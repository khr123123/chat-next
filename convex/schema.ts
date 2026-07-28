import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // ===========================
  // 好友请求
  // ===========================
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
    .index("friend_requests_by_to_status", ["toUserId", "status"])
    .index("friend_requests_by_from_status", ["fromUserId", "status"])
    .index("friend_requests_by_pair", ["fromUserId", "toUserId"]),

  // ===========================
  // 好友关系
  // ===========================
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    remark: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    muted: v.optional(v.boolean()),
    blockedByMe: v.optional(v.boolean()),
  })
    .index("friendships_by_user", ["userId"])
    .index("friendships_by_pair", ["userId", "friendId"]),

  // ===========================
  // 会话
  // ===========================
  conversations: defineTable({
    type: v.union(
      v.literal("direct"),
      v.literal("group"),
    ),

    // 单聊唯一 Key
    dmKey: v.optional(v.string()),

    // 群信息
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    ownerId: v.optional(v.id("users")),

    joinMode: v.optional(
      v.union(
        v.literal("open"),
        v.literal("approval"),
        v.literal("invite"),
      ),
    ),

    inviteCode: v.optional(v.string()),

    memberCount: v.number(),

    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.optional(v.number()),
  })
    .index("conversations_by_dm_key", ["dmKey"])
    .index("conversations_by_invite_code", ["inviteCode"])
    .index("conversations_by_last_message_at", ["lastMessageAt"]),

  // ===========================
  // 会话成员
  // ===========================
  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),

    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),

    nickname: v.optional(v.string()),

    joinedAt: v.number(),

    muted: v.optional(v.boolean()),

    lastReadMessageId: v.optional(v.id("messages")),
    lastReadAt: v.optional(v.number()),

    unreadCount: v.optional(v.number()),
  })
    .index(
      "conversation_members_by_conversation",
      ["conversationId"],
    )
    .index(
      "conversation_members_by_user",
      ["userId"],
    )
    .index(
      "conversation_members_by_user_conversation",
      ["userId", "conversationId"],
    ),

  // ===========================
  // 入群申请
  // ===========================
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
    .index(
      "group_join_requests_by_conversation_status",
      ["conversationId", "status"],
    )
    .index(
      "group_join_requests_by_user_status",
      ["userId", "status"],
    ),

  // ===========================
  // 消息
  // ===========================
  messages: defineTable({
    conversationId: v.id("conversations"),

    senderId: v.id("users"),

    kind: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system"),
      v.literal("recall"),
    ),

    content: v.optional(v.string()),

    attachmentStorageId: v.optional(v.id("_storage")),

    attachmentMeta: v.optional(
      v.object({
        name: v.string(),
        size: v.number(),
        mime: v.string(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      }),
    ),

    replyToId: v.optional(v.id("messages")),

    mentions: v.optional(v.array(v.id("users"))),

    edited: v.optional(v.boolean()),

    deletedAt: v.optional(v.number()),
  })
    .index(
      "messages_by_conversation",
      ["conversationId"],
    )
,

  // ===========================
  // 消息已读
  // ===========================
  messageReads: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.number(),
  })
    .index(
      "message_reads_by_message",
      ["messageId"],
    )
    .index(
      "message_reads_by_user_message",
      ["userId", "messageId"],
    ),
});

export default schema;