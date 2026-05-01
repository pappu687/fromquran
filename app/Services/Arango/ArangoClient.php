<?php

namespace App\Services\Arango;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ArangoClient
{
    protected string $baseUrl;

    protected string $database;

    protected string $username;

    protected string $password;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('arango.endpoint', 'http://localhost:8529'), '/');
        $this->database = config('arango.database', 'fromquran');
        $this->username = config('arango.username', 'root');
        $this->password = config('arango.password', '');
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function getDatabase(): string
    {
        return $this->database;
    }

    public function request(string $method, string $path, array $options = []): mixed
    {
        $url = "{$this->baseUrl}/_db/{$this->database}{$path}";

        $response = Http::withBasicAuth($this->username, $this->password)
            ->timeout(60)
            ->{$method}($url, $options);

        if ($response->failed()) {
            Log::warning('ArangoDB request failed', [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException(
                "ArangoDB request failed: {$response->status()} - {$response->body()}"
            );
        }

        return $response->json();
    }

    public function aql(string $query, array $bindVars = []): mixed
    {
        return $this->request('POST', '/_api/cursor', [
            'query' => $query,
            'bindVars' => (object) $bindVars,
            'batchSize' => 1000,
        ]);
    }

    public function databaseExists(): bool
    {
        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(10)
                ->get("{$this->baseUrl}/_api/database/user");

            $databases = $response->json('result', []);

            return in_array($this->database, $databases, true);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function createDatabase(): void
    {
        Http::withBasicAuth($this->username, $this->password)
            ->timeout(30)
            ->post("{$this->baseUrl}/_api/database", [
                'name' => $this->database,
            ]);
    }

    public function collectionExists(string $name): bool
    {
        try {
            $response = $this->request('GET', "/_api/collection/{$name}");

            return ($response['code'] ?? 0) === 200;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function createCollection(string $name, int $type = 2, array $options = []): void
    {
        $payload = array_merge([
            'name' => $name,
            'type' => $type, // 2 = document, 3 = edge
        ], $options);

        $this->request('POST', '/_api/collection', $payload);
    }

    public function upsertDocument(string $collection, string $key, array $document): void
    {
        $this->aql(<<<'AQL'
            INSERT @doc
            INTO @@collection
            OPTIONS { overwriteMode: "update", keepNull: false }
        AQL, [
            '@collection' => $collection,
            'doc' => array_merge($document, ['_key' => $key]),
        ]);
    }

    public function upsertEdge(string $collection, string $from, string $to, array $attributes = []): void
    {
        $key = md5("{$from}__{$to}");

        $this->aql(<<<'AQL'
            INSERT @doc
            INTO @@collection
            OPTIONS { overwriteMode: "update", keepNull: false }
        AQL, [
            '@collection' => $collection,
            'doc' => array_merge($attributes, [
                '_key' => $key,
                '_from' => $from,
                '_to' => $to,
            ]),
        ]);
    }

    public function upsertDocumentsBatch(string $collection, array $documents): void
    {
        if (empty($documents)) {
            return;
        }

        $url = "{$this->baseUrl}/_db/{$this->database}/_api/document/{$collection}?overwriteMode=update&keepNull=false&returnNew=false&returnOld=false";

        $response = Http::withBasicAuth($this->username, $this->password)
            ->timeout(120)
            ->post($url, array_values($documents));

        if ($response->failed()) {
            Log::warning('ArangoDB batch request failed', [
                'collection' => $collection,
                'count' => count($documents),
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException(
                "ArangoDB batch request failed: {$response->status()} - {$response->body()}"
            );
        }
    }
}
