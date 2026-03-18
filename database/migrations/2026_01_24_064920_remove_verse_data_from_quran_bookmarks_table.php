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
        if (! Schema::hasTable('quran_bookmarks')) {
            return;
        }

        if (Schema::hasColumn('quran_bookmarks', 'verse_data')) {
            Schema::table('quran_bookmarks', function (Blueprint $table) {
                $table->dropColumn('verse_data');
            });
        }

        try {
            Schema::table('quran_bookmarks', function (Blueprint $table) {
                $table->dropUnique(['verse_id']);
            });
        } catch (\Throwable $e) {
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_bookmarks', function (Blueprint $table) {
            $table->json('verse_data')->nullable();
            $table->unique('verse_id');
        });
    }
};
