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
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
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
    onExpandHub?: (hub: string, x: number, y: number) => void;
    hubOrigins?: Map<string, { x: number; y: number }>;
}

function distributeRadial(
    count: number,
    centerX: number,
    centerY: number,
    radius: number,
): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const angleStep = (2 * Math.PI) / count;
    for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
        });
    }
    return positions;
}

export function QuranGraphV2({
    data,
    onNodeClick,
    selectedNodeId,
    expandedHubs = new Set(),
    onExpandHub,
    hubOrigins = new Map(),
}: QuranGraphV2Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const [releasedHubs, setReleasedHubs] = useState<Set<string>>(new Set());

    // Reset released state when the center node changes
    useEffect(() => {
        setReleasedHubs(new Set());
    }, [data?.meta.center]);

    // Clean up released hubs that are no longer expanded
    useEffect(() => {
        setReleasedHubs((prev) => {
            const next = new Set<string>();
            for (const hub of prev) {
                if (expandedHubs.has(hub)) {
                    next.add(hub);
                }
            }
            return next;
        });
    }, [expandedHubs]);

    // Release fixed positions after bloom animation
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        expandedHubs.forEach((hub) => {
            if (!releasedHubs.has(hub)) {
                const timer = setTimeout(() => {
                    setReleasedHubs((prev) => new Set(prev).add(hub));
                }, 800);
                timers.push(timer);
            }
        });
        return () => timers.forEach(clearTimeout);
    }, [expandedHubs, releasedHubs]);

    const displayData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };

        const allNodes = data.nodes.map((n) => ({ ...n }));
        const allLinks = data.links.map((l) => ({ ...l }));

        const resourceNodes = allNodes.filter((n) => n.type === 'resource');
        const resourceCount = resourceNodes.length;

        // Small number: show resources directly, no hub
        if (resourceCount <= 4) {
            return {
                nodes: allNodes.map((n) => ({ ...n, id: n.id })),
                links: allLinks.map((l) => ({
                    source: l.source,
                    target: l.target,
                })),
            };
        }

        const resourceIds = new Set(resourceNodes.map((n) => n.id));
        const origin = hubOrigins.get('resources');
        const isExpanded = expandedHubs.has('resources');

        if (!isExpanded) {
            // Collapsed: show hub node only
            const visibleNodes = allNodes
                .filter((n) => !resourceIds.has(n.id))
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

            return {
                nodes: [...visibleNodes, hubNode],
                links: [
                    ...visibleLinks,
                    { source: data.meta.center, target: 'resource_hub' },
                ],
            };
        }

        // Expanded: show hub as a sub-center with resources orbiting it
        const isAnimating = origin && !releasedHubs.has('resources');

        // Hub is pinned to the right of where it was clicked
        const hubX = origin ? origin.x + 250 : 0;
        const hubY = origin ? origin.y : 0;

        // Calculate child positions around hub for the bloom animation
        let childPositions: Array<{ x: number; y: number }> = [];
        if (isAnimating) {
            const childRadius = Math.min(120, Math.max(60, resourceCount * 4));
            childPositions = distributeRadial(
                resourceCount,
                hubX,
                hubY,
                childRadius,
            );
        }

        const nodes = allNodes.map((n) => {
            const base = { ...n, id: n.id } as GraphNodeWithCoords;

            if (n.type === 'resource' && isAnimating) {
                const idx = resourceNodes.findIndex((r) => r.id === n.id);
                if (idx >= 0) {
                    const pos = childPositions[idx];
                    base.x = pos.x;
                    base.y = pos.y;
                    base.vx = 0;
                    base.vy = 0;
                    base.fx = pos.x;
                    base.fy = pos.y;
                }
            }
            return base;
        });

        // Hub node is always present when expanded
        const hubNode: GraphNodeWithCoords = {
            id: 'resource_hub',
            label: `${resourceCount} Resources`,
            type: 'resource_hub',
            payload: { count: resourceCount },
            ...(origin
                ? {
                      x: hubX,
                      y: hubY,
                      vx: 0,
                      vy: 0,
                      fx: hubX,
                      fy: hubY,
                  }
                : {}),
        };

        // Remove direct center-to-resource links so resources only connect through hub
        const filteredLinks = allLinks
            .filter((l) => !resourceIds.has(l.target))
            .map((l) => ({ source: l.source, target: l.target }));

        // Add center-to-hub and hub-to-resource links
        const hubToResourceLinks = resourceNodes.map((r) => ({
            source: 'resource_hub',
            target: r.id,
        }));

        return {
            nodes: [...nodes, hubNode],
            links: [
                ...filteredLinks,
                { source: data.meta.center, target: 'resource_hub' },
                ...hubToResourceLinks,
            ],
        };
    }, [data, expandedHubs, hubOrigins, releasedHubs]);

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
            const graphNode = node as GraphNodeWithCoords;

            if (graphNode.type === 'resource_hub') {
                onExpandHub?.('resources', graphNode.x ?? 0, graphNode.y ?? 0);
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
