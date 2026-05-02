import type {
    QuranGraphV2Node,
    QuranGraphV2NodeType,
    QuranGraphV2Response,
} from '@/types/quran-graph';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { useEffect, useMemo, useRef } from 'react';

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
    verse: 10,
    chapter: 12,
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

interface GraphNodeWithChildren extends QuranGraphV2Node {
    children?: GraphNodeWithChildren[];
    linkWith?: string[];
}

interface QuranGraphV2Props {
    data: QuranGraphV2Response | null;
    onNodeClick?: (node: QuranGraphV2Node) => void;
    selectedNodeId?: string | null;
    expandedHubs?: Set<string>;
    onExpandHub?: (hub: string, x: number, y: number) => void;
    hubOrigins?: Map<string, { x: number; y: number }>;
}

function buildTreeFromFlat(
    rootId: string,
    nodes: QuranGraphV2Node[],
    links: { source: string; target: string }[],
): unknown[] {
    const nodeMap = new Map<string, GraphNodeWithChildren>();
    for (const n of nodes) {
        nodeMap.set(n.id, { ...n, children: [], linkWith: [] });
    }

    const adj = new Map<string, string[]>();
    for (const link of links) {
        const s = link.source;
        const t = link.target;
        if (!adj.has(s)) adj.set(s, []);
        if (!adj.has(t)) adj.set(t, []);
        adj.get(s)!.push(t);
        adj.get(t)!.push(s);
    }

    const visited = new Set<string>();
    const parentMap = new Map<string, string>();
    const queue: string[] = [rootId];
    visited.add(rootId);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adj.get(current) || [];

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                parentMap.set(neighbor, current);
                queue.push(neighbor);
                const parent = nodeMap.get(current);
                const child = nodeMap.get(neighbor);
                if (parent && child) {
                    parent.children = parent.children || [];
                    parent.children.push(child);
                }
            } else {
                const currentNode = nodeMap.get(current);
                const neighborNode = nodeMap.get(neighbor);
                if (
                    currentNode &&
                    neighborNode &&
                    parentMap.get(neighbor) !== current &&
                    parentMap.get(current) !== neighbor
                ) {
                    currentNode.linkWith = currentNode.linkWith || [];
                    if (!currentNode.linkWith.includes(neighbor)) {
                        currentNode.linkWith.push(neighbor);
                    }
                }
            }
        }
    }

    const root = nodeMap.get(rootId);
    if (!root) return [];

    for (const [, node] of nodeMap) {
        if (!node.children || node.children.length === 0) {
            delete (node as Partial<typeof node>).children;
        }
        if (!node.linkWith || node.linkWith.length === 0) {
            delete (node as Partial<typeof node>).linkWith;
        }
    }

    function mapToAmCharts(n: GraphNodeWithChildren): unknown {
        return {
            name: n.label || n.id,
            label: n.label || n.id,
            id: n.id,
            type: n.type,
            value: NODE_SIZES[n.type] || 5,
            payload: n.payload,
            circleSettings: {
                fill: am5.color(NODE_COLORS[n.type] || NODE_COLORS.unknown),
            },
            ...(n.children ? { children: n.children.map(mapToAmCharts) } : {}),
            ...(n.linkWith && n.linkWith.length > 0
                ? { linkWith: n.linkWith }
                : {}),
        };
    }

    return [mapToAmCharts(root)];
}

function findHubDataItem(
    series: am5hierarchy.ForceDirected,
): am5.DataItem<am5hierarchy.IForceDirectedDataItem> | undefined {
    let found: am5.DataItem<am5hierarchy.IForceDirectedDataItem> | undefined;
    for (const di of series.dataItems) {
        const ctx = di.dataContext as
            | { id?: string; type?: string }
            | undefined;
        if (ctx?.type === 'resource_hub') {
            found = di as am5.DataItem<am5hierarchy.IForceDirectedDataItem>;
            break;
        }
    }
    return found;
}

function applyHubState(
    series: am5hierarchy.ForceDirected,
    expandedHubs: Set<string>,
) {
    const hub = findHubDataItem(series);
    if (!hub) return;

    const s = series as unknown as {
        enableDataItem(
            di: am5.DataItem<am5hierarchy.IForceDirectedDataItem>,
        ): void;
        disableDataItem(
            di: am5.DataItem<am5hierarchy.IForceDirectedDataItem>,
        ): void;
    };

    if (expandedHubs.has('resources')) {
        s.enableDataItem(hub);
    } else {
        s.disableDataItem(hub);
    }
}

