<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVerseAnnotationRequest;
use App\Http\Requests\UpdateVerseAnnotationRequest;
use App\Models\VerseAnnotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerseAnnotationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $verseIds = collect(explode(',', (string) $request->query('verse_ids', '')))
            ->map(static fn (string $value): ?int => is_numeric($value) ? (int) $value : null)
            ->filter(static fn (?int $value): bool => $value !== null && $value > 0)
            ->unique()
            ->values();

        if ($verseIds->isNotEmpty()) {
            $annotations = VerseAnnotation::query()
                ->where('user_id', $request->user()->id)
                ->whereIn('verse_id', $verseIds->all())
                ->orderBy('verse_id')
                ->orderBy('start_offset')
                ->get([
                    'id',
                    'verse_id',
                    'start_offset',
                    'end_offset',
                    'selected_text',
                    'note',
                ]);

            return response()->json([
                'data' => $annotations,
            ]);
        }

        $annotationsQuery = VerseAnnotation::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'verse:id,chapter_id,verse_number,verse_key',
                'verse.chapter:id,chapter_number',
            ])
            ->latest();

        if ($request->boolean('all')) {
            $annotations = $annotationsQuery->get();

            return response()->json([
                'data' => $annotations->map(fn (VerseAnnotation $annotation) => $this->serializeDetailedAnnotation($annotation)),
            ]);
        }

        $annotations = $annotationsQuery
            ->paginate(20)
            ->through(fn (VerseAnnotation $annotation) => $this->serializeDetailedAnnotation($annotation));

        return response()->json($annotations);
    }

    public function store(StoreVerseAnnotationRequest $request): JsonResponse
    {
        $annotation = VerseAnnotation::create([
            'user_id' => $request->user()->id,
            'verse_id' => $request->integer('verse_id'),
            'start_offset' => $request->integer('start_offset'),
            'end_offset' => $request->integer('end_offset'),
            'selected_text' => (string) $request->input('selected_text'),
            'note' => trim((string) $request->input('note')),
        ]);

        return response()->json($this->serializeAnnotation($annotation), 201);
    }

    public function update(
        UpdateVerseAnnotationRequest $request,
        VerseAnnotation $verseAnnotation,
    ): JsonResponse {
        abort_unless(
            $verseAnnotation->user_id === $request->user()->id,
            403,
        );

        $verseAnnotation->update([
            'note' => trim((string) $request->input('note')),
        ]);

        return response()->json($this->serializeAnnotation($verseAnnotation->fresh()));
    }

    public function destroy(
        Request $request,
        VerseAnnotation $verseAnnotation,
    ): JsonResponse {
        abort_unless(
            $verseAnnotation->user_id === $request->user()->id,
            403,
        );

        $verseAnnotation->delete();

        return response()->json([], 204);
    }

    /**
     * @return array<string, int|string>
     */
    private function serializeAnnotation(VerseAnnotation $annotation): array
    {
        return [
            'id' => $annotation->id,
            'verse_id' => $annotation->verse_id,
            'start_offset' => $annotation->start_offset,
            'end_offset' => $annotation->end_offset,
            'selected_text' => $annotation->selected_text,
            'note' => $annotation->note,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeDetailedAnnotation(VerseAnnotation $annotation): array
    {
        return [
            ...$this->serializeAnnotation($annotation),
            'created_at' => $annotation->created_at?->toISOString(),
            'updated_at' => $annotation->updated_at?->toISOString(),
            'verse' => $annotation->verse ? [
                'id' => $annotation->verse->id,
                'verse_key' => $annotation->verse->verse_key,
                'verse_number' => $annotation->verse->verse_number,
                'chapter_id' => $annotation->verse->chapter_id,
                'chapter_number' => $annotation->verse->chapter?->chapter_number,
            ] : null,
        ];
    }
}
