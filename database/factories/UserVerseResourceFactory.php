<?php

namespace Database\Factories;

use App\Models\UserVerseResource;
use App\Models\User;
use App\Models\Verse;
use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserVerseResourceFactory extends Factory
{
    protected $model = UserVerseResource::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'verse_id' => Verse::factory(),
            'resource_type_id' => ResourceType::factory(),
            'resource_url' => $this->faker->url,
            'comment' => $this->faker->sentence,
            'status' => 'pending',
        ];
    }
}
