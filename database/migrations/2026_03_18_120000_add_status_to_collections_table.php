<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('collections') || Schema::hasColumn('collections', 'status')) {
            return;
        }

        Schema::table('collections', function (Blueprint $table) {
            $table->string('status')->default('approved')->after('is_public');
            $table->index(['status', 'is_public']);
        });

        DB::table('collections')
            ->whereNull('status')
            ->update(['status' => 'approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropIndex(['status', 'is_public']);
            $table->dropColumn('status');
        });
    }
};
