/**
 * Centralized API Client
 *
 * Provides a unified interface for all API requests with:
 * - Automatic CSRF token injection
 * - Standardized error handling
 * - Retry logic for failed requests
 * - Request/response interceptors
 * - Type-safe response handling
 */

export interface ApiError {
    message: string;
    status: number;
    statusText: string;
    errors?: Record<string, string[]>;
    url?: string;
}

export interface ApiRequestOptions extends RequestInit {
    retry?: number;
    shouldRetry?: (error: ApiError) => boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more?: boolean;
}

export interface SingleResponse<T> {
    data: T;
}

// Default retry configuration
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 300;

// Check if running on server
const isServer = typeof window === 'undefined';

/**
 * Get CSRF token from meta tag
 */
function getCsrfToken(): string | null {
    if (isServer) return null;
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? null
    );
}

/**
 * Create an ApiError from a Response
 */
async function createApiError(
    response: Response,
    url: string,
    customMessage?: string,
): Promise<ApiError> {
    let errors: Record<string, string[]> | undefined;
    let message = customMessage || response.statusText || 'Request failed';

    try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            if (data.message) {
                message = data.message;
            }
            if (data.errors) {
                errors = data.errors;
            }
        }
    } catch {
        // Ignore parsing errors, use default message
    }

    return {
        message,
        status: response.status,
        statusText: response.statusText,
        errors,
        url,
    };
}

/**
 * Delay execution for retry backoff
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error should be retried
 */
function shouldRetryError(
    error: ApiError,
    customCheck?: (error: ApiError) => boolean,
): boolean {
    // Custom check takes precedence
    if (customCheck) {
        return customCheck(error);
    }

    // Default: retry on 5xx errors and 429 (rate limit)
    return error.status >= 500 || error.status === 429;
}

/**
 * Build request headers with CSRF token and common defaults
 */
function buildHeaders(
    customHeaders: HeadersInit | undefined,
    includeCsrf: boolean,
    isJson: boolean,
): HeadersInit {
    const headers: HeadersInit = {
        Accept: 'application/json',
        ...(isJson && { 'Content-Type': 'application/json' }),
        ...customHeaders,
    };

    if (includeCsrf) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            (headers as Record<string, string>)['X-CSRF-TOKEN'] = csrfToken;
        }
    }

    return headers;
}

/**
 * Core fetch with retry logic
 */
async function fetchWithRetry<T>(
    url: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const {
        retry = DEFAULT_RETRIES,
        shouldRetry: customShouldRetry,
        headers: customHeaders,
        credentials = 'include',
        ...restOptions
    } = options;

    const isJson = !!(restOptions.body && typeof restOptions.body === 'string');
    const includeCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        (options.method || 'GET').toUpperCase(),
    );

    const headers = buildHeaders(customHeaders, includeCsrf, isJson);

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
        try {
            const response = await fetch(url, {
                ...restOptions,
                headers,
                credentials,
            });

            if (!response.ok) {
                const error = await createApiError(response, url);

                // Don't retry client errors (4xx) except 429
                if (
                    error.status >= 400 &&
                    error.status < 500 &&
                    error.status !== 429
                ) {
                    throw error;
                }

                lastError = error;

                // Retry if we have attempts left and error is retryable
                if (
                    attempt < retry &&
                    shouldRetryError(error, customShouldRetry)
                ) {
                    await delay(RETRY_DELAY_MS * (attempt + 1));
                    continue;
                }

                throw error;
            }

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            // Re-throw ApiErrors
            if (error && typeof error === 'object' && 'status' in error) {
                throw error as ApiError;
            }

            // Wrap unknown errors
            const wrappedError: ApiError = {
                message:
                    error instanceof Error ? error.message : 'Network error',
                status: 0,
                statusText: 'Network Error',
                url,
            };

            // Retry network errors
            if (attempt < retry) {
                lastError = wrappedError;
                await delay(RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            throw wrappedError;
        }
    }

    // This should never be reached, but TypeScript needs it
    if (lastError) {
        throw lastError;
    }

    throw {
        message: 'Unknown error',
        status: 0,
        statusText: 'Unknown',
    } satisfies ApiError;
}

/**
 * API Client instance
 */
export const api = {
    /**
     * GET request
     */
    async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
        return fetchWithRetry<T>(url, {
            ...options,
            method: 'GET',
        });
    },

    /**
     * POST request
     */
    async post<T>(
        url: string,
        data?: unknown,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return fetchWithRetry<T>(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    /**
     * PUT request
     */
    async put<T>(
        url: string,
        data?: unknown,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return fetchWithRetry<T>(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    /**
     * PATCH request
     */
    async patch<T>(
        url: string,
        data?: unknown,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return fetchWithRetry<T>(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    /**
     * DELETE request
     */
    async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
        return fetchWithRetry<T>(url, {
            ...options,
            method: 'DELETE',
        });
    },

    /**
     * GET paginated response
     */
    async getPaginated<T>(
        url: string,
        options?: ApiRequestOptions,
    ): Promise<PaginatedResponse<T>> {
        return this.get<PaginatedResponse<T>>(url, options);
    },

    /**
     * GET single item response
     */
    async getSingle<T>(
        url: string,
        options?: ApiRequestOptions,
    ): Promise<SingleResponse<T>> {
        return this.get<SingleResponse<T>>(url, options);
    },
};

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'message' in error
    );
}

/**
 * Get user-friendly error message from ApiError
 */
export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return error.message;
    }
    return error instanceof Error
        ? error.message
        : 'An unexpected error occurred';
}

/**
 * Get validation errors from ApiError
 */
export function getValidationErrors(error: unknown): Record<string, string[]> {
    if (isApiError(error) && error.errors) {
        return error.errors;
    }
    return {};
}
