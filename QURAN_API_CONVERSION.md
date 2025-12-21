# Quran.com API Laravel Conversion

This document describes the conversion of the Quran.com API from Ruby on Rails to Laravel.

## Overview

The original Ruby on Rails schema has been converted to Laravel migrations and models, maintaining the same database structure and relationships while adapting to Laravel conventions.

## Core Tables

### Quran Content Tables

#### `chapters`
- Represents Quran chapters (surahs)
- Fields: chapter_number, name_arabic, name_simple, revelation_place, verses_count, etc.
- Relationships: hasMany verses, chapterInfos, translatedNames

#### `verses`
- Represents individual Quran verses (ayahs)
- Fields: chapter_id, verse_number, verse_key, text_uthmani, juz_number, page_number, etc.
- Relationships: belongsTo chapter, hasMany words, translations, tafsirs, audioFiles

#### `words`
- Represents individual words in verses
- Fields: verse_id, position, text_uthmani, page_number, line_number, etc.
- Relationships: belongsTo verse, chapter, charType, token, topic

#### `juzs`
- Represents the 30 Juz divisions of the Quran
- Fields: juz_number, first_verse_id, last_verse_id, verse_mapping
- Relationships: belongsTo firstVerse, lastVerse

#### `hizbs`
- Represents the 240 Hizb divisions (8 per Juz)
- Fields: hizb_number, first_verse_id, last_verse_id, verse_mapping
- Relationships: belongsTo firstVerse, lastVerse

### Content Resource System

#### `languages`
- Available languages for translations and content
- Fields: name, iso_code, native_name, direction, translations_count
- Relationships: hasMany resourceContents, translations, tafsirs

#### `resource_contents`
- Master table for all content types (translations, tafsirs, etc.)
- Fields: name, description, resource_type, language_id, author_id, approved
- Relationships: belongsTo language, author, dataSource

#### `authors`
- Content authors (translators, scholars, etc.)
- Fields: name, url, resource_contents_count
- Relationships: hasMany resourceContents

#### `translations`
- Quran verse translations
- Fields: verse_id, language_id, text, resource_content_id, priority
- Relationships: belongsTo verse, language, resourceContent

#### `tafsirs`
- Quran exegesis and commentary
- Fields: verse_id, language_id, text, resource_content_id
- Relationships: belongsTo verse, language, resourceContent

### Audio System

#### `audio_recitations`
- Quran recitation metadata
- Fields: name, reciter_id, style, approved, priority
- Relationships: belongsTo reciter, recitationStyle, hasMany audioFiles

#### `audio_files`
- Individual audio files for verses
- Fields: verse_id, url, duration, format, recitation_id
- Relationships: belongsTo verse, audioRecitation

#### `audio_segments`
- Word-by-word timing data for audio files
- Fields: audio_file_id, timestamp_from, timestamp_to, segments
- Relationships: belongsTo audioFile, verse

#### `reciters`
- Quran reciters
- Fields: name, bio, profile_picture, recitations_count
- Relationships: hasMany audioRecitations

### API Client Management

#### `api_clients`
- API client authentication and rate limiting
- Fields: name, api_key, request_quota, requests_count, active
- Relationships: hasMany requestStats

#### `api_client_request_stats`
- Daily request statistics per client
- Fields: api_client_id, date, requests_count
- Relationships: belongsTo apiClient

### Supporting Tables

#### `data_sources`
- Content data sources
- Fields: name, url
- Relationships: hasMany resourceContents

#### `char_types`
- Arabic character classification
- Fields: name, parent_id, description
- Relationships: hasMany words, children

#### `tokens`
- Tokenized Quran text
- Fields: text_uthmani, text_imlaei, resource_content_id
- Relationships: hasMany words

#### `roots`
- Arabic word roots
- Fields: value, arabic_trilateral, english_trilateral, words_count
- Relationships: hasMany words

## Key Features

### 1. Multi-Script Support
- Uthmani script (traditional)
- Imlaei script (simplified)
- IndoPak script
- Tajweed script with color coding

