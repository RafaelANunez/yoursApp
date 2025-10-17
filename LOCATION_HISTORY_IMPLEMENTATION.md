# Location History Feature - Implementation Documentation

## Overview

The Location History feature has been successfully implemented for the YOURS Safety App. This feature continuously tracks and displays the user's location history on a map with timeline visualization, helping users document their movements for safety and legal evidence purposes.

## Implementation Summary

### Files Created

1. **utils/locationHistoryStorage.js** - Core data storage and management utilities
   - Location history storage and retrieval
   - Location grouping logic (vicinity-based)
   - Location labeling system
   - Timeframe filtering
   - Auto-delete functionality
   - Clear history functionality

2. **utils/locationHistoryTracker.js** - Background location tracking management
   - Start/stop background tracking
   - Track location tracking status
   - Update tracking intervals

3. **components/LocationHistoryPage.js** - Main UI component
   - Master toggle with disclosure dialog
   - Map visualization with markers and routes
   - Timeline view (chronological list)
   - Location labeling UI
   - Settings section
   - Clear history UI
   - Battery warnings

### Files Modified

1. **App.js**
   - Added import for LocationHistoryPage
   - Added HistoryIcon SVG component
   - Added Location History link to SideMenu
   - Added LocationHistory case to renderPage
   - Defined background location tracking task (LOCATION_HISTORY_TASK_NAME)

2. **app.json**
   - Updated location permission descriptions
   - Configured for background location tracking

3. **package.json**
   - Added react-native-maps dependency (v1.20.1)

## Features Implemented

### ✅ Core Features

- **Master Toggle**: Enable/disable location history tracking with disclosure dialog
- **Background Location Tracking**: Continuous GPS tracking in the background
- **Location Grouping**: Automatically groups nearby location pings (within 75m) as stays
- **Map Visualization**: Interactive map showing historical locations with markers and routes
- **Timeline View**: Chronological list of locations with durations
- **Location Labeling**: Add custom labels to locations (Home, Work, etc.)
- **Timeframe Filtering**: Today, Yesterday, This Week, This Month, Custom Range
- **Settings Section**:
  - Update interval (1, 5, 10, 15, 30, 60 minutes)
  - Auto-delete period (Never, 7 days, 30 days, 90 days, 6 months, 1 year)
- **Clear History**: Delete history by timeframe
- **Battery Warnings**: Prominent battery usage notices
- **Current Location Display**: Shows user's real-time location on map
- **Permissions Handling**: Requests and manages foreground and background location permissions

### ✅ Data Management

- **Local Storage**: All data stored locally using AsyncStorage
- **Location Grouping**: Smart grouping of consecutive pings within 50-100m radius
- **Duration Tracking**: Calculates stay duration for grouped locations
- **Label Persistence**: Labels survive history clearing and auto-apply to nearby future pings
- **Auto-Delete**: Configurable automatic deletion of old history

### ✅ UI/UX Features

- **Disclosure Dialog**: Required on first enable, explains tracking and privacy
- **Permission Handling**: Clear messaging when permissions are denied
- **Tracking Status Indicators**: Shows when tracking is active or permission denied
- **Battery Warnings**: Multiple warnings about battery usage
- **Modal Dialogs**: For labeling locations and clearing history
- **Quick Labels**: Predefined labels for common locations
- **Empty States**: Clear messaging when no history exists

### 🔄 Export/Backup (Placeholders)

- Export to CSV (disabled, marked as "Coming Soon")
- Backup to Cloud (disabled, marked as "Coming Soon")

## Technical Details

### Data Structures

#### Location History Entry
```javascript
{
  id: "unique-id",
  latitude: 40.7128,
  longitude: -74.0060,
  timestamp: "2025-10-14T09:00:00Z",
  endTimestamp: "2025-10-14T11:30:00Z", // if grouped stay
  duration: 9000, // in seconds, if grouped
  label: "Coffee Shop", // if assigned, null otherwise
  isGrouped: true, // true if this represents a grouped stay
}
```

