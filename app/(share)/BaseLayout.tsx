"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 只有聊天页需要完整侧边栏
  const isChatPage = pathname === "/" 
  // 好友、文件都不需要展开第二栏
  const isCompactPage =
    pathname.startsWith("/friends") || pathname.startsWith("/files")

  const title = pathname.startsWith("/files")
    ? "文件"
    : pathname.startsWith("/friends")
      ? "好友"
      : "聊天"

  const [open, setOpen] = React.useState(!isCompactPage)

  React.useEffect(() => {
    if (isCompactPage) {
      setOpen(false)
    } else {
      setOpen(true)
    }
  }, [isCompactPage])

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(next) => {
        if (isCompactPage) return // 禁止展开
        setOpen(next)
      }}
      style={{ "--sidebar-width": "360px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
          {!isCompactPage && (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          )}
          <span className="text-sm text-muted-foreground">{title}</span>
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}