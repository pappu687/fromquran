import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LandingLayout from '@/layouts/landing-layout';
import roadmapData from '../data/roadmap.json';
import { CheckCircle2, ChevronRight, Circle, Clock, Sparkles } from 'lucide-react';

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

    const getStatusBadge = (status: RoadmapPhase['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Completed
                    </Badge>
                );
            case 'in-progress':
                return (
                    <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                        In Progress
                    </Badge>
                );
            case 'planned':
                return (
                    <Badge
                        variant="secondary"
                        className="border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    >
                        Planned
                    </Badge>
                );
        }
    };

    const getStatusIcon = (status: RoadmapPhase['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-6 w-6 text-green-500" />;
            case 'in-progress':
                return (
                    <Clock className="h-6 w-6 animate-pulse text-amber-500" />
                );
            case 'planned':
                return <Circle className="h-6 w-6 text-blue-300" />;
        }
    };

    return (
        <LandingLayout title="Roadmap">
            <div className="relative overflow-hidden py-16 md:py-24">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20">
                    <div className="h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary to-blue-600" />
                </div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 blur-[120px] opacity-10">
                    <div className="h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-blue-400 to-indigo-600" />
                </div>

                <div className="container relative mx-auto max-w-5xl px-4">
                    <div className="mx-auto mb-20 max-w-3xl text-center">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
                            Future Vision
                        </Badge>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                            FromQuran Roadmap
                        </h1>
                        <p className="text-balance text-lg text-muted-foreground md:text-xl">
                            The future of From Quran. Explore our upcoming features designed to make Quranic study more accessible, interactive, and insightful.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
                        {phases.map((phase) => (
                            <Card
                                key={phase.id}
                                className="group relative flex flex-col overflow-hidden border-border/50 bg-card/40 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                
                                <CardHeader className="pb-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-foreground shadow-inner transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                {getStatusIcon(phase.status)}
                                            </div>
                                            {getStatusBadge(phase.status)}
                                        </div>
                                    </div>
                                    <CardTitle className="mb-2 text-2xl font-bold tracking-tight">
                                        {phase.title}
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        {phase.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 pt-0">
                                    <div className="mt-4 space-y-4 rounded-xl bg-muted/30 p-4 ring-1 ring-inset ring-border/20 transition-colors group-hover:bg-muted/50">
                                        {phase.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 group/item"
                                            >
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`item-${item.id}`}
                                                        checked={item.completed}
                                                        disabled
                                                        className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                </div>
                                                <label
                                                    htmlFor={`item-${item.id}`}
                                                    className={`text-sm font-medium leading-tight transition-colors ${
                                                        item.completed
                                                            ? 'text-muted-foreground line-through opacity-70'
                                                            : 'text-foreground group-hover/item:text-primary'
                                                    }`}
                                                >
                                                    {item.task}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-24 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-muted/50 to-muted/20 p-8 text-center backdrop-blur-sm md:p-12">
                        <div className="relative z-10 mx-auto max-w-2xl">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
                                Growing with the Community
                            </h3>
                            <p className="mb-10 text-lg text-muted-foreground">
                                We're building From Quran for you. If you have any suggestions, feature requests, or feedback, we'd love to hear from you.
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-semibold text-background shadow-lg transition-all hover:scale-105 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Send Feedback
                                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