#### Location Label
```javascript
{
  id: "label-unique-id",
  label: "Home",
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 100, // meters - pings within this radius get this label
  createdAt: "2025-10-14T09:00:00Z",
  updatedAt: "2025-10-14T09:00:00Z"
}
```

#### Settings
```javascript
{
  enabled: false, // default OFF (opt-in)
  updateInterval: 10, // minutes
  autoDeletePeriod: 'never', // or '7days', '30days', '90days', '180days', '365days'
}
```

### Background Location Tracking

The background location tracking is implemented using:
- **Task Manager**: `expo-task-manager` for background task definition
- **Location API**: `expo-location` for GPS tracking
- **Task Name**: `location-history-tracking`
- **Update Interval**: Configurable (default: 10 minutes)
- **Accuracy**: Balanced (good accuracy while preserving battery)
- **Foreground Service**: Runs on Android with notification

The tracking task:
1. Receives location updates based on configured interval
2. Checks if tracking is still enabled
3. Adds location ping using grouping logic
4. Periodically runs auto-delete (every ~10 pings)

### Location Grouping Logic

Consecutive location pings are grouped when:
- Distance between pings ≤ 75 meters
- Creates a "stay" with start time, end time, and duration
- Duration is calculated from first to last ping in group

When user moves beyond 75m:
- New location entry is created
- Previous group is finalized with total duration

### Map Implementation

- **Library**: react-native-maps (Google Maps on Android, Apple Maps on iOS)
- **Features**:
  - Markers for each location
  - Polyline connecting locations chronologically
  - Current location marker (distinct color)
  - Marker tap to open labeling modal
  - Initial region centers on first historical location

### Permissions

**iOS**:
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `UIBackgroundModes: ["location"]`

**Android**:
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`

All configured in app.json with appropriate descriptions.

## Usage Instructions

### For Users

1. **Enable Location History**:
   - Open the app
   - Tap hamburger menu (☰)
   - Tap "Location History"
   - Toggle "Enable Location History" to ON
   - Read and accept the disclosure dialog
   - Grant "Always" location permission when prompted

2. **View Location History**:
   - Access Location History page from hamburger menu
   - Select timeframe filter (Today, Yesterday, Week, Month, Custom)
   - View locations on map or scroll timeline view
   - Tap any marker or timeline item to see details

3. **Label Locations**:
   - Tap a marker on the map or item in timeline
   - Enter a custom label or select a quick label
   - Labels automatically apply to future nearby pings

4. **Configure Settings**:
   - Expand the Settings section
   - Choose update interval (affects battery life)
   - Set auto-delete period if desired

5. **Clear History**:
   - Tap "Clear Location History" button
   - Select timeframe to delete
   - Confirm deletion
   - **Note**: Labels are preserved

### For Developers

1. **Add Location Ping Manually** (for testing):
```javascript
import { addLocationPing } from './utils/locationHistoryStorage';

await addLocationPing(latitude, longitude);
```

2. **Start/Stop Tracking Programmatically**:
```javascript
import {
  startLocationHistoryTracking,
  stopLocationHistoryTracking
} from './utils/locationHistoryTracker';

await startLocationHistoryTracking();
await stopLocationHistoryTracking();
```

3. **Query Location History**:
```javascript
import {
  getLocationHistory,
  filterLocationsByTimeframe
} from './utils/locationHistoryStorage';

