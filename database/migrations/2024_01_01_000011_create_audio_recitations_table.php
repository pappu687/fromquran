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
        Schema::create('audio_recitations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('arabic_name')->nullable();
            $table->string('relative_path')->nullable();
            $table->string('format')->nullable();
            $table->foreignId('section_id')->nullable();
            $table->text('description')->nullable();
            $table->integer('files_count')->default(0);
            $table->foreignId('resource_content_id')->nullable();
            $table->foreignId('recitation_style_id')->nullable();
            $table->foreignId('reciter_id')->nullable();
            $table->boolean('approved')->default(false);
            $table->integer('home')->default(0);
            $table->integer('priority')->default(0);
            $table->integer('segments_count')->default(0);
            $table->float('files_size')->nullable();
            $table->foreignId('qirat_type_id')->nullable();
            $table->boolean('segment_locked')->default(false);
            $table->timestamps();

            // Indexes
            $table->index('approved');
            $table->index('name');
            $table->index('priority');
            $table->index('recitation_style_id');
            $table->index('reciter_id');
            $table->index('relative_path');
            $table->index('resource_content_id');
            $table->index('section_id');
            $table->index('qirat_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio_recitations');
    }
};