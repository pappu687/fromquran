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
        Schema::create('verse_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->foreignId('verse_id')->index();
            $table->unsignedInteger('start_offset');
            $table->unsignedInteger('end_offset');
            $table->text('selected_text');
            $table->text('note');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'verse_id'], 'verse_annotations_user_verse_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verse_annotations');
    }
};
