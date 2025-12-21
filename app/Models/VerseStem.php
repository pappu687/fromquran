<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerseStem extends Model
{
    use HasFactory;

    protected $fillable = [
        'text_madani',
        'text_clean',
    ];
}