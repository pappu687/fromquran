<?php

namespace Database\Factories;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TagFactory extends Factory
{
    protected $model = Tag::class;

    public function definition(): array
    {
        $name = Str::title($this->faker->unique()->words(2, true));

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'type' => 'theme',
            'description' => $this->faker->optional()->sentence(),
            'color' => $this->faker->optional()->hexColor(),
            'status' => Tag::STATUS_ACTIVE,
        ];
    }
}
