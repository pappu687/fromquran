<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\BookmarkController;

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
Route::middleware('auth:sanctum')->prefix('bookmarks')->group(function () {
    Route::get('/', [BookmarkController::class, 'index']);
    Route::post('/', [BookmarkController::class, 'store']);
    Route::get('/stats', [BookmarkController::class, 'stats']);
    Route::get('/check', [BookmarkController::class, 'check']);
    Route::get('/{bookmark}', [BookmarkController::class, 'show']);
    Route::put('/{bookmark}', [BookmarkController::class, 'update']);
    Route::delete('/{bookmark}', [BookmarkController::class, 'destroy']);
});