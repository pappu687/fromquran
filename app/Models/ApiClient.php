<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ApiClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_key',
        'kalimat_api_key',
        'internal_api',
        'active',
        'request_quota',
        'requests_count',
        'current_period_requests_count',
        'current_period_ends_at',
    ];

    protected $casts = [
        'internal_api' => 'boolean',
        'active' => 'boolean',
        'request_quota' => 'integer',
        'requests_count' => 'integer',
        'current_period_requests_count' => 'integer',
        'current_period_ends_at' => 'datetime',
    ];

    protected $hidden = [
        'api_key',
        'kalimat_api_key',
    ];

    /**
     * Get the request stats for the API client.
     */
    public function requestStats(): HasMany
    {
        return $this->hasMany(ApiClientRequestStats::class);
    }

    /**
     * Scope a query to only include active clients.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope a query to only include internal clients.
     */
    public function scopeInternal($query)
    {
        return $query->where('internal_api', true);
    }

    /**
     * Scope a query to only include external clients.
     */
    public function scopeExternal($query)
    {
        return $query->where('internal_api', false);
    }

    /**
     * Generate new API key.
     */
    public static function generateApiKey(): string
    {
        return 'quran_' . Str::random(32);
    }

    /**
     * Regenerate API key.
     */
    public function regenerateApiKey(): string
    {
        $this->api_key = static::generateApiKey();
        $this->save();
        return $this->api_key;
    }

    /**
     * Check if client has quota available.
     */
    public function hasQuotaAvailable(): bool
    {
        if (is_null($this->request_quota)) {
            return true;
        }

        return $this->current_period_requests_count < $this->request_quota;
    }

    /**
     * Get remaining quota.
     */
    public function getRemainingQuota(): int
    {
        if (is_null($this->request_quota)) {
            return -1; // Unlimited
        }

        return max(0, $this->request_quota - $this->current_period_requests_count);
    }

    /**
     * Get quota usage percentage.
     */
    public function getQuotaUsagePercentage(): float
    {
        if (is_null($this->request_quota)) {
            return 0.0;
        }

        return ($this->current_period_requests_count / $this->request_quota) * 100;
    }

    /**
     * Check if quota period has expired and reset if needed.
     */
    public function checkAndResetQuotaPeriod(): void
    {
        if ($this->current_period_ends_at && now()->isAfter($this->current_period_ends_at)) {
            $this->resetQuotaPeriod();
        }
    }

    /**
     * Reset quota period.
     */
    public function resetQuotaPeriod(): void
    {
        $this->current_period_requests_count = 0;
        $this->current_period_ends_at = now()->addMonth();
        $this->save();
    }

    /**
     * Record API request.
     */
    public function recordRequest(): bool
    {
        $this->checkAndResetQuotaPeriod();

        if (!$this->hasQuotaAvailable()) {
            return false;
        }

        $this->increment('requests_count');
        $this->increment('current_period_requests_count');
        $this->save();

        // Record daily stats
        $today = now()->toDateString();
        $stats = $this->requestStats()->firstOrCreate(['date' => $today]);
        $stats->increment('requests_count');

        return true;
    }

    /**
     * Get request statistics for date range.
     */
    public function getRequestStats($startDate, $endDate)
    {
        return $this->requestStats()
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->get();
    }

    /**
     * Get total requests for today.
     */
    public function getTodayRequests(): int
    {
        $today = now()->toDateString();
        $stats = $this->requestStats()->where('date', $today)->first();
        return $stats ? $stats->requests_count : 0;
    }

    /**
     * Get total requests for current period.
     */
    public function getCurrentPeriodRequests(): int
    {
        return $this->current_period_requests_count;
    }

    /**
     * Get client type label.
     */
    public function getTypeLabel(): string
    {
        return $this->internal_api ? 'Internal' : 'External';
    }

    /**
     * Get status label.
     */
    public function getStatusLabel(): string
    {
        return $this->active ? 'Active' : 'Inactive';
    }

    /**
     * Check if client is over quota limit.
     */
    public function isOverQuota(): bool
    {
        return !$this->hasQuotaAvailable();
    }

    /**
     * Get quota status color.
     */
    public function getQuotaStatusColor(): string
    {
        $percentage = $this->getQuotaUsagePercentage();

        if ($percentage >= 90) {
            return 'red';
        } elseif ($percentage >= 70) {
            return 'yellow';
        } else {
            return 'green';
        }
    }
}