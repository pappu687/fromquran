<?php

namespace Database\Factories;

use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResourceTypeFactory extends Factory
{
    protected $model = ResourceType::class;

    public function definition()
    {
        $name = $this->faker->unique()->word;
        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'display_order' => $this->faker->numberBetween(1, 100),
        ];
    }
}
