import type {
    QuranGraphV2Node,
    QuranGraphV2NodeType,
    QuranGraphV2Response,
} from '@/types/quran-graph';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const ForceGraph2D = lazy(() => import('react-force-graph-2d'));

interface GraphNodeWithCoords extends QuranGraphV2Node {
    x?: number;
    y?: number;
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

const NODE_SIZES: Record<QuranGraphV2NodeType, number> = {
    verse: 8,
    chapter: 10,
    topic: 6,
    similar: 5,
    tafsir: 5,
    resource: 5,
    resource_hub: 10,
    translation: 5,
    root: 5,
    lemma: 5,
    stem: 5,
    unknown: 4,
};

interface QuranGraphV2Props {
    data: QuranGraphV2Response | null;
    onNodeClick?: (node: QuranGraphV2Node) => void;
    selectedNodeId?: string | null;
    expandedHubs?: Set<string>;
    onExpandHub?: (hub: string) => void;
}

export function QuranGraphV2({
    data,
    onNodeClick,
    selectedNodeId,
    expandedHubs = new Set(),
    onExpandHub,
}: QuranGraphV2Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    const displayData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };

        const allNodes = data.nodes;
        const allLinks = data.links;

        const resourceNodes = allNodes.filter((n) => n.type === 'resource');
        const resourceCount = resourceNodes.length;

        if (resourceCount <= 4 || expandedHubs.has('resources')) {
            return {
                nodes: allNodes.map((n) => ({ ...n, id: n.id })),
                links: allLinks.map((l) => ({
                    source: l.source,
                    target: l.target,
                })),
            };
        }

        const resourceIds = new Set(resourceNodes.map((n) => n.id));

        const visibleNodes = allNodes
            .filter((n) => n.type !== 'resource')
            .map((n) => ({ ...n, id: n.id }));

        const visibleLinks = allLinks
            .filter((l) => !resourceIds.has(l.target))
            .map((l) => ({ source: l.source, target: l.target }));

        const hubNode: GraphNodeWithCoords = {
            id: 'resource_hub',
            label: `${resourceCount} Resources`,
            type: 'resource_hub',
            payload: { count: resourceCount },
        };

        const hubLink = {
            source: data.meta.center,
            target: 'resource_hub',
        };

        return {
            nodes: [...visibleNodes, hubNode],
            links: [...visibleLinks, hubLink],
        };
    }, [data, expandedHubs]);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width && height) {
                    setDimensions({ width, height });
                }
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleNodeLabel = useCallback((node: object) => {
        const graphNode = node as QuranGraphV2Node;
        return graphNode.label || graphNode.id;
    }, []);

    const handleNodeCanvasObject = useCallback(
        (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const graphNode = node as GraphNodeWithCoords;
            const label = graphNode.label || graphNode.id;
            const color = NODE_COLORS[graphNode.type] || NODE_COLORS.unknown;

            let radius = NODE_SIZES[graphNode.type] || 5;
            if (
                graphNode.type === 'resource' &&
                graphNode.payload.thumbnail_url
            ) {
                radius = 8;
            }

            const isSelected = selectedNodeId === graphNode.id;

            ctx.beginPath();
            ctx.arc(
                graphNode.x ?? 0,
                graphNode.y ?? 0,
                isSelected ? radius + 3 : radius,
                0,
                2 * Math.PI,
            );
            ctx.fillStyle = color;
            ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();
            }

            const displayLabel =
                label.length > 20 ? label.slice(0, 20) + '...' : label;

            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = '#334155';
            ctx.fillText(
                displayLabel,
                (graphNode.x ?? 0) + radius + 2,
                (graphNode.y ?? 0) + fontSize / 3,
            );
        },
        [selectedNodeId],
    );

    const handleClick = useCallback(
        (node: object) => {
            const graphNode = node as QuranGraphV2Node;

            if (graphNode.type === 'resource_hub') {
                onExpandHub?.('resources');
                return;
            }

            onNodeClick?.(graphNode);
        },
        [onNodeClick, onExpandHub],
    );

    if (!data || data.nodes.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
                No graph data available.
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
            className="flex h-full w-full items-center justify-center p-2"
        >
            <Suspense
                fallback={
                    <div className="text-slate-500">Loading graph...</div>
                }
            >
                <ForceGraph2D
                    ref={graphRef}
                    graphData={displayData}
                    nodeLabel={handleNodeLabel}
                    nodeCanvasObject={handleNodeCanvasObject}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    cooldownTicks={100}
                    d3VelocityDecay={0.3}
                    onNodeClick={handleClick}
                    onEngineStop={() => {
                        if (graphRef.current) {
                            graphRef.current.zoom(2);
                        }
                    }}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            </Suspense>
        </div>
    );
}

export default QuranGraphV2;
