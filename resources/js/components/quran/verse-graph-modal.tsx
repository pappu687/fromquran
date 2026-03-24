import { X } from 'lucide-react';
import { type ResourceGraphApiResponse, type ResourceGraphNode } from '@/types/quran';
import { lazy, Suspense, useEffect, useState } from 'react';

const VerseResourceGraph = lazy(() => import('./verse-resource-graph'));

interface VerseGraphModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    verseKey: string;
    onSectionSelect: (sectionName: string) => void;
}

export function VerseGraphModal({
    open,
    onOpenChange,
    verseId,
    verseKey,
    onSectionSelect,
}: VerseGraphModalProps) {
    const [data, setData] = useState<ResourceGraphApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchData();
        } else {
            setData(null);
        }
    }, [open, verseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/verses/${verseId}/resources?limit=5&include_chapter_resources=0`,
            );
            if (response.ok) {
                const json =
                    (await response.json()) as ResourceGraphApiResponse;
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch graph data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const handleNodeClick = (node: ResourceGraphNode) => {
        if (
            node.type === 'resource' ||
            node.type === 'topic' ||
            node.type === 'similar'
        ) {
            if (!node.originalName) {
                return;
            }
            onSectionSelect(node.originalName);
            onOpenChange(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative flex h-full w-full flex-col bg-card shadow-lg sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl sm:border">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Resources Network ({verseKey})
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Click the nodes / circles to go to the section.
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-1.5 transition-colors hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <div className="flex min-h-[400px] items-center justify-center bg-muted/20 p-4">
                    {loading ? (
                        <div className="flex flex-col items-center text-muted-foreground">
                            <span className="animate-pulse">
                                Loading graph...
                            </span>
                        </div>
                    ) : (
                        <div className="flex h-full w-full flex-1 flex-col justify-center">
                            <div className="h-full w-full flex-1 overflow-hidden">
                                <Suspense
                                    fallback={
                                        <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
                                            Loading visualization...
                                        </div>
                                    }
                                >
                                    <VerseResourceGraph
                                        verseKey={verseKey}
                                        data={data}
                                        onNodeClick={handleNodeClick}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerseGraphModal;
