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
        Schema::create('user_audio_preferences', function (Blueprint $table) {
            $table->id();
            $table->integer('user_id');
            $table->integer('reciter_id')->nullable();
            $table->integer('audio_recitation_id')->nullable();
            $table->boolean('autoplay')->default(true);
            $table->boolean('repeat_verse')->default(false);
            $table->boolean('repeat_chapter')->default(false);
            $table->timestamps();



            // Indexes
            $table->unique('user_id');
            $table->index('reciter_id');
            $table->index('audio_recitation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_audio_preferences');
    }
};
