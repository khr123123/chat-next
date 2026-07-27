"use client"

import * as React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { UploadCloudIcon, ImageIcon, Loader2Icon } from "lucide-react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    currentSrc?: string
    fallback: string
}

const MAX_SIZE = 5 * 1024 * 1024

export function AvatarUploadDialog({ open, onOpenChange, currentSrc, fallback }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)

    const generateUploadUrl = useMutation(api.users.generateUploadUrl)
    const setAvatar = useMutation(api.users.setAvatar)

    // 清理预览 URL
    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview) }
    }, [preview])

    // 关闭时重置
    useEffect(() => {
        if (!open) {
            setFile(null)
            if (preview) URL.revokeObjectURL(preview)
            setPreview(null)
        }
    }, [open]) // eslint-disable-line

    const pickFile = useCallback((f: File | undefined | null) => {
        if (!f) return
        if (!f.type.startsWith("image/")) {
            toast.error("请选择图片文件"); return
        }
        if (f.size > MAX_SIZE) {
            toast.error("图片不能超过 5MB"); return
        }
        if (preview) URL.revokeObjectURL(preview)
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }, [preview])

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        try {
            const url = await generateUploadUrl()
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })
            if (!res.ok) throw new Error("upload failed")
            const { storageId } = (await res.json()) as { storageId: string }
            await setAvatar({ storageId: storageId as Id<"_storage"> })
            toast.success("头像已更新")
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            toast.error("头像上传失败")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>更换头像</DialogTitle>
                    <DialogDescription>支持 JPG / PNG / GIF，最大 5MB</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    <Avatar className="h-24 w-24 rounded-full ring-2 ring-border">
                        <AvatarImage src={preview ?? currentSrc} />
                        <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
                    </Avatar>

                    <div
                        className={cn(
                            "w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
                            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
                        )}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault(); setDragOver(false)
                            pickFile(e.dataTransfer.files?.[0])
                        }}
                    >
                        <UploadCloudIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            点击选择图片，或拖拽到此处
                        </p>
                        {file && (
                            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-foreground">
                                <ImageIcon className="h-3 w-3" />
                                {file.name} · {(file.size / 1024).toFixed(1)} KB
                            </p>
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.target.value = ""
                            pickFile(f)
                        }}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                        取消
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? (
                            <><Loader2Icon className="mr-1 h-4 w-4 animate-spin" />上传中…</>
                        ) : "确认上传"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
