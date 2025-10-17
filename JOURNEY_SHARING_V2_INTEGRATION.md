# Journey Sharing V2 - Firebase Integration Guide

## Overview

Journey Sharing V2 has been completely rebuilt using Firebase Realtime Database for real-time location sharing. All components, services, and utilities have been implemented and are ready for integration into your main App.js file.

## What's Been Implemented

### Core Services

1. **Firebase Configuration** (`services/firebase.js`)
   - Initializes Firebase with your provided configuration
   - Exports database instance for use throughout the app

2. **Firebase Service** (`services/firebaseService.js`)
   - `checkShareCodeAvailability()` - Validates if a share code is available
   - `pushLocationUpdate()` - Pushes encrypted location to Firebase
   - `endSharingSession()` - Ends an active sharing session
   - `fetchLocation()` - Fetches and decrypts location data
   - `listenToLocation()` - Real-time listener for location updates
   - `isSharerOffline()` - Checks if sharer is offline based on last update
   - `getTimeSinceUpdate()` - Human-readable time string

3. **Background Location Service** (`services/backgroundLocationService.js`)
   - `startBackgroundLocationTracking()` - Starts background GPS tracking with Firebase updates
   - `stopBackgroundLocationTracking()` - Stops tracking and ends session
   - `getSharingStatus()` - Gets current sharing session status
   - `extendSharingSession()` - Extends auto-stop time
   - Auto-stop functionality with notifications
   - Foreground service for Android

### Utilities

1. **Encryption** (`utils/journeySharing/encryption.js`)
   - `deriveKey()` - PBKDF2 key derivation from password + share code
   - `encryptLocation()` - AES-256 encryption of location data
   - `decryptLocation()` - Decryption with password validation
   - `validatePassword()` - Password verification

2. **Validation** (`utils/journeySharing/validation.js`)
   - `validateShareCode()` - Share code format validation
   - `validatePassword()` - Password format validation
   - `RateLimiter` class - Prevents brute force attempts (5 attempts per 15 min)

3. **Storage** (`utils/journeySharing/storage.js`)
   - Active session management (listener side)
   - Ended session history
   - Sharing session management (sharer side)
   - Location history persistence

### UI Components

1. **JourneySharingPageV2** (`components/JourneySharing/JourneySharingPageV2.js`)
   - Main Journey Sharing page with two sections:
     - "Track A Friend" section with active tracking preview
     - "Share Your Location" section with full form and controls
   - Supports both sharing (sharer) and tracking preview
   - Real-time countdown for next update
   - Session info display
   - Copy/Share functionality for share codes

2. **TrackAFriendPage** (`components/JourneySharing/TrackAFriendPage.js`)
   - Authentication form for tracking someone
   - Display name prompt after successful authentication
   - Active tracking sessions list
   - Ended sessions history
   - Rate limiting protection
   - Real-time Firebase listeners setup

3. **TrackingDetailPage** (`components/JourneySharing/TrackingDetailPage.js`)
   - Full-screen map with location markers
   - Route polyline connecting all points
   - Location timeline (chronological list)
   - Session info (status, duration, update interval)
   - Offline detection and warnings
   - Map controls (center on current, fit all points)
   - Stop tracking / Delete history actions

## Integration Steps

### Step 1: Import New Components in App.js

Add these imports near the top of your App.js:

```javascript
// Journey Sharing V2 Components
import JourneySharingPageV2 from './components/JourneySharing/JourneySharingPageV2';
import TrackAFriendPage from './components/JourneySharing/TrackAFriendPage';
import TrackingDetailPage from './components/JourneySharing/TrackingDetailPage';
```

### Step 2: Update Navigation State

Update your navigation state to support the new pages:

```javascript
const [currentPage, setCurrentPage] = React.useState('Home');
const [navigationParams, setNavigationParams] = React.useState(null);

const handleNavigate = (page, params = null) => {
  setCurrentPage(page);
  setNavigationParams(params);
};
```

### Step 3: Replace Old Journey Sharing Page

In your main component's render logic (around line 2334), replace:

```javascript
case 'JourneySharing': return <JourneySharingPage onBack={goHome} />;
```

With:

```javascript
case 'JourneySharing':
  return <JourneySharingPageV2 onBack={goHome} onNavigate={handleNavigate} />;
case 'TrackAFriend':
  return <TrackAFriendPage onBack={goBack} onNavigate={handleNavigate} />;
case 'TrackingDetail':
  return <TrackingDetailPage onBack={goBack} sessionId={navigationParams} />;
```

### Step 4: Optional - Remove Old Journey Sharing Code

You can remove or comment out the old `JourneySharingPage` component (around line 1190) since it's been replaced.

### Step 5: Test the Flow

1. **Testing Sharing:**
   - Navigate to Journey Sharing
   - Create a share code (e.g., "test-123")
   - Set a password
   - Choose update interval
   - Start sharing
   - Verify foreground service notification appears
   - Check Firebase console to see encrypted data

2. **Testing Tracking:**
   - From Journey Sharing page, tap "Track Someone's Location"
   - Enter the share code and password from step 1
   - Set a display name
   - Verify tracking starts and shows on map
   - Check that location updates appear in real-time

3. **Testing Map View:**
   - From active tracking session, tap "View Map"
   - Verify map shows route and markers
   - Test "Center on Current" and "Fit All" buttons
   - Check timeline displays all locations

## Firebase Security Rules

Apply these rules in your Firebase Console (Realtime Database → Rules):

