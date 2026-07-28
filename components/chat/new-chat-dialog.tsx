"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { UserAvatar } from "@/components/chat/user-avatar"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function NewChatDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button size="sm">
                        <PlusIcon className="mr-1 size-4" />
                        新聊天
                    </Button>
                }
            />
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>发起新会话</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="direct">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="direct">单聊</TabsTrigger>
                        <TabsTrigger value="group">建群</TabsTrigger>
                    </TabsList>

                    {/* ===== 单聊 Tab ===== */}
                    <TabsContent value="direct">
                        <DirectTab
                            onCreated={(cid) => {
                                setOpen(false)
                                router.push(`/?c=${cid}`)
                            }}
                        />
                    </TabsContent>

                    {/* ===== 群聊 Tab ===== */}
                    <TabsContent value="group">
                        <GroupTab
                            onCreated={(cid) => {
                                setOpen(false)
                                router.push(`/?c=${cid}`)
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

/** 单聊选择好友 */
function DirectTab({ onCreated }: { onCreated: (cid: Id<"conversations">) => void }) {
    // 调用 api.friends.listFriends
    const friends = useQuery(api.friends.listFriends, {})
    // 调用 api.conversations.openDirect
    const openDirect = useMutation(api.conversations.openDirect)
    const [selected, setSelected] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)

    const handleStart = async () => {
        if (!selected) return
        setLoading(true)
        try {
            const cid = await openDirect({ peerId: selected as Id<"users"> })
            onCreated(cid)
        } catch (err: any) {
            toast.error(err?.message ?? "创建失败")
        } finally {
            setLoading(false)
        }
    }

    if (friends === undefined) {
        return <div className="py-8 text-center text-sm text-muted-foreground">加载中…</div>
    }

    if (friends.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                还没有好友，去好友页面添加吧
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <ScrollArea className="h-[300px] rounded-lg border">
                <div className="space-y-1 p-2">
                    {friends.map((f: any) => (
                        <label
                            key={f._id}
                            className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent",
                                selected === f.friendId && "bg-accent",
                            )}
                        >
                            <Checkbox
                                checked={selected === f.friendId}
                                onCheckedChange={() => setSelected(f.friendId)}
                            />
                            <UserAvatar
                                storageId={f.friend?.image}
                                name={f.friend?.name}
                                className="size-8"
                            />
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">
                                    {f.friend?.name ?? "未命名"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {f.friend?.email}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </ScrollArea>
            <Button
                className="w-full"
                disabled={!selected || loading}
                onClick={handleStart}
            >
                {loading ? "创建中…" : "开始聊天"}
            </Button>
        </div>
    )
}

/** 群聊创建 */
function GroupTab({ onCreated }: { onCreated: (cid: Id<"conversations">) => void }) {
    // 调用 api.friends.listFriends
    const friends = useQuery(api.friends.listFriends, {})
    // 调用 api.conversations.createGroup
    const createGroup = useMutation(api.conversations.createGroup)

    const [name, setName] = React.useState("")
    const [selected, setSelected] = React.useState<Set<string>>(new Set())
    const [loading, setLoading] = React.useState(false)

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleCreate = async () => {
        if (!name.trim() || selected.size === 0) return
        setLoading(true)
        try {
            const cid = await createGroup({
                name: name.trim(),
                memberIds: [...selected] as Id<"users">[],
            })
            onCreated(cid)
        } catch (err: any) {
            toast.error(err?.message ?? "创建失败")
        } finally {
            setLoading(false)
        }
    }

    if (friends === undefined) {
        return <div className="py-8 text-center text-sm text-muted-foreground">加载中…</div>
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="group-name">群名称</Label>
                <Input
                    id="group-name"
                    placeholder="输入群名称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <Label>
                    选择成员{" "}
                    <span className="text-muted-foreground">({selected.size} 已选)</span>
                </Label>
                <ScrollArea className="h-[240px] rounded-lg border">
                    <div className="space-y-1 p-2">
                        {friends.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                还没有好友
                            </p>
                        ) : (
                            friends.map((f: any) => (
                                <label
                                    key={f._id}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent",
                                        selected.has(f.friendId) && "bg-accent",
                                    )}
                                >
                                    <Checkbox
                                        checked={selected.has(f.friendId)}
                                        onCheckedChange={() => toggle(f.friendId)}
                                    />
                                    <UserAvatar
                                        storageId={f.friend?.image}
                                        name={f.friend?.name}
                                        className="size-8"
                                    />
                                    <span className="flex-1 truncate text-sm">
                                        {f.friend?.name ?? "未命名"}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <Button
                className="w-full"
                disabled={!name.trim() || selected.size === 0 || loading}
                onClick={handleCreate}
            >
                {loading ? "创建中…" : `创建群聊 (${selected.size + 1} 人)`}
            </Button>
        </div>
    )
}
