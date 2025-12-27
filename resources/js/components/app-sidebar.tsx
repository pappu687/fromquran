import * as React from "react"
import {
  User,
  FolderOpen,
  FileUp,
  Heart,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react"

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { usePage, router } from '@inertiajs/react'
import type { SharedData } from '@/types'

// User navigation data
const userNavData = {
  navMain: [
    {
      title: "Quran Reader",
      url: "/",
      icon: BookOpen,
      isActive: true,
    },
  ],
  userMenu: [
    {
      title: "Account",
      url: "/dashboard",
      icon: User,
    },
    {
      title: "Collections",
      url: "/my-collections",
      icon: FolderOpen,
    },
    {
      title: "Contributions",
      url: "/my-contributions",
      icon: FileUp,
    },
    {
      title: "Favorites",
      url: "/favorites",
      icon: Heart,
    },
    {
      title: "Settings",
      url: "/settings/profile",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = usePage<SharedData>().props
  const user = auth?.user

  const handleLogout = () => {
    router.post('/logout')
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-b p-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold truncate">
              From Quran
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Explore & Learn
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <NavMain items={userNavData.navMain} />
        
        {/* User Menu - Only show if logged in */}
        {user && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userNavData.userMenu.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Logout */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleLogout}
                      tooltip="Logout"
                    >
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
