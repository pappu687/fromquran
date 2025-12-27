"use client"

import * as React from "react"
import {
  FolderOpen,
  Heart,
  LogOut,
  Settings,
  User,
  LogIn,
  MoreHorizontal,
} from "lucide-react"

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { usePage, router } from '@inertiajs/react'
import type { SharedData } from '@/types'

interface MenuItem {
  label: string
  icon: any
  href: string
  method?: 'post'
}

const menuData: MenuItem[][] = [
  [
    {
      label: "My Collections",
      icon: FolderOpen,
      href: "/my-collections",
    },
    {
      label: "Profile",
      icon: User,
      href: "/dashboard",
    },
  ],
  [
    {
      label: "Favorites",
      icon: Heart,
      href: "/favorites",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings/profile",
    },  
  ],
  [
    {
      label: "Logout",
      icon: LogOut,
      href: "/logout",
      method: "post",
    },
  ]
]

export function NavActions() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { auth } = usePage<SharedData>().props
  const user = auth?.user

  const handleMenuClick = (item: MenuItem) => {
    setIsOpen(false)
    if (item.method === 'post') {
      router.post(item.href)
    } else {
      router.visit(item.href)
    }
  }

  // If user is not logged in, show login button
  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Button 
          variant="default" 
          size="sm"
          onClick={() => router.visit('/login')}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </div>
    )
  }

  // If user is logged in, show welcome message and dropdown
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground hidden font-medium md:inline-block">
        Welcome, {user.name}
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-accent h-7 w-7"
          >
            <MoreHorizontal />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {menuData.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, itemIndex) => (
                        <SidebarMenuItem key={itemIndex}>
                          <SidebarMenuButton onClick={() => handleMenuClick(item)}>
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  )
}
