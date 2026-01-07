<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserChapterResource extends Model
{
    protected $fillable = [
        'user_id',
        'chapter_id',
        'resource_type_id',
        'resource_url',
        'comment',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    public function resourceType()
    {
        return $this->belongsTo(ResourceType::class);
    }
}
