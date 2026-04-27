<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request1 = Illuminate\Http\Request::create('/api/quran/audio/1/1', 'GET');
$response1 = $kernel->handle($request1);
echo "API 1:\n";
echo substr($response1->getContent(), 0, 500) . "\n\n";

$request2 = Illuminate\Http\Request::create('/api/qf/audio/chapter-recitations/1/1', 'GET');
$response2 = $kernel->handle($request2);
echo "API 2:\n";
echo substr($response2->getContent(), 0, 500) . "\n\n";
