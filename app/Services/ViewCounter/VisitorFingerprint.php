<?php

namespace App\Services\ViewCounter;

class VisitorFingerprint
{
    public function __construct(
        public readonly string $fingerprintHash,
        public readonly string $visitorHash,
        public readonly ?string $ipHash,
        public readonly ?string $userAgentHash,
        public readonly ?string $sessionId,
        public readonly string $visitorId,
        public readonly bool $issuedVisitorCookie,
        public readonly array $metadata = [],
    ) {
    }
}
