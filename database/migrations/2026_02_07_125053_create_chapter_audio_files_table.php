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
        Schema::create('chapter_audio_files', function (Blueprint $table) {
            $table->id();
            $table->integer('chapter_id');
            $table->integer('reciter_id')->nullable();
            $table->integer('audio_recitation_id')->nullable();
            $table->string('audio_url');
            $table->integer('duration')->nullable()->comment('Duration in milliseconds');
            $table->decimal('file_size', 8, 2)->nullable()->comment('File size in MB');
            $table->string('format')->default('mp3');
            $table->string('mime_type')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamps();

            // Foreign keys
            $table->foreign('chapter_id')->references('id')->on('chapters')->onDelete('cascade');
            $table->foreign('reciter_id')->references('id')->on('reciters')->onDelete('set null');
            $table->foreign('audio_recitation_id')->references('id')->on('audio_recitations')->onDelete('set null');

            // Indexes
            $table->index('chapter_id');
            $table->index('reciter_id');
            $table->index('audio_recitation_id');
            $table->index(['chapter_id', 'reciter_id']);
            $table->index('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapter_audio_files');
    }
};
