import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type UseVerseActionsReturn } from '@/hooks/use-verse-actions';
import {
    Bookmark,
    BookmarkCheck,
    BookmarkPlus,
    Languages,
    Link,
    Plus,
    Quote,
    Share2,
} from 'lucide-react';
import { type ReactNode } from 'react';

interface VerseActionsDropdownProps {
    actions: UseVerseActionsReturn;
    children: ReactNode;
    excludeCopyTranslation?: boolean;
    align?: 'start' | 'center' | 'end';
}

export function VerseActionsDropdown({
    actions,
    children,
    excludeCopyTranslation = false,
    align = 'end',
}: VerseActionsDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-48">
                <DropdownMenuItem
                    onClick={actions.handleCopyArabic}
                    className="gap-2 text-sm"
                >
                    <Quote className="h-3.5 w-3.5" />
                    Copy Arabic
                </DropdownMenuItem>
                {!excludeCopyTranslation && (
                    <DropdownMenuItem
                        onClick={actions.handleCopyTranslation}
                        className="gap-2 text-sm"
                    >
                        <Languages className="h-3.5 w-3.5" />
                        Copy Translation
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onClick={actions.handleCopyLink}
                    className="gap-2 text-sm"
                >
                    <Link className="h-3.5 w-3.5" />
                    Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={actions.handleShareToFacebook}
                    className="gap-2 text-sm"
                >
                    <Share2 className="h-3.5 w-3.5" />
                    Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={actions.handleShareToTwitter}
                    className="gap-2 text-sm"
                >
                    <Share2 className="h-3.5 w-3.5" />
                    Share on Twitter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={actions.handleBookmark}
                    className="gap-2 text-sm"
                >
                    {actions.isBookmarked ? (
                        <>
                            <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                            <span>Remove bookmark</span>
                        </>
                    ) : (
                        <>
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>Bookmark verse</span>
                        </>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => actions.setIsCollectionsModalOpen(true)}
                    className="gap-2 text-sm"
                >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>Add to collection</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={actions.handleAddResource}
                    className="gap-2 text-sm"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add resource</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
