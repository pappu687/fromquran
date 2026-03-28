<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Services\ViewCounter\CollectionViewCounter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCollectionViewController extends Controller
{
    public function __invoke(
        Request $request,
        Collection $collection,
        CollectionViewCounter $viewCounter,
    ): JsonResponse {
        abort_unless($collection->is_public && $collection->status === 'approved', 404);

        return $viewCounter->track($request, $collection);
    }
}
