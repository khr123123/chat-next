import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const sendRequest = mutation({
  args: {
    toUserId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { toUserId, message }) => {
    const { userId } = await requireUser(ctx);

    if (userId === toUserId) {
      throw new ConvexError("不能加自己");
    }

    // 是否已经是好友
    const existed = await ctx.db
      .query("friendships")
      .withIndex("friendships_by_pair", (q) =>
        q.eq("userId", userId).eq("friendId", toUserId)
      )
      .unique();

    if (existed) {
      throw new ConvexError("已经是好友");
    }

    // 是否已经发送申请
    const dup = await ctx.db
      .query("friendRequests")
      .withIndex("friend_requests_by_pair", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", toUserId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (dup) {
      throw new ConvexError("请求已发送");
    }

    return await ctx.db.insert("friendRequests", {
      fromUserId: userId,
      toUserId,
      message,
      status: "pending",
    });
  },
});

export const respondRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, { requestId, accept }) => {
    const { userId } = await requireUser(ctx);

    const req = await ctx.db.get(requestId);

    if (!req) {
      throw new ConvexError("请求不存在");
    }

    if (req.toUserId !== userId) {
      throw new ConvexError("无权处理");
    }

    if (req.status !== "pending") {
      throw new ConvexError("请求已处理");
    }

    await ctx.db.patch(requestId, {
      status: accept ? "accepted" : "rejected",
      respondedAt: Date.now(),
    });

    if (accept) {
      await ctx.db.insert("friendships", {
        userId: req.fromUserId,
        friendId: req.toUserId,
      });

      await ctx.db.insert("friendships", {
        userId: req.toUserId,
        friendId: req.fromUserId,
      });
    }
  },
});

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireUser(ctx);

    const rows = await ctx.db
      .query("friendships")
      .withIndex("friendships_by_user", (q) =>
        q.eq("userId", userId)
      )
      .collect();

    return await Promise.all(
      rows.map(async (r) => ({
        ...r,
        friend: await ctx.db.get(r.friendId),
      }))
    );
  },
});

export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireUser(ctx);

    const rows = await ctx.db
      .query("friendRequests")
      .withIndex("friend_requests_by_to_status", (q) =>
        q.eq("toUserId", userId).eq("status", "pending")
      )
      .collect();

    return await Promise.all(
      rows.map(async (r) => ({
        ...r,
        from: await ctx.db.get(r.fromUserId),
      }))
    );
  },
});