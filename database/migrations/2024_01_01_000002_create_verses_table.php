<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('verses')) {
            return;
        }

        Schema::create('verses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id');
            $table->integer('verse_number');
            $table->integer('verse_index')->unique();
            $table->string('verse_key'); // Format: "1:1" for chapter:verse
            $table->text('text_uthmani');
            $table->text('text_indopak')->nullable();
            $table->text('text_imlaei_simple')->nullable();
            $table->integer('juz_number');
            $table->integer('hizb_number');
            $table->integer('rub_el_hizb_number');
            $table->string('sajdah_type')->nullable(); // 'recommended' or 'obligatory'
            $table->integer('sajdah_number')->nullable();
            $table->integer('page_number');
            $table->text('image_url')->nullable();
            $table->integer('image_width')->nullable();
            $table->foreignId('verse_root_id')->nullable();
            $table->foreignId('verse_lemma_id')->nullable();
            $table->foreignId('verse_stem_id')->nullable();
            $table->text('text_imlaei')->nullable();
            $table->text('text_uthmani_simple')->nullable();
            $table->text('text_uthmani_tajweed')->nullable();
            $table->string('code_v1')->nullable();
            $table->string('code_v2')->nullable();
            $table->integer('v2_page')->nullable();
            $table->text('text_qpc_hafs')->nullable();
            $table->integer('words_count')->default(0);
            $table->text('text_indopak_nastaleeq')->nullable();
            $table->integer('pause_words_count')->default(0);
            $table->json('mushaf_pages_mapping')->default('{}');
            $table->text('text_qpc_nastaleeq')->nullable();
            $table->integer('ruku_number');
            $table->integer('surah_ruku_number');
            $table->integer('manzil_number');
            $table->text('text_qpc_nastaleeq_hafs')->nullable();
            $table->json('mushaf_juzs_mapping')->default('{}');
            $table->timestamps();

            // Indexes
            $table->index('chapter_id');
            $table->index(['chapter_id', 'verse_number']);
            $table->index('verse_index');
            $table->index('verse_key');
            $table->index('juz_number');
            $table->index('hizb_number');
            $table->index('rub_el_hizb_number');
            $table->index('ruku_number');
            $table->index('manzil_number');
            $table->index('page_number');
            $table->index('words_count');

            // Unique constraint for chapter and verse combination
            $table->unique(['chapter_id', 'verse_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verses');
    }
};
