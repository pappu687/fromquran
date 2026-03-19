import { TurnstileWidget } from '@/components/turnstile-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LandingLayout from '@/layouts/landing-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LifeBuoy, MessageSquareText, Wrench } from 'lucide-react';

export default function ContactPage() {
    const page = usePage<{ turnstile?: { enabled: boolean } }>();
    const turnstileEnabled = Boolean(page.props.turnstile?.enabled);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        subject: string;
        message: string;
        turnstile_token?: string;
    }>({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact', {
            preserveScroll: true,
        });
    };

    const contactTopics = [
        {
            icon: MessageSquareText,
            title: 'Feedback',
            description:
                'Suggestions on search, reading, collections, and overall clarity.',
        },
        {
            icon: Wrench,
            title: 'Bug reports',
            description:
                'Problems you found while reading, saving, or navigating the site.',
        },
        {
            icon: LifeBuoy,
            title: 'Contributions',
            description:
                'Ideas, scholarly resources, or development help for the roadmap ahead.',
        },
    ];

    return (
        <>
            <Head title="Contact - From Quran">
                {turnstileEnabled && (
                    <script
                        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                        async
                        defer
                    />
                )}
            </Head>

            <LandingLayout title="Contact - From Quran">
                <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.3)_100%)] py-16 md:py-24">
                    <div className="container mx-auto max-w-5xl px-4">
                        <div className="mx-auto max-w-3xl space-y-5 text-center">
                            <Badge
                                variant="outline"
                                className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                            >
                                Contact
                            </Badge>
                            <h1 className="font-young text-4xl tracking-tight text-foreground md:text-6xl">
                                Send a thoughtful note.
                            </h1>
                            <p className="text-base leading-7 text-muted-foreground md:text-xl md:leading-8">
                                If you found an issue, have feedback, or want to
                                help shape what comes next, send a message.
                            </p>
                        </div>

                        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:mt-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
                            <aside className="rounded-[28px] border border-border/60 bg-background/80 p-6 shadow-sm shadow-black/[0.03] md:p-7">
                                <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                                    Best for
                                </p>
                                <div className="mt-4 divide-y divide-border/60">
                                    {contactTopics.map((topic) => {
                                        const Icon = topic.icon;

                                        return (
                                            <div
                                                key={topic.title}
                                                className="flex gap-3 py-4 first:pt-0 last:pb-0"
                                            >
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {topic.title}
                                                    </p>
                                                    <p className="text-sm leading-6 text-muted-foreground">
                                                        {topic.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </aside>

                            <form
                                onSubmit={handleSubmit}
                                className="rounded-[28px] border border-border/60 bg-background/92 p-6 shadow-sm shadow-black/[0.03] md:p-8"
                            >
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="name"
                                                required
                                                className="h-11 rounded-xl border-border/70 bg-background"
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-destructive">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="email"
                                                required
                                                className="h-11 rounded-xl border-border/70 bg-background"
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-destructive">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            value={data.subject}
                                            onChange={(e) =>
                                                setData(
                                                    'subject',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="h-11 rounded-xl border-border/70 bg-background"
                                        />
                                        {errors.subject && (
                                            <p className="text-sm text-destructive">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            rows={7}
                                            value={data.message}
                                            onChange={(e) =>
                                                setData(
                                                    'message',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="min-h-36 rounded-2xl border-border/70 bg-background"
                                        />
                                        {errors.message && (
                                            <p className="text-sm text-destructive">
                                                {errors.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <TurnstileWidget />
                                        {errors.turnstile_token && (
                                            <p className="text-sm text-destructive">
                                                {errors.turnstile_token}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end border-t border-border/60 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="h-11 rounded-full px-5 text-sm font-medium"
                                        >
                                            {processing
                                                ? 'Sending...'
                                                : 'Send message'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </LandingLayout>
        </>
    );
}
