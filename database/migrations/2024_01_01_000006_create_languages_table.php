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
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('iso_code')->unique();
            $table->string('native_name');
            $table->string('direction')->default('ltr'); // 'ltr' or 'rtl'
            $table->string('es_analyzer_default')->nullable();
            $table->string('es_indexes')->nullable();
            $table->integer('translations_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('translations_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};