### 2. Comprehensive Audio System
- Multiple recitation styles (Qira'at)
- Word-by-word timing synchronization
- Audio segmentation and timing data
- Support for different audio formats

### 3. Rich Content Management
- Translations in multiple languages
- Tafsirs (exegesis) from various scholars
- Transliterations for non-Arabic readers
- Author and source tracking

### 4. API Client Management
- API key authentication
- Request quota management
- Usage statistics and analytics
- Rate limiting and monitoring

### 5. Morphological Analysis Support
- Word root extraction
- Grammar and morphology data
- Lemma and stemming information
- Character type classification

## Migration Strategy

### Running Migrations

```bash
php artisan migrate
```

### Key Changes from Ruby to Laravel

1. **Primary Keys**: Standardized to use `id` auto-increment instead of custom keys
2. **Timestamps**: Added `created_at` and `updated_at` columns where missing
3. **Foreign Keys**: Standardized Laravel foreign key constraints
4. **Data Types**: Converted to appropriate Laravel column types
5. **Indexes**: Maintained and optimized for Laravel/MySQL compatibility

### Model Relationships

All models have been created with proper Eloquent relationships:

- BelongsTo relationships for foreign key references
- HasMany relationships for one-to-many connections
- Proper constraint handling with `onDelete('cascade')`

### API Integration Points

The converted schema supports:

1. **Chapter Endpoints**
   - `/chapters` - List all chapters
   - `/chapters/{id}` - Get chapter details
   - `/chapters/{id}/info` - Chapter information by language

2. **Verse Endpoints**
   - `/chapters/{id}/verses` - Get verses by chapter
   - `/verses/{id}` - Get specific verse
   - `/verses/by_key/{key}` - Get verse by chapter:verse key

3. **Translation Endpoints**
   - `/translations` - List available translations
   - `/chapters/{id}/verses/{id}/translations` - Verse translations

4. **Audio Endpoints**
   - `/audio/recitations` - List available recitations
   - `/chapters/{id}/verses/{id}/audio` - Verse audio files

5. **Search Endpoints**
   - `/search` - Search across translations and Quran text

## Performance Considerations

### Indexes
- Comprehensive indexing on foreign keys and commonly queried columns
- Composite indexes for complex queries
- Full-text search support on text fields

### Data Types
- JSON/JSONB fields for flexible metadata storage
- Appropriate integer sizes for large tables
- Proper charset and collation for Arabic text

### Caching Strategy
- Cache frequently accessed content (popular translations)
- Cache computed fields (verse counts, word counts)
- Implement proper cache invalidation

## Next Steps

### Missing Features to Implement

1. **Morphological System**: Additional tables for word grammar, morphology concepts
2. **Word Translation System**: Word-by-word translations and transliterations
3. **Topic System**: Verse topic classification and relationships
4. **Mushaf System**: Different Quran manuscript layouts
5. **User Features**: Bookmarks, notes, progress tracking

### Data Import

To populate the database:

1. Export data from the existing Ruby on Rails application
2. Convert data format to match Laravel structure
3. Use Laravel seeding or import scripts
4. Validate data integrity after import

### API Development

1. Create Laravel controllers for each resource type
2. Implement proper validation and error handling
3. Add authentication and rate limiting middleware
4. Create API documentation
5. Implement caching strategies

## File Structure

```
database/migrations/
├── 2024_01_01_000001_create_chapters_table.php
├── 2024_01_01_000002_create_verses_table.php
├── 2024_01_01_000003_create_words_table.php
├── 2024_01_01_000004_create_juzs_table.php
├── 2024_01_01_000005_create_hizbs_table.php
├── 2024_01_01_000006_create_languages_table.php
├── 2024_01_01_000007_create_resource_contents_table.php
├── 2024_01_01_000008_create_authors_table.php
├── 2024_01_01_000009_create_translations_table.php
├── 2024_01_01_000010_create_tafsirs_table.php
├── 2024_01_01_000011_create_audio_recitations_table.php
├── 2024_01_01_000012_create_audio_files_table.php
├── 2024_01_01_000013_create_audio_segments_table.php
├── 2024_01_01_000014_create_audio_sections_table.php
├── 2024_01_01_000015_create_reciters_table.php
├── 2024_01_01_000016_create_qirat_types_table.php
├── 2024_01_01_000017_create_api_clients_table.php
├── 2024_01_01_000018_create_api_client_request_stats_table.php
├── 2024_01_01_000019_create_data_sources_table.php
├── 2024_01_01_000020_create_char_types_table.php
├── 2024_01_01_000021_create_tokens_table.php
├── 2024_01_01_000022_create_roots_table.php
└── 2024_01_01_000023_create_verse_supporting_tables.php

app/Models/
├── Chapter.php
├── Verse.php
├── Word.php
├── Language.php
├── ResourceContent.php
├── Author.php
├── Translation.php
├── Tafsir.php
├── Juz.php
├── Hizb.php
├── AudioRecitation.php
├── AudioFile.php
├── AudioSegment.php
├── ApiClient.php
├── DataSource.php
├── CharType.php
├── Root.php
└── [Additional models...]
```

## Conclusion

This conversion provides a solid foundation for a Quran API in Laravel, maintaining the rich feature set of the original Ruby on Rails implementation while leveraging Laravel's ecosystem and conventions. The modular design allows for easy extension and customization based on specific requirements.