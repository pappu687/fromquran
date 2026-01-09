<?php

namespace Database\Factories;

use App\Models\Chapter;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChapterFactory extends Factory
{
    protected $model = Chapter::class;

    public function definition()
    {
        return [
            'chapter_number' => $this->faker->unique()->numberBetween(1, 114),
            'name_simple' => $this->faker->word,
            'name_complex' => $this->faker->word,
            'name_arabic' => $this->faker->word,
            'verses_count' => $this->faker->numberBetween(3, 286),
            'pages' => [$this->faker->numberBetween(1, 604)],
            'revelation_place' => $this->faker->randomElement(['makkah', 'madinah']),
            'revelation_order' => $this->faker->numberBetween(1, 114),
        ];
    }
}
