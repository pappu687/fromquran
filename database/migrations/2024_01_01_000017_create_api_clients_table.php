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
        if (Schema::hasTable('api_clients')) {
            return;
        }

        Schema::create('api_clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('api_key')->unique();
            $table->string('kalimat_api_key')->nullable();
            $table->boolean('internal_api')->default(false);
            $table->boolean('active')->default(true);
            $table->integer('request_quota')->nullable();
            $table->integer('requests_count')->default(0);
            $table->integer('current_period_requests_count')->default(0);
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('active');
            $table->index('api_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_clients');
    }
};
