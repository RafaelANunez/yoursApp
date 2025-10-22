/**
 * Validates a share code format
 * @param {string} code - The share code to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateShareCode(code) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Share code is required' };
  }

  if (code.length < 6 || code.length > 12) {
    return { valid: false, error: 'Share code must be 6-12 characters' };
  }

  // Only allow alphanumeric and hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(code)) {
    return { valid: false, error: 'Share code can only contain letters, numbers, and hyphens' };
  }

  return { valid: true, error: null };
}

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validatePassword(password) {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  return { valid: true, error: null };
}

/**
 * Rate limiting for authentication attempts
 * Tracks failed attempts and blocks after 5 failures within 15 minutes
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map(); // shareCode -> [{timestamp, success}]
  }

  /**
   * Records an authentication attempt
   * @param {string} shareCode - The share code
   * @param {boolean} success - Whether the attempt was successful
   * @returns {boolean} True if attempt is allowed, false if rate limited
   */
  recordAttempt(shareCode, success) {
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);

    // Get existing attempts, filter out old ones
    let shareCodeAttempts = this.attempts.get(shareCode) || [];
    shareCodeAttempts = shareCodeAttempts.filter(
      attempt => attempt.timestamp > fifteenMinutesAgo
    );

    // If success, clear all attempts for this share code
    if (success) {
      this.attempts.set(shareCode, []);
      return true;
    }

    // Count recent failed attempts
    const recentFailures = shareCodeAttempts.filter(a => !a.success).length;

    if (recentFailures >= 5) {
      // Rate limited
      return false;
    }

    // Record this attempt
    shareCodeAttempts.push({ timestamp: now, success });
    this.attempts.set(shareCode, shareCodeAttempts);

    return true;
  }

  /**
   * Checks if a share code is currently rate limited
   * @param {string} shareCode - The share code to check
   * @returns {Object} {limited: boolean, remainingTime: number}
   */
  checkRateLimit(shareCode) {
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);

    let shareCodeAttempts = this.attempts.get(shareCode) || [];
    shareCodeAttempts = shareCodeAttempts.filter(
      attempt => attempt.timestamp > fifteenMinutesAgo
    );

    const recentFailures = shareCodeAttempts.filter(a => !a.success);

    if (recentFailures.length >= 5) {
      const oldestFailure = recentFailures[0].timestamp;
      const unlockTime = oldestFailure + (15 * 60 * 1000);
      const remainingTime = Math.max(0, unlockTime - now);

      return {
        limited: true,
        remainingTime,
        remainingMinutes: Math.ceil(remainingTime / 60000)
      };
    }

    return { limited: false, remainingTime: 0 };
  }

  /**
   * Clears all attempts for a share code
   * @param {string} shareCode - The share code
   */
  clearAttempts(shareCode) {
    this.attempts.delete(shareCode);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
