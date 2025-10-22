import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const LOCATION_HISTORY_KEY = '@location_history';
const LOCATION_LABELS_KEY = '@location_labels';
const LOCATION_SETTINGS_KEY = '@location_history_settings';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  updateInterval: 10, // minutes
  autoDeletePeriod: 'never', // 'never', '7days', '30days', '90days', '180days', '365days'
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Format duration in seconds to human-readable format
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '< 1m';
  }
};

/**
 * Get location history settings
 */
export const getLocationSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
    return settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting location settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save location history settings
 */
export const saveLocationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving location settings:', error);
    return false;
  }
};

/**
 * Get all location history entries
 */
export const getLocationHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting location history:', error);
    return [];
  }
};

/**
 * Save location history entries
 */
export const saveLocationHistory = async (history) => {
  try {
    await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving location history:', error);
    return false;
  }
};

/**
 * Add a new location ping to history
 * This function handles grouping logic - if the new location is within
 * 75 meters of the last location, it groups them together
 */
export const addLocationPing = async (latitude, longitude) => {
  try {
    const history = await getLocationHistory();
    const labels = await getLocationLabels();
    const timestamp = new Date().toISOString();

    // Find matching label within 100m radius
    let matchingLabel = null;
    for (const label of labels) {
      const distance = calculateDistance(latitude, longitude, label.latitude, label.longitude);
      if (distance <= label.radius) {
        matchingLabel = label.label;
        break;
      }
    }

    // Check if we should group with the last entry
    if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      const distance = calculateDistance(
        latitude,
        longitude,
        lastEntry.latitude,
        lastEntry.longitude
      );

      // Group if within 75 meters (vicinity threshold)
      if (distance <= 75) {
        // Update the last entry
        lastEntry.endTimestamp = timestamp;
        const startTime = new Date(lastEntry.timestamp);
        const endTime = new Date(timestamp);
        lastEntry.duration = Math.floor((endTime - startTime) / 1000); // duration in seconds
        lastEntry.isGrouped = true;

        // Update label if we found one and it's different
        if (matchingLabel && !lastEntry.label) {
          lastEntry.label = matchingLabel;
        }

        await saveLocationHistory(history);
        return lastEntry;
      }
    }

    // Create new entry if not grouping
    const newEntry = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      latitude,
      longitude,
      timestamp,
      endTimestamp: null,
      duration: 0,
      label: matchingLabel,
      isGrouped: false,
    };

    history.push(newEntry);
    await saveLocationHistory(history);
    return newEntry;
  } catch (error) {
    console.error('Error adding location ping:', error);
    return null;
  }
};

/**
 * Get location labels
 */
export const getLocationLabels = async () => {
  try {
    const labelsJson = await AsyncStorage.getItem(LOCATION_LABELS_KEY);
    return labelsJson ? JSON.parse(labelsJson) : [];
  } catch (error) {
    console.error('Error getting location labels:', error);
    return [];
  }
};

/**
 * Save location labels
 */
export const saveLocationLabels = async (labels) => {
  try {
    await AsyncStorage.setItem(LOCATION_LABELS_KEY, JSON.stringify(labels));
    return true;
  } catch (error) {
    console.error('Error saving location labels:', error);
    return false;
  }
};

/**
 * Add or update a location label
 */
export const addLocationLabel = async (latitude, longitude, label, radius = 100) => {
  try {
    const labels = await getLocationLabels();

    // Check if a label already exists for this location
    const existingIndex = labels.findIndex(l => {
      const distance = calculateDistance(latitude, longitude, l.latitude, l.longitude);
      return distance <= 50; // Within 50m, consider it the same location
    });

    const newLabel = {
      id: existingIndex >= 0 ? labels[existingIndex].id : `label_${Date.now()}`,
      label,
      latitude,
      longitude,
      radius,
      createdAt: existingIndex >= 0 ? labels[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      labels[existingIndex] = newLabel;
    } else {
      labels.push(newLabel);
    }

    await saveLocationLabels(labels);

    // Update all history entries within radius to use this label
    const history = await getLocationHistory();
    let updated = false;
    for (const entry of history) {
      const distance = calculateDistance(latitude, longitude, entry.latitude, entry.longitude);
      if (distance <= radius) {
        entry.label = label;
        updated = true;
      }
    }
    if (updated) {
      await saveLocationHistory(history);
    }

    return newLabel;
  } catch (error) {
    console.error('Error adding location label:', error);
    return null;
  }
};

/**
 * Remove a location label
 */
export const removeLocationLabel = async (labelId) => {
  try {
    const labels = await getLocationLabels();
    const filteredLabels = labels.filter(l => l.id !== labelId);
    await saveLocationLabels(filteredLabels);
    return true;
  } catch (error) {
    console.error('Error removing location label:', error);
    return false;
  }
};

/**
 * Filter location history by timeframe
 */
export const filterLocationsByTimeframe = (history, timeframe, customStart = null, customEnd = null) => {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return history.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate < endOfYesterday;
      });
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'custom':
      if (customStart && customEnd) {
        return history.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= new Date(customStart) && entryDate <= new Date(customEnd);
        });
      }
      return history;
    default:
      return history;
  }

  return history.filter(entry => new Date(entry.timestamp) >= startDate);
};

/**
 * Clear location history for a specific timeframe
 */
export const clearLocationHistory = async (timeframe = 'all', customStart = null, customEnd = null) => {
  try {
    const history = await getLocationHistory();

    if (timeframe === 'all') {
      await saveLocationHistory([]);
      return true;
    }

    const toDelete = filterLocationsByTimeframe(history, timeframe, customStart, customEnd);
    const toDeleteIds = new Set(toDelete.map(entry => entry.id));
    const remainingHistory = history.filter(entry => !toDeleteIds.has(entry.id));

    await saveLocationHistory(remainingHistory);
    return true;
  } catch (error) {
    console.error('Error clearing location history:', error);
    return false;
  }
};

/**
 * Auto-delete old location history based on settings
 */
export const autoDeleteOldHistory = async () => {
  try {
    const settings = await getLocationSettings();
    if (settings.autoDeletePeriod === 'never') {
      return false;
    }

    const history = await getLocationHistory();
    const now = new Date();
    let cutoffDate;

    switch (settings.autoDeletePeriod) {
      case '7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '180days':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '365days':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return false;
    }

    const filteredHistory = history.filter(entry => {
      return new Date(entry.timestamp) >= cutoffDate;
    });

    if (filteredHistory.length !== history.length) {
      await saveLocationHistory(filteredHistory);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error auto-deleting old history:', error);
    return false;
  }
};

/**
 * Get location history stats
 */
export const getLocationStats = async () => {
  try {
    const history = await getLocationHistory();
    const labels = await getLocationLabels();

    return {
      totalLocations: history.length,
      totalLabels: labels.length,
      oldestEntry: history.length > 0 ? history[0].timestamp : null,
      newestEntry: history.length > 0 ? history[history.length - 1].timestamp : null,
    };
  } catch (error) {
    console.error('Error getting location stats:', error);
    return null;
  }
};
