import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ChevronRight, ChevronDown, Tags } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Topic {
    topic_id: number;
    name: string;
    arabic_name?: string;
    children?: RecursiveTopic[];
}

interface RecursiveTopic {
    topic_id: number;
    name: string;
    arabic_name?: string;
    children?: RecursiveTopic[];
}

interface TopicsPanelProps {
    onTopicSelect: (topicId: number) => void;
    className?: string;
}

// Generate a random color from a palette
const getRandomColor = (id: number): string => {
    const colors = [
        'bg-red-100 text-red-800 hover:bg-red-200',
        'bg-blue-100 text-blue-800 hover:bg-blue-200',
        'bg-green-100 text-green-800 hover:bg-green-200',
        'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        'bg-purple-100 text-purple-800 hover:bg-purple-200',
        'bg-pink-100 text-pink-800 hover:bg-pink-200',
        'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
        'bg-orange-100 text-orange-800 hover:bg-orange-200',
        'bg-teal-100 text-teal-800 hover:bg-teal-200',
        'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    ];
    return colors[id % colors.length];
};

export function TopicsPanel({ onTopicSelect, className }: TopicsPanelProps) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await fetch('/api/topics');
                if (response.ok) {
                    const data = await response.json();
                    setTopics(data);
                }
            } catch (error) {
                console.error('Failed to fetch topics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, []);

    const toggleExpand = (topicId: number) => {
        setExpandedTopics((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(topicId)) {
                newSet.delete(topicId);
            } else {
                newSet.add(topicId);
            }
            return newSet;
        });
    };

    const filterTopics = (topicList: RecursiveTopic[]): RecursiveTopic[] => {
        const result: RecursiveTopic[] = [];

        for (const topic of topicList) {
            const matchesSearch =
                topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (topic.arabic_name &&
                    topic.arabic_name.includes(searchTerm));

            const filteredChildren = topic.children
                ? filterTopics(topic.children)
                : undefined;

            if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
                result.push({
                    ...topic,
                    children: filteredChildren,
                });
            }
        }

        return result;
    };

    const filteredTopics = filterTopics(topics);

    const renderTopic = (topic: Topic, level: number = 0): React.ReactNode => {
        const hasChildren = topic.children && topic.children.length > 0;
        const isExpanded = expandedTopics.has(topic.topic_id);
        const colorClass = getRandomColor(topic.topic_id);

        return (
            <div key={topic.topic_id}>
                <SidebarMenuItem>
                    <div
                        className={cn(
                            'flex w-full items-center gap-1',
                            level > 0 && 'ml-4',
                        )}
                    >
                        {hasChildren && (
                            <SidebarMenuButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(topic.topic_id);
                                }}
                                className="h-8 w-8 shrink-0 p-0"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </SidebarMenuButton>
                        )}
                        <SidebarMenuButton
                            onClick={() => onTopicSelect(topic.topic_id)}
                            className="h-auto flex-1 px-2 py-2"
                        >
                            <Badge
                                className={cn(
                                    'font-normal cursor-pointer transition-colors',
                                    colorClass,
                                )}
                                variant="secondary"
                            >
                                <span className="truncate max-w-[120px]">
                                    {topic.name}
                                </span>
                                {topic.arabic_name && (
                                    <span className="ml-1 font-arabic text-xs">
                                        {topic.arabic_name}
                                    </span>
                                )}
                            </Badge>
                        </SidebarMenuButton>
                    </div>
                </SidebarMenuItem>
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {topic.children!.map((child) =>
                            renderTopic(child, level + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 px-2 pb-2">
                <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>

            <SidebarContent className="overflow-hidden">
                <OverlayScrollbarsComponent
                    element="div"
                    className="h-full w-full"
                    options={{
                        scrollbars: {
                            autoHide: 'leave',
                            clickScroll: true,
                        },
                    }}
                    defer
                >
                    <SidebarGroup>
                        <SidebarGroupContent>
                            {loading ? (
                                <div className="flex items-center justify-center p-4">
                                    <span className="text-sm text-muted-foreground">
                                        Loading topics...
                                    </span>
                                </div>
                            ) : filteredTopics.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-4">
                                    <Tags className="mb-2 h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {searchTerm
                                            ? 'No topics found'
                                            : 'No topics available'}
                                    </span>
                                </div>
                            ) : (
                                <SidebarMenu>{filteredTopics.map((topic) => renderTopic(topic))}</SidebarMenu>
                            )}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </OverlayScrollbarsComponent>
            </SidebarContent>
        </div>
    );
}
