export function buildGraphData(verseKey: string, apiData: any) {
    const nodes: any[] = [];
    const links: any[] = [];

    // Center verse node
    nodes.push({
        id: verseKey,
        label: verseKey,
        type: 'verse',
    });

    // Resource Types
    const resourceTypes = apiData?.meta?.counts?.resource_types || {};

    Object.entries(resourceTypes).forEach(([name, count]) => {
        const id = name; 

        nodes.push({
            id,
            label: `${name} (${count})`,
            type: 'resource',
            originalName: name
        });

        links.push({
            source: verseKey,
            target: id,
        });
    });

    // Topics node
    const topicCount = apiData?.meta?.counts?.topics || 0;
    if (topicCount > 0) {
        nodes.push({
            id: 'Topics',
            label: `Topics (${topicCount})`,
            type: 'topic',
            originalName: 'Topics'
        });

        links.push({
            source: verseKey,
            target: 'Topics',
        });
    }

    // Similar verses node
    const similarCount = apiData?.meta?.counts?.similar_verses || 0;
    if (similarCount > 0) {
        nodes.push({
            id: 'Related Verses',
            label: `Related Verses (${similarCount})`,
            type: 'similar',
            originalName: 'Related Verses' // Maps exactly to Accordion item value
        });

        links.push({
            source: verseKey,
            target: 'Related Verses',
        });
    }

    return { nodes, links };
}
