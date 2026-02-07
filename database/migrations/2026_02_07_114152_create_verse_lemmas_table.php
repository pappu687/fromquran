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
        Schema::create('verse_lemmas', function (Blueprint $table) {
            $table->id();
            $table->string('text_madani', 255)->nullable()->collation('utf8mb4_general_ci');
            $table->string('text_clean', 255)->nullable()->collation('utf8mb4_general_ci');
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verse_lemmas');
    }
};
