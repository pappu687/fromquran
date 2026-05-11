import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { index as favorites } from '@/routes/favorites';
import { index as myAnnotations } from '@/routes/my-annotations';
import { index as myCollections } from '@/routes/my-collections';
import { index as myContributions } from '@/routes/my-contributions';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { BookText, FolderOpen, Heart, LogOut, Settings, User as UserIcon } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const { logout: authLogout } = useAuth();
    const cleanup = useMobileNavigation();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        cleanup();
        authLogout();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={myCollections()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <FolderOpen className="mr-2" />
                        My Collections
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={myContributions()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <UserIcon className="mr-2" />
                        My Contributions
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={myAnnotations()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <BookText className="mr-2" />
                        My Annotations
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={favorites()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Heart className="mr-2" />
                        Favorites
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    className="flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 size-4" />
                    Log out
                </button>
            </DropdownMenuItem>
        </>
    );
}
