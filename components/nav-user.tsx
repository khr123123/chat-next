"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from "sonner"
import {
  ChevronsUpDownIcon, SparklesIcon, BadgeCheckIcon,
  CreditCardIcon, BellIcon, LogOutIcon, CameraIcon,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar"
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog"
import { cn } from "@/lib/utils"

function getInitials(name?: string | null, email?: string | null) {
  const src = (name && name.trim()) || (email && email.split("@")[0]) || "U"
  return src.slice(0, 2).toUpperCase()
}

/** hover 时叠加相机图标的小头像 */
function AvatarWithCamera({
  src, alt, fallback, onClick, className,
}: {
  src?: string; alt: string; fallback: string
  onClick: (e: React.MouseEvent) => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(e) }}
      className={cn(
        "group relative h-8 w-8 shrink-0 rounded-lg overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="更换头像"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-lg",
          "bg-black/50 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        <CameraIcon className="h-4 w-4 text-white" />
      </span>
    </button>
  )
}

export function NavUser() {
  const router = useRouter()
  const { signOut } = useAuthActions()
  const { isMobile } = useSidebar()

  const me = useQuery(api.users.me) as
    | ({
        _id: string
        name?: string | null
        email?: string | null
        image?: string | null
        avatarStorageId?: Id<"_storage"> | null
      } | null)
    | undefined

  const avatarUrl = useQuery(
    api.users.avatarUrl,
    me?.avatarStorageId ? { storageId: me.avatarStorageId } : "skip",
  ) as string | null | undefined

  const [dialogOpen, setDialogOpen] = useState(false)

  const displayName = me?.name || me?.email?.split("@")[0] || "Guest"
  const email = me?.email || ""
  const avatarSrc = avatarUrl ?? me?.image ?? undefined
  const initials = getInitials(me?.name, me?.email)

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      router.replace("/login")
      toast.success("已退出登录")
    } catch (err) {
      console.error(err)
      toast.error("退出失败")
    }
  }, [signOut, router])

  if (me === undefined) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-muted animate-pulse">…</AvatarFallback>
            </Avatar>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }
  if (me === null) return null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="md:h-8 md:p-0 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
             <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatarSrc}/>
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    {/* 菜单顶部头像也支持 hover 修改 */}
                    <AvatarWithCamera
                      src={avatarSrc}
                      alt={displayName}
                      fallback={initials}
                      onClick={() => setDialogOpen(true)}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs">{email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <SparklesIcon />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem><BadgeCheckIcon />Account</DropdownMenuItem>
                <DropdownMenuItem><CreditCardIcon />Billing</DropdownMenuItem>
                <DropdownMenuItem><BellIcon />Notifications</DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={handleLogout}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AvatarUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentSrc={avatarSrc}
        fallback={initials}
      />
    </>
  )
}
