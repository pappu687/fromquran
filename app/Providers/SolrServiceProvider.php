<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Solarium\Client;
use Solarium\Core\Client\Adapter\Curl;
use Symfony\Component\EventDispatcher\EventDispatcher;

class SolrServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Client::class, function () {
            $adapter = new Curl();
            $eventDispatcher = new EventDispatcher();

            return new Client($adapter, $eventDispatcher, config('solr'));
        });
    }

    public function boot(): void
    {
        //
    }
}
