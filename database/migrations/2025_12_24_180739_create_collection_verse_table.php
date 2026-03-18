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
        if (Schema::hasTable('collection_verse')) {
            return;
        }

        Schema::create('collection_verse', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id');
            $table->foreignId('verse_id');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->unique(['collection_id', 'verse_id']);
            $table->index(['collection_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_verse');
    }
};
