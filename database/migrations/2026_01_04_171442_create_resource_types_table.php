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
        Schema::create('resource_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index('display_order');
        });

        // Insert default resource types from the existing enum
        DB::table('resource_types')->insert([
            [
                'slug' => 'youtube_tafseer',
                'name' => 'YouTube Tafseer',
                'display_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'podcast',
                'name' => 'Podcast',
                'display_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'article',
                'name' => 'Article',
                'display_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'shan_e_nuzul',
                'name' => 'Shan e Nuzul',
                'display_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'hadith',
                'name' => 'Related Hadith',
                'display_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'fiqh_ruling',
                'name' => 'Fiqh Ruling',
                'display_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'fatwa',
                'name' => 'Fatwa',
                'display_order' => 7,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'scholarly_commentary',
                'name' => 'Scholarly Commentary',
                'display_order' => 8,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'other',
                'name' => 'Other',
                'display_order' => 9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_types');
    }
};