export function QuranGraphV2({
    data,
    onNodeClick,
    expandedHubs = new Set(),
    onExpandHub,
}: QuranGraphV2Props) {
    const chartDivRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<{
        root: am5.Root;
        series: am5hierarchy.ForceDirected;
    } | null>(null);
    const onNodeClickRef = useRef(onNodeClick);
    onNodeClickRef.current = onNodeClick;
    const onExpandHubRef = useRef(onExpandHub);
    onExpandHubRef.current = onExpandHub;
    const expandedHubsRef = useRef(expandedHubs);
    expandedHubsRef.current = expandedHubs;

    const displayTreeData = useMemo(() => {
        if (!data) return [];

        const allNodes = data.nodes.map((n) => ({ ...n }));
        const allLinks = data.links.map((l) => ({ ...l }));

        const resourceNodes = allNodes.filter((n) => n.type === 'resource');
        const resourceCount = resourceNodes.length;

        if (resourceCount <= 4) {
            return buildTreeFromFlat(
                data.meta.center,
                allNodes,
                allLinks.map((l) => ({
                    source: l.source,
                    target: l.target,
                })),
            );
        }

        const resourceIds = new Set(resourceNodes.map((n) => n.id));
        const hubNode: QuranGraphV2Node = {
            id: 'resource_hub',
            label: `${resourceCount} Resources`,
            type: 'resource_hub',
            payload: { count: resourceCount },
        };

        const nonResourceNodes = allNodes.filter((n) => !resourceIds.has(n.id));
        const nodesWithHub = [...nonResourceNodes, hubNode, ...resourceNodes];

        const linksWithHub = [
            ...allLinks.filter(
                (l) => !resourceIds.has(l.target) && !resourceIds.has(l.source),
            ),
            {
                source: data.meta.center,
                target: 'resource_hub',
                type: 'hub',
                weight: 1,
                payload: null,
            },
            ...resourceNodes.map((r) => ({
                source: 'resource_hub',
                target: r.id,
                type: 'hub_resource',
                weight: 1,
                payload: null,
            })),
        ];

        return buildTreeFromFlat(
            data.meta.center,
            nodesWithHub,
            linksWithHub.map((l) => ({
                source: l.source,
                target: l.target,
            })),
        );
    }, [data]);

    useEffect(() => {
        if (!chartDivRef.current || typeof window === 'undefined') return;

        const root = am5.Root.new(chartDivRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        const zoomableContainer = root.container.children.push(
            am5.ZoomableContainer.new(root, {
                width: am5.p100,
                height: am5.p100,
                wheelable: true,
                pinchZoom: true,
                minZoomLevel: 0.3,
                maxZoomLevel: 5,
            }),
        );

        const series = zoomableContainer.contents.children.push(
            am5hierarchy.ForceDirected.new(root, {
                singleBranchOnly: false,
                downDepth: 2,
                initialDepth: 3,
                valueField: 'value',
                categoryField: 'name',
                childDataField: 'children',
                idField: 'id',
                linkWithField: 'linkWith',
                centerStrength: 0.6,
                velocityDecay: 0.3,
                nodePadding: 18,
                minRadius: 6,
                maxRadius: 18,
                initialFrames: 300,
                animationDuration: 600,
                animationEasing: am5.ease.out(am5.ease.cubic),
            }),
        );

        series.circles.template.setAll({
            templateField: 'circleSettings',
        });

        series.outerCircles.template.setAll({
            visible: false,
        });

        series.labels.template.setAll({
            fontSize: 12,
            maxWidth: 120,
            oversizedBehavior: 'truncate',
        });

        series.nodes.template.set('toggleKey', 'none');

        series.nodes.template.events.on('click', (ev) => {
            const dataContext = ev.target.dataItem?.dataContext as
                | (QuranGraphV2Node & { id: string; type: string })
                | undefined;
            if (!dataContext) return;

            if (dataContext.type === 'resource_hub') {
                onExpandHubRef.current?.('resources', 0, 0);
                return;
            }

            onNodeClickRef.current?.(dataContext);
        });

        chartRef.current = { root, series };

        return () => {
            root.dispose();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        const { series } = chartRef.current || {};
        if (!series) return;

        series.data.setAll(displayTreeData);

        const timer = setTimeout(() => {
            applyHubState(series, expandedHubs);
        }, 80);
        return () => clearTimeout(timer);
    }, [displayTreeData]);

    useEffect(() => {
        const { series } = chartRef.current || {};
        if (!series) return;
        applyHubState(series, expandedHubs);
    }, [expandedHubs]);

    if (!data || data.nodes.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
                No graph data available.
            </div>
        );
    }

    return (
        <div
            ref={chartDivRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                overflow: 'hidden',
            }}
        />
    );
}

export default QuranGraphV2;
