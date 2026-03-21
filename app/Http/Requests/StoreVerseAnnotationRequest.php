<?php

namespace App\Http\Requests;

use App\Models\Verse;
use App\Models\VerseAnnotation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreVerseAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'verse_id' => ['required', 'integer', 'exists:verses,id'],
            'start_offset' => ['required', 'integer', 'min:0'],
            'end_offset' => ['required', 'integer', 'gt:start_offset'],
            'selected_text' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value) || strip_tags($value) !== $value || trim($value) === '') {
                        $fail('The selected text must be plain text.');
                    }
                },
            ],
            'note' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value) || strip_tags($value) !== $value || trim($value) === '') {
                        $fail('The note must be plain text.');
                    }
                },
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $verse = Verse::find($this->integer('verse_id'));
            if (!$verse) {
                return;
            }

            $verseText = $this->resolveVerseText($verse);
            $startOffset = $this->integer('start_offset');
            $endOffset = $this->integer('end_offset');
            $selectedText = (string) $this->input('selected_text');

            $verseLength = mb_strlen($verseText, 'UTF-8');

            if ($endOffset > $verseLength) {
                $validator->errors()->add(
                    'end_offset',
                    'The selected range must be within the Arabic verse text.',
                );

                return;
            }

            $actualSelectedText = mb_substr(
                $verseText,
                $startOffset,
                $endOffset - $startOffset,
                'UTF-8',
            );

            if ($actualSelectedText !== $selectedText) {
                $validator->errors()->add(
                    'selected_text',
                    'The selected text does not match the Arabic verse text.',
                );
            }

            $hasOverlap = VerseAnnotation::query()
                ->where('user_id', $this->user()->id)
                ->where('verse_id', $verse->id)
                ->where('start_offset', '<', $endOffset)
                ->where('end_offset', '>', $startOffset)
                ->exists();

            if ($hasOverlap) {
                $validator->errors()->add(
                    'start_offset',
                    'The selected range overlaps an existing annotation.',
                );
            }
        });
    }

    private function resolveVerseText(Verse $verse): string
    {
        return (string) ($verse->text_uthmani ?? '');
    }
}
