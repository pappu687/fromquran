import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { buildGraphData } from './buildGraphData';

interface VerseResourceGraphProps {
    verseKey: string;
    data: any;
    onNodeClick?: (node: any) => void;
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

    const handleNodeLabel = useCallback((node: any) => {
        return node.label || node.id;
    }, []);

    const handleNodeCanvasObject = useCallback(
        (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.label || node.id;

            // Make text scale explicitly with zoom
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = node.type === 'verse' ? '#f97316' : '#0ea5e9'; // orange-500 : sky-500

            ctx.beginPath();
            ctx.arc(
                node.x,
                node.y,
                node.type === 'verse' ? 8 : 5,
                0,
                2 * Math.PI,
            );
            ctx.fill();

            ctx.fillStyle = document.documentElement.classList.contains('dark')
                ? '#e2e8f0'
                : '#334155'; // slate-200 : slate-700

            // Offset text position dynamically based on font size
            ctx.fillText(label, node.x + 8, node.y + fontSize / 3);
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
