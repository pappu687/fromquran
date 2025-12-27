import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import { DataTable, type Column, type SortDirection } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Verse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    text_uthmani: string;
    text_imlaei_simple: string;
    juz_number: number;
    page_number: number;
    verse_index: number;
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_arabic: string;
    };
    translations: Array<{
        id: number;
        text: string;
        language_name: string;
        resource_name: string;
    }>;
}

interface Chapter {
    id: number;
    chapter_number: number;
    name_simple: string;
    name_arabic: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: Verse[];
}

interface Stats {
    total_verses: number;
    total_translations: number;
    total_chapters: number;
    total_juzs: number;
}

interface Filters {
    search: string;
    chapter_id: string;
    juz_number: string;
    page_number: string;
    sort_column: string;
    sort_direction: SortDirection;
}

interface AdminVersesProps {
    verses: PaginationData;
    chapters: Chapter[];
    stats: Stats;
    filters: Filters;
}

export default function AdminVerses({ verses: initialVerses, chapters, stats, filters }: AdminVersesProps) {
    const [selectedChapter, setSelectedChapter] = useState(filters.chapter_id);
    const [selectedJuz, setSelectedJuz] = useState(filters.juz_number);

    const handleSort = (column: string, direction: SortDirection) => {
        router.get(
            '/admin/verses',
            {
                ...filters,
                sort_column: column,
                sort_direction: direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearch = (query: string) => {
        router.get(
            '/admin/verses',
            {
                ...filters,
                search: query,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/admin/verses',
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleChapterFilter = (chapterId: string) => {
        setSelectedChapter(chapterId);
        router.get(
            '/admin/verses',
            {
                ...filters,
                chapter_id: chapterId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleJuzFilter = (juzNumber: string) => {
        setSelectedJuz(juzNumber);
        router.get(
            '/admin/verses',
            {
                ...filters,
                juz_number: juzNumber,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleViewVerse = (verse: Verse) => {
        // Navigate to the verse in the Quran reader
        window.open(`/${verse.chapter.chapter_number}`, '_blank');
    };

    const columns: Column<Verse>[] = [
        {
            key: 'verse_key',
            title: 'Verse Key',
            sortable: true,
            cell: (verse) => (
                <span className="font-medium font-mono text-sm">
                    {verse.verse_key}
                </span>
            ),
        },
        {
            key: 'chapter_id',
            title: 'Chapter',
            sortable: true,
            cell: (verse) => (
                <div className="flex flex-col">
                    <span className="font-medium">{verse.chapter.name_simple}</span>
                    <span className="text-xs text-muted-foreground">
                        {verse.chapter.name_arabic}
                    </span>
                </div>
            ),
        },
        {
            key: 'verse_number',
            title: 'Verse #',
            sortable: true,
            cell: (verse) => (
                <span className="text-muted-foreground">#{verse.verse_number}</span>
            ),
        },
        {
            key: 'text_uthmani',
            title: 'Arabic Text',
            sortable: false,
            cell: (verse) => (
                <div className="max-w-md">
                    <p className="text-right font-arabic text-lg line-clamp-2" dir="rtl">
                        {verse.text_uthmani}
                    </p>
                </div>
            ),
        },
        {
            key: 'juz_number',
            title: 'Juz',
            sortable: true,
            cell: (verse) => (
                <Badge variant="outline">Juz {verse.juz_number}</Badge>
            ),
        },
        {
            key: 'page_number',
            title: 'Page',
            sortable: true,
            cell: (verse) => (
                <span className="text-sm text-muted-foreground">
                    {verse.page_number}
                </span>
            ),
        },
        {
            key: 'translations',
            title: 'Translations',
            sortable: false,
            cell: (verse) => (
                <Badge variant="secondary">
                    {verse.translations?.length || 0}
                </Badge>
            ),
        },
    ];

    const actions = (verse: Verse) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewVerse(verse)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View in Reader
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title="Verses - Admin - From Quran" />
            <AdminLayout title="Verses">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Verse Management
                            </h2>
                            <p className="text-muted-foreground">
                                Browse and manage Quran verses
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                                {stats.total_verses.toLocaleString()} verses
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                {stats.total_translations.toLocaleString()} translations
                            </Badge>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Select value={selectedChapter} onValueChange={handleChapterFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by chapter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Chapters</SelectItem>
                                {chapters.map((chapter) => (
                                    <SelectItem key={chapter.id} value={chapter.id.toString()}>
                                        {chapter.chapter_number}. {chapter.name_simple}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedJuz} onValueChange={handleJuzFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by Juz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Juz</SelectItem>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                                    <SelectItem key={juz} value={juz.toString()}>
                                        Juz {juz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* DataTable */}
                    <DataTable
                        data={initialVerses.data}
                        columns={columns}
                        pagination={{
                            current_page: initialVerses.current_page,
                            last_page: initialVerses.last_page,
                            per_page: initialVerses.per_page,
                            total: initialVerses.total,
                            from: initialVerses.from,
                            to: initialVerses.to,
                        }}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        sortColumn={filters.sort_column}
                        sortDirection={filters.sort_direction}
                        isLoading={false}
                        onSearch={handleSearch}
                        searchPlaceholder="Search by verse key, text, or chapter..."
                        actions={actions}
                        emptyMessage="No verses found"
                    />
                </div>
            </AdminLayout>
        </>
    );
}
