// app/(chat)/layout.tsx
"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "360px" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">聊天</span>
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
