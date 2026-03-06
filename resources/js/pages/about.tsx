import { Button } from '@/components/ui/button';
import LandingLayout from '@/layouts/landing-layout';
import { ArrowRight, Building2, Globe, Sparkles, Users2 } from 'lucide-react';

export default function AboutPage() {
    return (
        <LandingLayout title="About - From Quran">
            <section className="flex min-h-[80vh] items-center bg-background py-20 md:py-32">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="flex flex-col items-center justify-between md:flex-row">
                        {/* Left Content */}
                        <div className="max-w-xl flex-1 space-y-8 py-8 md:pr-12 lg:pr-16">
                            <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground md:text-4xl lg:text-[40px]">
                                We're building the tools we wished existed
                            </h1>
                            <div className="space-y-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                                <p>
                                    What started as a side project in 2018 has
                                    grown into a platform trusted by thousands
                                    of teams worldwide. We saw how much time
                                    people wasted on repetitive tasks and
                                    decided to fix it.
                                </p>
                                <p>
                                    Today, we're a team of 50+ designers,
                                    engineers, and operators spread across the
                                    globe—united by a belief that software
                                    should feel like magic, not work.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <Button className="gap-2 px-6 shadow-sm">
                                    Our Story <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-border/60 px-6 shadow-sm"
                                >
                                    Meet the Team
                                </Button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-4 hidden h-[320px] w-[1.5px] bg-foreground md:block lg:mx-8"></div>
                        <div className="my-8 h-[1.5px] w-full max-w-xl bg-foreground md:hidden"></div>

                        {/* Right Content */}
                        <div className="w-full max-w-xl flex-1 md:pl-12 lg:pl-16">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-16">
                                <div className="space-y-4">
                                    <Building2 className="h-5 w-5 text-foreground/80" />
                                    <div className="space-y-1.5">
                                        <h3 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                            2018
                                        </h3>
                                        <p className="text-[13px] font-medium text-muted-foreground">
                                            Founded
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Users2 className="h-5 w-5 text-foreground/80" />
                                    <div className="space-y-1.5">
                                        <h3 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                            50+
                                        </h3>
                                        <p className="text-[13px] font-medium text-muted-foreground">
                                            Team members
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Sparkles className="h-5 w-5 text-foreground/80" />
                                    <div className="space-y-1.5">
                                        <h3 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                            10K+
                                        </h3>
                                        <p className="text-[13px] font-medium text-muted-foreground">
                                            Customers
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Globe className="h-5 w-5 text-foreground/80" />
                                    <div className="space-y-1.5">
                                        <h3 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                            30+
                                        </h3>
                                        <p className="text-[13px] font-medium text-muted-foreground">
                                            Countries
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
