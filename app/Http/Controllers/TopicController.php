<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    /**
     * Get all topics in hierarchical structure for sidebar.
     */
    public function index()
    {
        $topics = Topic::root()
            ->with(['children' => function ($query) {
                $query->select('topic_id', 'name', 'arabic_name', 'parent_id')
                    ->with(['children' => function ($q) {
                        $q->select('topic_id', 'name', 'arabic_name', 'parent_id');
                    }]);
            }])
            ->select('topic_id', 'name', 'arabic_name', 'parent_id')
            ->orderBy('topic_id')
            ->get();

        return response()->json($topics);
    }

    /**
     * Get topics for a specific verse.
     */
    public function forVerse($verseId)
    {
        $verse = \App\Models\Verse::findOrFail($verseId);

        $topics = Topic::forVerse($verse->verse_key)
            ->select('topic_id', 'name', 'arabic_name')
            ->orderBy('topic_id')
            ->get();

        return response()->json([
            'data' => $topics,
        ]);
    }

    /**
     * Show a specific topic with verses.
     */
    public function show(Request $request, int $topicId)
    {
        $topic = Topic::with([
            'parent:topic_id,name,arabic_name',
            'children:topic_id,name,arabic_name,parent_id',
        ])->findOrFail($topicId);

        $page = (int) $request->get('page', 1);
        $limit = 10;

        // Get verses with pagination
        $verses = $topic->getVersesPaginated($page, $limit);

        // Get related topics
        $relatedTopicIds = $topic->getRelatedTopicIds();
        $relatedTopics = [];
        if (!empty($relatedTopicIds)) {
            $relatedTopics = Topic::whereIn('topic_id', $relatedTopicIds)
                ->select('topic_id', 'name', 'arabic_name')
                ->get();
        }

        return response()->json([
            'topic' => $topic,
            'verses' => $verses,
            'related_topics' => $relatedTopics,
        ]);
    }
}
