import * as Notifications from 'expo-notifications';
import { ref, set, get } from 'firebase/database';
import { database } from './firebase';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  try {
    if (!Constants.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '4454e141-2909-4013-ae2d-51a4623c7a0f',
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function saveUserToken(userId, token, userData = {}) {
  try {
    await set(ref(database, `users/${userId}`), {
      expoPushToken: token,
      ...userData,
      lastUpdated: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error saving user token:', error);
    return false;
  }
}

export async function getUserToken(userId) {
  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    return snapshot.exists() ? snapshot.val().expoPushToken : null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
}

export async function sendBulkPushNotifications(tokens, title, body, data = {}) {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
}
