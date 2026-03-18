import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    CircleHelp,
    HeartHandshake,
    Mail,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LandingLayout from '@/layouts/landing-layout';

const supportWays = [
    {
        title: 'Sponsor ongoing development',
        description:
            'Help cover the recurring work behind research, implementation, content review, infrastructure, and maintenance.',
        icon: HeartHandshake,
    },
    {
        title: 'Strengthen trusted access',
        description:
            'Your support helps us keep Quranic resources organized, searchable, and easier to benefit from in one place.',
        icon: ShieldCheck,
    },
    {
        title: 'Shape the next phase',
        description:
            'Support also gives momentum to the roadmap, including new research tools, better discovery, and richer study features.',
        icon: Sparkles,
    },
];

export default function SupportPage() {
    return (
        <LandingLayout title="Support Us - From Quran">
            <section className="bg-background py-16 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/15">
                            Support the mission
                        </Badge>
                        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
                            Help us build a more connected Qur&apos;an study
                            experience
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-muted-foreground md:text-xl">
                            From Quran is being built to bring together the
                            Qur&apos;an and beneficial supporting resources in a
                            way that is clear, searchable, and useful for
                            serious study. Financial support helps us keep that
                            work moving with consistency and care.
                        </p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
                        {supportWays.map((item) => (
                            <Card
                                key={item.title}
                                className="border-border/60 bg-card/70 shadow-sm backdrop-blur"
                            >
                                <CardContent className="p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="mt-5 text-xl font-semibold">
                                        {item.title}
                                    </h2>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-border/60 bg-background/80 p-8 shadow-sm backdrop-blur md:p-10">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                <CircleHelp className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold">
                                    Want to support this project?
                                </h2>
                                <p className="mt-4 text-base leading-8 text-muted-foreground">
                                    We&apos;re currently coordinating support
                                    directly. If you would like to contribute,
                                    sponsor development, or discuss meaningful
                                    ways to help the project grow, please reach
                                    out through the contact form. We&apos;ll
                                    respond with the appropriate next steps.
                                </p>
                                <p className="mt-4 text-base leading-8 text-muted-foreground">
                                    We also welcome conversations with
                                    developers, researchers, educators, and
                                    organizations who share the goal of making
                                    authentic Qur&apos;an-centered learning more
                                    accessible.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-4">
                                    <Button asChild size="lg" className="gap-2">
                                        <Link href="/contact">
                                            <Mail className="h-4 w-4" />
                                            Contact us
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="outline">
                                        <Link href="/roadmap">
                                            View roadmap
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
