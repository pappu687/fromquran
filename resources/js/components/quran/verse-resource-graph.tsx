import {
    type ResourceGraphApiResponse,
    type ResourceGraphNode,
} from '@/types/quran';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { useEffect, useMemo, useRef } from 'react';
import { buildGraphData } from './buildGraphData';

interface VerseResourceGraphProps {
    verseKey: string;
    data: ResourceGraphApiResponse | null;
    onNodeClick?: (node: ResourceGraphNode) => void;
}

export function VerseResourceGraph({
    verseKey,
    data,
    onNodeClick,
}: VerseResourceGraphProps) {
    const graphData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };
        return buildGraphData(verseKey, data);
    }, [verseKey, data]);

    const chartDivRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<{
        root: am5.Root;
        series: am5hierarchy.ForceDirected;
    } | null>(null);
    const onNodeClickRef = useRef(onNodeClick);
    onNodeClickRef.current = onNodeClick;

    useEffect(() => {
        if (!chartDivRef.current || typeof window === 'undefined') return;

        const root = am5.Root.new(chartDivRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        const series = root.container.children.push(
            am5hierarchy.ForceDirected.new(root, {
                singleBranchOnly: false,
                downDepth: 1,
                initialDepth: 2,
                valueField: 'value',
                categoryField: 'name',
                childDataField: 'children',
                idField: 'id',
                centerStrength: 0.6,
                velocityDecay: 0.3,
                nodePadding: 18,
                minRadius: 6,
                maxRadius: 18,
                initialFrames: 300,
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
            maxWidth: 100,
            oversizedBehavior: 'wrap',
        });

        series.nodes.template.set('toggleKey', 'none');

        series.nodes.template.events.on('click', (ev) => {
            const dataContext = ev.target.dataItem?.dataContext as
                | ResourceGraphNode
                | undefined;
            if (dataContext) {
                onNodeClickRef.current?.(dataContext);
            }
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

        if (graphData.nodes.length === 0) {
            series.data.setAll([]);
            return;
        }

        const rootNode = graphData.nodes.find((n) => n.id === verseKey);
        const children = graphData.nodes
            .filter((n) => n.id !== verseKey)
            .map((n) => ({
                name: n.label,
                id: n.id,
                label: n.label,
                type: n.type,
                value: n.type === 'verse' ? 8 : 5,
                originalName: n.originalName,
                circleSettings: {
                    fill:
                        n.type === 'verse'
                            ? am5.color('#f97316')
                            : am5.color('#0ea5e9'),
                },
            }));

        const amData = [
            {
                name: rootNode?.label || verseKey,
                id: verseKey,
                label: rootNode?.label || verseKey,
                type: 'verse',
                value: 10,
                circleSettings: {
                    fill: am5.color('#f97316'),
                },
                children,
            },
        ];

        series.data.setAll(amData);
    }, [graphData, verseKey]);

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

export default VerseResourceGraph;
