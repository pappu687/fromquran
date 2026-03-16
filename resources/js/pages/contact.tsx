import { TurnstileWidget } from '@/components/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LandingLayout from '@/layouts/landing-layout';
import { Head, useForm, usePage } from '@inertiajs/react';

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
                <section className="bg-background py-16 md:py-24">
                    <div className="container mx-auto max-w-3xl space-y-8 px-4">
                        <header className="space-y-3">
                            <h1 className="text-3xl font-bold md:text-4xl">
                                Get in touch
                            </h1>
                            <p className="text-base text-muted-foreground md:text-lg">
                                Have feedback, feature requests, or found an
                                issue? Send a message and we&apos;ll review it
                                as soon as possible.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        autoComplete="name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={data.subject}
                                    onChange={(e) =>
                                        setData('subject', e.target.value)
                                    }
                                    required
                                />
                                {errors.subject && (
                                    <p className="text-sm text-destructive">
                                        {errors.subject}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    rows={6}
                                    value={data.message}
                                    onChange={(e) =>
                                        setData('message', e.target.value)
                                    }
                                    required
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

                            <div className="flex items-center justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Sending…' : 'Send message'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>
            </LandingLayout>
        </>
    );
}
