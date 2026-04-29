import { type AyahAnswerQuestion } from '@/api/quranFoundation';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CircleHelp } from 'lucide-react';

export const AYAH_ANSWERS_SECTION_VALUE = 'Quran Foundation Answers';

interface AyahAnswersListProps {
    questions: AyahAnswerQuestion[];
}

interface AyahAnswersHeaderProps {
    totalCount: number;
}

export function AyahAnswersHeader({ totalCount }: AyahAnswersHeaderProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
                <CircleHelp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold">Quran Foundation Answers</span>
            <Badge variant="secondary" className="ml-2 font-normal">
                {totalCount}
            </Badge>
        </div>
    );
}

export function AyahAnswersList({ questions }: AyahAnswersListProps) {
    return (
        <div className="space-y-4 pr-2">
            {questions.map((question) => (
                <article
                    key={question.id}
                    className="rounded-lg border bg-card p-3"
                >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className="text-[10px] tracking-normal uppercase"
                        >
                            {question.type.toLowerCase().replaceAll('_', ' ')}
                        </Badge>
                        {question.theme?.map((theme) => (
                            <Badge
                                key={`${question.id}-${theme}`}
                                variant="secondary"
                                className="text-[10px] font-normal"
                            >
                                {theme}
                            </Badge>
                        ))}
                    </div>
                    <h3 className="text-sm leading-snug font-semibold text-foreground">
                        {question.body}
                    </h3>
                    {question.summary && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {question.summary}
                        </p>
                    )}
                    <div className="mt-3 space-y-3">
                        {question.answers.map((answer) => (
                            <div
                                key={answer.id}
                                className="rounded-md bg-muted/40 p-3"
                            >
                                <p className="text-sm leading-relaxed text-foreground">
                                    {answer.body}
                                </p>
                                {answer.answeredBy && (
                                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                                        Answered by {answer.answeredBy}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    {question.references && question.references.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            References: {question.references.join(', ')}
                        </p>
                    )}
                </article>
            ))}
        </div>
    );
}

export function AyahAnswersAccordionItem({
    questions,
    totalCount,
}: AyahAnswersListProps & AyahAnswersHeaderProps) {
    return (
        <AccordionItem value={AYAH_ANSWERS_SECTION_VALUE}>
            <AccordionTrigger className="rounded-md px-2 transition-colors hover:no-underline [&[data-state=open]]:bg-muted/50">
                <AyahAnswersHeader totalCount={totalCount} />
            </AccordionTrigger>
            <AccordionContent className="pt-4">
                <AyahAnswersList questions={questions} />
            </AccordionContent>
        </AccordionItem>
    );
}
