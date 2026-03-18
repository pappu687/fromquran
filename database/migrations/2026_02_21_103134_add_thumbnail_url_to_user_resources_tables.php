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
        if (Schema::hasTable('user_chapter_resources') && ! Schema::hasColumn('user_chapter_resources', 'thumbnail_url')) {
            Schema::table('user_chapter_resources', function (Blueprint $table) {
                $table->string('thumbnail_url')->nullable()->after('resource_url');
            });
        }

        if (Schema::hasTable('user_verse_resources') && ! Schema::hasColumn('user_verse_resources', 'thumbnail_url')) {
            Schema::table('user_verse_resources', function (Blueprint $table) {
                $table->string('thumbnail_url')->nullable()->after('resource_url');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_chapter_resources', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });

        Schema::table('user_verse_resources', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });
    }
};
