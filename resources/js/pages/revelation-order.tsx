import {
    revelationOrderData,
    type RevelationEntry,
} from '@/data/revelation-order';
import PublicLayout from '@/layouts/public-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpenText, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

type ViewMode = 'revelation' | 'mushaf';
type PhaseFilter = 'all' | 'early' | 'middle' | 'late' | 'medina';

interface TimelineGroup {
    key: string;
    label: string;
    items: RevelationEntry[];
}

const phaseFilters: Array<{ key: PhaseFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'early', label: 'Early Meccan' },
    { key: 'middle', label: 'Middle Meccan' },
    { key: 'late', label: 'Late Meccan' },
    { key: 'medina', label: 'Medinan' },
];

function getYearLabel(year: number) {
    if (year < 0) {
        return `${Math.abs(year)} BH`;
    }

    if (year > 0) {
        return `${year} AH`;
    }

    return 'Hijrah';
}

function getPhaseLabel(entry: RevelationEntry) {
    if (entry.phase === 'medina') {
        return entry.period === 'mixed' ? 'Mixed / Medinan' : 'Medinan';
    }

    return `${entry.phase.charAt(0).toUpperCase()}${entry.phase.slice(1)} Meccan`;
}

function getEntryNote(entry: RevelationEntry) {
    if (entry.order === 1) {
        return 'First revelation';
    }

    if (entry.order === 5) {
        return 'Opening prayer of the Quran';
    }

    if (entry.order === 50) {
        return 'Late Meccan turning point';
    }

    if (entry.order === 66) {
        return 'Community laws begin';
    }

    if (entry.order === 91) {
        return 'Final revelation phase';
    }

    if (entry.order === 93) {
        return 'Closing moment of revelation';
    }

    return null;
}

function buildGroups(
    items: RevelationEntry[],
    mode: ViewMode,
): TimelineGroup[] {
    if (mode === 'mushaf') {
        const buckets = new Map<string, RevelationEntry[]>();

        items.forEach((entry) => {
            const rangeStart = Math.floor((entry.surah - 1) / 12) * 12 + 1;
            const rangeEnd = Math.min(rangeStart + 11, 114);
            const label = `Surah ${rangeStart}-${rangeEnd}`;

            if (!buckets.has(label)) {
                buckets.set(label, []);
            }

            buckets.get(label)?.push(entry);
        });

        return Array.from(buckets.entries()).map(([label, bucket]) => ({
            key: label,
            label,
            items: bucket.sort((a, b) => a.surah - b.surah),
        }));
    }

    const buckets = new Map<number, RevelationEntry[]>();

    items.forEach((entry) => {
        if (!buckets.has(entry.year)) {
            buckets.set(entry.year, []);
        }

        buckets.get(entry.year)?.push(entry);
    });

    return Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, bucket]) => ({
            key: `${year}`,
            label: getYearLabel(year),
            items: bucket.sort((a, b) => a.order - b.order),
        }));
}

