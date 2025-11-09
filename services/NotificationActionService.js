import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Define the category identifier
const SAFETY_CATEGORY = 'SAFETY_CONTROL_BANNER';

// Action Identifiers
export const ACTIONS = {
  FAKE_CALL: 'TRIGGER_FAKE_CALL',
  PANIC: 'TRIGGER_PANIC',
  TIMER: 'TRIGGER_TIMER',
};

// Configure how notifications behave when received while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerSafetyNotificationActions() {
  await Notifications.setNotificationCategoryAsync(SAFETY_CATEGORY, [
    {
      identifier: ACTIONS.FAKE_CALL,
      buttonTitle: '📞 Fake Call',
      // opensAppToForeground ensures the app wakes up before we try to execute JS
      options: { opensAppToForeground: true }, 
    },
    {
      identifier: ACTIONS.PANIC,
      buttonTitle: '🚨 Panic',
      // keeping this true for now to ensure standard panic screen loads reliably
      options: { opensAppToForeground: true }, 
    },
    {
      identifier: ACTIONS.TIMER,
      buttonTitle: '⏱️ Timer',
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function showSafetyBanner() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛡️ Yours App Safety Mode',
      body: 'Quick access to safety features is active.',
      categoryIdentifier: SAFETY_CATEGORY,
      autoDismiss: false,
      sticky: Platform.OS === 'android',
      color: '#FF0000',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
}

export async function hideSafetyBanner() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * UPDATED LISTENER: accepts an object of specific callbacks
 */
export function addNotificationActionListener(callbacks) {
  const { onFakeCall, onPanic, onTimer, navigation } = callbacks;

  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const actionId = response.actionIdentifier;

    switch (actionId) {
      case ACTIONS.FAKE_CALL:
        if (onFakeCall) onFakeCall();
        break;
      case ACTIONS.PANIC:
         if (onPanic) onPanic();
        break;
      case ACTIONS.TIMER:
        if (onTimer) {
             onTimer();
        } else if (navigation && navigation.isReady()) {
             navigation.navigate('Timer');
        }
        break;
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        if (navigation && navigation.isReady()) {
             navigation.navigate('Home');
        }
        break;
      default:
        break;
    }
  });

  return subscription;
}