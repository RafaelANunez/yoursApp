import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'geofences';

export async function getAllGeofences() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting geofences:', error);
    return {};
  }
}

export async function getGeofence(geofenceId) {
  const geofences = await getAllGeofences();
  return geofences[geofenceId] || null;
}

export async function saveGeofence(geofence) {
  try {
    const geofences = await getAllGeofences();
    geofences[geofence.id] = geofence;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(geofences));
    return true;
  } catch (error) {
    console.error('Error saving geofence:', error);
    return false;
  }
}

export async function deleteGeofence(geofenceId) {
  try {
    const geofences = await getAllGeofences();
    delete geofences[geofenceId];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(geofences));
    return true;
  } catch (error) {
    console.error('Error deleting geofence:', error);
    return false;
  }
}

export async function getActiveGeofences() {
  const geofences = await getAllGeofences();
  return Object.values(geofences).filter(g => g.active);
}