const allHistory = await getLocationHistory();
const todayHistory = filterLocationsByTimeframe(allHistory, 'today');
```

## Testing Checklist

Before release, test the following:

### Core Functionality
- [ ] Master toggle enables/disables tracking
- [ ] Disclosure dialog appears on first enable
- [ ] Location permissions requested correctly
- [ ] Background tracking starts when enabled
- [ ] Background tracking stops when disabled
- [ ] Location pings are recorded
- [ ] Location grouping works (visit same spot multiple times)
- [ ] Duration calculated correctly for grouped stays

### UI/UX
- [ ] Map displays with markers
- [ ] Polyline connects markers correctly
- [ ] Current location shows on map
- [ ] Tapping marker opens label modal
- [ ] Timeline view shows correct data
- [ ] Tapping timeline item highlights map location
- [ ] Timeframe filters work correctly
- [ ] Custom date range works

### Location Labels
- [ ] Can add label to location
- [ ] Can edit existing label
- [ ] Can remove label
- [ ] Quick labels work
- [ ] Labels persist after app restart
- [ ] Labels auto-apply to nearby future pings
- [ ] Labels survive history clearing

### Settings
- [ ] Update interval can be changed
- [ ] Changing interval restarts tracking with new interval
- [ ] Auto-delete setting saves correctly
- [ ] Battery warning appears for intervals < 5 minutes

### Clear History
- [ ] Can clear history by timeframe
- [ ] Confirmation dialog appears
- [ ] Labels are preserved after clearing
- [ ] Map and timeline update after clearing

### Permissions & Edge Cases
- [ ] Works on both iOS and Android
- [ ] Handles denied permissions gracefully
- [ ] Works when app is closed
- [ ] Works when screen is locked
- [ ] Handles location services being disabled
- [ ] Handles permission revoked mid-tracking
- [ ] Data persists across app restarts
- [ ] No crashes when location unavailable
- [ ] Performance acceptable with many location pings

### Battery & Performance
- [ ] Battery drain is acceptable (depends on interval)
- [ ] Map renders smoothly with many markers
- [ ] Timeline scrolls smoothly
- [ ] No memory leaks
- [ ] Auto-delete runs periodically

## Known Considerations

1. **Battery Usage**: Background location tracking will drain battery. The default 10-minute interval balances accuracy and battery life. Users should be aware of this.

2. **Storage**: Location history can grow large over time. Auto-delete helps manage this.

3. **Privacy**: All data is stored locally. No data is sent to servers. Users have full control.

4. **Google Maps API**: For production, you may need to configure Google Maps API keys in app.json.

5. **Platform Differences**:
   - iOS shows native location permission dialogs
   - Android requires foreground service notification
   - Permission flows differ between platforms

## Future Enhancements

As noted in the requirements, the following are placeholders for future implementation:

1. **Export to CSV**: Export location history as CSV file
2. **Backup to Cloud**: Backup location data to Google Drive/iCloud
3. **Map Clustering**: For better performance with many markers (react-native-maps-super-cluster)
4. **Route Optimization**: More intelligent route display
5. **Location Search**: Search for specific locations in history
6. **Statistics**: Show stats like total distance traveled, most visited places, etc.

## Navigation Structure

Location History is accessible from:
- Hamburger menu → Location History
- Returns to Home page when back button is pressed

## Code Organization

```
yoursApp/
├── components/
│   └── LocationHistoryPage.js         # Main UI component
├── utils/
│   ├── locationHistoryStorage.js      # Data management
│   └── locationHistoryTracker.js      # Background tracking
├── App.js                              # Main app file (updated)
└── app.json                            # App configuration (updated)
```

## Dependencies

- `expo-location`: ~19.0.7 (already installed)
- `expo-task-manager`: ^14.0.7 (already installed)
- `@react-native-async-storage/async-storage`: ^2.2.0 (already installed)
- `react-native-maps`: 1.20.1 (newly installed)

## Conclusion

The Location History feature has been fully implemented according to the provided requirements. It includes:
- ✅ All core functionality
- ✅ Background location tracking
- ✅ Map visualization
- ✅ Timeline view
- ✅ Location labeling
- ✅ Settings and configuration
- ✅ Clear history
- ✅ Battery warnings
- ✅ Privacy-focused design
- ✅ Platform-specific handling

The feature is ready for testing on actual devices. Note that location tracking requires a physical device or emulator with location services - it cannot be tested in a browser or without GPS.

---

**Implementation Date**: October 14, 2025
**Status**: ✅ Complete
**Ready for Testing**: Yes (requires physical device with GPS)
