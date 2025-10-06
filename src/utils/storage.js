// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const logoutUser = async () => {
  await AsyncStorage.multiRemove(['userEmail', 'userPassword', 'isLoggedIn']);
};

const loginUser = async () => {
    if (email === 'test@example.com' && password === 'password') {
      try {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        onLoginSuccess();
      } catch (e) {
        console.error(e);
      }
    } else {
      Alert.alert('Login Failed', 'Invalid credentials');
    }
};

const signupUser = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      // Save user credentials locally (simple example)
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPassword', password); // Insecure - for demo only!
      await AsyncStorage.setItem('isLoggedIn', 'true');

      Alert.alert('Success', 'Account created!');
      onSignUpSuccess();
    } catch (e) {
      console.error('Error saving user data', e);
      Alert.alert('Error', 'Failed to create account');
    }
  };