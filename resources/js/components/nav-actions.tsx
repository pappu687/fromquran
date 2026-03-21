'use client';

import {
    BookText,
    BookOpen,
    FolderOpen,
    Heart,
    Home,
    List,
    Lock,
    LogIn,
    LogOut,
    MoreHorizontal,
    Search as SearchIcon,
    Settings,
    User,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { CommandPalette } from '@/components/command-palette';
import { ReaderSettingsSheet } from '@/components/reader-settings-sheet';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { useReadingMode } from '@/contexts/reading-mode-context';
import { type User as AuthUser } from '@/types';
import { router, usePage } from '@inertiajs/react';

interface MenuItem {
    label: string;
    icon: LucideIcon;
    href: string;
    method?: 'post';
}

const menuData: MenuItem[][] = [
    [
        {
            label: 'My Collections',
            icon: FolderOpen,
            href: '/my-collections',
        },
        {
            label: 'My Contributions',
            icon: User,
            href: '/my-contributions',
        },
        {
            label: 'My Annotations',
            icon: BookText,
            href: '/my-annotations',
        },
        {
            label: 'Favorites',
            icon: Heart,
            href: '/favorites',
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '/settings/profile',
        },
    ],
    [
        {
            label: 'Logout',
            icon: LogOut,
            href: '/logout',
            method: 'post',
        },
    ],
];

interface MobileMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'list' | 'reading';
    onModeChange: (mode: 'list' | 'reading') => void;
    user: AuthUser | null;
    onNavigate: (href: string) => void;
    onMenuItemClick: (item: MenuItem) => void;
    onReaderSettingsOpen: () => void;
}

