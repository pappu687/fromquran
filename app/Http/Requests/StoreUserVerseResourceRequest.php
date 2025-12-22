<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserVerseResourceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by auth middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'verse_id' => ['required', 'integer', 'exists:verses,id'],
            'resource_type' => [
                'required',
                'string',
                'in:youtube_tafseer,podcast,article,shan_e_nuzul,hadith,fiqh_ruling,fatwa,scholarly_commentary,other'
            ],
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
            'verse_id.required' => 'Verse ID is required.',
            'verse_id.exists' => 'The selected verse does not exist.',
            'resource_type.required' => 'Please select a resource type.',
            'resource_type.in' => 'Invalid resource type selected.',
            'resource_url.required' => 'Resource URL is required.',
            'resource_url.url' => 'Please provide a valid URL.',
            'comment.max' => 'Comment must not exceed 250 characters.',
        ];
    }
}
