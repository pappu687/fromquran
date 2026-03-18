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
        if (Schema::hasTable('hizbs')) {
            return;
        }

        Schema::create('hizbs', function (Blueprint $table) {
            $table->id();
            $table->integer('hizb_number')->unique();
            $table->jsonb('verse_mapping');
            $table->foreignId('first_verse_id');
            $table->foreignId('last_verse_id');
            $table->integer('verses_count');
            $table->timestamps();

            // Indexes
            $table->index('hizb_number');
            $table->index(['first_verse_id', 'last_verse_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hizbs');
    }
};
