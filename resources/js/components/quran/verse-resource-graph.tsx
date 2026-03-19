import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
    type ResourceGraphApiResponse,
    type ResourceGraphNode,
} from '@/types/quran';
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

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

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
        const graphNode = node as ResourceGraphNode;
        return graphNode.label || graphNode.id;
    }, []);

    const handleNodeCanvasObject = useCallback(
        (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const graphNode = node as ResourceGraphNode;
            const label = graphNode.label || graphNode.id;

            // Make text scale explicitly with zoom
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle =
                graphNode.type === 'verse' ? '#f97316' : '#0ea5e9'; // orange-500 : sky-500

            ctx.beginPath();
            ctx.arc(
                graphNode.x ?? 0,
                graphNode.y ?? 0,
                graphNode.type === 'verse' ? 8 : 5,
                0,
                2 * Math.PI,
            );
            ctx.fill();

            ctx.fillStyle = '#334155'; // slate-700, force light theme

            // Offset text position dynamically based on font size
            ctx.fillText(
                label,
                (graphNode.x ?? 0) + 8,
                (graphNode.y ?? 0) + fontSize / 3,
            );
        },
        [],
    );

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
            className="flex h-full w-full items-center justify-center p-2"
        >
            <ForceGraph2D
                graphData={graphData}
                nodeLabel={handleNodeLabel}
                nodeCanvasObject={handleNodeCanvasObject}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                onNodeClick={onNodeClick}
                width={dimensions.width}
                height={dimensions.height}
            />
        </div>
    );
}

export default VerseResourceGraph;
