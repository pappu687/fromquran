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
        Schema::create('audio_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audio_file_id')->constrained()->onDelete('cascade');
            $table->foreignId('audio_recitation_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
            $table->foreignId('verse_id')->constrained()->onDelete('cascade');
            $table->string('verse_key');
            $table->integer('verse_number');
            $table->integer('timestamp_from');
            $table->integer('timestamp_to');
            $table->integer('timestamp_median');
            $table->jsonb('segments')->default('[]');
            $table->integer('duration');
            $table->integer('duration_ms');
            $table->float('percentile');
            $table->integer('silent_duration')->default(0);
            $table->jsonb('relative_segments')->default('[]');
            $table->integer('relative_silent_duration')->default(0);
            $table->timestamps();

            // Indexes
            $table->unique(['audio_file_id', 'verse_number']);
            $table->index('audio_file_id');
            $table->index('audio_recitation_id');
            $table->index('chapter_id');
            $table->index('verse_id');
            $table->index('verse_number');
            $table->index(['audio_recitation_id', 'chapter_id', 'verse_id', 'timestamp_median']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio_segments');
    }
};