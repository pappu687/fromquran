<?php

namespace App\Services\ViewCounter;

class BotDetectionResult
{
    public function __construct(
        public readonly bool $isBot,
        public readonly bool $isSuspicious,
        public readonly ?string $reason = null,
        public readonly array $signals = [],
    ) {
    }
}
