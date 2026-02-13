import LandingLayout from '@/layouts/landing-layout';

export default function AboutPage() {
    return (
        <LandingLayout title="About - From Quran">
            <section className="bg-background py-16 md:py-24">
                <div className="container mx-auto max-w-3xl px-4 space-y-8">
                    <header className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            About
                        </p>
                        <h1 className="text-3xl font-bold md:text-4xl">
                            About From Quran
                        </h1>
                        <p className="text-base text-muted-foreground md:text-lg">
                            From Quran is an enhanced Quran platform that helps you explore
                            the Book of Allah through connected knowledge — verses, tafseer,
                            hadith, topics, and scholarly resources — in one focused place.
                        </p>
                    </header>

                    <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
                        <p>
                            The goal of From Quran is to make it easier to read, study, and
                            reflect on the Quran in a way that respects traditional sources
                            while taking advantage of modern tools. You can browse chapters,
                            follow topics across the mushaf, and open related resources for
                            deeper understanding.
                        </p>
                        <p>
                            The platform builds on a rich underlying database of chapters,
                            verses, translations, tafseer entries, and related resources.
                            Verses can be connected to audio recitations, explanatory videos,
                            articles, and other materials, so that every ayah becomes a hub
                            of trustworthy knowledge.
                        </p>
                        <p>
                            From Quran is intended to complement, not replace, traditional
                            study with teachers and classical works. Please always verify
                            religious matters with qualified scholars and treat this site as
                            a tool to assist your learning and reflection.
                        </p>
                    </div>

                    <section className="space-y-4 border-t pt-8">
                        <h2 className="text-xl font-semibold">Principles</h2>
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            <li>Respect for the Quran and authentic Islamic sources.</li>
                            <li>Clear separation between primary texts and commentary.</li>
                            <li>Fast, distraction-free reading and research experience.</li>
                            <li>Features that support reflection, teaching, and sharing.</li>
                        </ul>
                    </section>
                </div>
            </section>
        </LandingLayout>
    );
}

