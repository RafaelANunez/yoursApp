import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { PageHeader } from '../components/PageHeader';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { saveGeofence, getGeofence, getActiveGeofences } from '../services/geofenceStorage';
import { updateGeofenceMonitoring } from '../services/geofencingService';
import * as Location from 'expo-location';

const RADIUS_OPTIONS = [
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '200m', value: 200 },
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
];

export default function CreateGeofencePage({ onBack, geofenceId }) {
  const { contacts } = useEmergencyContacts();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(100);
  const [notifyOnArrival, setNotifyOnArrival] = useState(true);
  const [notifyOnDeparture, setNotifyOnDeparture] = useState(true);
  const [notifyAll, setNotifyAll] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const isEditMode = !!geofenceId;

  useEffect(() => {
    initializeLocation();
    if (isEditMode) {
      loadGeofenceData();
    }
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use geofences');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadGeofenceData = async () => {
    try {
      const geofence = await getGeofence(geofenceId);
      if (geofence) {
        setName(geofence.name);
        setLocation({
          latitude: geofence.latitude,
          longitude: geofence.longitude,
        });
        setRegion({
          latitude: geofence.latitude,
          longitude: geofence.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setRadius(geofence.radius);
        setNotifyOnArrival(geofence.notifyOnArrival);
        setNotifyOnDeparture(geofence.notifyOnDeparture);

        if (geofence.notifyContacts === 'all') {
          setNotifyAll(true);
          setSelectedContacts([]);
        } else {
          setNotifyAll(false);
          setSelectedContacts(geofence.notifyContacts);
        }
      }
    } catch (error) {
      console.error('Error loading geofence:', error);
      Alert.alert('Error', 'Failed to load geofence data');
    }
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setLocation(coordinate);
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a location name');
      return;
    }

    if (!location) {
      Alert.alert('Validation Error', 'Please select a location on the map');
      return;
    }

    if (!notifyOnArrival && !notifyOnDeparture) {
      Alert.alert('Validation Error', 'Please enable at least one notification type');
      return;
    }

    if (!notifyAll && selectedContacts.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one contact or choose "All Contacts"');
      return;
    }

    try {
      setLoading(true);

      const geofence = {
        id: isEditMode ? geofenceId : `geofence_${Date.now()}`,
        name: name.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        radius,
        notifyOnArrival,
        notifyOnDeparture,
        notifyContacts: notifyAll ? 'all' : selectedContacts,
        active: true,
        createdAt: isEditMode ? (await getGeofence(geofenceId)).createdAt : Date.now(),
        lastTriggered: null,
      };

      await saveGeofence(geofence);

      // Update monitoring
      const activeGeofences = await getActiveGeofences();
      await updateGeofenceMonitoring(activeGeofences);

      Alert.alert(
        'Success',
        `Geofence ${isEditMode ? 'updated' : 'created'} successfully`,
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      console.error('Error saving geofence:', error);
      Alert.alert('Error', 'Failed to save geofence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.fullPage}>
      <PageHeader title={isEditMode ? 'Edit Geofence' : 'Create Geofence'} onBack={onBack} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Home, Work, Gym"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Location</Text>
          <Text style={styles.sectionSubtitle}>Tap on the map to set location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
            >
              {location && (
                <>
                  <Marker coordinate={location} />
                  <Circle
                    center={location}
                    radius={radius}
                    strokeColor="#F9A8D4"
                    strokeWidth={2}
                    fillColor="rgba(249, 168, 212, 0.2)"
                  />
                </>
              )}
            </MapView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Radius</Text>
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radiusButton,
                  radius === option.value && styles.radiusButtonSelected,
                ]}
                onPress={() => setRadius(option.value)}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    radius === option.value && styles.radiusButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Notify on arrival</Text>
            <Switch
              value={notifyOnArrival}
              onValueChange={setNotifyOnArrival}
              trackColor={{ false: '#D1D5DB', true: '#F9A8D4' }}
              thumbColor={notifyOnArrival ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Notify on departure</Text>
            <Switch
              value={notifyOnDeparture}
              onValueChange={setNotifyOnDeparture}
              trackColor={{ false: '#D1D5DB', true: '#F9A8D4' }}
              thumbColor={notifyOnDeparture ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Contacts to Notify</Text>
          <TouchableOpacity
            style={styles.contactOption}
            onPress={() => {
              setNotifyAll(true);
              setSelectedContacts([]);
            }}
          >
            <View style={styles.radioButton}>
              {notifyAll && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.contactOptionText}>All Emergency Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactOption}
            onPress={() => setNotifyAll(false)}
          >
            <View style={styles.radioButton}>
              {!notifyAll && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.contactOptionText}>Select Individual Contacts</Text>
          </TouchableOpacity>

          {!notifyAll && (
            <View style={styles.contactsList}>
              {contacts.length === 0 ? (
                <Text style={styles.noContactsText}>No emergency contacts available</Text>
              ) : (
                contacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCheckbox}
                    onPress={() => toggleContactSelection(contact.id)}
                  >
                    <View style={styles.checkbox}>
                      {selectedContacts.includes(contact.id) && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : isEditMode ? 'Update Geofence' : 'Create Geofence'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullPage: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  map: {
    flex: 1,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  radiusButtonSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F9A8D4',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  radiusButtonTextSelected: {
    color: '#F9A8D4',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#374151',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F9A8D4',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F9A8D4',
  },
  contactOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  contactsList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  contactCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#F9A8D4',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#F9A8D4',
  },
  contactName: {
    fontSize: 14,
    color: '#374151',
  },
  noContactsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#F9A8D4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
