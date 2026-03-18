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
        if (Schema::hasTable('roots')) {
            return;
        }

        Schema::create('roots', function (Blueprint $table) {
            $table->id();
            $table->string('value');
            $table->string('text_clean')->nullable();
            $table->string('text_uthmani')->nullable();
            $table->string('english_trilateral')->nullable();
            $table->string('arabic_trilateral')->nullable();
            $table->jsonb('en_translations')->default('[]');
            $table->jsonb('ur_translations')->default('[]');
            $table->string('dictionary_image_path')->nullable();
            $table->integer('words_count')->default(0);
            $table->integer('uniq_words_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('arabic_trilateral');
            $table->index('english_trilateral');
            $table->index('text_clean');
            $table->index('text_uthmani');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roots');
    }
};
