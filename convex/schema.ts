import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  // ============ 好友关系 ============
  // 好友请求
  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    respondedAt: v.optional(v.number()),
  })
    .index("by_to_status", ["toUserId", "status"])
    .index("by_from_status", ["fromUserId", "status"])
    .index("by_pair", ["fromUserId", "toUserId"]),

  // 好友关系（双向存两条，方便查询）
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    remark: v.optional(v.string()),   // 好友备注
    pinned: v.optional(v.boolean()),
    muted: v.optional(v.boolean()),
    blockedByMe: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_pair", ["userId", "friendId"]),

  // ============ 会话（单聊 + 群聊统一模型）============
  conversations: defineTable({
    type: v.union(v.literal("direct"), v.literal("group")),
    // 单聊：由两个 userId 排序后 hash 生成，保证幂等
    dmKey: v.optional(v.string()),
    // 群聊字段
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    ownerId: v.optional(v.id("users")),
    // 加群方式
    joinMode: v.optional(v.union(
      v.literal("open"),      // 任何人可加
      v.literal("approval"),  // 需管理员审批
      v.literal("invite"),    // 仅邀请
    )),
    inviteCode: v.optional(v.string()),
    memberCount: v.number(),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_dm_key", ["dmKey"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_last_message_at", ["lastMessageAt"]),

  // 会话成员
  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),
    nickname: v.optional(v.string()),  // 群昵称
    joinedAt: v.number(),
    muted: v.optional(v.boolean()),
    // 已读位点
    lastReadMessageId: v.optional(v.id("messages")),
    lastReadAt: v.optional(v.number()),
    // 未读数缓存
    unreadCount: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  // 入群申请
  groupJoinRequests: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    inviterId: v.optional(v.id("users")),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    handledBy: v.optional(v.id("users")),
    respondedAt: v.optional(v.number()),
  })
    .index("by_conversation_status", ["conversationId", "status"])
    .index("by_user_status", ["userId", "status"]),

  // ============ 消息 ============
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    kind: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system"),      // 入群/退群等系统提示
      v.literal("recall"),
    ),
    content: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentMeta: v.optional(v.object({
      name: v.string(),
      size: v.number(),
      mime: v.string(),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
    })),
    replyToId: v.optional(v.id("messages")),
    mentions: v.optional(v.array(v.id("users"))),
    edited: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId"]),

  // 消息已读回执（群聊 & 单聊都可用）
  messageReads: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user_message", ["userId", "messageId"]),
});

export default schema;