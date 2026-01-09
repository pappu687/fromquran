<?php

namespace Database\Factories;

use App\Models\UserChapterResource;
use App\Models\User;
use App\Models\Chapter;
use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserChapterResourceFactory extends Factory
{
    protected $model = UserChapterResource::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'chapter_id' => Chapter::factory(),
            'resource_type_id' => ResourceType::factory(),
            'resource_url' => $this->faker->url,
            'comment' => $this->faker->sentence,
            'status' => 'pending',
        ];
    }
}
