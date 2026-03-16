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
        Schema::create('resource_contents', function (Blueprint $table) {
            $table->id();
            $table->boolean('approved')->default(false);
            $table->foreignId('author_id')->nullable();
            $table->foreignId('data_source_id')->nullable();
            $table->string('author_name')->nullable();
            $table->string('resource_type_name');
            $table->string('sub_type');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('cardinality_type')->default('1_ayah');
            $table->foreignId('language_id');
            $table->string('language_name');
            $table->string('slug')->unique();
            $table->foreignId('mobile_translation_id')->nullable();
            $table->integer('priority')->default(0);
            $table->text('resource_info')->nullable();
            $table->string('resource_id')->nullable();
            $table->jsonb('meta_data')->default('{}');
            $table->string('resource_type');
            $table->string('sqlite_db')->nullable();
            $table->timestamp('sqlite_db_generated_at')->nullable();
            $table->integer('records_count')->default(0);
            $table->integer('permission_to_host')->default(0);
            $table->integer('permission_to_share')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('approved');
            $table->index('author_id');
            $table->index('cardinality_type');
            $table->index('data_source_id');
            $table->index('language_id');
            $table->index('meta_data'); // GIN index for PostgreSQL
            $table->index('mobile_translation_id');
            $table->index('priority');
            $table->index('resource_id');
            $table->index('resource_type_name');
            $table->index('sub_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_contents');
    }
};