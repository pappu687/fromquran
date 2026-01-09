<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Collection::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $name = $this->faker->words(3, true);
        return [
            'user_id' => User::factory(),
            'name' => $name,
            'description' => $this->faker->sentence,
            'color' => $this->faker->hexColor,
            'is_public' => $this->faker->boolean(20), // 20% chance of being public
            'slug' => \Illuminate\Support\Str::slug($name),
        ];
    }
}
