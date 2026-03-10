import * as React from 'react';
import {
    LayoutDashboard,
    Users,
    Shield,
    FileText,
    Settings,
    BookOpen,
    Languages,
    Tags,
    Wrench,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';

// Admin navigation data
const adminNavData = {
    navMain: [
        {
            title: 'Dashboard',
            url: '/admin/dashboard',
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: 'Users',
            url: '/admin/users',
            icon: Users,
        },
        {
            title: 'Roles / Permission',
            url: '/admin/roles',
            icon: Shield,
        },
        {
            title: 'Resource Types',
            url: '/admin/resource-types',
            icon: Tags,
        },
        {
            title: 'Verses',
            url: '/admin/verses',
            icon: BookOpen,
        },
        {
            title: 'Translations',
            url: '/admin/translations',
            icon: Languages,
        },
        {
            title: 'Resource Submission',
            url: '/admin/resource-submissions',
            icon: FileText,
        },
        {
            title: 'Add Resource',
            url: '/admin/add-resource',
            icon: FileText,
        },
        {
            title: 'Settings',
            url: '/admin/settings',
            icon: Settings,
        },
        {
            title: 'Tools',
            url: '/admin/tools',
            icon: Wrench,
        },
    ],
};

export function AdminSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar className="border-r-0" {...props}>
            <SidebarHeader className="border-b p-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                            Admin Panel
                        </span>
                        <span className="text-xs text-muted-foreground">
                            From Quran
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={adminNavData.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
