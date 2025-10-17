import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
// import * as Notifications from 'expo-notifications'; // REMOVED: Notification support temporarily disabled
import { pushLocationUpdate, endSharingSession } from './firebaseService';
import { getSharingSession, saveSharingSession, clearSharingSession } from '../utils/journeySharing/storage';

const LOCATION_TASK_NAME = 'JOURNEY_SHARING_BACKGROUND_LOCATION';

/**
 * Defines the background location task
 * This task runs in the background and pushes location updates to Firebase
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Background] ❌ Location task error:', error);
    return;
  }

  if (data) {
    try {
      const { locations } = data;

      console.log('==========================================');
      console.log('[Background] 📍 BACKGROUND TASK TRIGGERED');
      console.log('[Background] Time:', new Date().toLocaleTimeString());
      console.log('[Background] Locations received:', locations.length);
      console.log('==========================================');

      const location = locations[0];

      if (!location) {
        console.log('[Background] ⚠️ No location data received');
        return;
      }

      // Get the current sharing session
      const session = await getSharingSession();
      if (!session || !session.active) {
        console.log('[Background] ⚠️ No active sharing session, stopping background location');
        await stopBackgroundLocationTracking();
        return;
      }

      // Check if session has auto-stopped
      if (session.autoStopTime && Date.now() >= session.autoStopTime) {
        console.log('[Background] ⏰ Auto-stop time reached, ending session');
        await handleAutoStop(session);
        return;
      }

      // Prepare location data
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp || Date.now()
      };

      console.log('[Background] Location data:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        time: new Date(locationData.timestamp).toLocaleTimeString()
      });

      console.log('[Background] Pushing to Firebase...');

      // Push to Firebase
      await pushLocationUpdate(
        session.shareCode,
        locationData,
        session.password,
        session.updateInterval
      );

      console.log('==========================================');
      console.log('[Background] ✅ BACKGROUND PUSH SUCCESSFUL');
      console.log('[Background] Pushed at:', new Date().toLocaleTimeString());
      console.log('[Background] Next update in:', session.updateInterval, 'seconds');
      console.log('==========================================');

      // Update session last update time
      session.lastUpdateTime = Date.now();
      await saveSharingSession(session);

    } catch (err) {
      console.log('==========================================');
      console.error('[Background] ❌ BACKGROUND PUSH FAILED');
      console.error('[Background] Error:', err.message);
      console.error('[Background] Time:', new Date().toLocaleTimeString());
      console.log('==========================================');
    }
  }
});

/**
 * Starts background location tracking for sharing
 * @param {Object} config - Configuration {shareCode, password, updateInterval (in seconds), autoStopTime}
 * @returns {Promise<void>}
 */
export async function startBackgroundLocationTracking(config) {
  try {
    console.log('==========================================');
    console.log('[Background] 🚀 STARTING BACKGROUND LOCATION TRACKING');
    console.log('[Background] Share code:', config.shareCode);
    console.log('[Background] Update interval:', config.updateInterval, 'seconds');
    console.log('[Background] Update interval (minutes):', config.updateInterval / 60);
    console.log('[Background] Update interval (ms):', config.updateInterval * 1000);
    console.log('[Background] Auto-stop time:', config.autoStopTime ? new Date(config.autoStopTime).toLocaleString() : 'Never');
    console.log('==========================================');

    // Request location permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission not granted');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[Background] ⚠️ Background location permission not granted. Sharing may not work when app is closed.');
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      console.log('[Background] ⚠️ Task already registered - stopping first');
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    // Save session info
    const session = {
      shareCode: config.shareCode,
      password: config.password,
      updateInterval: config.updateInterval,
      autoStopTime: config.autoStopTime,
      active: true,
      startTime: Date.now(),
      lastUpdateTime: Date.now()
    };
    await saveSharingSession(session);

    console.log('[Background] 📱 Session saved to storage');

    // Get initial location and push it
    console.log('[Background] 📍 Getting initial location...');
    const initialLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    const locationData = {
      latitude: initialLocation.coords.latitude,
      longitude: initialLocation.coords.longitude,
      timestamp: initialLocation.timestamp || Date.now()
    };

    console.log('[Background] 🔼 Pushing initial location to Firebase...');
    await pushLocationUpdate(
      config.shareCode,
      locationData,
      config.password,
      config.updateInterval
    );

    console.log('[Background] ✅ Initial location pushed successfully');

    // Calculate interval in milliseconds
    const intervalMs = config.updateInterval * 1000;

    console.log('[Background] ⚙️ Starting location updates with config:');
    console.log('[Background]   - timeInterval:', intervalMs, 'ms');
    console.log('[Background]   - accuracy: High');
    console.log('[Background]   - distanceInterval: 0 (time-based only)');

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs, // IMPORTANT: This should be in milliseconds
      distanceInterval: 0, // Update based on time, not distance
      deferredUpdatesInterval: intervalMs,
      foregroundService: {
        notificationTitle: 'YOURS - Sharing Location',
        notificationBody: `Updates every ${config.updateInterval / 60} minutes`,
        notificationColor: '#F472B6'
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Other,
      showsBackgroundLocationIndicator: true
    });

    console.log('==========================================');
    console.log('[Background] ✅ BACKGROUND LOCATION TRACKING STARTED');
    console.log('[Background] Next update expected at:', new Date(Date.now() + intervalMs).toLocaleTimeString());
    console.log('==========================================');

  } catch (error) {
    console.log('==========================================');
    console.error('[Background] ❌ ERROR STARTING BACKGROUND LOCATION TRACKING');
    console.error('[Background] Error:', error.message);
    console.log('==========================================');
    throw error;
  }
}

