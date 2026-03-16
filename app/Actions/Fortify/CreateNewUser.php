<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Rules\ValidTurnstileToken;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        if (
            (! isset($input['turnstile_token']) || $input['turnstile_token'] === '')
            && isset($input['cf-turnstile-response'])
        ) {
            $input['turnstile_token'] = $input['cf-turnstile-response'];
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ];

        if (config('turnstile.enabled')) {
            $rules['turnstile_token'] = ['required', new ValidTurnstileToken()];
        }

        Validator::make($input, $rules)->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
