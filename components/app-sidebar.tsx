"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NewChatDialog } from "@/components/chat/new-chat-dialog"
import { ProfileDialog } from "@/components/chat/profile-dialog"
import {
  MessageCircleIcon,
  UsersIcon,
  PlusIcon,
  SearchIcon,
  FileIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "聊天", href: "/", icon: MessageCircleIcon },
  { title: "好友", href: "/friends", icon: UsersIcon },
  { title: "文件", href: "/files", icon: FileIcon },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setOpen } = useSidebar()
  const me = useQuery(api.users.me, {})

  const isFilesPage = pathname.startsWith("/files")

  // 当前选中的会话
  const activeConversationId = searchParams.get("c")

  // 拉取会话列表
  const conversations = useQuery(api.conversations.listMyConversations, {})

  // 搜索过滤
  const [search, setSearch] = React.useState("")
  const filtered = React.useMemo(() => {
    if (!conversations) return []
    if (!search.trim()) return conversations
    return conversations.filter((c: any) =>
      c.title?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [conversations, search])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* ===== 第一栏：图标导航（始终显示） ===== */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="md:h-8 md:p-0"
                tooltip="聊天应用"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <MessageCircleIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ChatApp</span>
                  <span className="truncate text-xs">在线</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                      className="px-2.5 md:px-2"
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <ProfileDialog />
        </SidebarFooter>
      </Sidebar>

      {/* ===== 第二栏：会话列表（文件页不显示） ===== */}
      {!isFilesPage && (
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-base font-medium">消息</span>
              <NewChatDialog>
                <Button size="icon" variant="ghost" className="size-7">
                  <PlusIcon className="size-4" />
                </Button>
              </NewChatDialog>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <SidebarInput
                placeholder="搜索会话…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {conversations === undefined ? (
                  <div className="space-y-1 p-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg p-3"
                      >
                        <div className="size-10 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                          <div className="h-2 w-40 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                    <MessageCircleIcon className="size-8 opacity-40" />
                    <span>暂无会话，点击 + 开始聊天</span>
                  </div>
                ) : (
                  filtered.map((conv: any) => {
                    const avatarUrl = conv.avatarUrl as string | undefined
                    const title = (conv.title as string) || "未命名"
                    const initials = title.slice(0, 1).toUpperCase()

                    return (
                      <Link
                        key={conv._id}
                        href={`/?c=${conv._id}`}
                        onClick={() => setOpen(true)}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 border-b p-3 text-sm leading-tight last:border-b-0",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          activeConversationId === conv._id &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <Avatar className="size-10">
                          <AvatarImage src={avatarUrl} alt={title} />
                          <AvatarFallback className="bg-muted text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{title}</span>
                            {conv.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-5 shrink-0 px-1.5 text-xs"
                              >
                                {conv.unreadCount > 99
                                  ? "99+"
                                  : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {conv.lastMessagePreview || "暂无消息"}
                          </p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  )
}