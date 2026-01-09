<?php

namespace Database\Factories;

use App\Models\Chapter;
use App\Models\Verse;
use Illuminate\Database\Eloquent\Factories\Factory;

class VerseFactory extends Factory
{
    protected $model = Verse::class;

    public function definition()
    {
        return [
            'chapter_id' => Chapter::factory(),
            'verse_number' => $this->faker->numberBetween(1, 286),
            'verse_index' => $this->faker->numberBetween(1, 6236),
            'verse_key' => function (array $attributes) {
                // We'll rely on lazy evaluation or override. 
                // Getting chapter_id might be tricky if it's a closure.
                // Simple placeholder provided:
                return '1:1'; 
            },
            'text_uthmani' => 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
            'text_indopak' => 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
            'text_imlaei_simple' => 'بسم الله الرحمن الرحيم',
            'juz_number' => 1,
            'hizb_number' => 1,
            'rub_el_hizb_number' => 1,
            'ruku_number' => 1,
            'surah_ruku_number' => 1,
            'manzil_number' => 1,
            'page_number' => 1,
        ];
    }
}
