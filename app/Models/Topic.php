<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    protected $table = 'topics';

    protected $primaryKey = 'topic_id';

    public $incrementing = true;

    protected $fillable = [
        'name',
        'arabic_name',
        'parent_id',
        'thematic_parent_id',
        'ontology_parent_id',
        'description',
        'wiki_link',
        'thematic',
        'ontology',
        'ayahs',
        'related_topics',
    ];

    protected $casts = [
        'parent_id' => 'integer',
        'thematic_parent_id' => 'integer',
        'ontology_parent_id' => 'integer',
        'thematic' => 'boolean',
        'ontology' => 'boolean',
    ];

    /**
     * Get the parent topic.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'parent_id', 'topic_id');
    }

    /**
     * Get the children topics.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Topic::class, 'parent_id', 'topic_id');
    }

    /**
     * Get the thematic parent topic.
     */
    public function thematicParent(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'thematic_parent_id', 'topic_id');
    }

    /**
     * Get the ontology parent topic.
     */
    public function ontologyParent(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'ontology_parent_id', 'topic_id');
    }

    /**
     * Scope a query to only include root topics.
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope a query to find topics containing a specific verse.
     * Matches exact verse key to avoid partial matches (e.g., "2:7" shouldn't match "2:78")
     */
    public function scopeForVerse($query, string $verseKey)
    {
        // Use REGEXP to match exact verse key with boundaries
        // Matches: "verse_key," or ",verse_key," or ",verse_key" or "verse_key" alone
        // The pattern ensures exact matching with comma as delimiter
        $escapedKey = preg_quote($verseKey, '/');
        return $query->whereRaw("ayahs REGEXP ?", ["(^|,){$escapedKey}(,|$)"]);
    }

    /**
     * Parse the ayahs field into an array of verse keys.
     */
    public function getVerseKeys(): array
    {
        if (!$this->ayahs) {
            return [];
        }

        $ayahs = trim($this->ayahs, ",'");
        if (empty($ayahs)) {
            return [];
        }

        $verseKeys = array_map('trim', explode(',', $ayahs));
        return array_unique(array_filter($verseKeys));
    }

    /**
     * Get related topic IDs.
     */
    public function getRelatedTopicIds(): array
    {
        if (!$this->related_topics) {
            return [];
        }

        $topics = trim($this->related_topics, ",'");
        if (empty($topics)) {
            return [];
        }

        $topicIds = array_map('intval', array_filter(explode(',', $topics)));
        return array_unique($topicIds);
    }

    /**
     * Get verses for this topic with pagination.
     */
    public function getVersesPaginated(int $page = 1, int $limit = 10)
    {
        $verseKeys = $this->getVerseKeys();

        if (empty($verseKeys)) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $limit,
                'total' => 0,
            ];
        }

        // Parse verse keys to get chapter and verse numbers
        $parsed = [];
        foreach ($verseKeys as $key) {
            $parts = explode(':', $key);
            if (count($parts) === 2) {
                $parsed[] = [
                    'chapter' => (int) $parts[0],
                    'verse' => (int) $parts[1],
                    'verse_key' => $key,
                ];
            }
        }

        // Sort by chapter and verse number
        usort($parsed, function ($a, $b) {
            if ($a['chapter'] !== $b['chapter']) {
                return $a['chapter'] - $b['chapter'];
            }
            return $a['verse'] - $b['verse'];
        });

        $total = count($parsed);
        $lastPage = (int) ceil($total / $limit);
        $offset = ($page - 1) * $limit;

        $paged = array_slice($parsed, $offset, $limit);

        // Fetch verses from database
        $verses = [];
        foreach ($paged as $item) {
            $verse = Verse::with(['chapter:id,chapter_number,name_simple,name_roman', 'translations' => function ($query) {
                $query->whereHas('language', function ($q) {
                    $q->where('iso_code', 'en');
                })->orderBy('priority', 'desc');
            }])
                ->where('chapter_id', $item['chapter'])
                ->where('verse_number', $item['verse'])
                ->first();

            if ($verse) {
                $verses[] = [
                    'id' => $verse->id,
                    'verse_key' => $verse->verse_key,
                    'verse_number' => $verse->verse_number,
                    'chapter_id' => $verse->chapter_id,
                    'chapter_number' => $verse->chapter->chapter_number,
                    'chapter_name' => $verse->chapter->name_simple,
                    'chapter_name_roman' => $verse->chapter->name_roman,
                    'text_uthmani' => $verse->text_uthmani,
                    'translation' => $verse->translations->first()?->text,
                ];
            }
        }

        return [
            'data' => $verses,
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $limit,
            'total' => $total,
        ];
    }
}
