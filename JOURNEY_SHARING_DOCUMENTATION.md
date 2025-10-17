# Journey Sharing Feature - Implementation Documentation

## Overview
The Journey Sharing feature has been successfully implemented in the YOURS safety app. This feature allows users to share their real-time location with selected emergency contacts at regular intervals via SMS.

## What Was Implemented

### 1. **New Components**
- **MapPinIcon**: Custom SVG icon for Journey Sharing
- **JourneySharingPage**: Complete page component with two states (initial and active)

### 2. **Core Features**

#### Initial State (Journey Not Active)
- **Explanatory Blurb**: Clear description of what Journey Sharing does
- **Update Interval Selector**: Choose from 1, 5, 10, 15, or 30 minutes (default: 5 minutes)
- **Auto-Stop Time Picker**: Optional time-based auto-stop (24-hour format)
- **Contact Selection**:
  - Select individual emergency contacts
  - "Select All" option for quick selection
  - Displays contact name and phone number
- **Battery Warning**: Prominent yellow warning about GPS battery usage
- **Start Button**: Disabled when no contacts are selected or no emergency contacts exist

#### Active State (Journey Running)
- **Status Banner**: Green indicator showing journey is active
- **Journey Information Display**:
  - Update interval (read-only)
  - List of selected contacts
  - Auto-stop time or "Running until manually stopped"
  - Next update countdown timer
- **Update History**: Log of all sent updates with timestamps
- **Stop Button**: Large red button to end journey sharing

### 3. **Location & SMS Integration**
- Uses expo-location for GPS tracking
- Uses expo-sms for SMS functionality
- Requests location permissions before starting
- Gets accurate GPS coordinates at each interval
- Generates Google Maps links from coordinates

### 4. **Message Content**

#### Initial Message (When Journey Starts)
```
Hi, [User's Name] is sharing their journey with you for safety. They are NOT in trouble - this is just a precaution.

You'll receive location updates every [X] minutes.

Starting location ([Current Time]):
[Google Maps Link]
```

#### Update Messages (Every X Minutes)
```
Location update at [Timestamp]:
[Google Maps Link]
```

#### End Message (When Journey Stops)
```
Journey sharing has ended. [User's Name] has arrived safely.
```

### 5. **State Management**
- Persistent storage using AsyncStorage
- Journey state survives app restarts
- Stores:
  - Active status
  - Selected contacts
  - Update interval
  - Auto-stop time
  - Journey start time
  - Last update timestamp
  - Update history

### 6. **Timers & Background Logic**
- **Update Timer**: Sends location at specified intervals
- **Countdown Timer**: Shows time until next update
- **Auto-Stop Check**: Monitors time for auto-stop functionality
- All timers properly cleaned up when journey ends

### 7. **Auto-Stop Functionality**
- Checks every 30 seconds if auto-stop time is reached
- Automatically sends end message when time is reached
- Resets journey state after stopping
- Shows alert to user

## File Changes

### App.js
- Added `MapPinIcon` component after line 203
- Added `JourneySharingPage` component (lines 1116-1607)
- Updated `SideMenu` to include Journey Sharing menu item (line 1913-1916)
- Added routing for 'JourneySharing' in `renderPage` (line 2050)
- Added comprehensive styles for Journey Sharing (lines 2788-3068)

## How to Test

### Prerequisites
1. Ensure all dependencies are installed:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Run on a physical device (recommended for testing SMS and location):
```bash
npm run android  # For Android
npm run ios      # For iOS
```

### Testing Steps

#### 1. Add Emergency Contacts
- Open the app
- Navigate to hamburger menu → Emergency Contacts
- Add at least one emergency contact

#### 2. Test Initial State
- Navigate to hamburger menu → Journey Sharing
- Verify explanatory text displays
- Test update interval selector (1, 5, 10, 15, 30 minutes)
- Test auto-stop time picker
- Verify contact selection checkboxes work
- Verify battery warning displays
- Verify Start button is disabled with no contacts selected

#### 3. Test Journey Start
- Select at least one contact
- Click "Start Journey Sharing"
- Grant location permission if prompted
- Verify SMS app opens with pre-filled message
- Send the message manually
- Return to app
- Verify journey is now in active state

#### 4. Test Active State
- Verify green status banner displays
- Verify journey information shows correctly
- Verify countdown timer updates every second
- Wait for next update interval to test automatic updates
- Verify update history shows sent updates

#### 5. Test Auto-Stop
- Start a new journey
- Set auto-stop time to 2-3 minutes in the future
- Wait for auto-stop time
- Verify journey stops automatically
- Verify end message is sent

#### 6. Test Manual Stop
- Start a journey
- Click "Stop Journey Sharing" button
- Verify SMS app opens with end message
- Verify journey resets to initial state

