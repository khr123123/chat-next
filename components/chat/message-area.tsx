"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar, useStorageUrl } from "@/components/chat/user-avatar"
import { MessageInput } from "@/components/chat/message-input"
import { cn } from "@/lib/utils"
import {
  MoreVerticalIcon,
  FileIcon,
  DownloadIcon,
  ImageIcon,
} from "lucide-react"

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return "昨天"
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })
}

/** 单条消息气泡 */
function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
  senderImage,
  isGroup,
}: {
  message: any
  isMine: boolean
  showAvatar: boolean
  senderName?: string
  senderImage?: Id<"_storage">
  isGroup: boolean
}) {
  const attachmentUrl = useStorageUrl(message.attachmentStorageId)

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-1",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* 头像 */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && (
          <UserAvatar
            storageId={senderImage}
            name={senderName}
            className="size-8"
          />
        )}
      </div>

      {/* 气泡 */}
      <div
        className={cn(
          "flex max-w-[70%] flex-col gap-1",
          isMine ? "items-end" : "items-start",
        )}
      >
        {/* 群聊显示发送者名字 */}
        {isGroup && !isMine && showAvatar && (
          <span className="px-1 text-xs text-muted-foreground">
            {senderName ?? "未知"}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isMine
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {/* 文本消息 */}
          {message.kind === "text" && (
            <p className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* 图片消息 */}
          {message.kind === "image" && attachmentUrl && (
            <img
              src={attachmentUrl}
              alt={message.content ?? "图片"}
              className="max-h-64 max-w-full rounded-lg object-cover"
            />
          )}
          {message.kind === "image" && !attachmentUrl && (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted/50">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
          )}

          {/* 文件消息 */}
          {message.kind === "file" && (
            <a
              href={attachmentUrl ?? "#"}
              download={message.content}
              className="flex items-center gap-2 underline-offset-2 hover:underline"
            >
              <FileIcon className="size-4 shrink-0" />
              <span className="truncate">{message.content ?? "文件"}</span>
              <DownloadIcon className="size-3 shrink-0 opacity-60" />
            </a>
          )}
        </div>

        {/* 时间 */}
        <span className="px-1 text-[10px] text-muted-foreground">
          {formatTime(message._creationTime)}
        </span>
      </div>
    </div>
  )
}

/** 消息列表（含自动滚动到底部） */
function MessageList({
  conversationId,
  currentUserId,
  isGroup,
  membersMap,
}: {
  conversationId: Id<"conversations">
  currentUserId: Id<"users">
  isGroup: boolean
  membersMap: Map<string, any>
}) {
  // 调用 api.conversations.listMessages
  const messages = useQuery(api.conversations.listMessages, {
    conversationId,
    limit: 50,
  })
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages === undefined) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-48 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        还没有消息，发一条吧 👋
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-4">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId
          const prev = messages[i - 1]
          const showAvatar =
            !prev || prev.senderId !== msg.senderId || isGroup
          const member = membersMap.get(msg.senderId)
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
              senderName={member?.user?.name ?? member?.user?.email}
              senderImage={member?.user?.image}
              isGroup={isGroup}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}

/** 整个消息区域 */
export function MessageArea({
  conversationId,
}: {
  conversationId: Id<"conversations">
}) {
  // 调用 api.conversations.getConversation
  const conv = useQuery(api.conversations.getConversation, { conversationId })
  // 调用 api.users.me
  const me = useQuery(api.users.me, {})

  if (conv === undefined || me === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (conv === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        会话不存在或无权访问
      </div>
    )
  }

  // 构建成员映射：userId -> member（含 user 和 avatarUrl）
  const membersMap = new Map<string, any>()
  for (const m of conv.members ?? []) {
    membersMap.set(m.userId, m)
  }

  const isGroup = conv.type === "group"

  return (
    <div className="flex h-full flex-col">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <UserAvatar
          storageId={
            conv.type === "direct"
              ? conv.members?.find((m: any) => m.userId !== me?._id)?.user
                  ?.image
              : conv.avatarStorageId
          }
          name={conv.title}
          className="size-10"
        />
        <div className="flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-semibold">
            {conv.title || "未命名"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isGroup
              ? `${conv.memberCount} 人`
              : conv.members?.find((m: any) => m.userId !== me?._id)?.user
                  ?.email ?? ""}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>查看成员</DropdownMenuItem>
            {isGroup && <DropdownMenuItem>群设置</DropdownMenuItem>}
            <DropdownMenuItem className="text-destructive">
              退出会话
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ===== 消息列表 ===== */}
      <div className="flex-1 min-h-0">
        <MessageList
          conversationId={conversationId}
          currentUserId={me!._id}
          isGroup={isGroup}
          membersMap={membersMap}
        />
      </div>

      {/* ===== 输入框 ===== */}
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
