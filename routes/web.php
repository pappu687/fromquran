<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Quran Reader as home
Route::get('/', function () {
    return Inertia::render('quran/reader');
})->name('home');

// Backwards-compatible /explore route → redirect to home
Route::get('explore', function () {
    return redirect()->route('home');
})->name('explore');

// /{chapterNumber} e.g. /2
Route::get('{chapterNumber}', function (int $chapterNumber) {
    return Inertia::render('quran/reader', [
        'chapterNumber' => $chapterNumber,
    ]);
})->whereNumber('chapterNumber');

// /{chapterNumber}/{from}-{to} e.g. /2/10-15
Route::get('{chapterNumber}/{range}', function (int $chapterNumber, string $range) {
    [$from, $to] = array_pad(explode('-', $range), 2, null);

    return Inertia::render('quran/reader', [
        'chapterNumber' => $chapterNumber,
        'fromVerse' => $from ? (int) $from : null,
        'toVerse' => $to ? (int) $to : null,
    ]);
})->whereNumber('chapterNumber')->where('range', '[0-9]+-[0-9]+');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// User Resource Submission Routes (require authentication)
Route::middleware('auth')->prefix('user-resources')->group(function () {
    Route::post('/', [\App\Http\Controllers\UserResourceController::class, 'store'])->name('user-resources.store');
    Route::get('/', [\App\Http\Controllers\UserResourceController::class, 'index'])->name('user-resources.index');
    Route::get('/pending', [\App\Http\Controllers\UserResourceController::class, 'pending'])->name('user-resources.pending'); // For admin
});

// Admin Routes (require role-based access)
Route::middleware(['auth', 'role:Admin|Moderator|Reviewer'])->prefix('admin')->group(function () {
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
});

require __DIR__.'/settings.php';
