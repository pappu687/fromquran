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
  Search as SearchIcon,
  List,
  BookOpen,
} from "lucide-react"

import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/command-palette'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { useReadingMode } from '@/contexts/reading-mode-context'
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
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)
  const { auth } = usePage<SharedData>().props
  const user = auth?.user
  const { mode, setMode } = useReadingMode()

  const handleMenuClick = (item: MenuItem) => {
    setIsOpen(false)
    if (item.method === 'post') {
      router.post(item.href)
    } else {
      router.visit(item.href)
    }
  }

  // Handle CMD+K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search input component
  const SearchInput = () => (
    <div className="hidden sm:flex sm:items-center sm:gap-2">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => {
          if (value) setMode(value as 'list' | 'reading')
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="reading" aria-label="Reading view">
          <BookOpen className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <InputGroup className="max-w-[200px] lg:max-w-xs">
        <InputGroupInput
          placeholder="Search..."
          readOnly
          onClick={() => setCommandPaletteOpen(true)}
          className="cursor-pointer pl-9 pr-16"
        />
        <InputGroupAddon align="start">
          <SearchIcon className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )

  // If user is not logged in, show search and login button
  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2 text-sm">
          <SearchInput />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:hidden"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.visit('/login')}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </div>
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </>
    )
  }

  // If user is logged in, show search, welcome message and dropdown
  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <SearchInput />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:hidden"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
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
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  )
}
