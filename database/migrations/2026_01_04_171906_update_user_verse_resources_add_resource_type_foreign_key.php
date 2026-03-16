<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new column for foreign key
        Schema::table('user_verse_resources', function (Blueprint $table) {
            $table->unsignedBigInteger('resource_type_id')->nullable();
        });

        // Map existing enum values to resource_type_id
        $types = [
            'youtube_tafseer' => 1,
            'podcast' => 2,
            'article' => 3,
            'shan_e_nuzul' => 4,
            'hadith' => 5,
            'fiqh_ruling' => 6,
            'fatwa' => 7,
            'scholarly_commentary' => 8,
            'other' => 9,
        ];

        foreach ($types as $enumValue => $typeId) {
            DB::table('user_verse_resources')
                ->where('resource_type', $enumValue)
                ->update(['resource_type_id' => $typeId]);
        }

        // Set any remaining NULL values to 'other' (id 9)
        DB::table('user_verse_resources')
            ->whereNull('resource_type_id')
            ->update(['resource_type_id' => 9]);

        // Use raw SQL to make column NOT NULL (SQLite compatible)
        DB::statement('
            CREATE TABLE user_verse_resources_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id INTEGER NOT NULL,
                verse_id INTEGER NOT NULL,
                resource_type_id INTEGER NOT NULL,
                resource_url VARCHAR NOT NULL,
                comment TEXT,
                status VARCHAR NOT NULL DEFAULT "pending",
                created_at DATETIME,
                updated_at DATETIME
            )
        ');

        DB::statement('
            INSERT INTO user_verse_resources_new (id, user_id, verse_id, resource_type_id, resource_url, comment, status, created_at, updated_at)
            SELECT id, user_id, verse_id, resource_type_id, resource_url, comment, status, created_at, updated_at
            FROM user_verse_resources
        ');

        DB::statement('DROP TABLE user_verse_resources');
        DB::statement('ALTER TABLE user_verse_resources_new RENAME TO user_verse_resources');

        // Recreate indexes
        DB::statement('CREATE INDEX user_verse_resources_verse_id_status_index ON user_verse_resources (verse_id, status)');
        DB::statement('CREATE INDEX user_verse_resources_user_id_status_index ON user_verse_resources (user_id, status)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create the old table structure with enum
        DB::statement('
            CREATE TABLE user_verse_resources_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id INTEGER NOT NULL,
                verse_id INTEGER NOT NULL,
                resource_type VARCHAR NOT NULL CHECK(resource_type IN (
                    "youtube_tafseer", "podcast", "article", "shan_e_nuzul",
                    "hadith", "fiqh_ruling", "fatwa", "scholarly_commentary", "other"
                )),
                resource_url VARCHAR NOT NULL,
                comment TEXT,
                status VARCHAR NOT NULL DEFAULT "pending" CHECK(status IN ("pending", "approved", "rejected")),
                created_at DATETIME,
                updated_at DATETIME
            )
        ');

        // Map resource_type_id back to enum values
        $types = [
            1 => 'youtube_tafseer',
            2 => 'podcast',
            3 => 'article',
            4 => 'shan_e_nuzul',
            5 => 'hadith',
            6 => 'fiqh_ruling',
            7 => 'fatwa',
            8 => 'scholarly_commentary',
            9 => 'other',
        ];

        foreach ($types as $typeId => $enumValue) {
            DB::statement("
                INSERT INTO user_verse_resources_new (id, user_id, verse_id, resource_type, resource_url, comment, status, created_at, updated_at)
                SELECT id, user_id, verse_id, '{$enumValue}', resource_url, comment, status, created_at, updated_at
                FROM user_verse_resources
                WHERE resource_type_id = {$typeId}
            ");
        }

        DB::statement('DROP TABLE user_verse_resources');
        DB::statement('ALTER TABLE user_verse_resources_new RENAME TO user_verse_resources');

        // Recreate indexes
        DB::statement('CREATE INDEX user_verse_resources_verse_id_status_index ON user_verse_resources (verse_id, status)');
        DB::statement('CREATE INDEX user_verse_resources_user_id_status_index ON user_verse_resources (user_id, status)');
    }
};
