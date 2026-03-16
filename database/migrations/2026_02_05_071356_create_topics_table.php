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
        Schema::create('topics', function (Blueprint $table) {
            $table->id('topic_id');
            $table->text('name');
            $table->text('arabic_name')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('thematic_parent_id')->nullable();
            $table->unsignedBigInteger('ontology_parent_id')->nullable();
            $table->text('description')->nullable();
            $table->text('wiki_link')->nullable();
            $table->boolean('thematic')->default(false);
            $table->boolean('ontology')->default(false);
            $table->text('ayahs')->nullable();
            $table->text('related_topics')->nullable();


            $table->index('parent_id');
            $table->index('thematic_parent_id');
            $table->index('ontology_parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topics');
    }
};
