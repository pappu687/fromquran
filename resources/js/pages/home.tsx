import { Button } from '@/components/ui/button';
import { useChapters } from '@/hooks';
import LandingLayout from '@/layouts/landing-layout';
import { type ChapterSummary } from '@/types/quran';
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
import { type ReactNode } from 'react';

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
        <div className="grid gap-4 py-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                {icon}
            </div>
            <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-tight text-slate-950">
                    {title}
                </h3>
                <p className="max-w-xl text-sm leading-7 text-slate-600">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ChapterRow({ chapter }: { chapter: ChapterSummary }) {
    return (
        <button
            type="button"
            className="group relative grid w-full min-w-0 gap-3 bg-white/45 px-4 py-4 text-left shadow-[0_12px_40px_-34px_rgba(15,23,42,0.42)] ring-1 ring-slate-200/70 transition-colors hover:bg-white/72 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
            onClick={() => router.visit(`/${chapter.number}`)}
        >
            <div className="pointer-events-none absolute inset-y-4 left-0 w-px bg-slate-200" />
            <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-stone-50/90 text-sm font-semibold text-slate-700 transition-colors group-hover:border-slate-400 group-hover:text-slate-950">
                    {chapter.number}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
            <div className="flex shrink-0 items-center justify-between gap-3 pl-[3.75rem] sm:justify-end sm:pl-0">
                <div className="text-left sm:text-right">
                    <p className="text-sm text-slate-600">
                        {chapter.verses} verses
                    </p>
                    <p className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                        {chapter.revelationType}
                    </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>
        </button>
    );
}

function StatColumn({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-[1.5rem] bg-white/55 px-4 py-5 shadow-[0_12px_36px_-32px_rgba(15,23,42,0.3)] ring-1 ring-white/70 backdrop-blur-sm sm:px-5">
            <div className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.2rem]">
                {value}
            </div>
            <p className="mt-2 max-w-[14rem] text-sm leading-6 text-slate-500">
                {label}
            </p>
        </div>
    );
}

export default function HomePage() {
    const { chapters, loading, error } = useChapters();
    const hasError = Boolean(error);

    const scrollToChapters = () => {
        document.getElementById('chapters-section')?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    return (
        <LandingLayout title="From Quran - Explore the Quran Like Never Before">
            <div className="bg-[#f7f4ef] text-slate-950">
                <section className="relative overflow-hidden">
                    <div className="absolute top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(148,163,184,0.16),_transparent_68%)] blur-3xl" />
                    <div className="pointer-events-none absolute top-10 right-0 h-56 w-56 rounded-full bg-white/50 blur-3xl" />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="grid gap-14 py-14 sm:py-18 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:gap-16 lg:py-24">
                            <div className="max-w-4xl">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                                    <span>From Quran</span>
                                    <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[11px] text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                                        Read. Trace. Collect.
                                    </span>
                                </div>

                                <h1 className="font-young mt-6 max-w-4xl text-[3rem] leading-[0.92] tracking-[-0.055em] text-slate-950 sm:text-[4.2rem] lg:text-[5.5rem]">
                                    Read the Qur&apos;an
                                    <br />
                                    with context.
                                </h1>

                                <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
                                    <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                        Explore verses, related topics, tafseer,
                                        and saved collections in one reading
                                        experience designed to stay calm, clear,
                                        and highly readable.
                                    </p>
                                    <div className="rounded-[1.25rem] bg-white/45 px-4 py-4 text-sm leading-7 text-slate-500 shadow-[0_12px_36px_-32px_rgba(15,23,42,0.28)] ring-1 ring-white/70">
                                        Structured for focused reading, not
                                        visual clutter.
                                    </div>
                                </div>

                                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    <Button
                                        size="lg"
                                        onClick={scrollToChapters}
                                        className="h-12 rounded-full px-6"
                                    >
                                        Start reading
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => router.visit('/topics')}
                                        className="h-12 rounded-full border-slate-300 bg-white/70 px-6 shadow-none"
                                    >
                                        Explore topics
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit('/collections')
                                        }
                                        className="h-12 rounded-full border-slate-300 bg-white/70 px-6 shadow-none"
                                    >
                                        Explore Collections
                                    </Button>
                                </div>

                                <div className="mt-12 grid gap-4 sm:grid-cols-2">
                                    <StatColumn
                                        value="114"
                                        label="chapters ready to open"
                                    />
                                    <StatColumn
                                        value="1 place"
                                        label="for reading and references"
                                    />
                                </div>
                            </div>

                            <aside className="relative lg:pl-8">
                                <div className="rounded-[2rem] bg-white/38 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] ring-1 ring-white/70 backdrop-blur-sm sm:p-6">
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                                        <span>Why it feels better</span>
                                        <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-stone-50/80 px-3 py-1 text-[11px] text-slate-500">
                                            Built for reading
                                        </span>
                                    </div>
                                    <div className="mt-5 space-y-1">
                                        {featureItems.map((feature) => (
                                            <FeatureRow
                                                key={feature.title}
                                                {...feature}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                <section
                    id="chapters-section"
                    className="relative overflow-hidden py-14 sm:py-18 lg:py-24"
                >
                    <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(226,232,240,0.9),_transparent_70%)] blur-3xl" />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mb-8 max-w-5xl sm:mb-10">
                            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                                Chapters
                            </p>
                            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="sm:flex-1">
                                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                        All 114 chapters
                                    </h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                                        Scan the full Qur&apos;an index in a
                                        quiet two-column list, then move
                                        directly into the chapter you want to
                                        read.
                                    </p>
                                </div>
                                <Button
                                    variant="link"
                                    className="h-auto self-end px-0 text-sm font-medium text-slate-700 sm:ml-auto sm:self-auto"
                                    onClick={() =>
                                        router.visit('/revelation-order')
                                    }
                                >
                                    Revelation Order
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            {loading ? (
                                <div className="rounded-[2rem] bg-white/55 px-6 py-14 text-center backdrop-blur-sm">
                                    <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                                    <p className="mt-4 text-sm text-slate-500">
                                        Loading chapters...
                                    </p>
                                </div>
                            ) : hasError ? (
                                <div className="rounded-[2rem] bg-white/55 px-6 py-10 text-center backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold text-red-900">
                                        Chapters could not be loaded
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-red-700">
                                        Refresh the page and try again.
                                    </p>
                                </div>
                            ) : (
                                chapters.map((chapter) => (
                                    <ChapterRow
                                        key={chapter.id}
                                        chapter={chapter}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section className="py-14 sm:py-18">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="grid gap-6 rounded-[2rem] bg-white/42 px-5 py-8 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.32)] ring-1 ring-white/70 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10 sm:px-8">
                            <div className="max-w-2xl">
                                <h2 className="font-young text-3xl tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                    Everything stays centered on the text.
                                </h2>
                                <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                                    Start with a chapter, follow a topic, or
                                    save verses into a collection. The structure
                                    stays simple so the reading stays primary.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={scrollToChapters}
                                className="h-12 rounded-full px-6 sm:justify-self-end"
                            >
                                <BookOpen className="h-5 w-5" />
                                Browse chapters
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </LandingLayout>
    );
}
