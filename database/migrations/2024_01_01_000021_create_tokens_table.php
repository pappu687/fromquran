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
        Schema::create('tokens', function (Blueprint $table) {
            $table->id();
            $table->string('text_uthmani');
            $table->string('text_imlaei_simple')->nullable();
            $table->string('text_indopak')->nullable();
            $table->string('text_imlaei')->nullable();
            $table->string('text_uthmani_tajweed')->nullable();
            $table->text('text')->nullable();
            $table->foreignId('resource_content_id')->nullable();
            $table->integer('record_id')->nullable();
            $table->string('record_type')->nullable();
            $table->integer('uniq_token_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index(['record_type', 'record_id']);
            $table->index('resource_content_id');
            $table->index('text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tokens');
    }
};