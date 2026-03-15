import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LandingLayout from '@/layouts/landing-layout';
import roadmapData from '../data/roadmap.json';
import { CheckCircle2, ChevronRight, Circle, Clock } from 'lucide-react';

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
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Completed</Badge>;
            case 'in-progress':
                return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">In Progress</Badge>;
            case 'planned':
                return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20">Planned</Badge>;
        }
    };

    const getStatusIcon = (status: RoadmapPhase['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-6 w-6 text-green-500" />;
            case 'in-progress':
                return <Clock className="h-6 w-6 text-amber-500 animate-pulse" />;
            case 'planned':
                return <Circle className="h-6 w-6 text-slate-300" />;
        }
    };

    return (
        <LandingLayout title="Roadmap">
            <div className="py-12 md:py-20">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                            Product Roadmap
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Our vision for the future of From Quran. Explore our journey from infrastructure to advanced community features.
                        </p>
                    </div>

                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {phases.map((phase, index) => (
                            <div key={phase.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon Dot */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10">
                                    {getStatusIcon(phase.status)}
                                </div>

                                {/* Content Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 md:p-1">
                                    <Card className="overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border border-slate-100/50">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                {getStatusBadge(phase.status)}
                                                <span className="text-xs font-mono text-muted-foreground">Phase {index + 1}</span>
                                            </div>
                                            <CardTitle className="text-2xl font-bold">{phase.title}</CardTitle>
                                            <CardDescription className="text-base">{phase.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3 mt-4">
                                                {phase.items.map((item) => (
                                                    <div key={item.id} className="flex items-start gap-3 group/item">
                                                        <div className="flex items-center h-6">
                                                            <Checkbox
                                                                id={`item-${item.id}`}
                                                                checked={item.completed}
                                                                disabled
                                                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                                            />
                                                        </div>
                                                        <label
                                                            htmlFor={`item-${item.id}`}
                                                            className={`text-sm font-medium leading-none cursor-default ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                                        >
                                                            {item.task}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <h3 className="text-xl font-semibold mb-2">Have a suggestion?</h3>
                        <p className="text-muted-foreground mb-6">We'd love to hear your ideas for new features or improvements.</p>
                        <a 
                            href="/contact" 
                            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            Get in Touch <ChevronRight className="ml-2 h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
