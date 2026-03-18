<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $database = DB::getDatabaseName();

        $foreignKeys = DB::select(
            '
                SELECT TABLE_NAME, CONSTRAINT_NAME
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_TYPE = ?
                  AND TABLE_SCHEMA = ?
            ',
            ['FOREIGN KEY', $database]
        );

        foreach ($foreignKeys as $foreignKey) {
            DB::statement(
                sprintf(
                    'ALTER TABLE `%s` DROP FOREIGN KEY `%s`',
                    $foreignKey->TABLE_NAME,
                    $foreignKey->CONSTRAINT_NAME
                )
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Foreign keys are intentionally not recreated.
    }
};
