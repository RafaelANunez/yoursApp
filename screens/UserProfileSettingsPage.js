import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { PageHeader } from '../components/PageHeader'; // Assuming PageHeader is reusable
import { UserIcon, MailIcon, LockIcon } from '../components/Icons'; // Assuming icons exist

const UserProfileSettingsPage = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Assuming email is stored and needed
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [currentCredentials, setCurrentCredentials] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_credentials');
      if (stored) {
        const creds = JSON.parse(stored);
        setCurrentCredentials(creds);
        setName(creds.name || '');
        setEmail(creds.email || ''); // Load email if stored
        setImageUri(creds.profilePic || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Could not load user profile.');
    }
  };

  const pickImage = async () => {
    // Permission check
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow access to photos to change profile picture.");
      return;
    }

    // Launch image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (!currentCredentials) {
      Alert.alert('Error', 'Could not load current user data.');
      return;
    }

    let updatedPassword = currentCredentials.password; // Keep old password by default

    // Password change validation
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Validation Error', 'New passwords do not match.');
        return;
      }
      updatedPassword = newPassword; // Set the new password
    }

    // Prepare updated credentials
    const updatedCredentials = {
      ...currentCredentials,
      name: name.trim(),
      // email: email.trim(), // Decide if email should be changeable
      password: updatedPassword,
      profilePic: imageUri,
    };

    try {
      // Save updated credentials
      await AsyncStorage.setItem('@user_credentials', JSON.stringify(updatedCredentials));

      // Clear password fields after saving
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack(); // Go back after saving
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Profile Settings" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.container}>
        {/* Profile Picture */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            // Basic placeholder or icon
            <View style={styles.profileImagePlaceholder}>
               <UserIcon size={40} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.imagePickerText}>Change Picture</Text>
        </TouchableOpacity>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <UserIcon style={styles.inputIcon} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email (Display Only or Editable) */}
        <View style={styles.inputGroup}>
          <MailIcon style={styles.inputIcon} color="#9CA3AF" />
          <TextInput
            style={[styles.input, styles.readOnlyInput]} // Make read-only visually/functionally if needed
            value={email}
            // onChangeText={setEmail} // Uncomment if email should be editable
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            editable={false} // Set to false if email is not changeable
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Change Password Section */}
        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.inputGroup}>
          <LockIcon style={styles.inputIcon} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="New Password (min. 6 chars)"
            placeholderTextColor="#9CA3AF"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.inputGroup}>
          <LockIcon style={styles.inputIcon} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// Add relevant styles, adapting from Login/Signup screens
const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
        backgroundColor: '#FFF8F8', // Match theme
    },
    container: {
        flex: 1,
        padding: 20,
    },
    imagePicker: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 10,
    },
     profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E5E7EB', // Placeholder background
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    imagePickerText: {
        color: '#F87171', // Main pink color
        fontSize: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FBCFE8', // Light pink border
        height: 55,
        marginBottom: 15,
        paddingHorizontal: 15,
        width: '100%',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
     readOnlyInput: {
        color: '#6B7280', // Dim color for read-only fields
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 20,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#F87171', // Main pink button
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 30,
        marginBottom: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default UserProfileSettingsPage;