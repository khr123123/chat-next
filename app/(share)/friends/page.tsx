"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/chat/user-avatar"
import {
  SearchIcon,
  UserPlusIcon,
  MessageCircleIcon,
  CheckIcon,
  XIcon,
  UsersIcon,
  MailIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function FriendsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">好友</h1>
        <p className="text-sm text-muted-foreground">管理好友和好友请求</p>
      </div>

      <Tabs defaultValue="friends" className="flex flex-1 flex-col">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="friends">
            <UsersIcon className="mr-1 size-4" />
            好友列表
          </TabsTrigger>
          <TabsTrigger value="requests">
            <MailIcon className="mr-1 size-4" />
            好友请求
          </TabsTrigger>
          <TabsTrigger value="search">
            <SearchIcon className="mr-1 size-4" />
            搜索用户
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="flex-1 min-h-0">
          <FriendListTab />
        </TabsContent>
        <TabsContent value="requests" className="flex-1 min-h-0">
          <PendingRequestsTab />
        </TabsContent>
        <TabsContent value="search" className="flex-1 min-h-0">
          <UserSearchTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ 好友列表 ============
function FriendListTab() {
  // 调用 api.friends.listFriends
  const friends = useQuery(api.friends.listFriends, {})
  const router = useRouter()
  // 调用 api.conversations.openDirect
  const openDirect = useMutation(api.conversations.openDirect)

  const startChat = async (friendId: Id<"users">) => {
    try {
      const cid = await openDirect({ peerId: friendId })
      router.push(`/?c=${cid}`)
    } catch (err: any) {
      toast.error(err?.message ?? "创建会话失败")
    }
  }

  if (friends === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">加载中…</div>
  }

  if (friends.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <UsersIcon className="size-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          还没有好友，去「搜索用户」添加吧
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-2 p-6 sm:grid-cols-2">
        {friends.map((f: any) => (
          <div
            key={f._id}
            className="flex items-center gap-3 rounded-xl border p-4"
          >
            <UserAvatar
              storageId={f.friend?.image}
              name={f.friend?.name}
              className="size-12 shrink-0"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {f.friend?.name ?? "未命名"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {f.friend?.email}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => startChat(f.friendId)}
            >
              <MessageCircleIcon className="mr-1 size-4" />
              聊天
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// ============ 好友请求 ============
function PendingRequestsTab() {
  // 调用 api.friends.listPendingRequests
  const requests = useQuery(api.friends.listPendingRequests, {})
  // 调用 api.friends.respondRequest
  const respondRequest = useMutation(api.friends.respondRequest)

  const handleRespond = async (
    requestId: Id<"friendRequests">,
    accept: boolean,
  ) => {
    try {
      await respondRequest({ requestId, accept })
      toast.success(accept ? "已添加好友" : "已拒绝")
    } catch (err: any) {
      toast.error(err?.message ?? "操作失败")
    }
  }

  if (requests === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">加载中…</div>
  }

  if (requests.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <MailIcon className="size-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">暂无好友请求</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-6">
        {requests.map((r: any) => (
          <div
            key={r._id}
            className="flex items-center gap-3 rounded-xl border p-4"
          >
            <UserAvatar
              storageId={r.from?.image}
              name={r.from?.name}
              className="size-12 shrink-0"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {r.from?.name ?? "未命名"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {r.from?.email}
              </p>
              {r.message && (
                <p className="mt-1 truncate text-xs italic text-muted-foreground">
                  「{r.message}」
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                className="size-8"
                onClick={() => handleRespond(r._id, true)}
              >
                <CheckIcon className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="size-8"
                onClick={() => handleRespond(r._id, false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// ============ 搜索用户 ============
function UserSearchTab() {
  const [keyword, setKeyword] = React.useState("")
  const [submitted, setSubmitted] = React.useState("")

  // 调用 api.users.searchUsers
  const results = useQuery(
    api.users.searchUsers,
    submitted ? { keyword: submitted } : "skip",
  )

  // 调用 api.friends.sendRequest
  const sendRequest = useMutation(api.friends.sendRequest)
  const [sending, setSending] = React.useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(keyword)
  }

  const handleSendRequest = async (toUserId: Id<"users">) => {
    setSending(toUserId)
    try {
      await sendRequest({ toUserId })
      toast.success("好友请求已发送")
    } catch (err: any) {
      toast.error(err?.message ?? "发送失败")
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleSearch} className="border-b p-6 pb-4">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="输入邮箱搜索用户…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-6">
          {!submitted && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchIcon className="size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                输入邮箱搜索用户
              </p>
            </div>
          )}

          {submitted && results === undefined && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              搜索中…
            </div>
          )}

          {submitted && results !== undefined && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              未找到用户
            </div>
          )}

          {results?.map((u: any) => (
            <div
              key={u._id}
              className="flex items-center gap-3 rounded-xl border p-4"
            >
              <UserAvatar
                storageId={u.image}
                name={u.name}
                className="size-12 shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {u.name ?? "未命名"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={sending === u._id}
                onClick={() => handleSendRequest(u._id)}
              >
                <UserPlusIcon className="mr-1 size-4" />
                {sending === u._id ? "发送中…" : "加好友"}
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
