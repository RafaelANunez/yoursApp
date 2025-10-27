import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image,
  ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PageHeader } from '../components/PageHeader';
import { UserIcon, MailIcon, LockIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext'; 

const UserProfileSettingsPage = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || ''); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUri, setImageUri] = useState(user?.profilePic || null);

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
      // --- START OF FIX ---
      // 1. Request the image as a Base64 string instead of a file URI
      base64: true,
      // --- END OF FIX ---
    });

    if (!result.canceled) {
      // --- START OF FIX ---
      // 2. Create a "data URI" from the Base64 string
      // This is a self-contained string that Image components can render
      setImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
      // --- END OF FIX ---
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      Alert.alert('Error', 'Could not load current user data.');
      return;
    }
    
    let updatedPassword = user.password; 

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
      updatedPassword = newPassword; 
    }

    const updatedCredentials = {
      name: name.trim(),
      password: updatedPassword,
      profilePic: imageUri, // This is now the base64 data URI
    };

    try {
      await updateUser(updatedCredentials);
      setNewPassword('');
      setConfirmPassword('');
      navigation.goBack(); 
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
            // The Image component can render base64 data URIs perfectly
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
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

        {/* Email (Display Only) */}
        <View style={styles.inputGroup}>
          <MailIcon style={styles.inputIcon} color="#9CA3AF" />
          <TextInput
            style={[styles.input, styles.readOnlyInput]} 
            value={email}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            editable={false}
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

// styles remain the same
const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
        backgroundColor: '#FFF8F8', 
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
        backgroundColor: '#E5E7EB', 
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    imagePickerText: {
        color: '#F87171', 
        fontSize: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FBCFE8', 
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
        color: '#6B7280', 
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 20,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#F87171', 
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