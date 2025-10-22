import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getLocationSettings } from './locationHistoryStorage';

const LOCATION_HISTORY_TASK_NAME = 'location-history-tracking';

/**
 * Start background location tracking for Location History
 */
export const startLocationHistoryTracking = async () => {
  try {
    // Check if tracking is already running
    const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_HISTORY_TASK_NAME);
    if (isTracking) {
      console.log('Location History tracking is already running');
      return true;
    }

    // Get current settings
    const settings = await getLocationSettings();
    const updateIntervalMs = settings.updateInterval * 60 * 1000; // Convert minutes to milliseconds

    // Request permissions
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission not granted');
      return false;
    }

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('Background location permission not granted');
      return false;
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_HISTORY_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: updateIntervalMs,
      distanceInterval: 0, // Update based on time only
      foregroundService: {
        notificationTitle: 'Location History Tracking',
        notificationBody: 'Recording your location for safety',
        notificationColor: '#F472B6',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Other,
      showsBackgroundLocationIndicator: true,
    });

    console.log('Location History tracking started successfully');
    return true;
  } catch (error) {
    console.error('Error starting Location History tracking:', error);
    return false;
  }
};

/**
 * Stop background location tracking for Location History
 */
export const stopLocationHistoryTracking = async () => {
  try {
    const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_HISTORY_TASK_NAME);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_HISTORY_TASK_NAME);
      console.log('Location History tracking stopped successfully');
    }
    return true;
  } catch (error) {
    console.error('Error stopping Location History tracking:', error);
    return false;
  }
};

/**
 * Check if location tracking is currently running
 */
export const isLocationHistoryTrackingActive = async () => {
  try {
    return await TaskManager.isTaskRegisteredAsync(LOCATION_HISTORY_TASK_NAME);
  } catch (error) {
    console.error('Error checking tracking status:', error);
    return false;
  }
};

/**
 * Update tracking interval (stop and restart with new interval)
 */
export const updateTrackingInterval = async (newIntervalMinutes) => {
  try {
    const isTracking = await isLocationHistoryTrackingActive();
    if (isTracking) {
      await stopLocationHistoryTracking();
      // Settings will be updated by the caller before this function is called
      await startLocationHistoryTracking();
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error updating tracking interval:', error);
    return false;
  }
};
