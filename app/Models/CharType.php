<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CharType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parent_id',
        'description',
    ];

    protected $casts = [
        'parent_id' => 'integer',
    ];

    /**
     * Get the parent char type.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(CharType::class, 'parent_id');
    }

    /**
     * Get the child char types.
     */
    public function children(): HasMany
    {
        return $this->hasMany(CharType::class, 'parent_id');
    }

    /**
     * Get the words with this char type.
     */
    public function words(): HasMany
    {
        return $this->hasMany(Word::class);
    }

    /**
     * Scope a query to only include root char types.
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope a query to only include child char types.
     */
    public function scopeChild($query)
    {
        return $query->whereNotNull('parent_id');
    }

    /**
     * Check if char type is root.
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Check if char type has children.
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Get char type hierarchy path.
     */
    public function getHierarchyPath(): string
    {
        if ($this->isRoot()) {
            return $this->name;
        }

        $parent = $this->parent;
        if ($parent) {
            return $parent->getHierarchyPath() . ' > ' . $this->name;
        }

        return $this->name;
    }

    /**
     * Get all descendant char types.
     */
    public function getAllDescendants()
    {
        $descendants = collect();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }

        return $descendants;
    }

    /**
     * Get total words count including children.
     */
    public function getTotalWordsCount(): int
    {
        $count = $this->words()->count();

        foreach ($this->children as $child) {
            $count += $child->getTotalWordsCount();
        }

        return $count;
    }
}