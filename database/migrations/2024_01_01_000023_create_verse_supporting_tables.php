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
        // Create verse_roots table
        Schema::create('verse_roots', function (Blueprint $table) {
            $table->id();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Create verse_lemmas table
        Schema::create('verse_lemmas', function (Blueprint $table) {
            $table->id();
            $table->string('text_madani')->nullable();
            $table->string('text_clean')->nullable();
            $table->timestamps();
        });

        // Create verse_stems table
        Schema::create('verse_stems', function (Blueprint $table) {
            $table->id();
            $table->string('text_madani')->nullable();
            $table->string('text_clean')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verse_roots');
        Schema::dropIfExists('verse_lemmas');
        Schema::dropIfExists('verse_stems');
    }
};