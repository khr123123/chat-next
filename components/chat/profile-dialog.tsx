"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/chat/user-avatar"
import { NavUser } from "@/components/nav-user"
import { CameraIcon, Loader2Icon } from "lucide-react"

export function ProfileDialog() {
  const [open, setOpen] = React.useState(false)
  // 调用 api.users.me
  const me = useQuery(api.users.me, {})
  // 调用 api.users.generateUploadUrl
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)
  // 调用 api.users.setAvatar
  const setAvatar = useMutation(api.users.setAvatar)

  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
      await setAvatar({ storageId: storageId as Id<"_storage"> })
      toast.success("头像已更新")
    } catch (err: any) {
      toast.error(err?.message ?? "上传失败")
    } finally {
      setUploading(false)
    }
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <div className="w-full">
          <NavUser />
        </div>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
        </DialogHeader>

        {me && (
          <div className="space-y-4">
            {/* 头像 */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <UserAvatar
                  storageId={me.image}
                  name={me.name}
                  className="size-20"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 size-7 rounded-full"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <CameraIcon className="size-3" />
                  )}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">点击相机更换头像</p>
            </div>

            {/* 信息 */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">昵称</Label>
                <Input value={me.name ?? ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">邮箱</Label>
                <Input value={me.email ?? ""} readOnly />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
