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
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->boolean('bismillah_pre')->default(true);
            $table->integer('revelation_order');
            $table->string('revelation_place'); // 'meccan' or 'medinan'
            $table->string('name_complex');
            $table->string('name_arabic');
            $table->string('name_roman')->nullable();
            $table->string('name_simple');
            $table->string('pages')->nullable();
            $table->integer('verses_count');
            $table->integer('chapter_number')->unique();
            $table->integer('rukus_count')->nullable();
            $table->integer('hizbs_count')->nullable();
            $table->integer('rub_el_hizbs_count')->nullable();
            $table->timestamps();

            $table->index('chapter_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};