import { v, ConvexError } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser, requireMember, requireFriend, requireGroupAdmin } from "./lib/auth"

function dmKey(a: string, b: string) {
  return [a, b].sort().join(":")
}

// 打开或创建单聊
export const openDirect = mutation({
  args: { peerId: v.id("users") },
  handler: async (ctx, { peerId }) => {
    const { userId } = await requireUser(ctx)
    if (userId === peerId) throw new ConvexError("不能和自己聊天")
    await requireFriend(ctx, userId, peerId)

    const key = dmKey(userId, peerId)
    const existed = await ctx.db.query("conversations")
      .withIndex("conversations_by_dm_key", (q) => q.eq("dmKey", key)).unique()
    if (existed) return existed._id

    const cid = await ctx.db.insert("conversations", {
      type: "direct", dmKey: key, memberCount: 2,
    })
    const now = Date.now()
    await ctx.db.insert("conversationMembers", {
      conversationId: cid, userId, role: "member", joinedAt: now,
    })
    await ctx.db.insert("conversationMembers", {
      conversationId: cid, userId: peerId, role: "member", joinedAt: now,
    })
    return cid
  },
})

// 创建群
export const createGroup = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
    joinMode: v.optional(v.union(
      v.literal("open"), v.literal("approval"), v.literal("invite"),
    )),
  },
  handler: async (ctx, { name, memberIds, joinMode }) => {
    const { userId } = await requireUser(ctx)
    const uniq = Array.from(new Set(memberIds.filter((id) => id !== userId)))

    // 只允许邀请好友
    for (const id of uniq) await requireFriend(ctx, userId, id)

    const cid = await ctx.db.insert("conversations", {
      type: "group", name, ownerId: userId,
      joinMode: joinMode ?? "approval",
      memberCount: uniq.length + 1,
      inviteCode: Math.random().toString(36).slice(2, 10),
    })
    const now = Date.now()
    await ctx.db.insert("conversationMembers", {
      conversationId: cid, userId, role: "owner", joinedAt: now,
    })
    for (const id of uniq) {
      await ctx.db.insert("conversationMembers", {
        conversationId: cid, userId: id, role: "member", joinedAt: now,
      })
    }
    return cid
  },
})

// 发消息
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    content: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx)
    const m = await requireMember(ctx, userId, args.conversationId)
    if (m.muted) throw new ConvexError("你已被禁言")

    const mid = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      kind: args.kind,
      content: args.content,
      attachmentStorageId: args.attachmentStorageId,
      replyToId: args.replyToId,
    })
    await ctx.db.patch(args.conversationId, {
      lastMessageId: mid, lastMessageAt: Date.now(),
    })
    return mid
  },
})

// 分页拉消息
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    before: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, before, limit }) => {
    const { userId } = await requireUser(ctx)
    await requireMember(ctx, userId, conversationId)
    const q = ctx.db.query("messages")
      .withIndex("messages_by_conversation", (x) => x.eq("conversationId", conversationId))
      .order("desc")
    const rows = await q.take(Math.min(limit ?? 30, 100))
    return rows.reverse()
  },
})


// convex/conversations.ts (追加)
export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireUser(ctx)

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("conversation_members_by_user", (q) => q.eq("userId", userId))
      .collect()

    const items = await Promise.all(
      memberships.map(async (m) => {
        const conv = await ctx.db.get(m.conversationId)
        if (!conv) return null

        let title = conv.name ?? ""
        let peer: any = null
        let avatarUrl: string | null = null

        // convex/conversations.ts — listMyConversations 里 direct 分支
        if (conv.type === "direct") {
          const allMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("conversation_members_by_conversation", (q) =>
              q.eq("conversationId", conv._id),
            )
            .collect()

          const peerMem = allMembers.find((x) => x.userId !== userId)
          if (peerMem) {
            peer = await ctx.db.get(peerMem.userId)
            title = peer?.name ?? peer?.email ?? "未命名"
            if (peer?.image) {
              avatarUrl = await ctx.storage.getUrl(peer.image)
            }
          }
        } else if (conv.avatarStorageId) {
          avatarUrl = await ctx.storage.getUrl(conv.avatarStorageId)
        }

        const lastMsg = conv.lastMessageId
          ? await ctx.db.get(conv.lastMessageId)
          : null

        return {
          _id: conv._id,
          type: conv.type,
          title,
          avatarUrl,
          peer,
          memberCount: conv.memberCount,
          lastMessageAt: conv.lastMessageAt ?? conv._creationTime,
          lastMessagePreview:
            lastMsg?.kind === "text"
              ? lastMsg.content ?? ""
              : lastMsg?.kind === "image"
                ? "[图片]"
                : lastMsg?.kind === "file"
                  ? "[文件]"
                  : "",
          unreadCount: m.unreadCount ?? 0,
        }
      }),
    )

    return items
      .filter(Boolean)
      .sort((a: any, b: any) => (b!.lastMessageAt ?? 0) - (a!.lastMessageAt ?? 0))
  },
})

// 获取单个会话详情(用于 header)
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const { userId } = await requireUser(ctx)
    await requireMember(ctx, userId, conversationId)
    const conv = await ctx.db.get(conversationId)
    if (!conv) return null

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("conversation_members_by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect()

    const withUser = await Promise.all(
      members.map(async (m) => {
        const u = await ctx.db.get(m.userId)
        const img = u?.image ? await ctx.storage.getUrl(u.image) : null
        return { ...m, user: u, avatarUrl: img }
      }),
    )

    let title = conv.name ?? ""
    let avatarUrl: string | null = null
    if (conv.type === "direct") {
      const peer = withUser.find((m) => m.userId !== userId)
      title = peer?.user?.name ?? peer?.user?.email ?? "未命名"
      avatarUrl = peer?.avatarUrl ?? null
    } else if (conv.avatarStorageId) {
      avatarUrl = await ctx.storage.getUrl(conv.avatarStorageId)
    }

    return { ...conv, title, avatarUrl, members: withUser }
  },
})
