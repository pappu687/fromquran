import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DataTable,
    type Column,
    type SortDirection,
} from '@/components/ui/data-table';
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
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Translation {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    text: string;
    language_name: string;
    resource_name: string;
    priority: number;
    verse?: {
        id: number;
        text_uthmani: string;
    };
    chapter?: {
        id: number;
        chapter_number: number;
        name_simple: string;
    };
    language?: {
        id: number;
        name: string;
        iso_code: string;
    };
}

interface Chapter {
    id: number;
    chapter_number: number;
    name_simple: string;
    name_arabic: string;
}

interface Language {
    id: number;
    name: string;
    iso_code: string;
}

interface Resource {
    id: number;
    resource_id: number;
    name: string;
    author_name: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: Translation[];
}

interface Stats {
    total_translations: number;
    total_languages: number;
    total_resources: number;
    avg_translations_per_verse: number;
}

interface Filters {
    search: string;
    chapter_id: string;
    language_id: string;
    resource_id: string;
    sort_column: string;
    sort_direction: SortDirection;
}

interface AdminTranslationsProps {
    translations: PaginationData;
    chapters: Chapter[];
    languages: Language[];
    resources: Resource[];
    stats: Stats;
    filters: Filters;
}

export default function AdminTranslations({
    translations: initialTranslations,
    chapters,
    languages,
    resources,
    stats,
    filters,
}: AdminTranslationsProps) {
    const [selectedChapter, setSelectedChapter] = useState(filters.chapter_id);
    const [selectedLanguage, setSelectedLanguage] = useState(
        filters.language_id,
    );
    const [selectedResource, setSelectedResource] = useState(
        filters.resource_id,
    );

    const handleSort = (column: string, direction: SortDirection) => {
        router.get(
            '/admin/translations',
            {
                ...filters,
                sort_column: column,
                sort_direction: direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = (query: string) => {
        router.get(
            '/admin/translations',
            {
                ...filters,
                search: query,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/admin/translations',
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleChapterFilter = (chapterId: string) => {
        setSelectedChapter(chapterId);
        router.get(
            '/admin/translations',
            {
                ...filters,
                chapter_id: chapterId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleLanguageFilter = (languageId: string) => {
        setSelectedLanguage(languageId);
        router.get(
            '/admin/translations',
            {
                ...filters,
                language_id: languageId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResourceFilter = (resourceId: string) => {
        setSelectedResource(resourceId);
        router.get(
            '/admin/translations',
            {
                ...filters,
                resource_id: resourceId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleViewTranslation = (translation: Translation) => {
        // Navigate to the verse in the Quran reader
        if (translation.chapter) {
            window.open(`/${translation.chapter.chapter_number}`, '_blank');
        }
    };

    const columns: Column<Translation>[] = [
        {
            key: 'verse_key',
            title: 'Verse Key',
            sortable: true,
            cell: (translation) => (
                <span className="font-mono text-sm font-medium">
                    {translation.verse_key}
                </span>
            ),
        },
        {
            key: 'chapter_id',
            title: 'Chapter',
            sortable: true,
            cell: (translation) => (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {translation.chapter?.name_simple || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Verse {translation.verse_number}
                    </span>
                </div>
            ),
        },
        {
            key: 'text',
            title: 'Translation Text',
            sortable: false,
            cell: (translation) => (
                <div className="max-w-md">
                    <p className="line-clamp-2 text-sm">{translation.text}</p>
                </div>
            ),
        },
        {
            key: 'language_name',
            title: 'Language',
            sortable: true,
            cell: (translation) => (
                <Badge variant="outline">{translation.language_name}</Badge>
            ),
        },
        {
            key: 'resource_name',
            title: 'Resource',
            sortable: true,
            cell: (translation) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {translation.resource_name}
                    </span>
                </div>
            ),
        },
        {
            key: 'priority',
            title: 'Priority',
            sortable: false,
            cell: (translation) => (
                <Badge variant="secondary">{translation.priority || 0}</Badge>
            ),
        },
    ];

    const actions = (translation: Translation) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleViewTranslation(translation)}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    View in Reader
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title="Translations - Admin - From Quran" />
            <AdminLayout title="Translations">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.16)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Translation management
                                </h2>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Review translation coverage across chapters,
                                    languages, and source resources.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-lg font-semibold">
                                        {stats.total_translations.toLocaleString()}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Translations
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-lg font-semibold">
                                        {stats.total_languages}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Languages
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-lg font-semibold">
                                        {stats.total_resources}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Resources
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-lg font-semibold">
                                        {stats.avg_translations_per_verse}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Avg / Verse
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 bg-background/96 px-4 py-4 shadow-sm shadow-black/[0.02]">
                        <Select
                            value={selectedChapter}
                            onValueChange={handleChapterFilter}
                        >
                            <SelectTrigger className="h-10 w-[200px] rounded-lg border-border/70 bg-background">
                                <SelectValue placeholder="Filter by chapter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Chapters
                                </SelectItem>
                                {chapters.map((chapter) => (
                                    <SelectItem
                                        key={chapter.id}
                                        value={chapter.id.toString()}
                                    >
                                        {chapter.chapter_number}.{' '}
                                        {chapter.name_simple}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedLanguage}
                            onValueChange={handleLanguageFilter}
                        >
                            <SelectTrigger className="h-10 w-[180px] rounded-lg border-border/70 bg-background">
                                <SelectValue placeholder="Filter by language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Languages
                                </SelectItem>
                                {languages.map((language) => (
                                    <SelectItem
                                        key={language.id}
                                        value={language.id.toString()}
                                    >
                                        {language.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedResource}
                            onValueChange={handleResourceFilter}
                        >
                            <SelectTrigger className="h-10 w-[200px] rounded-lg border-border/70 bg-background">
                                <SelectValue placeholder="Filter by resource" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Resources
                                </SelectItem>
                                {resources.map((resource) => (
                                    <SelectItem
                                        key={resource.id}
                                        value={resource.resource_id.toString()}
                                    >
                                        {resource.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable
                        data={initialTranslations.data}
                        columns={columns}
                        pagination={{
                            current_page: initialTranslations.current_page,
                            last_page: initialTranslations.last_page,
                            per_page: initialTranslations.per_page,
                            total: initialTranslations.total,
                            from: initialTranslations.from,
                            to: initialTranslations.to,
                        }}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        sortColumn={filters.sort_column}
                        sortDirection={filters.sort_direction}
                        isLoading={false}
                        onSearch={handleSearch}
                        searchPlaceholder="Search by translation text, verse key, language, or resource..."
                        actions={actions}
                        emptyMessage="No translations found"
                    />
                </div>
            </AdminLayout>
        </>
    );
}
