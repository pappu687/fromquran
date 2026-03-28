<?php

namespace App\Services\ViewCounter;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BotDetector
{
    public function detect(Request $request): BotDetectionResult
    {
        if (! config('view_counter.bot_filter_enabled', true)) {
            return new BotDetectionResult(false, false);
        }

        $userAgent = Str::lower((string) $request->userAgent());
        $signals = [];

        if (in_array($request->method(), ['HEAD', 'OPTIONS'], true)) {
            return new BotDetectionResult(true, true, 'unsupported_method', [
                'method' => $request->method(),
            ]);
        }

        foreach (config('view_counter.suspicious_user_agents', []) as $needle) {
            if ($needle !== '' && Str::contains($userAgent, Str::lower($needle))) {
                return new BotDetectionResult(true, true, 'suspicious_user_agent', [
                    'needle' => $needle,
                ]);
            }
        }

        if (config('view_counter.trust_cloudflare_headers', true)) {
            $verifiedBotCategory = $request->header('CF-Verified-Bot-Category');

            if (filled($verifiedBotCategory)) {
                return new BotDetectionResult(true, true, 'cloudflare_verified_bot', [
                    'category' => $verifiedBotCategory,
                ]);
            }

            $botScore = $request->header('CF-Bot-Score');

            if (is_numeric($botScore)) {
                $score = (int) $botScore;

                if ($score <= config('view_counter.cloudflare_bot_score_block_threshold', 30)) {
                    return new BotDetectionResult(true, true, 'cloudflare_low_bot_score', [
                        'score' => $score,
                    ]);
                }

                if ($score <= config('view_counter.cloudflare_bot_score_suspicious_threshold', 45)) {
                    $signals['cloudflare_bot_score'] = $score;
                }
            }
        }

        if ($request->header('Accept') === '*/*' && ! $request->headers->has('Accept-Language')) {
            $signals['generic_accept_header'] = true;
        }

        if (! $request->headers->has('Sec-Fetch-Mode') && ! $request->headers->has('Sec-CH-UA')) {
            $signals['missing_browser_hints'] = true;
        }

        return new BotDetectionResult(
            isBot: false,
            isSuspicious: $signals !== [],
            reason: $signals !== [] ? 'suspicious_request_pattern' : null,
            signals: $signals,
        );
    }
}
