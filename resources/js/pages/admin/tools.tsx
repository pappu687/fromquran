import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    Mail,
    Database,
    HardDrive,
    Users,
    Zap,
    CheckCircle2,
    XCircle,
    Loader2,
    X,
} from 'lucide-react';

interface SolrStatus {
    connected: boolean;
    message: string;
}

interface Props {
    solrStatus: SolrStatus;
    flash?: {
        success?: string;
        error?: string;
    };
}

function ToolCard({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    );
}

function ActionButton({
    children,
    onClick,
    loading = false,
    variant = 'default',
}: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    variant?: 'default' | 'danger';
}) {
    const base =
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    };

    return (
        <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}

function StatusBadge({ connected, message }: { connected: boolean; message: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                connected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
        >
            {connected ? (
                <CheckCircle2 className="h-4 w-4" />
            ) : (
                <XCircle className="h-4 w-4" />
            )}
            {connected ? 'Connection: Success' : `Connection: Failed`}
        </span>
    );
}

// Simple Modal
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function AdminTools({ solrStatus, flash }: Props) {
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingCaches, setLoadingCaches] = useState(false);

    const submitTestEmail = () => {
        if (!testEmail) return;
        setLoadingEmail(true);
        router.post(
            '/admin/tools/test-email',
            { email: testEmail },
            {
                onFinish: () => {
                    setLoadingEmail(false);
                    setEmailModalOpen(false);
                    setTestEmail('');
                },
            },
        );
    };

    const triggerBackup = () => {
        setLoadingBackup(true);
        router.post('/admin/tools/backup', {}, { onFinish: () => setLoadingBackup(false) });
    };

    const clearSessions = () => {
        if (!confirm('This will log out ALL users including yourself. Continue?')) return;
        setLoadingSessions(true);
        router.post('/admin/tools/clear-sessions', {}, { onFinish: () => setLoadingSessions(false) });
    };

    const clearCaches = () => {
        setLoadingCaches(true);
        router.post('/admin/tools/clear-caches', {}, { onFinish: () => setLoadingCaches(false) });
    };

    return (
        <>
            <Head title="Tools - Admin - From Quran" />
            <AdminLayout title="Tools">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle2 className="mr-2 inline h-4 w-4" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                        <XCircle className="mr-2 inline h-4 w-4" />
                        {flash.error}
                    </div>
                )}

                <div className="mb-2">
                    <h1 className="text-xl font-semibold">Admin Tools</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage server utilities and system maintenance tasks.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Email Server */}
                    <ToolCard
                        icon={<Mail className="h-5 w-5" />}
                        title="Email Server"
                        description="Send a test email to verify your mail server is working correctly."
                    >
                        <ActionButton onClick={() => setEmailModalOpen(true)}>
                            Send Test Email
                        </ActionButton>
                    </ToolCard>

                    {/* Apache Solr */}
                    <ToolCard
                        icon={<Database className="h-5 w-5" />}
                        title="Apache Solr"
                        description="Current status of the Solr search engine connection."
                    >
                        <StatusBadge
                            connected={solrStatus.connected}
                            message={solrStatus.message}
                        />
                    </ToolCard>

                    {/* Backups */}
                    <ToolCard
                        icon={<HardDrive className="h-5 w-5" />}
                        title="Backups"
                        description="Create a full application and database backup using Spatie Laravel Backup."
                    >
                        <ActionButton onClick={triggerBackup} loading={loadingBackup}>
                            Create Backup
                        </ActionButton>
                    </ToolCard>

                    {/* Sessions */}
                    <ToolCard
                        icon={<Users className="h-5 w-5" />}
                        title="Sessions"
                        description="Clear all active user sessions. This will log everyone out of the application."
                    >
                        <ActionButton onClick={clearSessions} loading={loadingSessions} variant="danger">
                            Clear Sessions
                        </ActionButton>
                    </ToolCard>

                    {/* Caching */}
                    <ToolCard
                        icon={<Zap className="h-5 w-5" />}
                        title="Caching"
                        description="Clear application caches and purge Cloudflare CDN cache."
                    >
                        <ActionButton onClick={clearCaches} loading={loadingCaches}>
                            Clear Caches
                        </ActionButton>
                    </ToolCard>
                </div>

                {/* Send Test Email Modal */}
                <Modal
                    open={emailModalOpen}
                    onClose={() => setEmailModalOpen(false)}
                    title="Send Test Email"
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Enter an email address to send a test message to. This will verify
                            your mail server configuration is working correctly.
                        </p>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" htmlFor="test-email-input">
                                Email Address
                            </label>
                            <input
                                id="test-email-input"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitTestEmail()}
                                placeholder="you@example.com"
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <ActionButton onClick={submitTestEmail} loading={loadingEmail}>
                                Send Email
                            </ActionButton>
                        </div>
                    </div>
                </Modal>
            </AdminLayout>
        </>
    );
}
