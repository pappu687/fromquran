# Quran Data Import Command Guide

This guide explains how to use the Laravel artisan command to import Quran data from JSON files into your database.

## Prerequisites

1. Make sure you have run the database migrations:
   ```bash
   php artisan migrate
   ```

2. Download the Quran JSON data to the `docs` folder:
   ```bash
   mkdir -p docs
   curl -o docs/quran_en.json https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_en.json
   ```

## Command Usage

### Basic Usage

Run the import command with default settings:
```bash
php artisan quran:import-data
```

This will:
- Import from `docs/quran_en.json`
- Create/update 114 chapters
- Import ~6,236 verses
- Import English translations
- Set up supporting data (languages, authors, resource contents)

### Custom JSON File Path

If your JSON file is located elsewhere:
```bash
php artisan quran:import-data --path=custom/path/to/quran_data.json
```

## What Gets Imported

### 1. Chapters (Surahs)
- Arabic names and transliterations
- Revelation place (Meccan/Medinan)
- Verse counts
- Bismillah prefix settings

### 2. Verses (Ayahs)
- Arabic text (Uthmani script)
- Quran navigation data (Juz, Hizb, Page, Ruku, Manzil)
- Verse keys (format: "chapter:verse")
- Word counts

### 3. Translations
- English translations from quran-json
- Resource content tracking
- Author attribution

### 4. Supporting Data
- Languages table (English)
- Authors table (Quran.com)
- Resource contents table for tracking translations

## JSON File Structure

The command expects a JSON file with this structure:
```json
[
  {
    "id": 1,
    "name": "الفاتحة",
    "transliteration": "Al-Fatihah",
    "translation": "The Opener",
    "type": "meccan",
    "total_verses": 7,
    "verses": [
      {
        "id": 1,
        "text": "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
        "translation": "In the name of Allah..."
      }
    ]
  }
]
```

## Database Tables Affected

The command updates/creates records in these tables:
- `chapters` - Quran chapters
- `verses` - Individual verses
- `translations` - Verse translations
- `languages` - Supported languages
- `authors` - Translation authors
- `resource_contents` - Content metadata

## Progress Indicators

The command shows detailed progress:
```
 Starting Quran data import from: docs/quran_en.json

 English language setup ✓
 Author setup ✓
 Resource content setup ✓

📖 Importing chapters...
 114/114 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

📝 Importing verses...
 6236/6236 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

🌐 Importing English translations...
 6236/6236 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

✅ Quran data imported successfully!
📊 Summary:
   - Chapters: 114
   - Total Verses: 6236
   - Arabic Text: Imported
   - English Translations: Imported
```

## Error Handling

If the command fails, it will display specific error messages:

- **File not found**: "JSON file not found at: [path]"
- **Database errors**: Specific Laravel/SQL error messages
- **JSON format errors**: Parsing error details

## Data Validation

The command performs these validations:
- JSON file existence and readability
- Required fields in chapter objects
- Valid verse numbers
- Non-empty Arabic text

## Performance Considerations

- The command uses `updateOrCreate` to avoid duplicates
- Progress bars show real-time import status
- Large imports (6000+ verses) typically complete in 30-60 seconds
- Memory usage is optimized for standard Laravel setups

## Customization

### Adding New Languages

To import other languages, you can modify the `setupDependencies()` method in the command to create different language entries.

### Multiple Translation Sources

The command structure supports importing from multiple translation sources. Each source would have its own:
- Author entry
- Resource content entry
- Translation records

### Accurate Navigation Data

The current implementation uses simplified calculations for Juz, Hizb, Page, etc. For production use, replace the helper methods with accurate Quran navigation data.

## Troubleshooting

### Common Issues

1. **"Class not found" errors**: Make sure all model files are created
2. **Database connection errors**: Check your `.env` database configuration
3. **Memory errors**: Increase PHP memory limit for large imports

### Verification

After import, verify data quality:
```bash
# Check chapter count
php artisan tinker
>>> App\Models\Chapter::count()

# Check verse count
>>> App\Models\Verse::count()

# Check translation count
>>> App\Models\Translation::count()
```

## Next Steps

After successful import:

1. **Build API endpoints** to serve the data
2. **Add validation** for imported data integrity
3. **Implement caching** for frequently accessed content
4. **Add search functionality** using Laravel Scout or database search
5. **Set up additional translations** from other sources

## Contributing

When enhancing this command:

1. Test with small JSON samples first
2. Add appropriate error handling
3. Update this documentation
4. Consider data deduplication strategies