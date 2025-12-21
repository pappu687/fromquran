<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Word extends Model
{
    use HasFactory;

    protected $fillable = [
        'verse_id',
        'chapter_id',
        'position',
        'text_uthmani',
        'text_indopak',
        'text_imlaei_simple',
        'verse_key',
        'page_number',
        'class_name',
        'line_number',
        'code_dec',
        'code_hex',
        'code_hex_v3',
        'code_dec_v3',
        'char_type_id',
        'pause_name',
        'audio_url',
        'image_blob',
        'image_url',
        'token_id',
        'topic_id',
        'location',
        'char_type_name',
        'text_imlaei',
        'text_uthmani_simple',
        'text_uthmani_tajweed',
        'en_transliteration',
        'code_v1',
        'code_v2',
        'v2_page',
        'line_v2',
        'text_qpc_hafs',
        'text_indopak_nastaleeq',
        'text_qpc_nastaleeq',
        'text_qpc_nastaleeq_hafs',
    ];

    protected $casts = [
        'position' => 'integer',
        'page_number' => 'integer',
        'line_number' => 'integer',
        'code_dec' => 'integer',
        'code_dec_v3' => 'integer',
        'v2_page' => 'integer',
        'line_v2' => 'integer',
    ];

    /**
     * Get the verse that owns the word.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }

    /**
     * Get the chapter that owns the word.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the char type that owns the word.
     */
    public function charType(): BelongsTo
    {
        return $this->belongsTo(CharType::class);
    }

    /**
     * Get the token that owns the word.
     */
    public function token(): BelongsTo
    {
        return $this->belongsTo(Token::class);
    }

    /**
     * Get the topic that owns the word.
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Get the translations for the word.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(WordTranslation::class);
    }

    /**
     * Get the morphology data for the word.
     */
    public function morphology(): HasMany
    {
        return $this->hasMany(MorphologyWord::class);
    }

    /**
     * Get the transliterations for the word.
     */
    public function transliterations(): HasMany
    {
        return $this->hasMany(WordTransliteration::class);
    }

    /**
     * Get word translation in specific language.
     */
    public function getTranslation($languageCode)
    {
        return $this->translations()
            ->whereHas('language', function ($q) use ($languageCode) {
                $q->where('iso_code', $languageCode);
            })
            ->join('resource_contents', 'word_translations.resource_content_id', '=', 'resource_contents.id')
            ->orderBy('resource_contents.priority')
            ->first();
    }

    /**
     * Check if word has pause.
     */
    public function hasPause(): bool
    {
        return !is_null($this->pause_name);
    }

    /**
     * Get word text for specific script.
     */
    public function getText($script = 'uthmani'): string
    {
        $scriptField = "text_{$script}";

        if (isset($this->$scriptField) && !empty($this->$scriptField)) {
            return $this->$scriptField;
        }

        return $this->text_uthmani;
    }

    /**
     * Get audio URL for the word.
     */
    public function getAudioUrl(): ?string
    {
        return $this->audio_url;
    }

    /**
     * Get image URL for the word.
     */
    public function getImageUrl(): ?string
    {
        return $this->image_url;
    }
}