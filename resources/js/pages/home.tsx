import { Button } from '@/components/ui/button';
import LandingLayout from '@/layouts/landing-layout';
import { router } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    BookOpen,
    ChevronRight,
    Globe,
    Link2,
    Network,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface FeatureProps {
    icon: ReactNode;
    title: string;
    description: string;
}

const featureItems: FeatureProps[] = [
    {
        icon: <Network className="h-5 w-5" />,
        title: 'Knowledge graphs',
        description:
            'See how verses, tafseer, hadith, and supporting materials connect without the page feeling overloaded.',
    },
    {
        icon: <Globe className="h-5 w-5" />,
        title: 'Curated resources',
        description:
            'Move from a verse into lectures, articles, and commentary with a cleaner reading flow.',
    },
    {
        icon: <Link2 className="h-5 w-5" />,
        title: 'Cross references',
        description:
            'Jump between related verses and ideas when you want to study a theme in more depth.',
    },
    {
        icon: <Bookmark className="h-5 w-5" />,
        title: 'Personal collections',
        description:
            'Save verses and organize them into collections for reflection, revision, and teaching.',
    },
];

function FeatureRow({ icon, title, description }: FeatureProps) {
    return (
        <div className="flex items-start gap-4 border-t border-slate-200 py-4 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-slate-700">
                {icon}
            </div>
            <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-7 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ChapterRow({ chapter }: { chapter: Chapter }) {
    return (
        <button
            type="button"
            className="group flex w-full min-w-0 items-center justify-between gap-3 border-t border-slate-200 py-4 text-left first:border-t-0 first:pt-0 last:pb-0"
            onClick={() => router.visit(`/${chapter.number}`)}
        >
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-slate-700">
                    {chapter.number}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold tracking-tight text-slate-950">
                            {chapter.romanName}
                        </h3>
                        <span className="font-arabic text-xl text-slate-400">
                            {chapter.name}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {chapter.englishName}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-start gap-2 sm:items-center sm:gap-3">
                <div className="text-right">
                    <p className="text-sm text-slate-600">
                        {chapter.verses} verses
                    </p>
                    <p className="text-xs text-slate-400">
                        {chapter.revelationType}
                    </p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 sm:mt-0" />
            </div>
        </button>
    );
}

export default function HomePage() {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                if (!response.ok) {
                    throw new Error('Failed to load chapters');
                }

                const data = (await response.json()) as Chapter[];
                setChapters(data);
                setHasError(false);
            } catch (err) {
                console.error('Failed to load chapters:', err);
                setHasError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchChapters();
    }, []);

    const scrollToChapters = () => {
        document.getElementById('chapters-section')?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    return (
        <LandingLayout title="From Quran - Explore the Quran Like Never Before">
            <section className="border-b border-slate-200 bg-[#fafaf8]">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-16 lg:py-24">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            From Quran
                        </p>
                        <h1 className="font-young mt-4 text-[2.8rem] leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-[4rem] lg:text-[5.2rem]">
                            Read the Qur&apos;an
                            <br />
                            with context.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
                            Explore verses, related topics, tafseer, and saved
                            collections in one reading experience designed to
                            stay calm, clear, and highly readable.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                size="lg"
                                onClick={scrollToChapters}
                                className="h-12 rounded-full px-6"
                            >
                                Start reading
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.visit('/topics')}
                                className="h-12 rounded-full border-slate-200 bg-white px-6 shadow-none"
                            >
                                Explore topics
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.visit('/collections')}
                                className="h-12 rounded-full border-slate-200 bg-white px-6 shadow-none"
                            >
                                Explore Collections
                            </Button>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-3 sm:max-w-md">
                            <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                <div className="text-2xl font-semibold tracking-tight text-slate-950">
                                    114
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    chapters ready to open
                                </p>
                            </div>
                            <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                <div className="text-2xl font-semibold tracking-tight text-slate-950">
                                    1 place
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    for reading and references
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-white px-5 py-5 ring-1 ring-slate-200 sm:px-6">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            Why it feels better
                        </p>
                        <div className="mt-4">
                            {featureItems.map((feature) => (
                                <FeatureRow key={feature.title} {...feature} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="chapters-section"
                className="bg-[#fafaf8] py-14 sm:py-18 lg:py-24"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-8 max-w-7xl sm:mb-10">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            Chapters
                        </p>
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                All 114 chapters
                            </h2>
                            <Button
                                variant="link"
                                className="h-auto self-start px-0 text-sm font-medium text-slate-700 sm:self-auto"
                                onClick={() =>
                                    router.visit('/revelation-order')
                                }
                            >
                                Revelation Order
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-[2rem] bg-white px-6 py-14 text-center ring-1 ring-slate-200">
                            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                            <p className="mt-4 text-sm text-slate-500">
                                Loading chapters...
                            </p>
                        </div>
                    ) : hasError ? (
                        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-10 text-center">
                            <h3 className="text-lg font-semibold text-red-900">
                                Chapters could not be loaded
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-red-700">
                                Refresh the page and try again.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-[2rem] bg-white px-5 py-5 ring-1 ring-slate-200 sm:px-6">
                            <div className="grid gap-x-8 gap-y-2 lg:grid-cols-2">
                                {chapters.map((chapter) => (
                                    <ChapterRow
                                        key={chapter.id}
                                        chapter={chapter}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="border-t border-slate-200 bg-[#fafaf8] py-14 sm:py-18">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
                    <h2 className="font-young text-3xl tracking-[-0.03em] text-slate-950 sm:text-4xl">
                        Everything stays centered on the text.
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                        Start with a chapter, follow a topic, or save verses
                        into a collection. The structure stays simple so the
                        reading stays primary.
                    </p>
                    <Button
                        size="lg"
                        onClick={scrollToChapters}
                        className="mt-8 h-12 rounded-full px-6"
                    >
                        <BookOpen className="h-5 w-5" />
                        Browse chapters
                    </Button>
                </div>
            </section>
        </LandingLayout>
    );
}