/**
 * Stops background location tracking
 * @param {boolean} endSession - Whether to end the Firebase session
 * @returns {Promise<void>}
 */
export async function stopBackgroundLocationTracking(endSession = true) {
  try {
    console.log('==========================================');
    console.log('[Background] 🛑 STOPPING BACKGROUND LOCATION TRACKING');
    console.log('[Background] End session:', endSession);
    console.log('==========================================');

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      console.log('[Background] Stopping location updates...');
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('[Background] ✅ Location updates stopped');
    } else {
      console.log('[Background] ⚠️ Task not registered, nothing to stop');
    }

    if (endSession) {
      const session = await getSharingSession();
      if (session && session.shareCode) {
        console.log('[Background] Ending Firebase session...');
        await endSharingSession(session.shareCode);
        console.log('[Background] ✅ Firebase session ended');
      }
    }

    console.log('[Background] Clearing local session data...');
    await clearSharingSession();

    console.log('==========================================');
    console.log('[Background] ✅ BACKGROUND LOCATION TRACKING STOPPED');
    console.log('==========================================');

  } catch (error) {
    console.log('==========================================');
    console.error('[Background] ❌ ERROR STOPPING BACKGROUND LOCATION TRACKING');
    console.error('[Background] Error:', error.message);
    console.log('==========================================');
    throw error;
  }
}

/**
 * Handles auto-stop when time limit is reached
 * @param {Object} session - The sharing session
 * @returns {Promise<void>}
 */
async function handleAutoStop(session) {
  try {
    // End the session in Firebase
    await endSharingSession(session.shareCode);

    // Stop background tracking
    await stopBackgroundLocationTracking(false);

    // TODO: Notification feature - implement later when notifications are working
    // await sendAutoStopNotification();
    console.log('Auto-stop notification would appear here');

    console.log('Auto-stop completed');
  } catch (error) {
    console.error('Error handling auto-stop:', error);
  }
}

/**
 * Sends a notification when auto-stop occurs
 * TEMPORARILY DISABLED - Notification support will be re-enabled later
 * @returns {Promise<void>}
 */
// async function sendAutoStopNotification() {
//   try {
//     const { status } = await Notifications.getPermissionsAsync();
//     if (status !== 'granted') {
//       return;
//     }

//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: 'Location sharing has ended',
//         body: 'Your session has expired',
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.HIGH
//       },
//       trigger: null // Send immediately
//     });
//   } catch (error) {
//     console.error('Error sending auto-stop notification:', error);
//   }
// }

/**
 * Checks if background location tracking is currently running
 * @returns {Promise<boolean>}
 */
export async function isBackgroundLocationTracking() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      return false;
    }

    const session = await getSharingSession();
    return session && session.active;
  } catch (error) {
    console.error('Error checking background location status:', error);
    return false;
  }
}

/**
 * Gets the current sharing session status
 * @returns {Promise<Object|null>} Session info or null
 */
export async function getSharingStatus() {
  try {
    const session = await getSharingSession();
    if (!session || !session.active) {
      return null;
    }

    // Check if auto-stop time has passed
    if (session.autoStopTime && Date.now() >= session.autoStopTime) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting sharing status:', error);
    return null;
  }
}

/**
 * Extends the sharing session by adding more time
 * @param {number} additionalMinutes - Minutes to add
 * @returns {Promise<void>}
 */
export async function extendSharingSession(additionalMinutes) {
  try {
    const session = await getSharingSession();
    if (!session || !session.active) {
      throw new Error('No active sharing session');
    }

    if (!session.autoStopTime) {
      throw new Error('Session has no auto-stop time set');
    }

    const additionalMs = additionalMinutes * 60 * 1000;
    session.autoStopTime += additionalMs;

    await saveSharingSession(session);
    console.log(`Session extended by ${additionalMinutes} minutes`);
  } catch (error) {
    console.error('Error extending sharing session:', error);
    throw error;
  }
}

/**
 * Sets up location update notifications (Android foreground service notification)
 * TEMPORARILY DISABLED - Notification support will be re-enabled later
 * Foreground service notification is automatically handled by expo-location's foregroundService option
 */
export async function setupLocationNotifications() {
  // TODO: Re-enable notification setup when Expo Go notification issues are resolved
  // For now, foreground service notification (Android) is handled by expo-location
  console.log('Notification setup skipped - using expo-location foreground service only');

  // try {
  //   await Notifications.setNotificationHandler({
  //     handleNotification: async () => ({
  //       shouldShowAlert: true,
  //       shouldPlaySound: false,
  //       shouldSetBadge: false,
  //     }),
  //   });

  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;

  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }

  //   if (finalStatus !== 'granted') {
  //     console.warn('Notification permission not granted');
  //   }
  // } catch (error) {
  //   console.error('Error setting up location notifications:', error);
  // }
}
