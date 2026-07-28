"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * 把任意 _storage id 解析成可访问的 url
 * 复用 api.users.avatarUrl（它本质就是 ctx.storage.getUrl）
 */
export function useStorageUrl(storageId?: Id<"_storage">) {
  return useQuery(api.users.avatarUrl, storageId ? { storageId } : "skip")
}

export function UserAvatar({
  storageId,
  name,
  email,
  className,
}: {
  storageId?: Id<"_storage">
  name?: string
  email?: string
  className?: string
}) {
  const url = useStorageUrl(storageId)
  const fallback = (name ?? email ?? "?").charAt(0).toUpperCase()

  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarImage src={url ?? undefined} alt={name ?? ""} />
      <AvatarFallback className="bg-muted text-sm font-medium">
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
