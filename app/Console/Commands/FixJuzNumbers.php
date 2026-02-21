<?php

namespace App\Console\Commands;

use App\Models\Verse;
use App\Models\Translation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixJuzNumbers extends Command
{
    protected $signature = 'fix:juz-numbers';
    protected $description = 'Correct juz_number in verses and translations tables';

    public function handle()
    {
        $juzBoundaries = [
            ['juz' => 1, 'start_chapter' => 1, 'start_verse' => 1],
            ['juz' => 2, 'start_chapter' => 2, 'start_verse' => 142],
            ['juz' => 3, 'start_chapter' => 2, 'start_verse' => 253],
            ['juz' => 4, 'start_chapter' => 3, 'start_verse' => 93],
            ['juz' => 5, 'start_chapter' => 4, 'start_verse' => 24],
            ['juz' => 6, 'start_chapter' => 4, 'start_verse' => 148],
            ['juz' => 7, 'start_chapter' => 5, 'start_verse' => 82],
            ['juz' => 8, 'start_chapter' => 6, 'start_verse' => 111],
            ['juz' => 9, 'start_chapter' => 7, 'start_verse' => 88],
            ['juz' => 10, 'start_chapter' => 8, 'start_verse' => 41],
            ['juz' => 11, 'start_chapter' => 9, 'start_verse' => 93],
            ['juz' => 12, 'start_chapter' => 11, 'start_verse' => 6],
            ['juz' => 13, 'start_chapter' => 12, 'start_verse' => 53],
            ['juz' => 14, 'start_chapter' => 15, 'start_verse' => 1],
            ['juz' => 15, 'start_chapter' => 17, 'start_verse' => 1],
            ['juz' => 16, 'start_chapter' => 18, 'start_verse' => 75],
            ['juz' => 17, 'start_chapter' => 21, 'start_verse' => 1],
            ['juz' => 18, 'start_chapter' => 23, 'start_verse' => 1],
            ['juz' => 19, 'start_chapter' => 25, 'start_verse' => 21],
            ['juz' => 20, 'start_chapter' => 27, 'start_verse' => 56],
            ['juz' => 21, 'start_chapter' => 29, 'start_verse' => 46],
            ['juz' => 22, 'start_chapter' => 33, 'start_verse' => 31],
            ['juz' => 23, 'start_chapter' => 36, 'start_verse' => 28],
            ['juz' => 24, 'start_chapter' => 39, 'start_verse' => 32],
            ['juz' => 25, 'start_chapter' => 41, 'start_verse' => 47],
            ['juz' => 26, 'start_chapter' => 46, 'start_verse' => 1],
            ['juz' => 27, 'start_chapter' => 51, 'start_verse' => 31],
            ['juz' => 28, 'start_chapter' => 58, 'start_verse' => 1],
            ['juz' => 29, 'start_chapter' => 67, 'start_verse' => 1],
            ['juz' => 30, 'start_chapter' => 78, 'start_verse' => 1],
        ];

        $this->info('Fixing Juz numbers in verses table...');

        foreach ($juzBoundaries as $index => $boundary) {
            $juz = $boundary['juz'];
            $startChapter = $boundary['start_chapter'];
            $startVerse = $boundary['start_verse'];

            $endChapter = 114;
            $endVerse = 999;

            if (isset($juzBoundaries[$index + 1])) {
                $next = $juzBoundaries[$index + 1];
                $endChapter = $next['start_chapter'];
                $endVerse = $next['start_verse'] - 1;

                if ($endVerse == 0) {
                    $endChapter--;
                    $endVerse = 999;
                }
            }

            $this->info("Processing Juz {$juz}: Chapter {$startChapter}:{$startVerse} to {$endChapter}:{$endVerse}");

            // Update verses
            DB::table('verses')
                ->join('chapters', 'verses.chapter_id', '=', 'chapters.id')
                ->where(function ($query) use ($startChapter, $startVerse, $endChapter, $endVerse) {
                    $query->where(function ($q) use ($startChapter, $startVerse, $endChapter) {
                        $q->where('chapters.chapter_number', '>', $startChapter)
                          ->where('chapters.chapter_number', '<', $endChapter);
                    })
                    ->orWhere(function ($q) use ($startChapter, $startVerse, $endChapter) {
                        if ($startChapter == $endChapter) {
                            $q->where('chapters.chapter_number', '=', $startChapter)
                              ->where('verses.verse_number', '>=', $startVerse)
                              ->where('verses.verse_number', '<=', 999); // Adjusted for single chapter juz if needed
                             // However, usually it spans multiple chapters or part of chapters.
                        } else {
                            $q->where('chapters.chapter_number', '=', $startChapter)
                              ->where('verses.verse_number', '>=', $startVerse);
                        }
                    })
                    ->orWhere(function ($q) use ($endChapter, $endVerse) {
                        $q->where('chapters.chapter_number', '=', $endChapter)
                          ->where('verses.verse_number', '<=', $endVerse);
                    });
                })
                ->update(['verses.juz_number' => $juz]);

            // Update translations
            DB::table('translations')
                ->join('chapters', 'translations.chapter_id', '=', 'chapters.id')
                ->where(function ($query) use ($startChapter, $startVerse, $endChapter, $endVerse) {
                    $query->where(function ($q) use ($startChapter, $startVerse, $endChapter) {
                        $q->where('chapters.chapter_number', '>', $startChapter)
                          ->where('chapters.chapter_number', '<', $endChapter);
                    })
                    ->orWhere(function ($q) use ($startChapter, $startVerse, $endChapter, $endVerse) {
                        if ($startChapter == $endChapter) {
                             $q->where('chapters.chapter_number', '=', $startChapter)
                              ->where('translations.verse_number', '>=', $startVerse)
                              ->where('translations.verse_number', '<=', $endVerse);
                        } else {
                            $q->where('chapters.chapter_number', '=', $startChapter)
                              ->where('translations.verse_number', '>=', $startVerse);
                        }
                    })
                    ->orWhere(function ($q) use ($endChapter, $endVerse) {
                        $q->where('chapters.chapter_number', '=', $endChapter)
                          ->where('translations.verse_number', '<=', $endVerse);
                    });
                })
                ->update(['translations.juz_number' => $juz]);
        }

        $this->info('✅ Juz numbers fixed successfully!');
    }
}
