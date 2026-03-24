<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserChapterResource;
use Illuminate\Http\Request;
use Solarium\Client;

class ChapterResourceController extends Controller
{
    public function __construct(protected Client $client) {}

    /**
     * Get approved resources for a single chapter
     */
    public function show($chapterId)
    {
        $query = $this->client->createSelect();
        $query->setQuery('document_type_s:user_chapter_resource AND chapter_id_i:' . $chapterId);
        $query->addSort('created_at_dt', $query::SORT_DESC);
        $query->setRows(100);

        try {
            $resultset = $this->client->select($query);
            $resources = collect($resultset)->map(function ($doc) {
                $comment = $doc->description_t;
                $isTruncated = \Illuminate\Support\Str::wordCount($comment) > 50;
                $truncatedComment = \Illuminate\Support\Str::words($comment, 50, '...');

                return [
                    'id' => $doc->id,
                    'real_id' => str_replace('ucr_', '', $doc->id),
                    'chapter_id' => $doc->chapter_id_i,
                    'resource_title' => $doc->title_t,
                    'comment' => $truncatedComment,
                    'full_comment' => $comment,
                    'is_truncated' => $isTruncated,
                    'resource_url' => $doc->resource_url_s,
                    'thumbnail_url' => $doc->thumbnail_url_s,
                    'resource_type' => [
                        'slug' => $doc->resource_type_slug_s ?? null,
                        'name' => $doc->resource_type_name_s,
                    ],
                    'user' => [
                        'name' => $doc->user_name_s,
                    ],
                    'created_at' => $doc->created_at_dt,
                ];
            });

            return response()->json([
                'data' => $resources,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
