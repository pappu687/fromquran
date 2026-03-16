<?php

namespace App\Http\Controllers;

use App\Rules\ValidTurnstileToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if (
            ! $request->filled('turnstile_token')
            && $request->filled('cf-turnstile-response')
        ) {
            $request->merge([
                'turnstile_token' => $request->input('cf-turnstile-response'),
            ]);
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ];

        if (config('turnstile.enabled')) {
            $rules['turnstile_token'] = ['required', new ValidTurnstileToken()];
        }

        $validated = $request->validate($rules);

        // Here you could dispatch a job, send an email, or log the contact.
        // For now, we simply acknowledge receipt and redirect back home.

        return redirect()
            ->route('home')
            ->with('success', 'Thank you for reaching out. Your message has been received.');
    }
}
