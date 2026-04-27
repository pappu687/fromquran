<?php

use App\Http\Controllers\Api\QuranFoundationController;
use App\Http\Controllers\Api\VerseAnnotationController;
use App\Http\Controllers\Api\VerseResourceController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\PublicCollectionViewController;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\TagController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Check authentication status (uses web middleware for session auth)
Route::middleware(['web'])->get('/check-auth', function (Request $request) {
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => auth()->check() ? $request->user() : null,
    ]);
});

// Quran API Routes
Route::prefix('quran')->group(function () {
    Route::get('/chapters', [QuranController::class, 'chapters']);
    Route::get('/chapters/{chapterId}/info', [QuranController::class, 'chapterInfo']);
    Route::get('/chapters/{chapterId}/verses', [QuranController::class, 'verses']);
    Route::get('/editions', [QuranController::class, 'editions']);
    Route::get('/search', [QuranController::class, 'search']);
    Route::get('/juzs', [QuranController::class, 'juzs']);
    Route::get('/juzs/{juzId}/verses', [QuranController::class, 'juzVerses']);
    Route::get('/audio/{reciterId}/{chapterId}', [QuranController::class, 'audio']);
    Route::get('/reciters', [QuranController::class, 'reciters']);
    Route::get('/tafseer-books', [QuranController::class, 'tafseerBooks']);
    Route::get('/tafsir/{chapterId}/{verseNumber}', [QuranController::class, 'tafsir']);
    Route::get('/chapters/{chapterId}/resources', [\App\Http\Controllers\Api\ChapterResourceController::class, 'show']);
    Route::get('/verses', [QuranController::class, 'allVersesForChapter']);
    Route::get('/settings', [QuranController::class, 'settings']);
});

Route::prefix('qf')->group(function () {
    Route::get('/verify', [QuranFoundationController::class, 'verify']);

    Route::get('/resources/recitations', [QuranFoundationController::class, 'recitations']);
    Route::get('/resources/recitations/{id}', [QuranFoundationController::class, 'recitationInfo'])->whereNumber('id');
    Route::get('/resources/translations', [QuranFoundationController::class, 'translations']);
    Route::get('/resources/translations/{id}', [QuranFoundationController::class, 'translationInfo'])->whereNumber('id');
    Route::get('/resources/tafsirs', [QuranFoundationController::class, 'tafsirs']);
    Route::get('/resources/tafsirs/{id}', [QuranFoundationController::class, 'tafsirInfo'])->whereNumber('id');
    Route::get('/resources/languages', [QuranFoundationController::class, 'languages']);
    Route::get('/resources/chapter-infos', [QuranFoundationController::class, 'chapterInfos']);
    Route::get('/resources/chapter-reciters', [QuranFoundationController::class, 'chapterReciters']);
    Route::get('/resources/recitation-styles', [QuranFoundationController::class, 'recitationStyles']);
    Route::get('/resources/verse-media', [QuranFoundationController::class, 'verseMedia']);

    Route::get('/audio/chapter-recitations/{chapterId}', [QuranFoundationController::class, 'chapterRecitations'])->whereNumber('chapterId');
    Route::get('/audio/chapter-recitations/{chapterId}/{recitationId}', [QuranFoundationController::class, 'chapterRecitation'])->whereNumber(['chapterId', 'recitationId']);
    Route::get('/audio/verse-recitations/by-chapter/{chapterId}/{recitationId}', [QuranFoundationController::class, 'verseRecitationsByChapter'])->whereNumber(['chapterId', 'recitationId']);
    Route::get('/audio/verse-recitations/by-ayah/{chapterId}/{verseNumber}/{recitationId}', [QuranFoundationController::class, 'verseRecitationsByAyah'])->whereNumber(['chapterId', 'verseNumber', 'recitationId']);
});

// Bookmark Routes (require authentication)
Route::middleware(['web', 'auth'])->prefix('bookmarks')->group(function () {
    Route::get('/', [BookmarkController::class, 'index']);
    Route::post('/', [BookmarkController::class, 'store']);
    Route::get('/stats', [BookmarkController::class, 'stats']);
    Route::get('/check', [BookmarkController::class, 'check']);
    Route::get('/{bookmark}', [BookmarkController::class, 'show']);
    Route::put('/{bookmark}', [BookmarkController::class, 'update']);
    Route::delete('/{bookmark}', [BookmarkController::class, 'destroy']);
});

// Verse Report Routes (require authentication)
Route::middleware(['web', 'auth'])->prefix('verse-reports')->group(function () {
    Route::post('/', [\App\Http\Controllers\Api\VerseReportController::class, 'store']);
});

Route::middleware(['web', 'auth'])->prefix('verse-annotations')->group(function () {
    Route::get('/', [VerseAnnotationController::class, 'index']);
    Route::post('/', [VerseAnnotationController::class, 'store']);
    Route::put('/{verseAnnotation}', [VerseAnnotationController::class, 'update']);
    Route::delete('/{verseAnnotation}', [VerseAnnotationController::class, 'destroy']);
});

// Verse Resources (public - approved resources only)
Route::get('/verses/resources', [VerseResourceController::class, 'index']);
Route::get('/verses/{verseId}/resources', [VerseResourceController::class, 'show']);
Route::get('/verses/{verseId}/similar', [VerseResourceController::class, 'similarVerses']);
Route::get('/resources/{id}', [VerseResourceController::class, 'getResource']);

// Resource Types (public)
Route::get('/resource-types', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'list']);

// Topics (public)
Route::get('/topics', [\App\Http\Controllers\TopicController::class, 'index']);
Route::get('/topics/{topicId}', [\App\Http\Controllers\TopicController::class, 'show']);
Route::get('/verses/{verseId}/topics', [\App\Http\Controllers\TopicController::class, 'forVerse']);
Route::get('/tags', [TagController::class, 'index']);

Route::post(
    '/public/collections/{collection:slug}/view',
    PublicCollectionViewController::class,
)->middleware('throttle:public-collection-views');

// Collection Routes (require authentication)
// Public Collection Routes
Route::middleware(['web'])->prefix('collections')->group(function () {
    Route::get('/public-page', [CollectionController::class, 'publicPageData']);
    Route::get('/public', [CollectionController::class, 'publicIndex']);
    Route::get('/{slug}', [CollectionController::class, 'show']);
});

// Collection Routes (require authentication)
Route::middleware(['web', 'auth'])->prefix('collections')->group(function () {
    Route::get('/', [CollectionController::class, 'index']);
    Route::post('/', [CollectionController::class, 'store']);
    Route::get('/verse/{verseId}', [CollectionController::class, 'getCollectionsForVerse']);
    Route::post('/toggle', [CollectionController::class, 'toggleVerse']);
    Route::put('/{slug}', [CollectionController::class, 'update']);
    Route::delete('/{slug}', [CollectionController::class, 'destroy']);
    Route::post('/{slug}/verses', [CollectionController::class, 'addVerse']);
    Route::delete('/{slug}/verses', [CollectionController::class, 'removeVerse']);
    Route::post('/{slug}/reorder', [CollectionController::class, 'reorderVerses']);
});

// Admin User Management Routes (require authentication and admin role)
Route::middleware(['web', 'auth', 'role:Admin'])->prefix('admin/users')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\UserController::class, 'apiIndex']);
    Route::get('/roles', [\App\Http\Controllers\Admin\UserController::class, 'roles']);
    Route::get('/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Admin\UserController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);
});
