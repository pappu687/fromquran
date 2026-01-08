<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserChapterResourceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'chapter_id' => ['required', 'integer', 'exists:chapters,id'],
            'resource_type_id' => ['required', 'integer', 'exists:resource_types,id'],
            'resource_url' => ['required', 'url', 'max:2048'],
            'comment' => ['nullable', 'string', 'max:250'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'chapter_id.required' => 'Chapter ID is required.',
            'chapter_id.exists' => 'The selected chapter does not exist.',
            'resource_type_id.required' => 'Please select a resource type.',
            'resource_type_id.exists' => 'The selected resource type does not exist.',
            'resource_url.required' => 'Resource URL is required.',
            'resource_url.url' => 'Please provide a valid URL.',
            'comment.max' => 'Comment must not exceed 250 characters.',
        ];
    }
}
