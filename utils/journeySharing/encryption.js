import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

/**
 * Generate random bytes using expo-crypto (React Native compatible)
 */
function getSecureRandomBytes(length) {
  const randomBytes = Crypto.getRandomBytes(length);
  // Convert Uint8Array to WordArray for crypto-js
  const words = [];
  for (let i = 0; i < randomBytes.length; i += 4) {
    words.push(
      (randomBytes[i] << 24) |
      (randomBytes[i + 1] << 16) |
      (randomBytes[i + 2] << 8) |
      (randomBytes[i + 3])
    );
  }
  return CryptoJS.lib.WordArray.create(words, randomBytes.length);
}

/**
 * Derives an encryption key from a password and share code using PBKDF2
 * @param {string} password - User's password
 * @param {string} shareCode - Share code (used as salt)
 * @returns {Object} Derived key
 */
export function deriveKey(password, shareCode) {
  try {
    const key = CryptoJS.PBKDF2(password, shareCode, {
      keySize: 256 / 32,
      iterations: 10000
    });
    return key;
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Encrypts location data using AES-256
 * @param {Object} location - {latitude, longitude, timestamp}
 * @param {string} password - User's password
 * @param {string} shareCode - Share code (used as salt)
 * @returns {string} Encrypted data string
 */
export function encryptLocation(location, password, shareCode) {
  try {
    const key = deriveKey(password, shareCode);
    const locationJson = JSON.stringify(location);

    // Generate IV using expo-crypto
    const iv = getSecureRandomBytes(16);

    // Encrypt with explicit IV
    const encrypted = CryptoJS.AES.encrypt(locationJson, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Return IV + encrypted data (both as strings)
    const result = {
      iv: iv.toString(CryptoJS.enc.Base64),
      data: encrypted.toString()
    };

    return JSON.stringify(result);
  } catch (error) {
    console.error('Error encrypting location:', error);
    throw new Error('Failed to encrypt location data');
  }
}

/**
 * Decrypts location data
 * @param {string} encryptedData - Encrypted location string (JSON with IV and data)
 * @param {string} password - User's password
 * @param {string} shareCode - Share code (used as salt)
 * @returns {Object} Decrypted location {latitude, longitude, timestamp}
 */
export function decryptLocation(encryptedData, password, shareCode) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data');
    }

    // Parse IV and encrypted data
    let encryptedObj;
    try {
      encryptedObj = JSON.parse(encryptedData);
    } catch (e) {
      console.error('Error parsing encrypted data:', e);
      throw new Error('Invalid encrypted data format');
    }

    if (!encryptedObj.iv || !encryptedObj.data) {
      throw new Error('Missing IV or data in encrypted payload');
    }

    const key = deriveKey(password, shareCode);
    const iv = CryptoJS.enc.Base64.parse(encryptedObj.iv);

    // Decrypt with explicit IV
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedObj.data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert to UTF-8 string
    let locationJson = '';
    try {
      locationJson = decryptedBytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error('Error converting to UTF-8:', e);
      throw new Error('Decryption failed - invalid password');
    }

    if (!locationJson || locationJson === '') {
      throw new Error('Decryption failed - wrong password');
    }

    // Parse JSON
    let location;
    try {
      location = JSON.parse(locationJson);
    } catch (e) {
      console.error('Error parsing location JSON:', e);
      throw new Error('Invalid password or corrupted data');
    }

    // Validate structure
    if (!location || typeof location !== 'object') {
      throw new Error('Invalid location data structure');
    }

    if (!location.latitude || !location.longitude) {
      throw new Error('Missing latitude or longitude');
    }

    return location;
  } catch (error) {
    console.error('Decryption error:', error.message);

    // Provide user-friendly error messages
    if (error.message.includes('wrong password') ||
        error.message.includes('Invalid password') ||
        error.message.includes('JSON')) {
      throw new Error('Invalid password');
    }

    throw new Error('Failed to decrypt location data');
  }
}
