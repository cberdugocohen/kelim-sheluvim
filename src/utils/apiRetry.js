/**
 * Shared API retry utility with exponential backoff
 * Replaces 5+ duplicate implementations across the codebase
 */
export async function apiCallWithRetry(apiCall, maxRetriesOrOpts = 3, baseDelay = 2000, timeout = 30000) {
  let maxRetries, maxDelay, useTimeout;

  if (typeof maxRetriesOrOpts === 'object' && maxRetriesOrOpts !== null) {
    // Options object style: apiCallWithRetry(fn, { maxRetries, baseDelay, ... })
    ({ maxRetries = 3, baseDelay = 2000, maxDelay = 30000, timeout = 15000, useTimeout = false } = maxRetriesOrOpts);
  } else {
    // Positional style: apiCallWithRetry(fn, maxRetries, baseDelay, timeout)
    maxRetries = maxRetriesOrOpts;
    maxDelay = 60000;
    useTimeout = timeout > 0;
  }

  const totalAttempts = Math.max(1, maxRetries);

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      if (useTimeout) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );
        return await Promise.race([apiCall(), timeoutPromise]);
      }
      return await apiCall();
    } catch (error) {
      console.warn(`API call failed (attempt ${attempt}/${totalAttempts}):`, error.message);

      const isRetryable =
        error.message?.includes('Network Error') ||
        error.message?.includes('Rate limit') ||
        error.message?.includes('timeout') ||
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('timeout exceeded') ||
        (error.response && error.response.status === 429);

      if (attempt < totalAttempts && isRetryable) {
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, maxDelay);
        console.warn(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Format Israeli phone number for WhatsApp links
 * Replaces duplicate implementations in UserProfile.jsx and SpotlightProfile.jsx
 */
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '972' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('972')) {
    return '972' + cleaned;
  }
  return cleaned;
}

/**
 * Format a URL to ensure it has a protocol prefix
 */
export function formatUrl(url) {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
