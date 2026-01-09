<?php

namespace Database\Factories;

use App\Models\QuranBookmark;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuranBookmarkFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = QuranBookmark::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'chapter_id' => $this->faker->numberBetween(1, 114),
            'verse_number' => $this->faker->numberBetween(1, 286),
            'verse_id' => function (array $attributes) {
                return $attributes['chapter_id'] . ':' . $attributes['verse_number'];
            },
            'verse_data' => [
                'text' => $this->faker->sentence,
                'translation' => $this->faker->sentence,
            ],
            'notes' => $this->faker->sentence,
            'edition' => 'en.sahih',
        ];
    }
}
