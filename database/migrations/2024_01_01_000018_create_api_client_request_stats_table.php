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
        if (Schema::hasTable('api_client_request_stats')) {
            return;
        }

        Schema::create('api_client_request_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_client_id');
            $table->date('date');
            $table->integer('requests_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('api_client_id');
            $table->index('date');

            // Unique constraint for client and date
            $table->unique(['api_client_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_client_request_stats');
    }
};
