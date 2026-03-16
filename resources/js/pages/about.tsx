import LandingLayout from '@/layouts/landing-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AboutPage() {
    return (
        <LandingLayout title="About Us - From Quran">
            <section className="relative overflow-hidden py-24 md:py-32">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 blur-[120px] opacity-10">
                    <div className="h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary to-blue-600" />
                </div>
                
                <div className="container relative mx-auto max-w-4xl px-4">
                    <div className="mx-auto max-w-3xl text-center">                        
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                            About Us
                        </h1>
                        <p className="mb-12 text-xl font-medium text-muted-foreground md:text-2xl">
                            Connecting everything to the Qur’an in one place.
                        </p>
                        
                        <div className="space-y-8 text-left text-lg leading-relaxed text-muted-foreground md:text-xl">
                            <p>
                                This project began as a long-standing vision to connect every relevant resource to the Qur’an — including Hadith, Tafseer, reflections, YouTube lectures, Fatwas, and other authentic materials from credible scholars.
                            </p>
                            <p>
                                Our goal is to make it easier for anyone to explore the Qur’an alongside trusted scholarly resources, all within a single platform.
                            </p>
                            <p>
                                Many more features are planned for the future. If you are a developer interested in contributing (Laravel, React, or Apache Solr), we would love to hear from you. Please reach out through the contact form.
                            </p>
                        </div>

                        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                            <Button 
                                size="lg" 
                                className="gap-2 px-8 py-6 text-lg shadow-lg transition-all hover:scale-105"
                                onClick={() => router.visit('/contact')}
                            >
                                <Mail className="h-5 w-5" />
                                Get in Touch
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
