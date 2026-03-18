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
        if (Schema::hasTable('tafsir')) {
            return;
        }

        Schema::create('tafsir', function (Blueprint $table) {
            $table->smallInteger('tafsir_id');
            $table->text('ayah_key')->nullable();
            $table->text('group_ayah_key')->nullable();
            $table->text('from_ayah')->nullable();
            $table->text('to_ayah')->nullable();
            $table->text('ayah_keys')->nullable();
            $table->text('text')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tafsir');
    }
};
