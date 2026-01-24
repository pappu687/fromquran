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
        Schema::table('quran_bookmarks', function (Blueprint $table) {
            $table->dropColumn('verse_data');

            // Remove the global unique constraint on verse_id if it exists
            // Laravel naming convention for unique index: table_column_unique
            $table->dropUnique(['verse_id']);
        });
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
