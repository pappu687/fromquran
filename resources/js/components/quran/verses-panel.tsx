import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VerseCard } from './verse-card';

interface Verse {
    id: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
    hasResources?: boolean;
    resourceCount?: number;
}

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
}

interface VersesPanelProps {
    chapter?: Chapter;
    apiUrl?: string;
    pageSize?: number;
    showTranslation?: boolean;
    className?: string;
    user?: any; // User authentication object
    fromVerse?: number;
    toVerse?: number;
}

export function VersesPanel({
    chapter,
    apiUrl = '/api/quran',
    pageSize = 10,
    showTranslation = true,
    user,
    className,
    fromVerse,
    toVerse,
}: VersesPanelProps) {
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<number>>(
        new Set(),
    );
    const [isAutoScroll, setIsAutoScroll] = useState(false);
    const [selectedEdition, setSelectedEdition] = useState('en.sahih');
    const [showSearch, setShowSearch] = useState(false);
    const [currentChapterId, setCurrentChapterId] = useState<number | null>(
        null,
    );

    const fetchVerses = async (pageNum: number, reset = false) => {
        if (!chapter) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                limit: String(pageSize),
                edition: selectedEdition,
            });

            if (fromVerse && toVerse) {
                params.set('from', String(fromVerse));
                params.set('to', String(toVerse));
            }

            const response = await fetch(
                `${apiUrl}/chapters/${chapter.id}/verses?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error('Failed to fetch verses');
            }

            const data = await response.json();

            if (reset) {
                setVerses(data.data || []);
            } else {
                setVerses((prev) => [...prev, ...(data.data || [])]);
            }

            setHasMore(data.data?.length === pageSize);
            setPage(pageNum);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (chapter && chapter.id !== currentChapterId) {
            setCurrentChapterId(chapter.id);
            setVerses([]);
            setPage(1);
            setHasMore(true);
            fetchVerses(1, true);
        }
    }, [chapter?.id, apiUrl, pageSize, selectedEdition, fromVerse, toVerse]);

    // Load user bookmarks if authenticated
    useEffect(() => {
        if (user && chapter) {
            loadUserBookmarks();
        }
    }, [user, chapter, selectedEdition]);

    const loadUserBookmarks = async () => {
        if (!user) return;

        try {
            const response = await fetch(
                `/api/bookmarks?chapter_id=${chapter.id}&edition=${selectedEdition}`,
            );

            if (response.ok) {
                const data = await response.json();
                const bookmarkedIds = new Set(
                    data.data.map((b: any) => b.verse_id),
                );
                setBookmarkedVerses(bookmarkedIds);
            }
        } catch (err) {
            console.error('Failed to load bookmarks:', err);
        }
    };



    const loadMore = () => {
        if (!loading && hasMore) {
            fetchVerses(page + 1);
        }
    };

    const handleBookmarkToggle = async (verse: Verse) => {
        if (!user) {
            // Redirect to login or show message
            alert('Please login to bookmark verses');
            return;
        }

        const verseId = verse.id.toString();
        const isCurrentlyBookmarked = bookmarkedVerses.has(verseId);

        try {
            if (isCurrentlyBookmarked) {
                // Remove bookmark
                const response = await fetch(
                    `/api/bookmarks/check?verse_id=${verseId}&edition=${selectedEdition}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.bookmark) {
                        await fetch(`/api/bookmarks/${data.bookmark.id}`, {
                            method: 'DELETE',
                        });
                    }
                }

                setBookmarkedVerses((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(verseId);
                    return newSet;
                });
            } else {
                // Add bookmark
                await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chapter_id: chapter?.id,
                        verse_number: verse.verseNumber,
                        verse_id: verseId,
                        verse_data: verse,
                        edition: selectedEdition,
                    }),
                });

                setBookmarkedVerses((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(verseId);
                    return newSet;
                });
            }
        } catch (err) {
            console.error('Failed to toggle bookmark:', err);
            alert('Failed to update bookmark. Please try again.');
        }
    };

    const handleCopy = async (verseId: number, text: string) => {
        await navigator.clipboard.writeText(text);
    };

    const handlePlayAudio = (audioUrl: string) => {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
    };

    const toggleAutoScroll = () => {
        setIsAutoScroll(!isAutoScroll);
    };

    if (!chapter) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Select a chapter to start reading</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col',
                'w-full', // full width by default
                'max-w-full', // prevent overflowing
                'md:max-w-[280mm]', // A4 width (~210mm) for md and up
                'md:mx-auto', // center on md+
                className,
            )}
        >
            {/* Verses Content */}
            <div>
                <div className="p-4">
                    {error && (
                        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
                            <p>Error: {error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchVerses(1, true)}
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {verses.length === 0 && !loading && !error && (
                        <div className="py-8 text-center text-muted-foreground">
                            <p>No verses found</p>
                        </div>
                    )}

                    {/* Verses */}
                    {verses.map((verse) => (
                        <VerseCard
                            key={verse.id}
                            verse={verse}
                            isBookmarked={bookmarkedVerses.has(
                                verse.id.toString(),
                            )}
                            hasResources={verse.hasResources || false}
                            onBookmarkToggle={() => handleBookmarkToggle(verse)}
                            onCopy={handleCopy}
                            onPlayAudio={handlePlayAudio}
                            showTranslation={showTranslation}
                        />
                    ))}

                    {/* Load More Button */}
                    {!fromVerse && !toVerse && hasMore && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={loadMore}
                                disabled={loading}
                                className="min-w-32"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More Verses'
                                )}
                            </Button>
                        </div>
                    )}

                    {/* End Message */}
                    {!hasMore && verses.length > 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                            <Separator className="mb-4" />
                            <p>You've reached the end of this chapter</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
