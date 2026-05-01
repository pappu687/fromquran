import type {
    QuranGraphV2Node,
    QuranGraphV2NodeType,
} from '@/types/quran-graph';
import { Undo2, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { useQuranGraphV2 } from './use-quran-graph-v2';

const QuranGraphV2 = lazy(() => import('./quran-graph-v2'));

interface QuranGraphV2ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId?: number;
    chapterId?: number;
    verseKey?: string;
    chapterName?: string;
}

const NODE_COLORS: Record<QuranGraphV2NodeType, string> = {
    verse: '#f97316',
    chapter: '#10b981',
    topic: '#8b5cf6',
    similar: '#06b6d4',
    tafsir: '#f59e0b',
    resource: '#0ea5e9',
    resource_hub: '#0369a1',
    translation: '#ec4899',
    root: '#84cc16',
    lemma: '#14b8a6',
    stem: '#6366f1',
    unknown: '#94a3b8',
};

function DetailPanel({
    node,
    onClose,
}: {
    node: QuranGraphV2Node;
    onClose: () => void;
}) {
    const url =
        node.type === 'resource' && node.payload.url
            ? String(node.payload.url)
            : null;

    return (
        <div className="absolute top-16 right-4 z-10 w-72 rounded-lg border bg-card p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
                <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                        backgroundColor: `${NODE_COLORS[node.type]}20`,
                        color: NODE_COLORS[node.type],
                    }}
                >
                    {node.type}
                </span>
                <button
                    onClick={onClose}
                    className="rounded p-1 transition-colors hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <h3 className="mb-2 text-sm font-semibold">{node.label}</h3>
            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 block text-xs text-primary underline"
                >
                    Open resource →
                </a>
            )}
            {Object.entries(node.payload).length > 0 && (
                <div className="max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {Object.entries(node.payload).map(([key, value]) => (
                        <div key={key} className="break-words">
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof value === 'string'
                                ? value
                                : JSON.stringify(value)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function QuranGraphV2Wrapper({
    verseId,
    chapterId,
    selectedNodeId,
    onNodeClick,
    expandedHubs,
    onExpandHub,
    hubOrigins,
}: {
    verseId?: number;
    chapterId?: number;
    selectedNodeId: string | null;
    onNodeClick: (node: QuranGraphV2Node) => void;
    expandedHubs: Set<string>;
    onExpandHub: (hub: string, x: number, y: number) => void;
    hubOrigins: Map<string, { x: number; y: number }>;
}) {
    const { data, loading, error } = useQuranGraphV2({
        verseId,
        chapterId,
        depth: 1,
    });

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
                <span className="animate-pulse">Loading graph...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex-1">
            <QuranGraphV2
                data={data}
                selectedNodeId={selectedNodeId}
                onNodeClick={onNodeClick}
                expandedHubs={expandedHubs}
                onExpandHub={onExpandHub}
                hubOrigins={hubOrigins}
            />
        </div>
    );
}

export function QuranGraphV2Modal({
    open,
    onOpenChange,
    verseId,
    chapterId,
    verseKey,
    chapterName,
}: QuranGraphV2ModalProps) {
    const [selectedNode, setSelectedNode] = useState<QuranGraphV2Node | null>(
        null,
    );
    const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());
    const [hubOrigins, setHubOrigins] = useState<
        Map<string, { x: number; y: number }>
    >(new Map());

    const handleNodeClick = useCallback((node: QuranGraphV2Node) => {
        setSelectedNode((prev) => (prev?.id === node.id ? null : node));

        if (node.type === 'verse' && node.payload.verse_key) {
            const key = String(node.payload.verse_key);
            const [chapter, verse] = key.split(':');
            if (chapter && verse && typeof window !== 'undefined') {
                window.open(`/${chapter}/${verse}`, '_blank');
            }
            return;
        }

        if (node.type === 'chapter' && node.payload.chapter_number) {
            const chapter = String(node.payload.chapter_number);
            if (typeof window !== 'undefined') {
                window.open(`/${chapter}`, '_blank');
            }
            return;
        }

        // Resources show the detail panel instead of navigating away,
        // so the user can inspect before deciding to open the link.
    }, []);

    const handleExpandHub = useCallback((hub: string, x: number, y: number) => {
        setExpandedHubs((prev) => new Set(prev).add(hub));
        setHubOrigins((prev) => {
            const next = new Map(prev);
            next.set(hub, { x, y });
            return next;
        });
    }, []);

    const handleReset = useCallback(() => {
        setExpandedHubs(new Set());
        setHubOrigins(new Map());
        setSelectedNode(null);
    }, []);

    const hasExpanded = expandedHubs.size > 0;

    if (!open) return null;

    const title = verseKey
        ? `Explore Connections (${verseKey})`
        : chapterName
          ? `Explore Connections (${chapterName})`
          : 'Explore Connections';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative flex h-full w-full flex-col bg-card shadow-lg sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-xl sm:border">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <p className="text-sm text-muted-foreground">
                            Click nodes to explore connections. Colored circles
                            show different types.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasExpanded && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80"
                                title="Collapse expanded nodes"
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        )}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="rounded-full p-1.5 transition-colors hover:bg-muted"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </button>
                    </div>
                </div>

                <div className="relative flex min-h-[400px] flex-1 items-center justify-center bg-muted/20 p-4">
                    <Suspense
                        fallback={
                            <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
                                Loading visualization...
                            </div>
                        }
                    >
                        <QuranGraphV2Wrapper
                            verseId={verseId}
                            chapterId={chapterId}
                            selectedNodeId={selectedNode?.id ?? null}
                            onNodeClick={handleNodeClick}
                            expandedHubs={expandedHubs}
                            onExpandHub={handleExpandHub}
                            hubOrigins={hubOrigins}
                        />
                    </Suspense>

                    {selectedNode && (
                        <DetailPanel
                            node={selectedNode}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}
                </div>

                <div className="flex flex-wrap gap-3 border-t px-4 py-2 text-xs text-muted-foreground">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="capitalize">{type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default QuranGraphV2Modal;
