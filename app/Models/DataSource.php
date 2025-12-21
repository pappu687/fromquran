<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
    ];

    /**
     * Get the resource contents for the data source.
     */
    public function resourceContents(): HasMany
    {
        return $this->hasMany(ResourceContent::class);
    }

    /**
     * Get approved resource contents for the data source.
     */
    public function approvedResourceContents(): HasMany
    {
        return $this->hasMany(ResourceContent::class)->where('approved', true);
    }

    /**
     * Get resource contents count by type.
     */
    public function getResourceContentsCountByType($resourceType): int
    {
        return $this->resourceContents()
            ->where('resource_type', $resourceType)
            ->where('approved', true)
            ->count();
    }

    /**
     * Get total approved resource contents.
     */
    public function getTotalApprovedResourceContents(): int
    {
        return $this->approvedResourceContents()->count();
    }

    /**
     * Get data source URL.
     */
    public function getUrl(): string
    {
        return $this->url ?? '';
    }

    /**
     * Check if data source has URL.
     */
    public function hasUrl(): bool
    {
        return !empty($this->url);
    }
}