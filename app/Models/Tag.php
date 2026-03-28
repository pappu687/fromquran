<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tag extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'color',
        'status',
    ];

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::saving(function (Tag $tag) {
            $normalizedName = preg_replace('/\s+/', ' ', trim($tag->name));
            $tag->name = $normalizedName ?: $tag->name;
            $tag->type = Str::lower(trim($tag->type ?: 'general'));
            $tag->slug = Str::slug($tag->slug ?: $tag->name);
        });
    }

    /**
     * Scope active tags.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Get collections using this tag.
     */
    public function collections(): MorphToMany
    {
        return $this->morphedByMany(Collection::class, 'taggable')
            ->withPivot('display_order')
            ->withTimestamps();
    }
}
