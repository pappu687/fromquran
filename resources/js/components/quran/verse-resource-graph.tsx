import { useCallback, useMemo } from 'react';
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

    const handleNodeLabel = useCallback((node: any) => {
        return node.label || node.id;
    }, []);

    const handleNodeCanvasObject = useCallback(
        (node: any, ctx: CanvasRenderingContext2D) => {
            const label = node.label || node.id;

            ctx.font = '10px Sans-Serif';
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
            ctx.fillText(label, node.x + 8, node.y + 3);
        },
        [],
    );

    return (
        <div style={{ width: '100%', height: '400px' }} className="w-full">
            <ForceGraph2D
                graphData={graphData}
                nodeLabel={handleNodeLabel}
                nodeCanvasObject={handleNodeCanvasObject}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                onNodeClick={onNodeClick}
                width={800} // Default inner width if resizing not fully automatic yet
                height={400}
            />
        </div>
    );
}

export default VerseResourceGraph;