const MobileMenuContent = React.memo(
    ({
        open,
        onOpenChange,
        mode,
        onModeChange,
        user,
        onNavigate,
        onMenuItemClick,
        onReaderSettingsOpen,
    }: MobileMenuProps) => {
        const handleAction = (action: () => void) => {
            onOpenChange(false);
            action();
        };

        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-[320px] sm:hidden">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-lg font-semibold">
                            Menu
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-6 py-2">
                        {/* Reader Controls */}
                        <div className="space-y-4">
                            <h3 className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Reader
                            </h3>
                            <div className="space-y-2">
                                <Button
                                    variant="ghost"
                                    className="h-11 w-full justify-start px-3 text-sm font-medium hover:bg-accent"
                                    onClick={() =>
                                        handleAction(() => onNavigate('/'))
                                    }
                                >
                                    <Home className="mr-3 h-5 w-5" />
                                    Home
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="h-11 w-full justify-start px-3 text-sm font-medium hover:bg-accent"
                                    onClick={() =>
                                        handleAction(onReaderSettingsOpen)
                                    }
                                >
                                    <Settings className="mr-3 h-5 w-5" />
                                    Reader Settings
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="h-11 w-full justify-start px-3 text-sm font-medium hover:bg-accent"
                                    onClick={() =>
                                        handleAction(() =>
                                            onNavigate('/search'),
                                        )
                                    }
                                >
                                    <SearchIcon className="mr-3 h-5 w-5" />
                                    Search
                                </Button>
                            </div>

                            <div className="space-y-3 px-2">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    View Mode
                                </p>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={mode}
                                    onValueChange={(value) => {
                                        if (value)
                                            onModeChange(
                                                value as 'list' | 'reading',
                                            );
                                    }}
                                    className="grid w-full grid-cols-2 gap-0"
                                >
                                    <ToggleGroupItem
                                        value="list"
                                        aria-label="List view"
                                        className={
                                            mode === 'list'
                                                ? 'bg-gray-300 text-white hover:bg-gray-300 hover:text-white'
                                                : ''
                                        }
                                    >
                                        <List className="h-4 w-4" />
                                        List
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="reading"
                                        aria-label="Reading view"
                                        className={
                                            mode === 'reading'
                                                ? 'bg-gray-300 text-white hover:bg-gray-300 hover:text-white'
                                                : ''
                                        }
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Reading
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>

                        {/* User menu items (if logged in) */}
                        {user && (
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Account
                                </h3>
                                <div className="space-y-2">
                                    {menuData.flat().map((item, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="h-11 w-full justify-start px-3 text-sm font-medium hover:bg-accent"
                                            onClick={() =>
                                                handleAction(() =>
                                                    onMenuItemClick(item),
                                                )
                                            }
                                        >
                                            <item.icon className="mr-3 h-5 w-5" />
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Login button (if not logged in) */}
                        {!user && (
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Account
                                </h3>
                                <Button
                                    variant="ghost"
                                    className="h-11 w-full justify-start px-3 text-sm font-medium hover:bg-accent"
                                    onClick={() =>
                                        handleAction(() => onNavigate('/login'))
                                    }
                                >
                                    <LogIn className="mr-3 h-5 w-5" />
                                    Login
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        );
    },
);

MobileMenuContent.displayName = 'MobileMenuContent';

export function NavActions() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
    const [readerSettingsOpen, setReaderSettingsOpen] = React.useState(false);
    const { user } = useAuth();
    const { mode, setMode } = useReadingMode();
    // Only show reading mode toggle on the Quran reader page
    const { component } = usePage();
    const isReaderPage = component === 'quran/reader';

    const handleMenuClick = (item: MenuItem) => {
        setIsOpen(false);
        if (item.method === 'post') {
            router.post(item.href);
        } else {
            router.visit(item.href);
        }
    };

    // Handle CMD+K / Ctrl+K keyboard shortcut
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search / reader controls
    const SearchInput = () => (
        <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/')}
                    >
                        <Home className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
            </Tooltip>

            {isReaderPage && (
                <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                        if (value) setMode(value as 'list' | 'reading');
                    }}
                    variant="outline"
                    size="sm"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="list"
                                aria-label="List view"
                                className={
                                    mode === 'list'
                                        ? 'bg-gray-700 text-white hover:bg-gray-700 hover:text-white'
                                        : ''
                                }
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>List view</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="reading"
                                aria-label="Reading view"
                                className={
                                    mode === 'reading'
                                        ? 'bg-gray-700 text-white hover:bg-gray-700 hover:text-white'
                                        : ''
                                }
                            >
                                <BookOpen className="h-4 w-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Reading view</TooltipContent>
                    </Tooltip>
                </ToggleGroup>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReaderSettingsOpen(true)}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Reader Settings</TooltipContent>
            </Tooltip>

            {!user && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/login')}
                            aria-label="Login"
                        >
                            <Lock className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Login to access all features
                    </TooltipContent>
                </Tooltip>
            )}

            <Button
                variant="ghost"
                size="sm"
                className="ml-1"
                onClick={() => router.visit('/search')}
            >
                <SearchIcon className="mr-1 h-4 w-4" />
                <span className="text-xs font-medium">Search</span>
            </Button>
        </div>
    );

    // If user is not logged in, show search and login button
    if (!user) {
        return (
            <>
                <div className="flex items-center gap-2 text-sm">
                    <SearchInput />
                    {/* Mobile: lock icon + kebab menu */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:hidden"
                        onClick={() => router.visit('/login')}
                        aria-label="Login"
                    >
                        <Lock className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
                <MobileMenuContent
                    open={mobileMenuOpen}
                    onOpenChange={setMobileMenuOpen}
                    mode={mode}
                    onModeChange={setMode}
                    user={user}
                    onNavigate={(href) => router.visit(href)}
                    onMenuItemClick={handleMenuClick}
                    onReaderSettingsOpen={() => setReaderSettingsOpen(true)}
                />
                <CommandPalette
                    open={commandPaletteOpen}
                    onOpenChange={setCommandPaletteOpen}
                />
                <ReaderSettingsSheet
                    open={readerSettingsOpen}
                    onOpenChange={setReaderSettingsOpen}
                />
            </>
        );
    }

    // If user is logged in, show search, welcome message and dropdown
    return (
        <>
            <div className="flex items-center gap-2 text-sm">
                <SearchInput />
                <div className="hidden font-medium text-muted-foreground md:inline-block">
                    Welcome, {user.name}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-7 w-7 data-[state=open]:bg-accent sm:flex"
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
                                    <SidebarGroup
                                        key={index}
                                        className="border-b last:border-none"
                                    >
                                        <SidebarGroupContent className="gap-0">
                                            <SidebarMenu>
                                                {group.map(
                                                    (item, itemIndex) => (
                                                        <SidebarMenuItem
                                                            key={itemIndex}
                                                        >
                                                            <SidebarMenuButton
                                                                onClick={() =>
                                                                    handleMenuClick(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <item.icon />{' '}
                                                                <span>
                                                                    {item.label}
                                                                </span>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    ),
                                                )}
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    </SidebarGroup>
                                ))}
                            </SidebarContent>
                        </Sidebar>
                    </PopoverContent>
                </Popover>
            </div>
            <MobileMenuContent
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                mode={mode}
                onModeChange={setMode}
                user={user}
                onNavigate={(href) => router.visit(href)}
                onMenuItemClick={handleMenuClick}
                onReaderSettingsOpen={() => setReaderSettingsOpen(true)}
            />
            <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
            />
            <ReaderSettingsSheet
                open={readerSettingsOpen}
                onOpenChange={setReaderSettingsOpen}
            />
        </>
    );
}
