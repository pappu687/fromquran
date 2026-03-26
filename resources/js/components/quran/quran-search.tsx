import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ExternalLink, Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchResult {
    id: number;
    documentType?: string;
    chapterId: number;
    chapterName: string;
    verseNumber: number;
    text: string;
    translation: string | null;
    highlight: string;
}

interface QuranSearchProps {
    onVerseSelect?: (chapterId: number, verseNumber: number) => void;
    className?: string;
}

export function QuranSearch({ onVerseSelect, className }: QuranSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/quran/search?query=${encodeURIComponent(searchQuery)}&limit=20`,
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setResults(
                (data.data || []).filter(
                    (result: SearchResult) => result.documentType === 'verse',
                ),
            );
        } catch (err) {
            setError('Failed to search. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleVerseClick = (result: SearchResult) => {
        if (onVerseSelect) {
            onVerseSelect(result.chapterId, result.verseNumber);
            setIsOpen(false);
            setQuery('');
            setResults([]);
        }
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;

        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.toLowerCase() === highlight.toLowerCase()) {
                return (
                    <mark key={index} className="rounded bg-yellow-200 px-0.5">
                        {part}
                    </mark>
                );
            }
            return part;
        });
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className={className}
            >
                <Search className="mr-2 h-4 w-4" />
                Search Quran
            </Button>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
        >
            <div className="container mx-auto flex h-full max-w-4xl flex-col p-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Search Quran</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search in English or Arabic..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
                        {error}
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Found {results.length} results for "{query}"
                            </div>

                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent/50"
                                    onClick={() => handleVerseClick(result)}
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                {result.chapterName}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                Verse {result.verseNumber}
                                            </span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    </div>

                                    <div className="space-y-2">
                                        <div
                                            className="text-right text-lg leading-relaxed"
                                            dir="rtl"
                                        >
                                            {highlightText(result.text, query)}
                                        </div>
                                        {result.translation && (
                                            <div className="text-sm leading-relaxed text-muted-foreground">
                                                {highlightText(
                                                    result.translation,
                                                    query,
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="mt-3" />
                                    <div className="pt-2 text-xs text-muted-foreground">
                                        Click to open this verse
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query && !loading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>No results found for "{query}"</p>
                            <p className="mt-2 text-sm">
                                Try using different keywords or search in Arabic
                                or English
                            </p>
                        </div>
                    ) : !query ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>Enter keywords to search the Quran</p>
                            <p className="mt-2 text-sm">
                                You can search in English or Arabic
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
