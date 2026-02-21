<?php

namespace App\Console\Commands;

use App\Models\Chapter;
use App\Models\Verse;
use App\Models\Language;
use App\Models\Author;
use App\Models\ResourceContent;
use App\Models\Translation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ImportQuranData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quran:import-data {--path= : Path to JSON file (default: docs/quran_en.json)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Quran data from JSON file into database';

    private $language;
    private $author;
    private $resourceContent;
    private $chapterData = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->option('path') ?? 'docs/quran_en.json';

        if (!file_exists($path)) {
            $this->error("JSON file not found at: {$path}");
            return 1;
        }

        $this->info("Starting Quran data import from: {$path}");

        try {
            $this->setupDependencies();
            $this->importChapters();
            $this->importVerses();
            $this->importTranslations();

            $this->info('✅ Quran data imported successfully!');
            $this->info("📊 Summary:");
            $this->info("   - Chapters: " . count($this->chapterData));
            $totalVerses = array_sum(array_column($this->chapterData, 'total_verses'));
            $this->info("   - Total Verses: {$totalVerses}");
            $this->info("   - Arabic Text: Imported");
            $this->info("   - English Translations: Imported");

        } catch (\Exception $e) {
            $this->error("❌ Import failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }

    private function setupDependencies()
    {
        $this->withProgressBar(3, function () {
            // Create or get English language
            $this->language = Language::updateOrCreate(
                ['iso_code' => 'en'],
                [
                    'name' => 'English',
                    'native_name' => 'English',
                    'direction' => 'ltr',
                ]
            );
            $this->info(' English language setup');

            // Create or get author for this translation
            $this->author = Author::updateOrCreate(
                ['name' => 'Quran.com (Default English Translation)'],
                [
                    'url' => 'https://quran.com',
                ]
            );
            $this->info(' Author setup');

            // Create resource content for this translation
            $this->resourceContent = ResourceContent::updateOrCreate(
                [
                    'resource_type' => 'translation',
                    'language_id' => $this->language->id,
                    'slug' => 'english-quran-com-translation',
                ],
                [
                    'name' => 'English Translation (Quran.com)',
                    'description' => 'Default English translation from quran-json package',
                    'resource_type_name' => 'quran-translation',
                    'sub_type' => 'translation',
                    'author_id' => $this->author->id,
                    'language_name' => $this->language->name,
                    'cardinality_type' => '1_ayah',
                    'approved' => true,
                    'priority' => 1,
                    'resource_id' => 'quran.com-en',
                    'records_count' => 0, // Will be updated later
                ]
            );
            $this->info(' Resource content setup');
        });

        $this->newLine();
    }

    private function importChapters()
    {
        $jsonPath = $this->option('path') ?? 'docs/quran_en.json';
        $jsonData = json_decode(file_get_contents($jsonPath), true);

        $this->info('📖 Importing chapters...');
        $this->withProgressBar(count($jsonData), function () use ($jsonData) {
            foreach ($jsonData as $chapter) {
                $chapterData = [
                    'chapter_number' => $chapter['id'],
                    'name_complex' => $chapter['name'],
                    'name_arabic' => $chapter['name'],
                    'name_simple' => $chapter['translation'],
                    'verses_count' => $chapter['total_verses'],
                    'revelation_place' => $chapter['type'],
                    'bismillah_pre' => $chapter['id'] > 1, // Al-Fatihah is chapter 1
                    'revelation_order' => $chapter['id'], // Will need proper mapping later
                ];

                // Update existing chapter or create new one
                Chapter::updateOrCreate(
                    ['chapter_number' => $chapter['id']],
                    $chapterData
                );

                $this->chapterData[$chapter['id']] = $chapter;
            }
        });

        $this->newLine();
    }

    private function importVerses()
    {
        $this->info('📝 Importing verses...');
        $totalVerses = array_sum(array_column($this->chapterData, 'total_verses'));

        $this->withProgressBar($totalVerses, function () {
            $verseIndex = 1;

            foreach ($this->chapterData as $chapterId => $chapter) {
                $chapterModel = Chapter::where('chapter_number', $chapterId)->first();

                foreach ($chapter['verses'] as $verse) {
                    $verseKey = "{$chapterId}:{$verse['id']}";

                    Verse::updateOrCreate(
                        [
                            'chapter_id' => $chapterModel->id,
                            'verse_number' => $verse['id'],
                        ],
                        [
                            'verse_index' => $verseIndex++,
                            'verse_key' => $verseKey,
                            'text_uthmani' => $verse['text'],
                            'juz_number' => $this->calculateJuz($chapterId, $verse['id']),
                            'hizb_number' => $this->calculateHizb($chapterId, $verse['id']),
                            'rub_el_hizb_number' => $this->calculateRubElHizb($chapterId, $verse['id']),
                            'page_number' => $this->calculatePage($chapterId, $verse['id']),
                            'ruku_number' => $this->calculateRuku($chapterId, $verse['id']),
                            'manzil_number' => $this->calculateManzil($chapterId),
                            'surah_ruku_number' => $this->calculateSurahRuku($chapterId, $verse['id']),
                            'words_count' => $this->countWords($verse['text']),
                        ]
                    );
                }
            }
        });

        $this->newLine();
    }

    private function importTranslations()
    {
        $this->info('🌐 Importing English translations...');
        $totalVerses = array_sum(array_column($this->chapterData, 'total_verses'));

        $this->withProgressBar($totalVerses, function () {
            foreach ($this->chapterData as $chapterId => $chapter) {
                $chapterModel = Chapter::where('chapter_number', $chapterId)->first();

                foreach ($chapter['verses'] as $verse) {
                    $verseModel = Verse::where('chapter_id', $chapterModel->id)
                        ->where('verse_number', $verse['id'])
                        ->first();

                    if ($verseModel) {
                        Translation::updateOrCreate(
                            [
                                'verse_id' => $verseModel->id,
                                'resource_content_id' => $this->resourceContent->id,
                            ],
                            [
                                'language_id' => $this->language->id,
                                'text' => $verse['translation'],
                                'language_name' => $this->language->name,
                                'resource_name' => $this->resourceContent->name,
                                'priority' => 1,
                                'verse_key' => $verseModel->verse_key,
                                'chapter_id' => $chapterModel->id,
                                'verse_number' => $verse['id'],
                                'juz_number' => $verseModel->juz_number,
                                'hizb_number' => $verseModel->hizb_number,
                                'rub_el_hizb_number' => $verseModel->rub_el_hizb_number,
                                'page_number' => $verseModel->page_number,
                                'ruku_number' => $verseModel->ruku_number,
                                'surah_ruku_number' => $verseModel->surah_ruku_number,
                                'manzil_number' => $verseModel->manzil_number,
                            ]
                        );
                    }
                }
            }
        });

        $this->newLine();

        // Update resource content records count
        $this->resourceContent->records_count = Verse::count();
        $this->resourceContent->save();
    }

    // Helper methods for calculating Quran navigation data
    // These are simplified calculations - in a real implementation, you'd use accurate mappings

    private function calculateJuz($chapter, $verse): int
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

        // Search backwards to find the first boundary that is less than or equal to current position
        for ($i = count($juzBoundaries) - 1; $i >= 0; $i--) {
            $boundary = $juzBoundaries[$i];
            if ($chapter > $boundary['start_chapter']) {
                return $boundary['juz'];
            }
            if ($chapter == $boundary['start_chapter'] && $verse >= $boundary['start_verse']) {
                return $boundary['juz'];
            }
        }

        return 1;
    }

    private function calculateHizb($chapter, $verse): int
    {
        $juz = $this->calculateJuz($chapter, $verse);
        return (($juz - 1) * 8) + 1; // Simplified - needs accurate calculation
    }

    private function calculateRubElHizb($chapter, $verse): int
    {
        return $this->calculateHizb($chapter, $verse) * 4; // Simplified
    }

    private function calculatePage($chapter, $verse): int
    {
        // Simplified page calculation - needs accurate mapping
        $pageMap = [
            1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 6,
            6 => 7, 7 => 8, 8 => 10, 9 => 12, 10 => 14,
            11 => 16, 12 => 18, 13 => 20, 14 => 22, 15 => 24,
            16 => 26, 17 => 28, 18 => 30, 19 => 32, 20 => 34,
            21 => 36, 22 => 38, 23 => 40, 24 => 42, 25 => 44,
            26 => 46, 27 => 48, 28 => 50, 29 => 52, 30 => 54,
            31 => 56, 32 => 58, 33 => 60, 34 => 62, 35 => 64,
            36 => 66, 37 => 68, 38 => 70, 39 => 72, 40 => 74,
            41 => 76, 42 => 78, 43 => 80, 44 => 82, 45 => 84,
            46 => 86, 47 => 88, 48 => 90, 49 => 92, 50 => 94,
            51 => 96, 52 => 98, 53 => 100, 54 => 102, 55 => 104,
            56 => 106, 57 => 108, 58 => 110, 59 => 112, 60 => 114,
        ];

        if ($chapter <= 60) {
            return $pageMap[$chapter] ?? 200;
        } else {
            return 200 + ($chapter - 60) * 2; // Simplified
        }
    }

    private function calculateRuku($chapter, $verse): int
    {
        // Simplified ruku calculation - needs accurate data
        return ($chapter * 10) + ($verse / 10);
    }

    private function calculateSurahRuku($chapter, $verse): int
    {
        // Simplified - needs accurate data
        return ceil($verse / 10);
    }

    private function calculateManzil($chapter): int
    {
        // Manzil divisions
        if ($chapter <= 4) return 1;
        if ($chapter <= 9) return 2;
        if ($chapter <= 16) return 3;
        if ($chapter <= 24) return 4;
        if ($chapter <= 37) return 5;
        if ($chapter <= 49) return 6;
        return 7;
    }

    private function countWords($text): int
    {
        // Simple word count for Arabic text
        return count(explode(' ', $text));
    }
}
