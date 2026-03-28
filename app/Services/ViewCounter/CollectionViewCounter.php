<?php

namespace App\Services\ViewCounter;

use App\Jobs\PersistCollectionView;
use App\Models\Collection;
use App\Models\CollectionViewEvent;
use Illuminate\Contracts\Cache\Factory as CacheFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class CollectionViewCounter
{
    public function __construct(
        protected CacheFactory $cacheFactory,
        protected BotDetector $botDetector,
        protected TurnstileVerifier $turnstileVerifier,
        protected VisitorFingerprintResolver $fingerprintResolver,
    ) {
    }

    public function track(Request $request, Collection $collection): JsonResponse
    {
        $responseData = [
            'counted' => false,
            'views_count' => $this->currentViewsCount($collection),
        ];

        if (! config('view_counter.enabled', true)) {
            return response()->json($responseData);
        }

        $botResult = $this->botDetector->detect($request);

        if ($botResult->isBot) {
            return response()->json($responseData);
        }

        if (
            $botResult->isSuspicious &&
            config('view_counter.use_turnstile_for_suspicious_requests', false) &&
            ! $this->turnstileVerifier->passes($request)
        ) {
            return response()->json($responseData);
        }

        $fingerprint = $this->fingerprintResolver->resolve($request);
        $dedupeKey = $this->dedupeKey($collection->id, $fingerprint->fingerprintHash);
        $ttlSeconds = max(1, config('view_counter.dedupe_ttl_hours', 12) * 3600);
        $cache = $this->cacheStore();

        if (! $cache->add($dedupeKey, now()->timestamp, $ttlSeconds)) {
            return $this->response($responseData, $fingerprint);
        }

        $event = null;

        if (config('view_counter.event_logging_enabled', true)) {
            $event = CollectionViewEvent::query()->firstOrCreate(
                ['event_key' => $this->eventKey($collection->id, $fingerprint->fingerprintHash, $ttlSeconds)],
                [
                    'collection_id' => $collection->id,
                    'visitor_hash' => $fingerprint->visitorHash,
                    'ip_hash' => $fingerprint->ipHash,
                    'user_agent_hash' => $fingerprint->userAgentHash,
                    'session_id' => $fingerprint->sessionId,
                    'viewed_at' => now(),
                    'is_bot' => false,
                    'metadata' => [
                        'suspicious' => $botResult->isSuspicious,
                        'signals' => $botResult->signals,
                        'visitor' => $fingerprint->metadata,
                    ],
                ],
            );

            if (! $event->wasRecentlyCreated) {
                return $this->response($responseData, $fingerprint);
            }
        }

        $viewsCount = $this->incrementShadowCount($collection);

        if ($event !== null) {
            PersistCollectionView::dispatch($event->id);
        } else {
            Collection::query()->whereKey($collection->id)->increment('views_count');
        }

        return $this->response([
            'counted' => true,
            'views_count' => $viewsCount,
        ], $fingerprint);
    }

    public function currentViewsCount(Collection $collection): int
    {
        $cache = $this->cacheStore();
        $counterKey = $this->counterKey($collection->id);

        if ($cache->has($counterKey)) {
            return (int) $cache->get($counterKey, $collection->views_count);
        }

        return (int) $collection->views_count;
    }

    protected function incrementShadowCount(Collection $collection): int
    {
        $cache = $this->cacheStore();
        $counterKey = $this->counterKey($collection->id);

        $cache->add($counterKey, (int) $collection->views_count, now()->addDays(7));

        return (int) $cache->increment($counterKey);
    }

    protected function response(array $payload, VisitorFingerprint $fingerprint): JsonResponse
    {
        $response = response()->json($payload);

        if ($fingerprint->issuedVisitorCookie) {
            $response->headers->setCookie(
                Cookie::make(
                    name: (string) config('view_counter.visitor_cookie_name', 'fq_visitor'),
                    value: $fingerprint->visitorId,
                    minutes: (int) config('view_counter.visitor_cookie_ttl_minutes', 525600),
                    secure: config('session.secure_cookie'),
                    sameSite: 'lax',
                ),
            );
        }

        return $response;
    }

    protected function cacheStore()
    {
        $store = config('view_counter.cache_store');

        return $store ? $this->cacheFactory->store($store) : $this->cacheFactory->store();
    }

    protected function dedupeKey(int $collectionId, string $fingerprintHash): string
    {
        return "collection_view:{$collectionId}:{$fingerprintHash}";
    }

    protected function counterKey(int $collectionId): string
    {
        return "collection_views_count:{$collectionId}";
    }

    protected function eventKey(int $collectionId, string $fingerprintHash, int $ttlSeconds): string
    {
        $window = (int) floor(now()->timestamp / $ttlSeconds);

        return hash_hmac(
            'sha256',
            implode('|', [$collectionId, $fingerprintHash, $window]),
            (string) config('app.key'),
        );
    }
}
