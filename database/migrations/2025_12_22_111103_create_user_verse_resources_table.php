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
        if (Schema::hasTable('user_verse_resources')) {
            return;
        }

        Schema::create('user_verse_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('verse_id');
            $table->foreignId('resource_type_id');
            $table->string('resource_url');
            $table->text('resource_title')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->text('comment')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['verse_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_verse_resources');
    }
};
