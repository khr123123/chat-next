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
  SmileIcon,
  PlusIcon,
  TypeIcon,
  MapPinIcon, // optional location-style icon if you need it
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

  const sendMessage = useMutation(api.conversations.sendMessage)
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)

  // auto-grow
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
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
      toast.error(err?.message ?? "送信に失敗しました")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const uploadAndSend = async (file: File, kind: "image" | "file") => {
    setUploading(true)
    try {
      const postUrl = await generateUploadUrl()
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!res.ok) throw new Error("アップロードに失敗しました")
      const { storageId } = await res.json()

      await sendMessage({
        conversationId,
        kind,
        content: kind === "file" ? file.name : undefined,
        attachmentStorageId: storageId as Id<"_storage">,
      })
      toast.success(kind === "image" ? "画像を送信しました" : "ファイルを送信しました")
    } catch (err: any) {
      toast.error(err?.message ?? "アップロードに失敗しました")
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
    <div className="border-t bg-background px-4 py-3">
      {/* Teams-style single bar */}
      <div
        className={cn(
          "flex items-end gap-1 rounded-lg border border-input bg-background",
          "px-3 py-2 shadow-sm",
          "focus-within:ring-1 focus-within:ring-ring"
        )}
      >
        {/* Text area – fills remaining space */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力"
          rows={1}
          disabled={disabled || uploading}
          className={cn(
            "min-h-[36px] max-h-[120px] flex-1 resize-none",
            "border-0 bg-transparent p-0 shadow-none",
            "focus-visible:ring-0 text-[15px] leading-relaxed",
            "placeholder:text-muted-foreground"
          )}
        />

        {/* Right-side icon cluster (matches screenshot order) */}
        <div className="flex items-center gap-0.5 shrink-0 self-end pb-0.5">
          {/* Formatting “A” */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={disabled || uploading}
            title="書式"
          >
            <TypeIcon className="size-[18px]" />
          </Button>

          {/* Emoji */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={disabled || uploading}
            title="絵文字"
          >
            <SmileIcon className="size-[18px]" />
          </Button>

          {/* Attach / file */}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
            title="ファイルを添付"
          >
            <PaperclipIcon className="size-[18px]" />
          </Button>

          {/* Image (or location-style icon if you prefer MapPinIcon) */}
          <input
            ref={fileImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={disabled || uploading}
            onClick={() => fileImageRef.current?.click()}
            title="画像"
          >
            <ImageIcon className="size-[18px]" />
          </Button>

          {/* Plus */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={disabled || uploading}
            title="その他"
          >
            <PlusIcon className="size-[18px]" />
          </Button>

          {/* Send */}
          <Button
            type="button"
            size="icon"
            className="size-8 ml-0.5"
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
    </div>
  )
}