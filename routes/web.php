<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Chapter;
use App\Models\Verse;

// Home page - Landing page
Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

// Backwards-compatible /explore route → redirect to home
Route::get('explore', function () {
    return redirect()->route('home');
})->name('explore');

// Public Collections
Route::get('collections', function () {
    return Inertia::render('user/collections');
})->name('collections.index');

Route::get('collections/{slug}', function (string $slug) {
    return Inertia::render('public-collection-detail', [
        'slug' => $slug,
    ]);
})->name('collections.show');

// Topics
Route::get('topics', function () {
    return Inertia::render('topics');
})->name('topics.index');

Route::get('topic/{topicId}', function (int $topicId) {
    return Inertia::render('topic-detail', [
        'topicId' => $topicId,
    ]);
})->whereNumber('topicId')->name('topics.show');

// Related resources for a specific verse
Route::get('related/{chapterNumber}/{verseNumber}', function (int $chapterNumber, int $verseNumber) {
    $chapter = Chapter::where('chapter_number', $chapterNumber)->firstOrFail();

    $verse = Verse::where('chapter_id', $chapter->id)
        ->where('verse_number', $verseNumber)
        ->firstOrFail();

    // Find previous and next verses based on global verse_index
    $previous = Verse::where('verse_index', '<', $verse->verse_index)
        ->orderByDesc('verse_index')
        ->first();

    $next = Verse::where('verse_index', '>', $verse->verse_index)
        ->orderBy('verse_index')
        ->first();

    return Inertia::render('quran/related', [
        'chapterNumber' => $chapterNumber,
        'verseNumber' => $verseNumber,
        'verseId' => $verse->id,
        'previousVerse' => $previous ? [
            'chapterNumber' => $previous->chapter->chapter_number,
            'verseNumber' => $previous->verse_number,
        ] : null,
        'nextVerse' => $next ? [
            'chapterNumber' => $next->chapter->chapter_number,
            'verseNumber' => $next->verse_number,
        ] : null,
    ]);
})->whereNumber('chapterNumber')->whereNumber('verseNumber')->name('related.verse');

// Quran Reader routes (Root Level)
// /read - Alias for backwards compatibility
Route::get('read', function () {
    return redirect()->route('reader.chapter', ['chapterNumber' => 1]);
});

// /{chapterNumber} e.g. /2
Route::get('{chapterNumber}', function (int $chapterNumber) {
    return Inertia::render('quran/reader', [
        'chapterNumber' => $chapterNumber,
    ]);
})->whereNumber('chapterNumber')->name('reader.chapter');

// /{chapterNumber}/{range} e.g. /2/10-15 or /2/6
Route::get('{chapterNumber}/{range}', function (int $chapterNumber, string $range) {
    $parts = explode('-', $range);
    $from = $parts[0] ?? null;
    $to = $parts[1] ?? $from;

    return Inertia::render('quran/reader', [
        'chapterNumber' => $chapterNumber,
        'fromVerse' => $from ? (int) $from : null,
        'toVerse' => $to ? (int) $to : null,
    ]);
})->whereNumber('chapterNumber')->where('range', '[0-9]+(-[0-9]+)?')->name('reader.range');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // My Collections (new interface)
    Route::get('my-collections', function () {
        return Inertia::render('my-collections');
    })->name('my-collections.index');

    Route::get('my-collections/{slug}', function (string $slug) {
        return Inertia::render('my-collection-detail', [
            'slug' => $slug,
        ]);
    })->name('my-collections.show');

    // Favorites (Bookmarks)
    Route::get('favorites', function () {
        return Inertia::render('favorites');
    })->name('favorites.index');

    // My Contributions
    Route::get('my-contributions', function () {
        return Inertia::render('my-contributions');
    })->name('my-contributions.index');
});

