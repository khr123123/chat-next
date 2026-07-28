import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"

/** 必须登录 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new ConvexError({ code: "UNAUTHENTICATED", message: "请先登录" })
  const user = await ctx.db.get(userId)
  if (!user) throw new ConvexError({ code: "USER_NOT_FOUND", message: "用户不存在" })
  if ((user as any).role === "banned") {
    throw new ConvexError({ code: "BANNED", message: "账号已被封禁" })
  }
  return { userId, user }
}

/** 必须是管理员 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const { userId, user } = await requireUser(ctx)
  if ((user as any).role !== "admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "无权访问" })
  }
  return { userId, user }
}

/** 必须是好友 */
export async function requireFriend(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  otherId: Id<"users">,
) {
  const rel = await ctx.db
    .query("friendships")
    .withIndex("friendships_by_pair", (q) => q.eq("userId", userId).eq("friendId", otherId))
    .unique()
  if (!rel) throw new ConvexError({ code: "NOT_FRIEND", message: "对方不是你的好友" })
  return rel
}

/** 必须是会话成员 */
export async function requireMember(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  conversationId: Id<"conversations">,
) {
  const membership = await ctx.db
    .query("conversationMembers")
    .withIndex("conversation_members_by_user_conversation", (q) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique()
  if (!membership) {
    throw new ConvexError({ code: "NOT_MEMBER", message: "你不在该会话中" })
  }
  return membership
}

/** 必须是群主/管理员 */
export async function requireGroupAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  conversationId: Id<"conversations">,
) {
  const m = await requireMember(ctx, userId, conversationId)
  if (m.role !== "owner" && m.role !== "admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "需要管理员权限" })
  }
  return m
}
