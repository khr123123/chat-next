import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// 当前登录用户（你叫它 api.users.current / loggedInUser 都行，保持一致即可）
export const me = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        return await ctx.db.get(userId);
    },
});

// 把 _storage id 解析成可访问的 url
export const avatarUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, { storageId }) => {
        return await ctx.storage.getUrl(storageId);
    },
});

// 生成一次性上传 url（要求登录）
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("未登录");
        return await ctx.storage.generateUploadUrl();
    },
});

// 用新上传的 storageId 替换头像
export const setAvatar = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, { storageId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("未登录");
        await ctx.db.patch(userId, { image: storageId });
    },
});