// User Resource Submission Routes (require authentication)
Route::middleware('auth')->group(function () {
    Route::prefix('user-resources')->group(function () {
        Route::post('/', [\App\Http\Controllers\UserResourceController::class, 'store'])->name('user-resources.store');
        Route::get('/', [\App\Http\Controllers\UserResourceController::class, 'index'])->name('user-resources.index');
        Route::get('/pending', [\App\Http\Controllers\UserResourceController::class, 'pending'])->name('user-resources.pending'); // For admin
    });

    Route::prefix('user-chapter-resources')->group(function () {
        Route::post('/', [\App\Http\Controllers\UserChapterResourceController::class, 'store'])->name('user-chapter-resources.store');
    });
});

// Admin Routes (require role-based access)
Route::middleware(['auth', 'role:Admin|Moderator|Reviewer'])->prefix('admin')->group(function () {
    // Admin root - redirect to dashboard
    Route::get('/', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.index');

    // Admin Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('admin/dashboard');
    })->name('admin.dashboard');

    // Roles & Permissions (Admin only)
    Route::prefix('roles')->middleware('role:Admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\RoleController::class, 'index'])
            ->name('admin.roles');
        Route::get('/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'show'])
            ->name('admin.roles.show');
        Route::post('/', [\App\Http\Controllers\Admin\RoleController::class, 'store'])
            ->name('admin.roles.store');
        Route::put('/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'update'])
            ->name('admin.roles.update');
        Route::delete('/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])
            ->name('admin.roles.destroy');
    });

    // Resource Types (Admin only)
    Route::prefix('resource-types')->middleware('role:Admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'index'])
            ->name('admin.resource-types');
        Route::get('/{resourceType}', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'show'])
            ->name('admin.resource-types.show');
        Route::post('/', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'store'])
            ->name('admin.resource-types.store');
        Route::put('/{resourceType}', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'update'])
            ->name('admin.resource-types.update');
        Route::delete('/{resourceType}', [\App\Http\Controllers\Admin\ResourceTypeController::class, 'destroy'])
            ->name('admin.resource-types.destroy');
    });

    // Settings (Admin only)
    Route::get('/settings', function () {
        return Inertia::render('admin/settings');
    })->middleware('role:Admin')->name('admin.settings');

    // Resource Submissions
    Route::get('/resource-submissions', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'index'])
        ->name('admin.resource-submissions');

    // Only Admins & Moderators can approve/reject/delete submissions
    Route::post('/resource-submissions/{submission}/approve', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'approve'])
        ->middleware('role:Admin|Moderator')
        ->name('admin.resource-submissions.approve');

    Route::post('/resource-submissions/{submission}/reject', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'reject'])
        ->middleware('role:Admin|Moderator')
        ->name('admin.resource-submissions.reject');

    Route::delete('/resource-submissions/{submission}', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'destroy'])
        ->middleware('role:Admin|Moderator')
        ->name('admin.resource-submissions.destroy');

    Route::post('/resource-submissions/bulk-approve', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'bulkApprove'])
        ->middleware('role:Admin|Moderator')
        ->name('admin.resource-submissions.bulk-approve');

    Route::post('/resource-submissions/bulk-reject', [\App\Http\Controllers\Admin\ResourceSubmissionController::class, 'bulkReject'])
        ->middleware('role:Admin|Moderator')
        ->name('admin.resource-submissions.bulk-reject');

    // User Management (Admin only)
    Route::prefix('users')->middleware('role:Admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\UserController::class, 'index'])
            ->name('admin.users');
        Route::get('/{user}', [\App\Http\Controllers\Admin\UserController::class, 'show'])
            ->name('admin.users.show');
        Route::post('/', [\App\Http\Controllers\Admin\UserController::class, 'store'])
            ->name('admin.users.store');
        Route::put('/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])
            ->name('admin.users.update');
        Route::delete('/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])
            ->name('admin.users.destroy');
    });

    // Verse Management
    Route::get('/verses', [\App\Http\Controllers\Admin\VerseController::class, 'index'])
        ->name('admin.verses');
    Route::get('/verses/{verse}', [\App\Http\Controllers\Admin\VerseController::class, 'show'])
        ->name('admin.verses.show');

    // Translation Management
    Route::get('/translations', [\App\Http\Controllers\Admin\VerseController::class, 'translations'])
        ->name('admin.translations');
});

require __DIR__.'/settings.php';