export default function RevelationOrderPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('revelation');
    const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');

    const filteredEntries = useMemo(() => {
        const base =
            phaseFilter === 'all'
                ? revelationOrderData
                : revelationOrderData.filter(
                      (entry) => entry.phase === phaseFilter,
                  );

        return [...base].sort((a, b) =>
            viewMode === 'revelation' ? a.order - b.order : a.surah - b.surah,
        );
    }, [phaseFilter, viewMode]);

    const groups = useMemo(
        () => buildGroups(filteredEntries, viewMode),
        [filteredEntries, viewMode],
    );

    return (
        <PublicLayout>
            <Head title="Revelation Order - From Quran" />

            <div className="bg-[#f7f4ef] text-slate-950">
                <section className="relative overflow-hidden border-b border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
                    <div className="absolute top-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(148,163,184,0.14),_transparent_68%)] blur-3xl" />

                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
                        <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                            <span>Revelation order</span>
                            <span className="h-px flex-1 bg-slate-300/80" />
                        </div>

                        <div className="mt-6 max-w-3xl">
                            <h1 className="font-young text-[2.5rem] leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-[3.5rem] lg:text-[4.25rem]">
                                Revelation order of Surahs
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                                Follow the surahs as revelation moved through
                                the early, middle, and late Meccan years,
                                crossed the Hijrah, and settled into the Medinan
                                community.
                            </p>
                        </div>

                        <div className="mt-8 border-y border-slate-300/80 py-4 sm:py-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="inline-flex rounded-full border border-slate-300 bg-white/70 p-1">
                                    {[
                                        {
                                            key: 'mushaf',
                                            label: 'Mushaf Order',
                                        },
                                        {
                                            key: 'revelation',
                                            label: 'Revelation Order',
                                        },
                                    ].map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() =>
                                                setViewMode(
                                                    option.key as ViewMode,
                                                )
                                            }
                                            className={
                                                viewMode === option.key
                                                    ? 'rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                                                    : 'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900'
                                            }
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {filteredEntries.length} surahs in this
                                        view
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                                {phaseFilters.map((filter) => (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() =>
                                            setPhaseFilter(filter.key)
                                        }
                                        className={
                                            phaseFilter === filter.key
                                                ? 'rounded-full border border-slate-300 bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-900'
                                                : 'rounded-full border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900'
                                        }
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-8 sm:py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="relative pl-10 sm:pl-14">
                            <div className="absolute top-0 left-4 h-full w-px bg-gradient-to-b from-slate-200 via-emerald-300/70 to-transparent sm:left-6" />

                            <div className="space-y-10">
                                {groups.map((group, groupIndex) => (
                                    <div key={group.key} className="relative">
                                        {viewMode === 'revelation' &&
                                            group.label === '1 AH' &&
                                            groupIndex > 0 && (
                                                <div className="mb-8 flex items-center gap-4">
                                                    <div className="h-px flex-1 bg-slate-300/80" />
                                                    <span className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                                                        Hijrah
                                                    </span>
                                                    <div className="h-px flex-1 bg-slate-300/80" />
                                                </div>
                                            )}

                                        <div className="sticky top-20 z-[1] mb-4 flex items-center gap-3 bg-[#f7f4ef]/90 py-1 backdrop-blur">
                                            <div className="absolute left-[-32px] flex h-6 w-6 items-center justify-center sm:left-[-44px]">
                                                <div className="h-6 w-6 rounded-full border-2 border-emerald-600 bg-emerald-500 shadow-[0_0_0_4px_rgba(247,244,239,0.95)]" />
                                            </div>
                                            <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                                {group.label}
                                            </p>
                                        </div>

                                        <div className="border-y border-slate-200 bg-white/50 backdrop-blur-sm">
                                            {group.items.map((entry) => {
                                                const note =
                                                    getEntryNote(entry);

                                                return (
                                                    <Link
                                                        key={`${group.key}-${entry.surah}`}
                                                        href={`/${entry.surah}`}
                                                        className="group block border-t border-slate-200 px-4 py-5 first:border-t-0 sm:px-6"
                                                    >
                                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                                                        Surah{' '}
                                                                        {
                                                                            entry.surah
                                                                        }
                                                                    </span>
                                                                    <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                                                        {getPhaseLabel(
                                                                            entry,
                                                                        )}
                                                                    </span>
                                                                    <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                                                        Revelation
                                                                        #{' '}
                                                                        {
                                                                            entry.order
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                                                    {entry.name}
                                                                </h2>

                                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                                    <span>
                                                                        {
                                                                            entry.period
                                                                        }
                                                                    </span>
                                                                    <span>
                                                                        •
                                                                    </span>
                                                                    <span>
                                                                        {getYearLabel(
                                                                            entry.year,
                                                                        )}
                                                                    </span>
                                                                    <span>
                                                                        •
                                                                    </span>
                                                                    <span>
                                                                        Mushaf #
                                                                        {
                                                                            entry.surah
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {note && (
                                                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                                                                        {note}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-950">
                                                                <BookOpenText className="h-4 w-4" />
                                                                Read
                                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
