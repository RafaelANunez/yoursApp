import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getGeofence } from './geofenceStorage';
import { getUserToken, sendBulkPushNotifications } from './expoPushService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEOFENCE_TASK_NAME = 'geofence-background-task';

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  if (data.eventType === Location.GeofencingEventType.Enter) {
    await handleGeofenceEvent(data.region.identifier, 'arrival');
  } else if (data.eventType === Location.GeofencingEventType.Exit) {
    await handleGeofenceEvent(data.region.identifier, 'departure');
  }
});

async function handleGeofenceEvent(geofenceId, eventType) {
  try {
    const geofence = await getGeofence(geofenceId);
    if (!geofence) return;

    const shouldNotify = eventType === 'arrival'
      ? geofence.notifyOnArrival
      : geofence.notifyOnDeparture;

    if (!shouldNotify) return;

    // Get emergency contacts
    const contactsData = await AsyncStorage.getItem('emergencyContacts');
    if (!contactsData) return;

    const allContacts = JSON.parse(contactsData);
    let contactsToNotify = geofence.notifyContacts === 'all'
      ? allContacts
      : allContacts.filter(c => geofence.notifyContacts.includes(c.id));

    // Get tokens
    const tokens = [];
    for (const contact of contactsToNotify) {
      if (contact.userId) {
        const token = await getUserToken(contact.userId);
        if (token) tokens.push(token);
      }
    }

    if (tokens.length === 0) return;

    // Send notifications
    const title = eventType === 'arrival'
      ? `📍 Arrived at ${geofence.name}`
      : `📍 Left ${geofence.name}`;
    const body = `User has ${eventType === 'arrival' ? 'arrived at' : 'left'} ${geofence.name}`;

    await sendBulkPushNotifications(tokens, title, body, {
      type: 'geofence_notification',
      eventType,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
    });
  } catch (error) {
    console.error('Error handling geofence event:', error);
  }
}

export async function startGeofenceMonitoring(geofences) {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Background location permission not granted');
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }

    const regions = geofences.map(g => ({
      identifier: g.id,
      latitude: g.latitude,
      longitude: g.longitude,
      radius: g.radius,
      notifyOnEnter: g.notifyOnArrival,
      notifyOnExit: g.notifyOnDeparture,
    }));

    if (regions.length > 0) {
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    }
  } catch (error) {
    console.error('Error starting geofence monitoring:', error);
    throw error;
  }
}

export async function stopGeofenceMonitoring() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
  } catch (error) {
    console.error('Error stopping geofence monitoring:', error);
  }
}

export async function updateGeofenceMonitoring(geofences) {
  await stopGeofenceMonitoring();
  await startGeofenceMonitoring(geofences);
}
