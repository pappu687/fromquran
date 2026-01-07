<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChapterInfo extends Model
{
    protected $table = 'surah_infos';

    protected $fillable = [
        'surah_number',
        'surah_name',
        'text',
        'short_text',
    ];
}
