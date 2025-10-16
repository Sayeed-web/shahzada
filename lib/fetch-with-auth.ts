import { getSession, signOut } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
  retries?: number
  retryDelay?: number
}

interface RefreshTokenResponse {
  accessToken: string
  error?: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const TOKEN_REFRESH_URL = '/api/auth/refresh'

// Use a mutex to prevent multiple refresh attempts
let isRefreshing = false
let refreshPromise: Promise<RefreshTokenResponse> | null = null
let lastRefreshTime = 0

async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  try {
    // Prevent concurrent refresh attempts
    if (isRefreshing) {
      if (!refreshPromise) {
        refreshPromise = new Promise<RefreshTokenResponse>(resolve => {
          setTimeout(() => resolve({ accessToken: '', error: 'Refresh timeout' }), 10000);
        });
      }
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = new Promise(async (resolve) => {
      try {
        // Check if we've refreshed recently (within 10 seconds)
        const now = Date.now();
        if (now - lastRefreshTime < 10000) {
          const session = await getSession();
          if (session?.user?.token) {
            resolve({ accessToken: session.user.token });
            return;
          }
        }
        
        lastRefreshTime = now;
    
        const session = await getSession()
        if (!session?.user?.refreshToken) {
          resolve({ accessToken: '', error: 'No refresh token available' });
          return;
        }

        const response = await fetch(TOKEN_REFRESH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: session.user.refreshToken,
          }),
          cache: 'no-store',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          resolve({ accessToken: '', error: errorData.message || 'Failed to refresh token' });
          return;
        }

        const data = await response.json()
        resolve({ accessToken: data.accessToken });
      } catch (error) {
        console.error('Token refresh failed:', error)
        resolve({ accessToken: '', error: error instanceof Error ? error.message : 'Token refresh failed' });
      } finally {
        isRefreshing = false;
      }
    });
    
    return refreshPromise;
  } catch (error) {
    console.error('Token refresh outer error:', error);
    isRefreshing = false;
    refreshPromise = null;
    return { accessToken: '', error: error instanceof Error ? error.message : 'Token refresh failed' };
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const session = await getSession()
  if (!session?.user) return null

  // Check if token is expired or will expire soon (within 5 minutes)
  const tokenExpiry = session.expires ? new Date(session.expires) : null
  const isExpiringSoon = tokenExpiry && tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000

  if (!isExpiringSoon && session.user.token) {
    return session.user.token
  }

  // Refresh token if expiring soon
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
  }

  const result = await refreshPromise
  refreshPromise = null

  if (result.error) {
    // Token refresh failed, sign out user if it's an authentication error
    if (result.error.includes('token') || result.error.includes('auth')) {
      await signOut({ redirect: false })
      window.location.href = '/auth/signin?error=session_expired'
    }
    return null
  }

  return result.accessToken
}

export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    skipAuth = false,
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchOptions
  } = options

  if (skipAuth) {
    return fetch(url, fetchOptions)
  }

  let lastError: Error | null = null
  let attempt = 0

  while (attempt < retries) {
    try {
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        throw new Error('No valid access token available')
      }

      const headers = new Headers(fetchOptions.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)

      // Add default headers
      if (!headers.has('Content-Type') && fetchOptions.method !== 'GET' && 
          !(fetchOptions.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }

      // Add cache control for API requests
      if (url.startsWith('/api/') && !headers.has('Cache-Control')) {
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        headers.set('Pragma', 'no-cache')
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      })

      // Handle different response statuses
      if (response.status === 401) {
        // Token might be invalid, try refreshing
        refreshPromise = null // Force new refresh attempt
        
        // Only retry once for auth errors
        if (attempt > 0) {
          throw new Error('Authentication failed after token refresh')
        }
        
        throw new Error('Unauthorized')
      }

      if (response.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          variant: 'destructive',
        })
        throw new Error('Forbidden')
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay
        await new Promise(resolve => setTimeout(resolve, delay))
        throw new Error('Rate limited')
      }

      return response

    } catch (error) {
      lastError = error as Error
      attempt++

      if (attempt === retries) {
        // Final attempt failed
        toast({
          title: 'Request Failed',
          description: `Failed to complete request: ${lastError.message}`,
          variant: 'destructive',
        })
        break
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  throw lastError || new Error('Request failed')
}

// Helper function for common HTTP methods
export const authFetch = {
  get: (url: string, options: FetchOptions = {}) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),

  post: (url: string, data: any, options: FetchOptions = {}) =>
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (url: string, data: any, options: FetchOptions = {}) =>
    fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (url: string, options: FetchOptions = {}) =>
    fetchWithAuth(url, { ...options, method: 'DELETE' }),

  patch: (url: string, data: any, options: FetchOptions = {}) =>
    fetchWithAuth(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}