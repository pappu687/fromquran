interface TajweedTextProps {
    text: string;
    className?: string;
    dir?: 'rtl' | 'ltr';
    style?: React.CSSProperties;
}

export function TajweedText({
    text,
    className,
    dir = 'rtl',
    style,
}: TajweedTextProps) {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    const ruleRegex =
        /<rule class=['"]?(?<class>[^'">\s]+)['"]?>(?<content>.*?)<\/rule>/g;

    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = ruleRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <span key={`plain-${keyIndex}`}>
                    {text.slice(lastIndex, match.index)}
                </span>,
            );
        }

        const ruleClass = match.groups?.class ?? '';
        const content = match.groups?.content ?? '';

        parts.push(
            <span
                key={`rule-${keyIndex}`}
                className={ruleClass}
                data-tajweed=""
            >
                {content}
            </span>,
        );

        lastIndex = ruleRegex.lastIndex;
        keyIndex++;
    }

    if (lastIndex < text.length) {
        parts.push(<span key={`plain-${keyIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return (
        <span className={`tajweed-text ${className ?? ''}`} dir={dir} style={style}>
            {parts}
        </span>
    );
}
