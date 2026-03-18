import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FileUp,
    FolderOpen,
    Heart,
    LogOut,
    Settings,
    ShieldCheck,
} from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';

// User navigation data
const userNavData = {
    navMain: [
        {
            title: 'Quran Reader',
            url: '/',
            icon: BookOpen,
        },
    ],
    userMenu: [
        {
            title: 'Collections',
            url: '/my-collections',
            icon: FolderOpen,
        },
        {
            title: 'Contributions',
            url: '/my-contributions',
            icon: FileUp,
        },
        {
            title: 'Favorites',
            url: '/favorites',
            icon: Heart,
        },
        {
            title: 'Account Settings',
            url: '/settings/profile',
            icon: Settings,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user, logout, hasRole } = useAuth();
    const { url } = usePage();
    // Normalize to pathname only (strip query string)
    const currentPath = url.split('?')[0];

    const isCurrentPath = (itemUrl: string) => {
        if (itemUrl === '/') return currentPath === '/';
        return currentPath.startsWith(itemUrl);
    };

    return (
        <Sidebar className="border-r-0" {...props}>
            <SidebarHeader className="border-b p-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">
                            From Quran
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            Explore & Learn
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <NavMain
                    items={userNavData.navMain.map((item) => ({
                        ...item,
                        isActive: isCurrentPath(item.url),
                    }))}
                />

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
                                                isActive={isCurrentPath(item.url)}
                                            >
                                                <Link href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}

                                    {/* Admin Panel — only for admins */}
                                    {hasRole('Admin') && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip="Admin Panel"
                                                isActive={isCurrentPath('/admin')}
                                            >
                                                <Link href="/admin">
                                                    <ShieldCheck />
                                                    <span>Admin Panel</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Logout */}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={logout}
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
    );
}
