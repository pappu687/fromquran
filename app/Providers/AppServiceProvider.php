<?php

namespace App\Providers;

use App\Models\Collection;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::morphMap([
            'collection' => Collection::class,
        ]);

        RateLimiter::for('public-collection-views', function (Request $request) {
            $collectionRouteValue = $request->route()?->parameter('collection');
            $collectionKey = $collectionRouteValue instanceof Collection
                ? $collectionRouteValue->getKey()
                : (string) $collectionRouteValue;

            return Limit::perMinute(
                (int) config('view_counter.throttle_per_minute', 60),
            )->by(implode('|', [
                $request->ip(),
                (string) $request->header('User-Agent'),
                $collectionKey !== '' ? $collectionKey : 'unknown',
            ]));
        });

        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
