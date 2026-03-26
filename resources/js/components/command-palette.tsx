import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfVerses: number;
}

interface Verse {
    id: number;
    verseNumber: number;
    chapterId: number;
    text: string;
}

interface SearchResult {
    id: number;
    documentType?: string;
    verseNumber: number;
    chapterId: number;
    text: string;
    chapter?: Chapter;
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(
        null,
    );

    // Fetch chapters when dialog opens
    useEffect(() => {
        if (open) {
            fetch('/api/quran/chapters')
                .then((res) => res.json())
                .then((data) => setChapters(data))
                .catch((err) =>
                    console.error('Failed to fetch chapters:', err),
                );
        }
    }, [open]);

    // Debounced search for verses
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setLoading(true);
            const params = new URLSearchParams({
                query: searchQuery,
                limit: '10',
            });

            fetch(`/api/quran/search?${params}`)
                .then((res) => res.json())
                .then((data) => {
                    setSearchResults(
                        (data.data || []).filter(
                            (result: SearchResult) =>
                                result.documentType === 'verse',
                        ),
                    );
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Search failed:', err);
                    setSearchResults([]);
                    setLoading(false);
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectChapter = (chapterNumber: number) => {
        router.get(`/${chapterNumber}`);
        onOpenChange(false);
        setSearchQuery('');
    };

    const handleSelectVerse = (chapterId: number, verseNumber: number) => {
        router.get(`/${chapterId}#${verseNumber}`);
        onOpenChange(false);
        setSearchQuery('');
    };

    // Filter chapters based on search query
    const filteredChapters = searchQuery
        ? chapters.filter(
              (chapter) =>
                  chapter.englishName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                  chapter.englishNameTranslation
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
          )
        : chapters.slice(0, 10); // Show first 10 when no search

    const showChapterResults =
        searchQuery.length > 0 || filteredChapters.length > 0;
    const showVerseResults = searchResults.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 shadow-lg">
                <Command className="max-h-[600px]">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder="Search verses or chapters..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="border-0 focus-visible:ring-0"
                        />
                    </div>
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}

                        {!loading &&
                            searchQuery.length >= 2 &&
                            searchResults.length === 0 && (
                                <CommandEmpty>No results found.</CommandEmpty>
                            )}

                        {!loading && showVerseResults && (
                            <>
                                <CommandGroup
                                    heading="Verses"
                                    className="[&_[data-cmdk-group-heading]]:px-2"
                                >
                                    {searchResults.map((result) => (
                                        <CommandItem
                                            key={result.id}
                                            onSelect={() =>
                                                handleSelectVerse(
                                                    result.chapterId,
                                                    result.verseNumber,
                                                )
                                            }
                                            className="flex flex-col items-start gap-1 px-4 py-3"
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Chapter {result.chapterId}:
                                                    {result.verseNumber}
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <p className="line-clamp-2 text-sm">
                                                {result.text}
                                            </p>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {showChapterResults && <CommandSeparator />}
                            </>
                        )}

                        {!loading && showChapterResults && (
                            <CommandGroup
                                className="p-2 text-sm font-semibold text-gray-500"
                                heading={
                                    searchQuery.length >= 2
                                        ? 'Chapters'
                                        : 'Recent Chapters'
                                }
                            >
                                {filteredChapters.slice(0, 5).map((chapter) => (
                                    <CommandItem
                                        key={chapter.id}
                                        onSelect={() =>
                                            handleSelectChapter(chapter.number)
                                        }
                                        className="flex items-center justify-between px-4 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="h-6 min-w-6 justify-center rounded-full px-1 text-xs"
                                            >
                                                {chapter.number}
                                            </Badge>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {chapter.englishName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {
                                                        chapter.englishNameTranslation
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {chapter.numberOfVerses} verses
                                            </span>
                                            <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {!loading && searchQuery.length === 0 && (
                            <div className="py-3">
                                <CommandGroup
                                    heading="Quick Actions"
                                    className="p-2 text-sm font-semibold text-gray-500"
                                >
                                    <CommandItem
                                        onSelect={() => {
                                            router.get('/dashboard');
                                            onOpenChange(false);
                                        }}
                                    >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span>Go to Dashboard</span>
                                    </CommandItem>
                                </CommandGroup>
                                <div className="px-4 py-2">
                                    <p className="text-xs text-muted-foreground">
                                        Use{' '}
                                        <kbd className="rounded bg-muted px-1.5 py-0.5">
                                            ↑↓
                                        </kbd>{' '}
                                        to navigate,{' '}
                                        <kbd className="rounded bg-muted px-1.5 py-0.5">
                                            Enter
                                        </kbd>{' '}
                                        to select
                                    </p>
                                </div>
                            </div>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
