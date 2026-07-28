"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
} from "@/components/ui/attachment"
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
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return "昨天"
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })
}

function initials(name?: string | null) {
  if (!name?.trim()) return "?"
  return name.trim().slice(0, 1).toUpperCase()
}

function memberDisplayName(member: any): string {
  return (
    member?.user?.name ||
    member?.user?.email ||
    member?.name ||
    member?.email ||
    "未知"
  )
}

/** 单条消息 */
function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
  senderAvatarUrl,
  isGroup,
}: {
  message: any
  isMine: boolean
  showAvatar: boolean
  senderName?: string
  senderAvatarUrl?: string | null
  isGroup: boolean
}) {
  const attachmentUrl = undefined // TODO: message.kind === "image" || "file" 时，获取附件 URL
  const align = isMine ? "end" : "start"
  const bubbleVariant = isMine ? "default" : "secondary"
  const avatarSrc = senderAvatarUrl || undefined

  return (
    <Message align={align} className="px-4 py-0.5">
      {/* 左侧：对方头像（连续消息只在最后一条显示，前面占位对齐） */}
      {!isMine && (
        <MessageAvatar>
          {showAvatar ? (
            <Avatar className="size-8">
              <AvatarImage src={avatarSrc} alt={senderName ?? ""} />
              <AvatarFallback className="bg-muted text-xs font-medium">
                {initials(senderName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-8 shrink-0" aria-hidden />
          )}
        </MessageAvatar>
      )}

      <MessageContent>
        {isGroup && !isMine && showAvatar && (
          <MessageHeader className="px-1 text-xs text-muted-foreground">
            {senderName ?? "未知"}
          </MessageHeader>
        )}

        {message.kind === "text" && (
          <Bubble variant={bubbleVariant} align={align}>
            <BubbleContent className="whitespace-pre-wrap break-words text-sm">
              {message.content}
            </BubbleContent>
          </Bubble>
        )}

        {message.kind === "image" && (
          <Bubble variant={bubbleVariant} align={align}>
            <BubbleContent className="overflow-hidden p-1">
              {attachmentUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl}
                  alt={message.content ?? "图片"}
                  className="max-h-64 max-w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted/50">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
              )}
            </BubbleContent>
          </Bubble>
        )}

        {message.kind === "file" && (
          <Attachment state="done" size="sm" className="max-w-xs">
            <AttachmentMedia>
              <FileIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{message.content ?? "文件"}</AttachmentTitle>
              <AttachmentDescription>文件</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                aria-label={`下载 ${message.content ?? "文件"}`}
                render={
                  <a href={attachmentUrl ?? "#"} download={message.content} />
                }
              >
                <DownloadIcon />
              </AttachmentAction>
            </AttachmentActions>
            {attachmentUrl && (
              <AttachmentTrigger
                render={
                  <a
                    href={attachmentUrl}
                    download={message.content}
                    aria-label={`下载 ${message.content ?? "文件"}`}
                  />
                }
              />
            )}
          </Attachment>
        )}

        <MessageFooter className="px-1 text-[10px] text-muted-foreground">
          {formatTime(message._creationTime)}
        </MessageFooter>
      </MessageContent>
    </Message>
  )
}

/** 消息列表 */
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
  const messages = useQuery(api.conversations.listMessages, {
    conversationId,
    limit: 50,
  })
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages === undefined) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn("flex gap-2", i % 2 === 0 ? "" : "flex-row-reverse")}
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-40 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="text-2xl">👋</span>
        <span>还没有消息，发一条吧</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="flex flex-col gap-0.5 py-4">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId
          const next = messages[i + 1]
          const showAvatar = !next || next.senderId !== msg.senderId
          // 用 string 统一 key，避免 Id 类型不一致
          const member = membersMap.get(String(msg.senderId))

          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
              senderName={memberDisplayName(member)}
              senderAvatarUrl={member?.avatarUrl}
              isGroup={isGroup}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

/** 整个消息区域 */
export function MessageArea({
  conversationId,
}: {
  conversationId: Id<"conversations">
}) {
  const conv = useQuery(api.conversations.getConversation, { conversationId })
  const me = useQuery(api.users.me, {})

  if (conv === undefined || me === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-3/4 rounded-lg" />
        </div>
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

  const membersMap = new Map<string, any>()
  for (const m of conv.members ?? []) {
    membersMap.set(String(m.userId), m)
  }

  const isGroup = conv.type === "group"
  const other = (conv.members ?? []).find(
    (m: any) => String(m.userId) !== String(me._id),
  )

  // getConversation 已解析好 title / avatarUrl
  const title = conv.title || other?.user?.name || other?.user?.email || "未命名"
  const headerAvatarUrl =
    (conv.avatarUrl as string | null | undefined) ||
    (other?.avatarUrl as string | null | undefined) ||
    undefined

  const subtitle = isGroup
    ? `${conv.memberCount ?? conv.members?.length ?? 0} 人`
    : other?.user?.email ?? other?.user?.name ?? ""
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Avatar className="size-10">
          <AvatarImage src={headerAvatarUrl} alt={title} />
          <AvatarFallback className="bg-muted text-sm font-medium">
            {initials(title)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <MoreVerticalIcon className="size-4" />
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

      {/* 消息列表 */}
      <div className="min-h-0 flex-1">
        <MessageList
          conversationId={conversationId}
          currentUserId={me!._id}
          isGroup={isGroup}
          membersMap={membersMap}
        />
      </div>
      {/* 输入框 */}
      <div className="shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  )
}