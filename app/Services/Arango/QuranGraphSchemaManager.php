<?php

namespace App\Services\Arango;

class QuranGraphSchemaManager
{
    public function __construct(protected ArangoClient $client) {}

    public function setup(): void
    {
        if (! $this->client->databaseExists()) {
            $this->client->createDatabase();
        }

        $documentCollections = config('arango.collections.documents', []);
        $edgeCollections = config('arango.collections.edges', []);

        foreach ($documentCollections as $name) {
            if (! $this->client->collectionExists($name)) {
                $this->client->createCollection($name, 2);
            }
        }

        foreach ($edgeCollections as $name) {
            if (! $this->client->collectionExists($name)) {
                $this->client->createCollection($name, 3);
            }
        }
    }

    public function dropAll(): void
    {
        $all = array_merge(
            config('arango.collections.documents', []),
            config('arango.collections.edges', [])
        );

        foreach ($all as $name) {
            if ($this->client->collectionExists($name)) {
                $this->client->request('DELETE', "/_api/collection/{$name}");
            }
        }
    }
}
