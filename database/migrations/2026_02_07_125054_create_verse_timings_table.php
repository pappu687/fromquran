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
        if (Schema::hasTable('verse_timings')) {
            return;
        }

        Schema::create('verse_timings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_audio_file_id');
            $table->string('verse_key')->comment('Format: chapter:verse, e.g., 1:1');
            $table->integer('timestamp_from')->comment('Start time in milliseconds');
            $table->integer('timestamp_to')->comment('End time in milliseconds');
            $table->integer('duration')->comment('Duration in milliseconds');
            $table->json('segments')->nullable()->comment('Word-level timing segments');
            $table->timestamps();

            // Indexes
            $table->index('chapter_audio_file_id');
            $table->index('verse_key');
            $table->index(['chapter_audio_file_id', 'verse_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verse_timings');
    }
};
