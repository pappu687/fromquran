<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Verse;
use App\Models\VerseAnnotation;
use Illuminate\Database\Eloquent\Factories\Factory;

class VerseAnnotationFactory extends Factory
{
    protected $model = VerseAnnotation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'verse_id' => Verse::factory(),
            'start_offset' => 0,
            'end_offset' => 3,
            'selected_text' => 'بسم',
            'note' => $this->faker->sentence(),
        ];
    }
}
