"use client"

import { useSearchParams } from "next/navigation"
import { Id } from "@/convex/_generated/dataModel"
import { MessageArea } from "@/components/chat/message-area"
import { NewChatDialog } from "@/components/chat/new-chat-dialog"
import { Button } from "@/components/ui/button"
import { MessageCircleIcon } from "lucide-react"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("c") as Id<"conversations"> | null

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <MessageCircleIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">选择一个会话开始聊天</p>
          <p className="mt-1 text-sm text-muted-foreground">
            或发起新会话
          </p>
        </div>
        <NewChatDialog>
          <Button>
            <MessageCircleIcon className="mr-2 size-4" />
            新聊天
          </Button>
        </NewChatDialog>
      </div>
    )
  }

  return <MessageArea conversationId={conversationId} />
}
