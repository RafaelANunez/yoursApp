import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Category Identifiers
const SAFETY_CATEGORY = 'SAFETY_CONTROL_BANNER';
export const TIMER_EXPIRED_CATEGORY = 'TIMER_EXPIRED'; // NEW: Specific category for timer end

// Action Identifiers
export const ACTIONS = {
  FAKE_CALL: 'TRIGGER_FAKE_CALL',
  PANIC: 'TRIGGER_PANIC',
  TIMER: 'TRIGGER_TIMER',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true, // ensure sound plays for timer
    shouldSetBadge: false,
  }),
});

export async function registerSafetyNotificationActions() {
  // Register Action Category
  await Notifications.setNotificationCategoryAsync(SAFETY_CATEGORY, [
    {
      identifier: ACTIONS.FAKE_CALL,
      buttonTitle: '📞 Fake Call',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTIONS.PANIC,
      buttonTitle: '🚨 Panic',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTIONS.TIMER,
      buttonTitle: '⏱️ Timer',
      options: { opensAppToForeground: true },
    },
  ]);

  // NEW: Register Timer Expired Category (no buttons needed, just for routing)
  await Notifications.setNotificationCategoryAsync(TIMER_EXPIRED_CATEGORY, []);
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
      sound: false, // Silent for the banner itself
    },
    trigger: null,
  });
}

export async function hideSafetyBanner() {
  // We can use generic dismiss here as we WANT to kill the banner
  // But to be safe, let's only kill notifications with our category if we want to be precise.
  // For now, standard dismiss is okay for "hiding" it specifically if we knew its ID,
  // but since we don't track the ID, we might have to loop.
  // Actually, dismissAll is fine if the user explicitly requested "Turn off banner".
  // If you want to ONLY KILL THE BANNER, you'd need to track its ID when scheduling.
  // For simplicity, this remains as is for user-initiated "off" toggle.
   await Notifications.dismissAllNotificationsAsync();
}

/**
 * NEW: Safely dismisses notifications EXCEPT the safety banner.
 * Use this instead of Notifications.dismissAllNotificationsAsync() in other parts of your app.
 */
export async function dismissNonSafetyNotifications() {
    const displayed = await Notifications.getPresentedNotificationsAsync();
    for (const notification of displayed) {
        if (notification.request.content.categoryIdentifier !== SAFETY_CATEGORY) {
            await Notifications.dismissNotificationAsync(notification.request.identifier);
        }
    }
}

export function addNotificationActionListener(callbacks) {
  const { onFakeCall, onPanic, onTimer, navigation } = callbacks;

  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const actionId = response.actionIdentifier;
    // NEW: Check the category of the notification that was tapped
    const categoryId = response.notification.request.content.categoryIdentifier;

    // 1. PRIORITY CHECK: Was this the Timer Expiration notification?
    if (categoryId === TIMER_EXPIRED_CATEGORY) {
        if (onTimer) {
             onTimer();
        } else if (navigation && navigation.isReady()) {
             navigation.navigate('Timer');
        }
        return; // Stop processing, we found our match
    }

    // 2. Standard Action Buttons from Banner
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
      // 3. Default body tap (if not handled by priority check above)
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