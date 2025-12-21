<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResourceContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'approved',
        'author_id',
        'data_source_id',
        'author_name',
        'resource_type_name',
        'sub_type',
        'name',
        'description',
        'cardinality_type',
        'language_id',
        'language_name',
        'slug',
        'mobile_translation_id',
        'priority',
        'resource_info',
        'resource_id',
        'meta_data',
        'resource_type',
        'sqlite_db',
        'sqlite_db_generated_at',
        'records_count',
        'permission_to_host',
        'permission_to_share',
    ];

    protected $casts = [
        'approved' => 'boolean',
        'priority' => 'integer',
        'records_count' => 'integer',
        'permission_to_host' => 'integer',
        'permission_to_share' => 'integer',
        'meta_data' => 'array',
        'sqlite_db_generated_at' => 'datetime',
    ];

    /**
     * Get the author that owns the resource content.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * Get the data source that owns the resource content.
     */
    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class);
    }

    /**
     * Get the language that owns the resource content.
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    /**
     * Get the mobile translation that owns the resource content.
     */
    public function mobileTranslation(): BelongsTo
    {
        return $this->belongsTo(ResourceContent::class, 'mobile_translation_id');
    }

    /**
     * Get the translations for the resource content.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class);
    }

    /**
     * Get the tafsirs for the resource content.
     */
    public function tafsirs(): HasMany
    {
        return $this->hasMany(Tafsir::class);
    }

    /**
     * Get the chapter infos for the resource content.
     */
    public function chapterInfos(): HasMany
    {
        return $this->hasMany(ChapterInfo::class);
    }

    /**
     * Scope a query to only include approved resources.
     */
    public function scopeApproved($query)
    {
        return $query->where('approved', true);
    }

    /**
     * Scope a query to filter by resource type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('resource_type', $type);
    }

    /**
     * Scope a query to filter by sub type.
     */
    public function scopeBySubType($query, $subType)
    {
        return $query->where('sub_type', $subType);
    }

    /**
     * Scope a query to filter by language.
     */
    public function scopeByLanguage($query, $languageCode)
    {
        return $query->whereHas('language', function ($q) use ($languageCode) {
            $q->where('iso_code', $languageCode);
        });
    }

    /**
     * Check if resource can be hosted.
     */
    public function canBeHosted(): bool
    {
        return $this->permission_to_host > 0;
    }

    /**
     * Check if resource can be shared.
     */
    public function canBeShared(): bool
    {
        return $this->permission_to_share > 0;
    }

    /**
     * Get meta data value.
     */
    public function getMetaData($key, $default = null)
    {
        return data_get($this->meta_data, $key, $default);
    }

    /**
     * Set meta data value.
     */
    public function setMetaData($key, $value)
    {
        $metaData = $this->meta_data ?? [];
        data_set($metaData, $key, $value);
        $this->meta_data = $metaData;
    }
}