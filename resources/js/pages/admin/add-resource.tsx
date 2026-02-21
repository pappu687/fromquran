import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ExternalLink, Loader2, PlusCircle, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Chapter {
    id: number;
    number: number;
    name_arabic: string;
    name_roman: string;
    verses_count: number;
}

interface Verse {
    id: number;
    verse_number: number;
    verse_key: string;
}

interface SearchResult {
    id: string; // from youtube
    title: string;
    description: string;
    url: string;
    thumbnail_url?: string;
}

interface Props {
    resourceTypes: ResourceType[];
    chapters: Chapter[];
}

export default function AddResource({ resourceTypes, chapters }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResourceTypeId, setSelectedResourceTypeId] =
        useState<string>('');

    // Chain dropdown state
    const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
    const [verses, setVerses] = useState<Verse[]>([]);
    const [selectedVerseId, setSelectedVerseId] = useState<string>('all');

    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedResults, setSelectedResults] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!selectedResourceTypeId) {
            // Find youtube_tafseer and select it by default
            const ytType = resourceTypes.find((t) => t.slug === 'youtube_tafseer');
            if (ytType) {
                setSelectedResourceTypeId(ytType.id.toString());
            } else if (resourceTypes.length > 0) {
                setSelectedResourceTypeId(resourceTypes[0].id.toString());
            }
        }
    }, [resourceTypes, selectedResourceTypeId]);

    useEffect(() => {
        if (selectedChapterId && selectedChapterId !== 'all') {
            // Fetch verses
            setSelectedVerseId('all');
            axios
                .get(`/api/verses?chapter_id=${selectedChapterId}`)
                .then((res) => {
                    setVerses(res.data);
                })
                .catch((err) => console.error(err));
        } else {
            setVerses([]);
            setSelectedVerseId('all');
        }
    }, [selectedChapterId]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;

        setIsSearching(true);
        axios
            .post('/admin/add-resource/search', {
                term: searchTerm,
                type: selectedResourceTypeId,
            })
            .then((res) => {
                setSearchResults(res.data.results || []);
                setSelectedResults([]); // reset selection
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsSearching(false);
            });
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedResults(searchResults.map((r) => r.id));
        } else {
            setSelectedResults([]);
        }
    };

    const toggleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedResults((prev) => [...prev, id]);
        } else {
            setSelectedResults((prev) => prev.filter((item) => item !== id));
        }
    };

    const handleSubmit = () => {
        if (selectedResults.length === 0) return;
        if (!selectedChapterId || selectedChapterId === 'all') {
            alert('A Chapter must be selected.');
            return;
        }

        const resourcesPayload = searchResults
            .filter((r) => selectedResults.includes(r.id))
            .map((r) => ({
                url: r.url,
                title: r.title,
                description: r.description,
                thumbnail_url: r.thumbnail_url,
            }));

        setIsSubmitting(true);
        router.post(
            '/admin/add-resource/store',
            {
                resource_type_id: selectedResourceTypeId,
                chapter_id: selectedChapterId,
                verse_id: selectedVerseId === 'all' ? null : selectedVerseId,
                resources: resourcesPayload,
            },
            {
                onFinish: () => setIsSubmitting(false),
                onSuccess: () => {
                    setSelectedResults([]);
                    toast.success('Successfully added');
                },
            },
        );
    };

    return (
        <>
            <Head title="Add Resource - Admin - From Quran" />
            <AdminLayout title="Add Resource">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Web</CardTitle>
                            <CardDescription>
                                Search YouTube (or other sources) using Spatie
                                Crawler and add resources directly to
                                user_verse_resources or user_chapter_resources.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleSearch}
                                className="flex flex-col gap-4"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Resource Type
                                        </label>
                                        <Select
                                            value={selectedResourceTypeId}
                                            onValueChange={
                                                setSelectedResourceTypeId
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resourceTypes.map((type) => (
                                                    <SelectItem
                                                        key={type.id}
                                                        value={type.id.toString()}
                                                    >
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Chapter (Target)
                                        </label>
                                        <Select
                                            value={selectedChapterId}
                                            onValueChange={setSelectedChapterId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Chapter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    None (Require Chapter)
                                                </SelectItem>
                                                {chapters.map((chapter) => (
                                                    <SelectItem
                                                        key={chapter.id}
                                                        value={chapter.id.toString()}
                                                    >
                                                        {chapter.number}.{' '}
                                                        {chapter.name_roman} (
                                                        {chapter.name_arabic})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Verse (Target)
                                        </label>
                                        <Select
                                            value={selectedVerseId}
                                            onValueChange={setSelectedVerseId}
                                            disabled={
                                                selectedChapterId === 'all' ||
                                                verses.length === 0
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Verses (Chapter Level)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    All Verses (Chapter Level)
                                                </SelectItem>
                                                {verses.map((verse) => (
                                                    <SelectItem
                                                        key={verse.id}
                                                        value={verse.id.toString()}
                                                    >
                                                        Verse{' '}
                                                        {verse.verse_number} (
                                                        {verse.verse_key})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-4 md:flex-row">
                                    <div className="w-full flex-1 space-y-2">
                                        <label className="text-sm font-medium">
                                            Search Keyword
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                placeholder="e.g. Surah Al-Baqarah Tafseer Nouman Ali Khan"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSearching || !searchTerm}
                                    >
                                        {isSearching ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="mr-2 h-4 w-4" />
                                        )}
                                        Search
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {searchResults.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Search Results</CardTitle>
                                <CardDescription>
                                    Select the desired resources and assign them
                                    to the target Chapter/Verse.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr className="border-b">
                                                <th className="w-12 p-3 text-left">
                                                    <Checkbox
                                                        checked={
                                                            selectedResults.length >
                                                                0 &&
                                                            selectedResults.length ===
                                                                searchResults.length
                                                        }
                                                        onCheckedChange={
                                                            toggleSelectAll
                                                        }
                                                    />
                                                </th>
                                                <th className="w-[120px] p-3 text-left">
                                                    Thumbnail
                                                </th>
                                                <th className="p-3 text-left">
                                                    Title & Desc
                                                </th>
                                                <th className="p-3 text-left">
                                                    URL
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.map((result) => (
                                                <tr
                                                    key={result.id}
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                >
                                                    <td className="p-3">
                                                        <Checkbox
                                                            checked={selectedResults.includes(
                                                                result.id,
                                                            )}
                                                            onCheckedChange={(
                                                                c,
                                                            ) =>
                                                                toggleSelect(
                                                                    result.id,
                                                                    c as boolean,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        {result.thumbnail_url ? (
                                                            <div className="overflow-hidden rounded-md border text-center">
                                                                <img
                                                                    src={
                                                                        result.thumbnail_url
                                                                    }
                                                                    alt={
                                                                        result.title
                                                                    }
                                                                    className="h-[60px] w-auto object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-[60px] w-full items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div
                                                            className="line-clamp-2 font-semibold"
                                                            dangerouslySetInnerHTML={{
                                                                __html: result.title,
                                                            }}
                                                        />
                                                        <div
                                                            className="mt-1 line-clamp-3 text-xs text-muted-foreground"
                                                            dangerouslySetInnerHTML={{
                                                                __html: result.description,
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <a
                                                            href={result.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            <span className="inline-block max-w-[200px] truncate align-bottom">
                                                                {result.url}
                                                            </span>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={
                                            selectedResults.length === 0 ||
                                            isSubmitting ||
                                            selectedChapterId === 'all'
                                        }
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Add{' '}
                                        {selectedResults.length > 0
                                            ? selectedResults.length
                                            : ''}{' '}
                                        Resource
                                        {selectedResults.length !== 1
                                            ? 's'
                                            : ''}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AdminLayout>
        </>
    );
}
