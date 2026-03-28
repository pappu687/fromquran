<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_view_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('collection_id');
            $table->string('event_key')->unique();
            $table->string('visitor_hash', 64);
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->string('session_id')->nullable();
            $table->timestamp('viewed_at');
            $table->timestamp('counted_at')->nullable();
            $table->boolean('is_bot')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('collection_id', 'cve_collection_idx');
            $table->index(
                ['collection_id', 'viewed_at'],
                'cve_collection_viewed_idx',
            );
            $table->index(
                ['collection_id', 'visitor_hash', 'viewed_at'],
                'cve_collection_visitor_viewed_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_view_events');
    }
};
