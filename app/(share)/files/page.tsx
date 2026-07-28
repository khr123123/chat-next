"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  UploadIcon,
  MoreHorizontalIcon,
  DownloadIcon,
  Trash2Icon,
  Grid3X3Icon,
  ListIcon,
  SearchIcon,
  PlayIcon,
  Loader2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

type FileItem = {
  _id: Id<"files">
  name: string
  type: "image" | "video" | "file"
  size: number
  url: string | null
  thumbnailUrl: string | null
  _creationTime: number
}

type QueueItem = {
  name: string
  progress: number
  status: "pending" | "uploading" | "done" | "error"
}

const PAGE_SIZE = 24 // 每页 24 个（3/4/6 列都能整除）

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("zh-CN")
}

/**
 * 关键：给视频 URL 加上时间片段 #t=0.1
 * iOS Safari 只有拿到时间片段时，才会主动去请求并解码首帧作为 poster
 */
function videoPosterUrl(url: string | null) {
  if (!url) return ""
  // 已经带片段就不重复加
  if (url.includes("#t=")) return url
  return `${url}#t=0.1`
}

export default function Page() {
  const files = useQuery(api.files.listMine)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFile = useMutation(api.files.saveFile)
  const removeFile = useMutation(api.files.remove)

  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [tab, setTab] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [preview, setPreview] = React.useState<FileItem | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadQueue, setUploadQueue] = React.useState<QueueItem[]>([])

  // 分页
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 过滤后的完整列表
  const filtered = React.useMemo(() => {
    if (!files) return []
    const kw = search.trim().toLowerCase()
    return files.filter((f) => {
      if (tab === "image" && f.type !== "image") return false
      if (tab === "video" && f.type !== "video") return false
      if (kw && !f.name.toLowerCase().includes(kw)) return false
      return true
    })
  }, [files, tab, search])

  // 当前可见的分页切片
  const visible = React.useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )
  const hasMore = visible.length < filtered.length

  // 切换 tab/搜索时，重置分页
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [tab, search])

  // 无限滚动：IntersectionObserver 监听底部哨兵
  React.useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) =>
            Math.min(c + PAGE_SIZE, filtered.length),
          )
        }
      },
      {
        // 提前 200px 触发加载，滚动体验更顺
        rootMargin: "200px",
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, filtered.length, visible.length])

  const uploadOne = async (file: File, index: number) => {
    const postUrl = await generateUploadUrl()

    const storageId = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", postUrl)
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      )

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          setUploadQueue((prev) =>
            prev.map((item, i) =>
              i === index
                ? { ...item, progress: percent, status: "uploading" }
                : item,
            ),
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const { storageId } = JSON.parse(xhr.responseText)
            resolve(storageId)
          } catch {
            reject(new Error("解析响应失败"))
          }
        } else {
          reject(new Error("上传失败"))
        }
      }
      xhr.onerror = () => reject(new Error("网络错误"))
      xhr.send(file)
    })

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "file"

    await saveFile({
      name: file.name,
      type,
      size: file.size,
      storageId: storageId as Id<"_storage">,
    })
  }

  const uploadFiles = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList)
    if (list.length === 0) return

    setUploading(true)
    setUploadQueue(
      list.map((f) => ({
        name: f.name,
        progress: 0,
        status: "pending" as const,
      })),
    )

    let success = 0
    let failed = 0

    for (let i = 0; i < list.length; i++) {
      try {
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "uploading" } : item,
          ),
        )
        await uploadOne(list[i], i)
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 100, status: "done" } : item,
          ),
        )
        success++
      } catch {
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error" } : item,
          ),
        )
        failed++
      }
    }

    setUploading(false)
    if (failed === 0) {
      toast.success(`成功上传 ${success} 个文件`)
    } else {
      toast.error(`${success} 成功，${failed} 失败`)
    }
    setTimeout(() => setUploadQueue([]), 2500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      uploadFiles(e.target.files)
    }
    e.target.value = ""
  }

  const handleDelete = async (file: FileItem) => {
    try {
      await removeFile({ id: file._id })
      toast.success("已删除")
      if (preview?._id === file._id) setPreview(null)
    } catch (err: any) {
      toast.error(err?.message ?? "删除失败")
    }
  }

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files.length) {
          uploadFiles(e.dataTransfer.files)
        }
      }}
    >
      {/* 顶部 */}
      <div className="border-b px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">文件</h1>
            <p className="text-sm text-muted-foreground">
              管理您的照片、视频和文件
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 sm:w-56"
              />
            </div>

            <div className="flex rounded-md border">
              <Button
                size="icon"
                variant={view === "grid" ? "secondary" : "ghost"}
                className="size-8 rounded-r-none"
                onClick={() => setView("grid")}
              >
                <Grid3X3Icon className="size-4" />
              </Button>
              <Button
                size="icon"
                variant={view === "list" ? "secondary" : "ghost"}
                className="size-8 rounded-l-none"
                onClick={() => setView("list")}
              >
                <ListIcon className="size-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mr-2 size-4" />
              {uploading ? "上传中…" : "上传"}
            </Button>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-32 truncate text-muted-foreground sm:w-40">
                  {item.name}
                </span>
                <div className="flex-1">
                  <Progress value={item.progress} className="h-1.5" />
                </div>
                <span className="w-14 text-right text-xs text-muted-foreground">
                  {item.status === "done"
                    ? "完成"
                    : item.status === "error"
                      ? "失败"
                      : `${item.progress}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 内容 */}
     <div className="min-h-0 flex-1 overflow-hidden">
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex h-full flex-col"
        >
          <div className="border-b px-4 sm:px-6">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                全部
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <ImageIcon className="mr-1.5 size-4" />
                照片
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <VideoIcon className="mr-1.5 size-4" />
                视频
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1" ref={scrollAreaRef}>
            <div className="p-4 sm:p-6">
              {files === undefined ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse rounded-lg bg-muted sm:aspect-[4/3]"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <FileIcon className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">暂无文件</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    上传照片或视频开始管理，支持拖拽
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="mr-2 size-4" />
                    上传文件
                  </Button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {visible.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      onPreview={() => setPreview(file)}
                      onDelete={() => handleDelete(file)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {visible.map((file) => (
                    <FileRow
                      key={file._id}
                      file={file}
                      onPreview={() => setPreview(file)}
                      onDelete={() => handleDelete(file)}
                    />
                  ))}
                </div>
              )}

              {/* 分页哨兵 & 状态 */}
              {filtered.length > 0 && (
                <div
                  ref={sentinelRef}
                  className="mt-6 flex items-center justify-center py-4"
                >
                  {hasMore ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2Icon className="size-4 animate-spin" />
                      加载更多…
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      已显示全部 {filtered.length} 个文件
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* 预览 */}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">{preview?.name}</DialogTitle>

          {preview?.type === "image" && preview.url ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[80vh] w-full bg-black object-contain"
            />
          ) : preview?.type === "video" && preview.url ? (
            <video
              key={preview.url}
              src={preview.url}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] w-full bg-black"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-12">
              <FileIcon className="size-16 text-muted-foreground" />
              <p className="font-medium">{preview?.name}</p>
              {preview?.url && (
                <a
                  href={preview.url}
                  download={preview.name}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <DownloadIcon className="mr-2 size-4" />
                  下载
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{preview?.name}</p>
              <p className="text-xs text-muted-foreground">
                {preview && formatSize(preview.size)} ·{" "}
                {preview && formatDate(preview._creationTime)}
              </p>
            </div>
            {preview?.url && (
              <a
                href={preview.url}
                download={preview.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <DownloadIcon className="mr-1 size-4" />
                下载
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- 网格卡片 ---------- */
function FileCard({
  file,
  onPreview,
  onDelete,
}: {
  file: FileItem
  onPreview: () => void
  onDelete: () => void
}) {
  const thumb = file.thumbnailUrl || file.url
  const [imgError, setImgError] = React.useState(false)

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onPreview}
    >
      <div className="relative">
        {/* 移动端：正方形；桌面端：4:3 */}
        <div className="relative aspect-square w-full bg-muted sm:aspect-[4/3]">
          {file.type === "image" && thumb && !imgError ? (
            <img
              src={thumb}
              alt={file.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : file.type === "video" && file.url ? (
            <video
              // 关键修复：加 #t=0.1，让 iOS Safari 拉取首帧
              src={videoPosterUrl(file.url)}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              // 移动端不要自动播放缩略
              disablePictureInPicture
              controlsList="nodownload"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileIcon className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {file.type === "video" && (
          <>
            <Badge className="absolute left-2 top-2" variant="secondary">
              <VideoIcon className="mr-1 size-3" />
              视频
            </Badge>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 p-2 backdrop-blur-sm">
                <PlayIcon className="size-5 fill-white text-white sm:size-6" />
              </div>
            </div>
          </>
        )}

        {/* 移动端：操作按钮常显；桌面：hover 显示 */}
        <div
          className="absolute right-2 top-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <FileActions file={file} onDelete={onDelete} />
        </div>
      </div>

      <CardContent className="p-2 sm:p-3">
        <p className="truncate text-xs font-medium sm:text-sm">{file.name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
          {formatSize(file.size)} · {formatDate(file._creationTime)}
        </p>
      </CardContent>
    </Card>
  )
}

/* ---------- 列表行 ---------- */
function FileRow({
  file,
  onPreview,
  onDelete,
}: {
  file: FileItem
  onPreview: () => void
  onDelete: () => void
}) {
  const thumb = file.thumbnailUrl || file.url

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50"
      onClick={onPreview}
    >
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {file.type === "image" && thumb ? (
          <img
            src={thumb}
            alt={file.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : file.type === "video" && file.url ? (
          <>
            <video
              src={videoPosterUrl(file.url)}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <PlayIcon className="absolute size-4 fill-white text-white drop-shadow" />
          </>
        ) : (
          <FileIcon className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(file.size)} · {formatDate(file._creationTime)}
        </p>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <FileActions file={file} onDelete={onDelete} />
      </div>
    </div>
  )
}

/* ---------- 操作菜单 ---------- */
function FileActions({
  file,
  onDelete,
}: {
  file: FileItem
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className="inline-flex size-8 items-center justify-center rounded-md bg-secondary/90 text-secondary-foreground backdrop-blur-sm hover:bg-secondary"
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={() => {
            if (file.url) window.open(file.url, "_blank")
          }}
        >
          <DownloadIcon className="mr-2 size-4" />
          下载
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2Icon className="mr-2 size-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
