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
        Schema::create('audio_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verse_id')->constrained()->onDelete('cascade');
            $table->text('url');
            $table->integer('duration')->nullable();
            $table->text('segments')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('format')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->foreignId('recitation_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('verse_key');
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
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
            $table->index('verse_id');
            $table->index('chapter_id');
            $table->index(['chapter_id', 'verse_number']);
            $table->index('juz_number');
            $table->index('hizb_number');
            $table->index('rub_el_hizb_number');
            $table->index('page_number');
            $table->index('ruku_number');
            $table->index('surah_ruku_number');
            $table->index('manzil_number');
            $table->index('recitation_id');
            $table->index('verse_key');
            $table->index('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio_files');
    }
};