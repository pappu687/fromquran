<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVerseAnnotationRequest extends FormRequest
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
}
