import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAutofill } from '../context/AutofillContext';

export const IncidentReportForm = ({ visible, entry, onClose, onSave }) => {
  const { people, locations, addPerson, addLocation } = useAutofill();
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [location, setLocation] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('regular');
  const [description, setDescription] = useState('');

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  const incidentTypes = [
    'Physical altercation', 'Verbal conflict', 'Bullying or harassment',
    'Vandalism', 'Safety violation', 'Other'
  ];
  const severityLevels = {
    danger: { color: '#FECACA', name: 'Danger' },
    warning: { color: '#FEF08A', name: 'Warning' },
    suspicious: { color: '#E5E7EB', name: 'Suspicious' },
    regular: { color: 'white', name: 'Regular Note' },
  };

  useEffect(() => {
    if (entry) {
      setIncidentDate(new Date(entry.date));
      setPersonName(entry.personName || '');
      setRelationship(entry.relationship || '');
      setLocation(entry.location || '');
      setIncidentType(entry.incidentType || '');
      setSeverity(entry.severity || 'regular');
      setDescription(entry.description || '');
    } else {
      setIncidentDate(new Date());
      setPersonName('');
      setRelationship('');
      setLocation('');
      setIncidentType('');
      setSeverity('regular');
      setDescription('');
    }
  }, [entry, visible]);
  
  const handleNameChange = (text) => {
    setPersonName(text);
    if (text.length > 1) {
      const filtered = people.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));
      setNameSuggestions(filtered);
    } else {
      setNameSuggestions([]);
    }
  };
  
  const handleLocationChange = (text) => {
      setLocation(text);
      if (text.length > 1) {
          const filtered = locations.filter(l => l.toLowerCase().includes(text.toLowerCase()));
          setLocationSuggestions(filtered)
      } else {
          setLocationSuggestions([]);
      }
  }

  const handleSave = () => {
    if (!personName.trim() || !incidentType) {
      Alert.alert('Required Fields', 'Please fill in the person\'s name and the type of incident.');
      return;
    }
    const reportData = {
      title: `Incident with ${personName}`,
      date: incidentDate.toISOString(),
      personName: personName.trim(),
      relationship: relationship.trim(),
      location: location.trim(),
      incidentType,
      severity,
      description: description.trim(),
      isIncidentReport: true,
    };
    onSave(reportData);
    addPerson({ name: reportData.personName, relationship: reportData.relationship });
    addLocation(reportData.location);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <ScrollView style={{width: '100%'}} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1}}>
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>
              {entry ? 'Edit Incident Report' : 'New Incident Report'}
            </Text>

            <Text style={styles.label}>Date of Incident</Text>
            <TextInput
              style={styles.input}
              value={incidentDate.toLocaleDateString()}
              onChangeText={(text) => setIncidentDate(new Date(text))}
              placeholder="MM/DD/YYYY"
            />

            <Text style={styles.label}>Full Name of Person</Text>
            <TextInput style={styles.input} placeholder="e.g., John Doe" value={personName} onChangeText={handleNameChange} />
             {nameSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {nameSuggestions.map((p, i) => (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => {
                            setPersonName(p.name);
                            if(p.relationships.length > 0) setRelationship(p.relationships[0])
                            setNameSuggestions([]);
                        }}>
                           <Text>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Relationship to Person</Text>
            <TextInput style={styles.input} placeholder="e.g., Neighbor, Colleague" value={relationship} onChangeText={setRelationship} />

            <Text style={styles.label}>Location of Incident</Text>
            <TextInput style={styles.input} placeholder="e.g., 123 Main St, Anytown" value={location} onChangeText={handleLocationChange} />
            {locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {locationSuggestions.map((l, i) => (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => {
                            setLocation(l);
                            setLocationSuggestions([]);
                        }}>
                           <Text>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Type of Incident</Text>
            <View style={styles.pickerContainer}>
                {incidentTypes.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.pickerButton, incidentType === type && styles.pickerButtonSelected]}
                        onPress={() => setIncidentType(type)}
                    >
                        <Text style={styles.pickerButtonText}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Severity Level</Text>
             <View style={styles.pickerContainer}>
                {Object.keys(severityLevels).map(level => (
                    <TouchableOpacity
                        key={level}
                        style={[
                          styles.pickerButton,
                          { backgroundColor: severityLevels[level].color, borderWidth: 1, borderColor: '#D1D5DB' },
                          severity === level && styles.pickerButtonSelected
                        ]}
                        onPress={() => setSeverity(level)}
                    >
                        <Text style={styles.pickerButtonText}>{severityLevels[level].name}</Text>
                    </TouchableOpacity>
                ))}
            </View>


            <Text style={styles.label}>Description of Incident</Text>
            <TextInput
              style={[styles.input, { height: 150, textAlignVertical: 'top' }]}
              placeholder="Describe what happened..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      formModal: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        elevation: 10,
      },
      formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      },
      input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
      },
      label: {
          fontSize: 14,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 6,
      },
      pickerContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          gap: 8,
          marginBottom: 16,
      },
      pickerButton: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#D1D5DB',
          alignItems: 'center',
      },
      pickerButtonSelected: {
          borderColor: '#F472B6',
          borderWidth: 2,
      },
      pickerButtonText: {
          fontSize: 14,
          color: '#374151'
      },
      suggestionsContainer: {
          backgroundColor: '#F9FAFB',
          borderRadius: 8,
          marginTop: -12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB'
      },
      suggestionItem: {
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB'
      },
      formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
      },
      cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
      },
      cancelButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
      },
      saveButton: {
        backgroundColor: '#F472B6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginLeft: 8,
      },
      saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
});