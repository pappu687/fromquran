<?php

namespace App\Services\ViewCounter;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitorFingerprintResolver
{
    public function resolve(Request $request): VisitorFingerprint
    {
        $cookieName = (string) config('view_counter.visitor_cookie_name', 'fq_visitor');
        $visitorId = (string) $request->cookie($cookieName, '');
        $issuedVisitorCookie = false;

        if ($visitorId === '') {
            $visitorId = Str::uuid()->toString();
            $issuedVisitorCookie = true;
        }

        $sessionId = method_exists($request, 'hasSession') && $request->hasSession()
            ? $request->session()->getId()
            : null;

        $normalizedUserAgent = $this->normalizeUserAgent((string) $request->userAgent());
        $ipSegment = $this->coarseIpSegment($request->ip());
        $identitySource = ! $issuedVisitorCookie
            ? $visitorId
            : ($sessionId ?: null);

        $fingerprintSource = implode('|', array_filter([
            $identitySource,
            $normalizedUserAgent,
            $ipSegment,
        ], static fn (?string $value): bool => filled($value)));

        if ($fingerprintSource === '') {
            $fingerprintSource = $visitorId;
        }

        $visitorHash = $this->hashValue($identitySource ?: $fingerprintSource);
        $ipHash = $ipSegment !== null ? $this->hashValue($ipSegment) : null;
        $userAgentHash = $normalizedUserAgent !== '' ? $this->hashValue($normalizedUserAgent) : null;

        return new VisitorFingerprint(
            fingerprintHash: $this->hashValue($fingerprintSource),
            visitorHash: $visitorHash,
            ipHash: $ipHash,
            userAgentHash: $userAgentHash,
            sessionId: $sessionId,
            visitorId: $visitorId,
            issuedVisitorCookie: $issuedVisitorCookie,
            metadata: [
                'ip_segment' => $ipSegment,
                'user_agent_family' => Str::limit($normalizedUserAgent, 120, ''),
            ],
        );
    }

    public function hashValue(string $value): string
    {
        return hash_hmac('sha256', $value, (string) config('app.key'));
    }

    protected function normalizeUserAgent(string $userAgent): string
    {
        return Str::of($userAgent)
            ->lower()
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->limit(255, '')
            ->value();
    }

    protected function coarseIpSegment(?string $ip): ?string
    {
        if (! filled($ip)) {
            return null;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);

            return implode('.', array_slice($parts, 0, 3)).'.0';
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);

            return implode(':', array_slice($parts, 0, 4)).'::';
        }

        return null;
    }
}
