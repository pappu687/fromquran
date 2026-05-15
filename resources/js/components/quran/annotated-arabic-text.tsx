import { LoginModal } from '@/components/auth/login-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { type VerseAnnotation } from '@/types/quran';
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type RefObject,
} from 'react';

interface SelectionState {
    endOffset: number;
    note: string;
    selectedText: string;
    showEditor: boolean;
    startOffset: number;
    x: number;
    y: number;
}

interface AnnotatedArabicTextProps {
    verseId: number;
    text: string;
    annotations?: VerseAnnotation[];
    as?: 'div' | 'span';
    className?: string;
    dir?: 'rtl' | 'ltr' | 'auto';
    interactive?: boolean;
    onAnnotationCreated?: (annotation: VerseAnnotation) => void;
    onSearch?: (text: string) => void;
    highlightText?: string;
    style?: CSSProperties;
}

export function AnnotatedArabicText({
    verseId,
    text,
    annotations = [],
    as = 'div',
    className,
    dir,
    interactive = false,
    onAnnotationCreated,
    onSearch,
    highlightText,
    style,
}: AnnotatedArabicTextProps) {
    const { user } = useAuth();
    const rootRef = useRef<HTMLElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [openTooltipAnnotationId, setOpenTooltipAnnotationId] = useState<
        number | null
    >(null);
    const [selectedAnnotation, setSelectedAnnotation] =
        useState<VerseAnnotation | null>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia(
            '(hover: none), (pointer: coarse)',
        );
        const updateTouchState = () => {
            setIsTouchDevice(mediaQuery.matches);
        };

        updateTouchState();
        mediaQuery.addEventListener('change', updateTouchState);

        return () => {
            mediaQuery.removeEventListener('change', updateTouchState);
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (
                popupRef.current?.contains(event.target as Node) ||
                rootRef.current?.contains(event.target as Node)
            ) {
                return;
            }

            setSelection(null);
            setError(null);
            setOpenTooltipAnnotationId(null);
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, []);

    useEffect(() => {
        setSelection(null);
        setError(null);
        setOpenTooltipAnnotationId(null);
        setSelectedAnnotation(null);
    }, [verseId]);

    useEffect(() => {
        if (!selection?.showEditor) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            noteInputRef.current?.focus();
            noteInputRef.current?.setSelectionRange(
                noteInputRef.current.value.length,
                noteInputRef.current.value.length,
            );
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [selection?.showEditor]);

    const clearSelection = () => {
        if (typeof window !== 'undefined') {
            window.getSelection()?.removeAllRanges();
        }

        setSelection(null);
        setError(null);
    };

    const handleSelectionComplete = () => {
        if (!interactive || typeof window === 'undefined') {
            return;
        }

        const selectedRange = readSelection(rootRef.current, text);
        if (!selectedRange) {
            setSelection(null);
            setError(null);
            return;
        }

        setSelection({
            ...selectedRange,
            note: '',
            showEditor: false,
        });
        setError(null);
    };

    const saveAnnotation = async () => {
        if (!selection || isSaving) {
            return;
        }

        const note = selection.note.trim();
        if (!note) {
            setError('Note cannot be empty.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/api/verse-annotations', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    verse_id: verseId,
                    start_offset: selection.startOffset,
                    end_offset: selection.endOffset,
                    selected_text: selection.selectedText,
                    note,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as {
                    errors?: Record<string, string[]>;
                    message?: string;
                } | null;

                const firstError = payload?.errors
                    ? Object.values(payload.errors)[0]?.[0]
                    : null;

                throw new Error(
                    firstError || payload?.message || 'Failed to save note.',
                );
            }

            const annotation = (await response.json()) as VerseAnnotation;
            onAnnotationCreated?.(annotation);
            clearSelection();
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Failed to save note.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    const segments = buildSegments(text, annotations);
    const noteExceedsTooltipLimit = (note: string) => note.trim().length > 150;

    const handleAnnotationActivate = (annotation: VerseAnnotation) => {
        if (noteExceedsTooltipLimit(annotation.note)) {
            setSelectedAnnotation(annotation);
            setOpenTooltipAnnotationId(null);
            return;
        }

        if (isTouchDevice) {
            setOpenTooltipAnnotationId((current) =>
                current === annotation.id ? null : annotation.id,
            );
        }
    };

    const renderAnnotatedSegment = (
        annotation: VerseAnnotation,
        segmentText: string,
    ) => {
        const trigger = (
            <button
                aria-label="View note"
                className="inline rounded border-0 bg-amber-200/90 px-0.5 py-0 text-inherit outline-none"
                data-note={annotation.note}
                onClick={() => handleAnnotationActivate(annotation)}
                type="button"
            >
                {segmentText}
            </button>
        );

        if (noteExceedsTooltipLimit(annotation.note)) {
            return trigger;
        }

        return (
            <Tooltip
                onOpenChange={(open) =>
                    setOpenTooltipAnnotationId(open ? annotation.id : null)
                }
                open={
                    isTouchDevice
                        ? openTooltipAnnotationId === annotation.id
                        : undefined
                }
            >
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent
                    className="max-w-xs text-left whitespace-pre-wrap"
                    sideOffset={6}
                >
                    {annotation.note}
                </TooltipContent>
            </Tooltip>
        );
    };

    const rootProps = {
        className: cn('relative whitespace-pre-wrap', className),
        'data-verse-id': verseId,
        dir,
        onMouseUp: handleSelectionComplete,
        onTouchEnd: handleSelectionComplete,
        style,
    };

    const renderTextWithHighlight = (textContent: string) => {
        if (!highlightText) return textContent;
        const parts = textContent.split(highlightText);
        if (parts.length === 1) return textContent;

        const result = [];
        for (let i = 0; i < parts.length; i++) {
            result.push(parts[i]);
            if (i < parts.length - 1) {
                result.push(
                    <mark
                        key={`mark-${i}`}
                        className="rounded-sm bg-green-200/80 px-0.5 text-inherit"
                    >
                        {highlightText}
                    </mark>,
                );
            }
        }
        return result;
    };

    return (
        <>
            {as === 'span' ? (
                <span
                    ref={rootRef as RefObject<HTMLSpanElement>}
                    {...rootProps}
                >
                    {segments.map((segment, index) => {
                        if (!segment.annotation) {
                            return (
                                <span key={`${verseId}-segment-${index}`}>
                                    {renderTextWithHighlight(segment.text)}
                                </span>
                            );
                        }

                        return (
                            <span key={segment.annotation.id}>
                                {renderAnnotatedSegment(
                                    segment.annotation,
                                    segment.text,
                                )}
                            </span>
                        );
                    })}
                </span>
            ) : (
                <div ref={rootRef as RefObject<HTMLDivElement>} {...rootProps}>
                    {segments.map((segment, index) => {
                        if (!segment.annotation) {
                            return (
                                <span key={`${verseId}-segment-${index}`}>
                                    {renderTextWithHighlight(segment.text)}
                                </span>
                            );
                        }

                        return (
                            <span key={segment.annotation.id}>
                                {renderAnnotatedSegment(
                                    segment.annotation,
                                    segment.text,
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {interactive && selection ? (
                <div
                    ref={popupRef}
                    className="fixed z-50 w-72 rounded-xl border bg-background p-3 shadow-lg"
                    style={{
                        left: Math.max(
                            12,
                            Math.min(selection.x, window.innerWidth - 300),
                        ),
                        top: Math.max(12, selection.y),
                    }}
                >
                    {!user ? (
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full"
                                onClick={() => setIsLoginModalOpen(true)}
                                size="sm"
                                variant="outline"
                            >
                                Log in to save note
                            </Button>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    onSearch?.(selection.selectedText);
                                    clearSelection();
                                }}
                                size="sm"
                                variant="outline"
                            >
                                Search this selection
                            </Button>
                        </div>
                    ) : !selection.showEditor ? (
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full"
                                onClick={() =>
                                    setSelection((current) =>
                                        current
                                            ? {
                                                  ...current,
                                                  showEditor: true,
                                              }
                                            : current,
                                    )
                                }
                                size="sm"
                            >
                                Add note
                            </Button>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    onSearch?.(selection.selectedText);
                                    clearSelection();
                                }}
                                size="sm"
                                variant="outline"
                            >
                                Search
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-md bg-muted/60 px-2 py-1.5 text-right text-sm">
                                {selection.selectedText}
                            </div>
                            <Textarea
                                ref={noteInputRef}
                                onChange={(event) =>
                                    setSelection((current) =>
                                        current
                                            ? {
                                                  ...current,
                                                  note: event.target.value,
                                              }
                                            : current,
                                    )
                                }
                                placeholder="Write a note..."
                                rows={4}
                                value={selection.note}
                            />
                            {error ? (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            ) : null}
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    onClick={clearSelection}
                                    size="sm"
                                    type="button"
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={isSaving}
                                    onClick={saveAnnotation}
                                    size="sm"
                                    type="button"
                                >
                                    {isSaving ? 'Saving...' : 'Save note'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            <LoginModal
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
            />
            <Dialog
                open={!!selectedAnnotation}
                onOpenChange={(open) => !open && setSelectedAnnotation(null)}
            >
                <DialogContent
                    aria-describedby={undefined}
                    className="max-h-[85vh] overflow-hidden p-4 sm:max-w-lg sm:p-6"
                >
                    <DialogHeader>
                        <DialogTitle>Note</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto text-sm whitespace-pre-wrap text-foreground">
                        {selectedAnnotation?.note}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

interface TextSegment {
    annotation?: VerseAnnotation;
    text: string;
}

function buildSegments(
    text: string,
    annotations: VerseAnnotation[],
): TextSegment[] {
    const segments: TextSegment[] = [];
    const sortedAnnotations = [...annotations].sort(
        (left, right) => left.start_offset - right.start_offset,
    );
    let cursor = 0;

    for (const annotation of sortedAnnotations) {
        if (annotation.start_offset > cursor) {
            segments.push({
                text: text.slice(cursor, annotation.start_offset),
            });
        }

        segments.push({
            annotation,
            text: text.slice(annotation.start_offset, annotation.end_offset),
        });

        cursor = annotation.end_offset;
    }

    if (cursor < text.length) {
        segments.push({
            text: text.slice(cursor),
        });
    }

    return segments;
}

function readSelection(
    root: HTMLElement | null,
    verseText: string,
): Omit<SelectionState, 'note' | 'showEditor'> | null {
    if (!root || typeof window === 'undefined') {
        return null;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (!root.contains(container)) {
        return null;
    }

    const selectedText = range.toString();
    if (!selectedText.trim()) {
        return null;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(root);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    if (
        startOffset < 0 ||
        endOffset <= startOffset ||
        endOffset > verseText.length
    ) {
        return null;
    }

    if (verseText.slice(startOffset, endOffset) !== selectedText) {
        return null;
    }

    const rect = range.getBoundingClientRect();

    return {
        selectedText,
        startOffset,
        endOffset,
        x: rect.left,
        y: rect.bottom + 8,
    };
}
