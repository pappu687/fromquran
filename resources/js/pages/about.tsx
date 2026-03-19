import { router } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LandingLayout from '@/layouts/landing-layout';

export default function AboutPage() {
    const principles = [
        'Qur’an first, with every supporting resource kept in context.',
        'Trusted scholarly material gathered into one calm, searchable place.',
        'A reading experience designed to reduce friction, not add more noise.',
    ];

    return (
        <LandingLayout title="About Us - From Quran">
            <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)] py-16 md:py-24">
                <div className="container mx-auto max-w-5xl px-4">
                    <div className="mx-auto max-w-3xl space-y-5 text-center">
                        <Badge
                            variant="outline"
                            className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                        >
                            About From Quran
                        </Badge>
                        <h1 className="font-young text-4xl tracking-tight text-foreground md:text-6xl">
                            Connecting everything back to the text.
                        </h1>
                        <p className="text-base leading-7 text-muted-foreground md:text-xl md:leading-8">
                            From Quran is built to make serious study feel
                            simple, readable, and centered on the Qur’an.
                        </p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:mt-16 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-start">
                        <div className="space-y-6 rounded-[28px] border border-border/60 bg-background/90 p-6 shadow-sm shadow-black/[0.03] md:p-10">
                            <div className="space-y-5 text-base leading-8 text-muted-foreground md:text-lg">
                                <p>
                                    This project began as a long-standing vision
                                    to connect every relevant resource to the
                                    Qur’an, including Hadith, Tafseer,
                                    reflections, lectures, Fatwas, and other
                                    authentic materials from credible scholars.
                                </p>
                                <p>
                                    The goal is straightforward: make it easier
                                    to explore the Qur’an alongside trusted
                                    scholarly resources without scattering the
                                    experience across disconnected tools and
                                    tabs.
                                </p>
                                <p>
                                    Many more features are planned. If you are a
                                    developer interested in contributing with
                                    Laravel, React, or Apache Solr, we would
                                    like to hear from you.
                                </p>
                            </div>

                            <div className="pt-3">
                                <Button
                                    size="lg"
                                    className="h-12 rounded-full px-6 text-sm font-medium"
                                    onClick={() => router.visit('/contact')}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Get in touch
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-[28px] border border-border/60 bg-background/75 p-6 shadow-sm shadow-black/[0.03]">
                                <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                                    Principles
                                </p>
                                <div className="mt-4 divide-y divide-border/60">
                                    {principles.map((principle) => (
                                        <div
                                            key={principle}
                                            className="py-4 text-sm leading-6 text-foreground first:pt-0 last:pb-0"
                                        >
                                            {principle}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-border/60 bg-muted/30 p-6">
                                <p className="text-sm font-medium text-foreground">
                                    Looking ahead
                                </p>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    The product will keep expanding carefully,
                                    but the principle stays the same: each new
                                    feature should help readers stay closer to
                                    the text, not farther from it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
