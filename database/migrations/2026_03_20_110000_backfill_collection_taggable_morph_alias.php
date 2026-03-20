<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('taggables')) {
            return;
        }

        DB::table('taggables')
            ->where('taggable_type', 'App\\Models\\Collection')
            ->update(['taggable_type' => 'collection']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('taggables')) {
            return;
        }

        DB::table('taggables')
            ->where('taggable_type', 'collection')
            ->update(['taggable_type' => 'App\\Models\\Collection']);
    }
};
