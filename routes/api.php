<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\Api\VerseResourceController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Quran API Routes
Route::prefix('quran')->group(function () {
    Route::get('/chapters', [QuranController::class, 'chapters']);
    Route::get('/chapters/{chapterId}/verses', [QuranController::class, 'verses']);
    Route::get('/editions', [QuranController::class, 'editions']);
    Route::get('/search', [QuranController::class, 'search']);
    Route::get('/juzs', [QuranController::class, 'juzs']);
    Route::get('/juzs/{juzId}/verses', [QuranController::class, 'juzVerses']);
});

// Bookmark Routes (require authentication)
Route::middleware('auth')->prefix('bookmarks')->group(function () {
    Route::get('/', [BookmarkController::class, 'index']);
    Route::post('/', [BookmarkController::class, 'store']);
    Route::get('/stats', [BookmarkController::class, 'stats']);
    Route::get('/check', [BookmarkController::class, 'check']);
    Route::get('/{bookmark}', [BookmarkController::class, 'show']);
    Route::put('/{bookmark}', [BookmarkController::class, 'update']);
    Route::delete('/{bookmark}', [BookmarkController::class, 'destroy']);
});

// Verse Resources (public - approved resources only)
Route::get('/verses/resources', [VerseResourceController::class, 'index']);
Route::get('/verses/{verseId}/resources', [VerseResourceController::class, 'show']);

// Collection Routes (require authentication)
Route::middleware(['web', 'auth'])->prefix('collections')->group(function () {
    Route::get('/', [CollectionController::class, 'index']);
    Route::post('/', [CollectionController::class, 'store']);
    Route::get('/verse/{verseId}', [CollectionController::class, 'getCollectionsForVerse']);
    Route::post('/toggle', [CollectionController::class, 'toggleVerse']);
    Route::get('/{slug}', [CollectionController::class, 'show']);
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