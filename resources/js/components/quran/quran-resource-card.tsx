import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle, ExternalLink, Globe } from 'lucide-react';

interface ResourceTypeLike {
    slug?: string | null;
    name: string;
}

export interface QuranResourceCardResource {
    id: string | number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    is_truncated?: boolean;
    created_at?: string;
    resource_type: ResourceTypeLike;
}

interface QuranResourceCardProps {
    resource: QuranResourceCardResource;
    loadingFullResourceId: string | number | null;
    selectedResourceOpen: boolean;
    getDomainName: (url: string) => string;
    onSeeMore: (resourceId: string | number) => void | Promise<void>;
    isVerifiedSource?: (url: string) => boolean;
    verifiedBadgeMode?: 'metadata' | 'footer' | 'none';
    className?: string;
}

const getYoutubeVideoId = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.replace(/^www\./, '');

        if (hostname === 'youtu.be') {
            return parsedUrl.pathname.split('/').filter(Boolean)[0] || null;
        }

        if (
            hostname === 'youtube.com' ||
            hostname === 'm.youtube.com' ||
            hostname === 'youtube-nocookie.com' ||
            hostname.endsWith('.youtube.com') ||
            hostname.endsWith('.youtube-nocookie.com')
        ) {
            if (parsedUrl.pathname === '/watch') {
                return (
                    parsedUrl.searchParams.get('v') ||
                    parsedUrl.searchParams.get('vi')
                );
            }

            const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
            const [firstSegment, secondSegment] = pathParts;

            if (
                (firstSegment === 'embed' || firstSegment === 'shorts') &&
                secondSegment
            ) {
                return secondSegment;
            }

            return pathParts.at(-1) || null;
        }
    } catch {
        return null;
    }

    return null;
};

export function QuranResourceCard({
    resource,
    loadingFullResourceId,
    selectedResourceOpen,
    getDomainName,
    onSeeMore,
    isVerifiedSource,
    verifiedBadgeMode = 'none',
    className,
}: QuranResourceCardProps) {
    const youtubeVideoId = getYoutubeVideoId(resource.resource_url);
    const youtubeThumbnailUrl = youtubeVideoId
        ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`
        : null;
    const isVerified = isVerifiedSource?.(resource.resource_url) ?? false;

    return (
        <div
            className={cn(
                'group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                    {youtubeThumbnailUrl ? (
                        <a
                            href={resource.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 rounded-lg transition-colors hover:bg-muted/40"
                        >
                            <div className="relative aspect-video w-28 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                <img
                                    src={youtubeThumbnailUrl}
                                    alt={
                                        resource.resource_title ||
                                        'YouTube tafseer thumbnail'
                                    }
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    YouTube
                                </div>
                            </div>
                            <div className="min-w-0 space-y-1 pt-0.5">
                                <div className="flex items-start gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                    <span className="line-clamp-2">
                                        {resource.resource_title ||
                                            resource.resource_url}
                                    </span>
                                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Watch tafseer on YouTube
                                </p>
                            </div>
                        </a>
                    ) : (
                        <a
                            href={resource.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-base font-semibold text-foreground decoration-primary/30 underline-offset-4 transition-colors group-hover:text-primary hover:underline"
                        >
                            <span className="line-clamp-2">
                                {resource.resource_title || resource.resource_url}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                        </a>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                            <Globe className="h-3 w-3" />
                            {getDomainName(resource.resource_url)}
                        </span>
                        {verifiedBadgeMode === 'metadata' && isVerified && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/30">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                            </span>
                        )}
                        {resource.created_at && (
                            <span className="flex items-center gap-1 font-sans">
                                <Calendar className="h-3 w-3" />
                                {new Date(resource.created_at).toLocaleDateString(
                                    'en-US',
                                    {
                                        timeZone: 'UTC',
                                        month: 'short',
                                        year: 'numeric',
                                    },
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {resource.comment && (
                <div className="relative">
                    <div
                        className={`text-sm leading-relaxed text-muted-foreground/90 ${!selectedResourceOpen ? 'line-clamp-3' : ''}`}
                        dangerouslySetInnerHTML={{
                            __html: resource.comment,
                        }}
                    />
                    {resource.is_truncated && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 bg-muted/30 px-2 text-xs font-medium text-primary hover:bg-muted"
                            disabled={loadingFullResourceId === resource.id}
                            onClick={() => void onSeeMore(resource.id)}
                        >
                            {loadingFullResourceId === resource.id
                                ? 'Loading...'
                                : 'Read Full Answer'}
                        </Button>
                    )}
                </div>
            )}

            {verifiedBadgeMode === 'footer' && (
                <div className="mt-1 flex justify-end border-t pt-3">
                    <Badge
                        variant="outline"
                        className="h-5 border-dashed text-[10px] font-normal opacity-60"
                    >
                        Verified
                    </Badge>
                </div>
            )}
        </div>
    );
}
