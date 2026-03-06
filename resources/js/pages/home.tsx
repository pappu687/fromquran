import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import LandingLayout from '@/layouts/landing-layout';
import { router } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Sparkles,
    Network,
    Globe,
    Link2,
    Bookmark,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureProps) => (
    <Card className="border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader className="p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                {icon}
            </div>
            <CardTitle className="mb-2 text-base font-semibold text-foreground">
                {title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
            </CardDescription>
        </CardHeader>
    </Card>
);

const ChapterCard = ({ chapter }: { chapter: Chapter }) => (
    <Card
        key={chapter.id}
        className="group cursor-pointer border-2 border-transparent shadow-none transition-all duration-200 hover:border-gray-200 hover:bg-muted/70"
        onClick={() => router.visit(`/${chapter.number}`)}
    >
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {chapter.number}
                        </div>
                        <CardTitle className="text-lg transition-colors group-hover:text-primary">
                            {chapter.romanName}
                        </CardTitle>
                    </div>
                </div>
                <div className="text-right text-sm">
                    <div className="text-muted-foreground">
                        {chapter.verses} verses
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {chapter.revelationType}
                    </div>
                </div>
            </div>
        </CardHeader>
    </Card>
);

export default function HomePage() {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                const data = await response.json();
                setChapters(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load chapters:', err);
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

    const scrollToFeatures = () => {
        document.getElementById('features-section')?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    return (
        <LandingLayout title="From Quran - Explore the Quran Like Never Before">
            {/* Hero & Features Section */}
            <section className="relative overflow-hidden bg-background py-20 md:py-32">
                <div className="bg-grid-pattern absolute inset-0 opacity-[0.02]" />

                <div className="relative container mx-auto max-w-7xl px-4">
                    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
                        <div className="max-w-xl">
                            <div className="mb-6 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                A New Way to Explore the Quran
                            </div>

                            <h1 className="font-young mb-6 text-4xl leading-tight font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                Explore the Quran
                                <br />
                                Like Never Before
                            </h1>

                            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                                Every Islamic resource, connected. Discover
                                tafseer, hadith, and scholarly discussions
                                visualized through interactive knowledge
                                graphs—all rooted in the Quran.
                            </p>

                            <div className="mb-10 flex flex-wrap items-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={scrollToChapters}
                                    className="gap-2 text-base shadow-sm"
                                >
                                    Start Reading
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    onClick={scrollToFeatures}
                                    className="gap-2 text-base font-medium"
                                >
                                    Learn More
                                </Button>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    114 Chapters
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Authentic Resources
                                </div>
                            </div>
                        </div>

                        <div
                            id="features-section"
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <FeatureCard
                                icon={
                                    <Network className="h-5 w-5 opacity-70" />
                                }
                                title="Knowledge Graphs"
                                description="Visualize connections between Quran verses, hadith, tafseer, and scholarly resources."
                            />
                            <FeatureCard
                                icon={<Globe className="h-5 w-5 opacity-70" />}
                                title="Rich Resources"
                                description="Access tagged YouTube tafseer, podcasts, articles, and discussions."
                            />
                            <FeatureCard
                                icon={<Link2 className="h-5 w-5 opacity-70" />}
                                title="Cross-References"
                                description="Explore related verses, hadith, and fiqh rulings for any ayah."
                            />
                            <FeatureCard
                                icon={
                                    <Bookmark className="h-5 w-5 opacity-70" />
                                }
                                title="Personal Collections"
                                description="Save, organize, and share your favorite verses and reflections."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Chapters Grid Section */}
            <section id="chapters-section" className="py-16 md:py-24">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="mb-10 text-center">
                        <h2 className="font-young mb-4 text-3xl font-bold md:text-4xl">
                            All 114 Chapters
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            Begin your journey through the Quran, from
                            Al-Fatihah to An-Nas. Click on any chapter to start
                            reading.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="text-center">
                                <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-primary/20" />
                                <p className="text-muted-foreground">
                                    Loading chapters...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {chapters.map((chapter) => (
                                <ChapterCard
                                    key={chapter.id}
                                    chapter={chapter}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="font-young mb-4 text-3xl font-bold md:text-4xl">
                            Ready to Explore?
                        </h2>
                        <p className="mb-8 text-lg text-muted-foreground">
                            Dive deep into the Quran with interconnected
                            knowledge, visualized relationships, and
                            comprehensive resources—all in one place.
                        </p>
                        <Button
                            size="lg"
                            onClick={scrollToChapters}
                            className="gap-2 text-base shadow-md"
                        >
                            <BookOpen className="h-5 w-5" />
                            Start Your Journey
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
