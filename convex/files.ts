import { getAuthUserId } from "@convex-dev/auth/server"
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("未登录")
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveFile = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("file")),
    size: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("未登录")

    return await ctx.db.insert("files", {
      userId,
      name: args.name,
      type: args.type,
      size: args.size,
      storageId: args.storageId,
    })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()

    const result = []
    for (const f of files) {
      const url = await ctx.storage.getUrl(f.storageId)
      // 调试：在 Convex 日志里看
      console.log("file", f.name, "storageId", f.storageId, "url", url)

      result.push({
        _id: f._id,
        name: f.name,
        type: f.type,
        size: f.size,
        _creationTime: f._creationTime,
        url, // 可能是 null
        thumbnailUrl: f.thumbnailStorageId
          ? await ctx.storage.getUrl(f.thumbnailStorageId)
          : null,
      })
    }
    return result
  },
})

export const remove = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("未登录")

    const file = await ctx.db.get(args.id)
    if (!file) throw new Error("文件不存在")
    if (file.userId !== userId) throw new Error("无权删除")

    await ctx.storage.delete(file.storageId)
    if (file.thumbnailStorageId) {
      await ctx.storage.delete(file.thumbnailStorageId)
    }
    await ctx.db.delete(args.id)
  },
})
