import { Link, usePage } from '@inertiajs/react';
import {
    ChevronUp,
    HeartHandshake,
    Info,
    Map,
    ListChecks,
    MenuSquare,
} from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const footerLinks = [
    {
        title: 'Quran Topic Index',
        href: '/topics',
        icon: ListChecks,
    },
    {
        title: 'About Us',
        href: '/about',
        icon: Info,
    },
    {
        title: 'RoadMap',
        href: '/roadmap',
        icon: Map,
    },
    {
        title: 'Support us',
        href: '/support',
        icon: HeartHandshake,
    },
];

export function ReaderSidebarFooter() {
    const { url } = usePage();
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const currentPath = url.split('?')[0];

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            tooltip="More"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                                <MenuSquare className="h-4 w-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    More
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Pages and support
                                </span>
                            </div>
                            <ChevronUp className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'right'
                                  : 'top'
                        }
                    >
                        {footerLinks.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link
                                    href={item.href}
                                    className={
                                        currentPath === item.href
                                            ? 'bg-accent text-accent-foreground'
                                            : ''
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
