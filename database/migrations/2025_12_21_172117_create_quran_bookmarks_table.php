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
        Schema::create('quran_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->integer('chapter_id');
            $table->integer('verse_number');
            $table->string('verse_id')->unique(); // Unique identifier for the verse
            $table->json('verse_data')->nullable(); // Store verse details
            $table->text('notes')->nullable(); // User's personal notes
            $table->string('edition', 20)->default('en.sahih'); // Translation edition
            $table->timestamps();

            // Indexes for better performance
            $table->index(['user_id', 'chapter_id']);
            $table->index(['user_id', 'verse_id']);
            $table->unique(['user_id', 'verse_id', 'edition'], 'user_verse_edition_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_bookmarks');
    }
};
