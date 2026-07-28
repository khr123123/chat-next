"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  SendIcon,
  ImageIcon,
  PaperclipIcon,
  Loader2Icon,
} from "lucide-react"

export function MessageInput({
  conversationId,
  disabled,
}: {
  conversationId: Id<"conversations">
  disabled?: boolean
}) {
  const [text, setText] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const fileImageRef = React.useRef<HTMLInputElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // 调用 api.conversations.sendMessage
  const sendMessage = useMutation(api.conversations.sendMessage)

  // 调用 api.users.generateUploadUrl（上传文件用）
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)

  // 自适应高度
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [text])

  const handleSendText = async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    try {
      await sendMessage({
        conversationId,
        kind: "text",
        content: trimmed,
      })
      setText("")
    } catch (err: any) {
      toast.error(err?.message ?? "发送失败")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  /**
   * 上传文件到 Convex Storage
   * 1. 调用 generateUploadUrl 获取一次性上传地址
   * 2. POST 文件到该地址
   * 3. 拿到 storageId
   * 4. 调用 sendMessage 发送附件消息
   */
  const uploadAndSend = async (file: File, kind: "image" | "file") => {
    setUploading(true)
    try {
      const postUrl = await generateUploadUrl()
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!res.ok) throw new Error("上传失败")
      const { storageId } = await res.json()

      await sendMessage({
        conversationId,
        kind,
        content: kind === "file" ? file.name : undefined,
        attachmentStorageId: storageId as Id<"_storage">,
      })
      toast.success(kind === "image" ? "图片已发送" : "文件已发送")
    } catch (err: any) {
      toast.error(err?.message ?? "上传失败")
    } finally {
      setUploading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file, "image")
    e.target.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file, "file")
    e.target.value = ""
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        {/* 图片上传 */}
        <input
          ref={fileImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-9 shrink-0"
          disabled={disabled || uploading}
          onClick={() => fileImageRef.current?.click()}
        >
          <ImageIcon className="size-5 text-muted-foreground" />
        </Button>

        {/* 文件上传 */}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-9 shrink-0"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
        >
          <PaperclipIcon className="size-5 text-muted-foreground" />
        </Button>

        {/* 文本输入 */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息…  Enter 发送，Shift+Enter 换行"
          rows={1}
          disabled={disabled || uploading}
          className={cn(
            "min-h-[40px] max-h-[160px] resize-none flex-1",
          )}
        />

        {/* 发送按钮 */}
        <Button
          size="icon"
          className="size-9 shrink-0"
          disabled={disabled || uploading || !text.trim()}
          onClick={handleSendText}
        >
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
