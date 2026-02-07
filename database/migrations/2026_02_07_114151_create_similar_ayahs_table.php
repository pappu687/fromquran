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
        Schema::create('similar_ayahs', function (Blueprint $table) {
            $table->text('verse_key');
            $table->text('matched_ayah_key');
            $table->integer('matched_words_count')->nullable();
            $table->integer('coverage')->nullable();
            $table->integer('score')->nullable();
            $table->text('match_words_range')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('similar_ayahs');
    }
};