```json
{
  "rules": {
    "locations": {
      "$shareCode": {
        ".read": true,
        ".write": true,
        ".indexOn": ["timestamp", "active", "lastUpdate"]
      }
    }
  }
}
```

## Key Features Implemented

### For Sharers (People Sharing Their Location)
- ✅ Create unique share codes (validated for availability)
- ✅ Password-protected with AES-256 encryption
- ✅ Configurable update intervals (1, 5, 10, 15, 30 minutes)
- ✅ Auto-stop timer (1-24 hours or never)
- ✅ Background location tracking (works when app closed)
- ✅ Foreground service notification (Android)
- ✅ Copy/Share via SMS functionality
- ✅ Real-time session status display
- ✅ Manual stop with confirmation
- ✅ Auto-stop with notification

### For Listeners (People Tracking Someone)
- ✅ Authenticate with share code + password
- ✅ Rate limiting (5 failed attempts per 15 min)
- ✅ Set custom display names
- ✅ Real-time Firebase listeners for updates
- ✅ Track multiple people simultaneously
- ✅ Session history preservation
- ✅ Offline detection with warnings
- ✅ Full map visualization with route
- ✅ Chronological timeline view
- ✅ Stop tracking / Delete history

### Security & Privacy
- ✅ End-to-end encryption (AES-256)
- ✅ PBKDF2 key derivation (10,000 iterations)
- ✅ Share code as salt for consistency
- ✅ No passwords stored in Firebase
- ✅ Only encrypted data transmitted
- ✅ Rate limiting to prevent brute force
- ✅ Client-side encryption/decryption only

### Background Operation
- ✅ Background location tracking for sharers
- ✅ Background Firebase listeners for trackers
- ✅ Foreground service (Android) for reliability
- ✅ Auto-stop with cleanup
- ✅ Session persistence across app restarts

## Known Limitations & Future Enhancements

### Current Limitations
1. **Location History Grouping**: Timeline shows all points sequentially. Future enhancement could group nearby points into "stays" with duration.

2. **Reverse Geocoding**: Location names are shown as coordinates. Could add reverse geocoding to show addresses.

3. **Export/Backup**: Not yet implemented. Placeholder for future Google Drive export.

4. **Emergency Integration**: Framework is ready but emergency alerts not yet triggered by panic button.

5. **Discreet Mode Integration**: Needs to check app's discreet mode setting before showing notifications.

### Recommended Next Steps
1. Test on physical devices (not just simulator/emulator)
2. Build a development build (not Expo Go) for full background testing
3. Test battery consumption with different update intervals
4. Test with multiple concurrent tracking sessions
5. Test offline/reconnection scenarios
6. Add Discreet Mode check to notification logic
7. Integrate with existing Emergency Contacts system
8. Add export/backup functionality

## Architecture Notes

### Data Flow (Sharing)
```
1. User enters share code/password
2. Background task starts
3. Every [interval]:
   - Get GPS location
   - Encrypt with password
   - Push to Firebase at /locations/{shareCode}
4. Auto-stop or manual stop:
   - Set active: false in Firebase
   - Stop background task
   - Clear local session
```

### Data Flow (Tracking)
```
1. User authenticates with code/password
2. Fetch initial location (validates auth)
3. Set up Firebase listener
4. On each update:
   - Receive encrypted data
   - Decrypt with password
   - Store in local history
   - Update UI
5. When sharer stops:
   - Listener detects active: false
   - Move to ended sessions
   - Preserve local history
```

### Firebase Data Structure
```
/locations/
  /{shareCode}/
    encryptedData: "encrypted-json-string"
    timestamp: 1697234567890
    active: true/false
    updateInterval: 600 (seconds)
    lastUpdate: 1697234567890
```

### Encrypted Data Content
```javascript
{
  latitude: 40.7128,
  longitude: -74.0060,
  timestamp: 1697234567890
}
```

## Troubleshooting

### Location Not Updating
1. Check if location permissions are granted ("Always" for background)
2. Verify Firebase data is being written (check Firebase console)
3. Check foreground service notification is visible (Android)
4. Ensure app has battery optimization disabled

### Can't Authenticate
1. Verify share code is correct (case-sensitive)
2. Check password is exactly as entered by sharer
3. Check if rate limited (wait 15 minutes)
4. Verify sharer's session is active in Firebase

### Map Not Showing
1. Ensure react-native-maps is properly configured
2. Add Google Maps API key for Android (if needed)
3. Check location history exists (session.locationHistory array)
4. Verify coordinates are valid numbers

### Background Not Working
1. Build development build (not Expo Go)
2. Grant background location permission
3. Disable battery optimization
4. Check foreground service notification appears
5. Test on physical device, not simulator

## Support

For issues or questions:
1. Check Firebase console for encrypted data
2. Check React Native debugger for errors
3. Review background task logs
4. Test individual services separately

## Files Created

### Services
- `services/firebase.js` - Firebase initialization
- `services/firebaseService.js` - Firebase CRUD operations
- `services/backgroundLocationService.js` - Background GPS tracking

### Utils
- `utils/journeySharing/encryption.js` - Encryption/decryption
- `utils/journeySharing/validation.js` - Input validation & rate limiting
- `utils/journeySharing/storage.js` - Local storage management

### Components
- `components/JourneySharing/JourneySharingPageV2.js` - Main page
- `components/JourneySharing/TrackAFriendPage.js` - Tracking authentication
- `components/JourneySharing/TrackingDetailPage.js` - Map & timeline view

All dependencies were already installed in your project!
