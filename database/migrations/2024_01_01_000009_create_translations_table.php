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
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('language_id');
            $table->text('text');
            $table->foreignId('resource_content_id');
            $table->foreignId('verse_id');
            $table->string('language_name');
            $table->string('resource_name')->nullable();
            $table->integer('priority')->default(0);
            $table->string('verse_key');
            $table->foreignId('chapter_id');
            $table->integer('verse_number');
            $table->integer('juz_number');
            $table->integer('hizb_number');
            $table->integer('rub_el_hizb_number');
            $table->integer('page_number');
            $table->integer('ruku_number');
            $table->integer('surah_ruku_number');
            $table->integer('manzil_number');
            $table->timestamps();

            // Indexes
            $table->index('language_id');
            $table->index('resource_content_id');
            $table->index('verse_id');
            $table->index('priority');
            $table->index('verse_key');
            $table->index('chapter_id');
            $table->index(['chapter_id', 'verse_number']);
            $table->index('juz_number');
            $table->index('hizb_number');
            $table->index('rub_el_hizb_number');
            $table->index('page_number');
            $table->index('ruku_number');
            $table->index('manzil_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};