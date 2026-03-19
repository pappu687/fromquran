import { Badge } from '@/components/ui/badge';
import LandingLayout from '@/layouts/landing-layout';
import { CheckCircle2, ChevronRight, Circle, Clock } from 'lucide-react';
import roadmapData from '../data/roadmap.json';

interface RoadmapItem {
    id: number;
    task: string;
    completed: boolean;
}

interface RoadmapPhase {
    id: number;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'planned';
    items: RoadmapItem[];
}

export default function Roadmap() {
    const phases = roadmapData as RoadmapPhase[];
    const phaseCounts = {
        completed: phases.filter((phase) => phase.status === 'completed')
            .length,
        inProgress: phases.filter((phase) => phase.status === 'in-progress')
            .length,
        planned: phases.filter((phase) => phase.status === 'planned').length,
    };

    const getStatusBadge = (status: RoadmapPhase['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                        Completed
                    </Badge>
                );
            case 'in-progress':
                return (
                    <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
                        In Progress
                    </Badge>
                );
            case 'planned':
                return (
                    <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300">
                        Planned
                    </Badge>
                );
        }
    };

    const getStatusIcon = (status: RoadmapPhase['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                );
            case 'in-progress':
                return (
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                );
            case 'planned':
                return (
                    <Circle className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                );
        }
    };

    return (
        <LandingLayout title="Roadmap">
            <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.3)_100%)] py-16 md:py-24">
                <div className="container mx-auto max-w-5xl px-4">
                    <div className="mx-auto max-w-3xl space-y-5 text-center">
                        <Badge
                            variant="outline"
                            className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                        >
                            Roadmap
                        </Badge>
                        <h1 className="font-young text-4xl tracking-tight text-foreground md:text-6xl">
                            A careful roadmap, not a feature dump.
                        </h1>
                        <p className="text-base leading-7 text-balance text-muted-foreground md:text-xl md:leading-8">
                            What is already shipped, what is actively being
                            built, and what is planned next for From Quran.
                        </p>
                    </div>

                    <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 md:mt-12">
                        <div className="rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-center shadow-sm shadow-black/[0.03]">
                            <p className="text-lg font-semibold text-foreground md:text-xl">
                                {phaseCounts.completed}
                            </p>
                            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                Completed
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-center shadow-sm shadow-black/[0.03]">
                            <p className="text-lg font-semibold text-foreground md:text-xl">
                                {phaseCounts.inProgress}
                            </p>
                            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                In progress
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-center shadow-sm shadow-black/[0.03]">
                            <p className="text-lg font-semibold text-foreground md:text-xl">
                                {phaseCounts.planned}
                            </p>
                            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                Planned
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto mt-8 max-w-4xl rounded-[32px] border border-border/60 bg-background/92 shadow-sm shadow-black/[0.03] md:mt-10">
                        <div className="divide-y divide-border/70">
                            {phases.map((phase) => (
                                <section
                                    key={phase.id}
                                    className="px-5 py-6 md:px-8 md:py-7"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    {getStatusIcon(
                                                        phase.status,
                                                    )}
                                                </div>
                                                {getStatusBadge(phase.status)}
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                                                    {phase.title}
                                                </h2>
                                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                                                    {phase.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 divide-y divide-border/60 rounded-2xl border border-border/60 bg-muted/20">
                                        {phase.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3 px-4 py-3 md:px-5"
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {item.completed ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    ) : (
                                                        <Circle className="h-4 w-4 text-muted-foreground/60" />
                                                    )}
                                                </div>
                                                <p
                                                    className={`text-sm leading-6 ${
                                                        item.completed
                                                            ? 'text-muted-foreground line-through'
                                                            : 'text-foreground'
                                                    }`}
                                                >
                                                    {item.task}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>

                    <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-border/60 bg-muted/25 px-6 py-8 text-center md:px-10">
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Built with community input
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                            If there is something missing, unclear, or worth
                            prioritizing, send feedback. The roadmap should be
                            shaped by real use.
                        </p>
                        <a
                            href="/contact"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                        >
                            Send feedback
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </a>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