#### 7. Test State Persistence
- Start a journey
- Close the app completely
- Reopen the app
- Navigate to Journey Sharing
- Verify journey is still active with correct information

## Important Notes

### SMS Limitations
Due to platform security restrictions, messages **cannot be sent automatically**. The SMS app will open with pre-filled content, but the user must manually tap "Send" for each message. This is a platform limitation that cannot be bypassed.

### Background Location (Future Enhancement)
The current implementation uses foreground location permissions. For true background operation when the app is not actively open, you would need to:

1. Add background location permissions to app.json:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow YOURS to access your location for Journey Sharing."
        }
      ]
    ]
  }
}
```

2. Request background permission in the code:
```javascript
await Location.requestBackgroundPermissionsAsync();
```

3. Use background tasks (expo-task-manager) to continue location updates when app is closed.

### Testing Location on Emulator
- **iOS Simulator**: Can simulate location changes via Debug → Location menu
- **Android Emulator**: Can set custom GPS coordinates in Extended Controls
- **Physical Device**: Required for accurate GPS testing

### User Name Configuration
The feature uses a stored user name for messages. Currently defaults to "User". To set the user's name:
```javascript
await AsyncStorage.setItem('@user_name', 'Jessica');
```

You may want to add a settings page for users to set their name.

## Integration with Existing Features

### Emergency Contacts
Journey Sharing uses the existing emergency contacts system via the `useEmergencyContacts()` context. No additional contact management needed.

### Discreet Mode
The feature is ready for discreet mode integration. You can add checks for discreet mode status using:
```javascript
const discreetMode = await AsyncStorage.getItem('@discreet_mode_enabled');
```

Then modify notification behavior accordingly.

## Known Limitations

1. **Manual SMS Sending**: Users must manually send each message (platform limitation)
2. **Foreground Location Only**: App should remain open or in background for updates
3. **No Vibration on Ignored Messages**: Not yet implemented (can be added if needed)
4. **No Network Error Handling**: Assumes SMS and location services are available
5. **Time Format**: Auto-stop uses 24-hour format (e.g., "21:30" for 9:30 PM)

## Future Enhancements

1. **Background Location Tracking**: Use expo-task-manager for true background operation
2. **Notification System**: Add push notifications when updates are sent
3. **Delivery Confirmation**: Track if SMS was sent successfully (if API allows)
4. **Location Accuracy Indicator**: Show GPS accuracy to user
5. **Journey Templates**: Save common journey configurations
6. **Share Journey Link**: Generate a live tracking link instead of SMS
7. **Multiple Journey Types**: Different templates for dates, walking, driving, etc.
8. **Battery Optimization**: Smart interval adjustment based on battery level

## Troubleshooting

### Issue: Location permission denied
**Solution**: Check device settings and ensure location services are enabled for the app.

### Issue: SMS not available
**Solution**: Ensure device has SMS capability. Won't work on tablets without cellular.

### Issue: Journey doesn't persist after app restart
**Solution**: Verify AsyncStorage is working correctly. Check for errors in console.

### Issue: Countdown timer not updating
**Solution**: Check that the journey is actually active and timers are running.

### Issue: No contacts to select
**Solution**: Add emergency contacts first via the Emergency Contacts page.

## Color Scheme
The feature follows the app's existing color palette:
- Primary: #F472B6 (Pink)
- Secondary: #EF4444 (Red for stop/warning)
- Success: #10B981 (Green for active status)
- Warning: #F59E0B (Yellow for battery warning)
- Backgrounds: #FEF2F2, #ECFDF5, #FEF3C7

## Support
If you encounter any issues or need modifications, the main component is located at:
- **Component**: `JourneySharingPage` in App.js (lines 1116-1607)
- **Styles**: Lines 2788-3068 in App.js
- **Icon**: `MapPinIcon` (lines 204-221)

## Testing Checklist
- [ ] Add emergency contacts
- [ ] Select contacts for journey
- [ ] Start journey with different intervals
- [ ] Verify initial SMS is sent
- [ ] Wait for automatic update
- [ ] Check countdown timer updates
- [ ] Test manual stop
- [ ] Test auto-stop with time
- [ ] Verify state persists after app restart
- [ ] Test with single contact
- [ ] Test with multiple contacts
- [ ] Test "Select All" functionality
- [ ] Verify disabled states work correctly
- [ ] Test on both iOS and Android

## Conclusion
The Journey Sharing feature is fully implemented and ready for testing. All requirements from the specification have been met, with the exception of true background location tracking (which requires additional configuration) and automatic SMS sending (which is a platform limitation).

The feature integrates seamlessly with the existing app structure and follows the established design patterns and color scheme.
