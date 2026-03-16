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
        Schema::create('words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verse_id');
            $table->foreignId('chapter_id');
            $table->integer('position');
            $table->string('text_uthmani');
            $table->string('text_indopak')->nullable();
            $table->string('text_imlaei_simple')->nullable();
            $table->string('verse_key');
            $table->integer('page_number');
            $table->string('class_name')->nullable();
            $table->integer('line_number');
            $table->integer('code_dec');
            $table->string('code_hex');
            $table->string('code_hex_v3')->nullable();
            $table->integer('code_dec_v3')->nullable();
            $table->foreignId('char_type_id')->nullable();
            $table->string('pause_name')->nullable();
            $table->string('audio_url')->nullable();
            $table->text('image_blob')->nullable();
            $table->string('image_url')->nullable();
            $table->foreignId('token_id')->nullable();
            $table->foreignId('topic_id')->nullable();
            $table->string('location')->nullable();
            $table->string('char_type_name')->nullable();
            $table->string('text_imlaei')->nullable();
            $table->string('text_uthmani_simple')->nullable();
            $table->string('text_uthmani_tajweed')->nullable();
            $table->string('en_transliteration')->nullable();
            $table->string('code_v1')->nullable();
            $table->string('code_v2')->nullable();
            $table->integer('v2_page')->nullable();
            $table->integer('line_v2')->nullable();
            $table->string('text_qpc_hafs')->nullable();
            $table->string('text_indopak_nastaleeq')->nullable();
            $table->string('text_qpc_nastaleeq')->nullable();
            $table->string('text_qpc_nastaleeq_hafs')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('verse_id');
            $table->index('chapter_id');
            $table->index('position');
            $table->index('verse_key');
            $table->index('char_type_id');
            $table->index('token_id');
            $table->index('topic_id');
            $table->index('location');
            $table->index('page_number');

            // Unique constraint for verse and position combination
            $table->unique(['verse_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('words');
    }
};