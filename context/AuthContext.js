import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Storage key for the *email* of the last logged-in user
const CURRENT_USER_KEY = '@current_user_email';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object: { email, name, profilePic, ... }
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, check if a user was already logged in
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userEmail = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (userEmail) {
          // If we have a user email, load their full credentials
          const credsString = await AsyncStorage.getItem(`@user_creds_${userEmail}`);
          if (credsString) {
            const userData = JSON.parse(credsString);
            setUser(userData);
            setIsLoggedIn(true);
          } else {
            // Data mismatch, log them out
            await AsyncStorage.removeItem(CURRENT_USER_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      const credsString = await AsyncStorage.getItem(`@user_creds_${email}`);
      if (!credsString) {
        throw new Error('User not found. Please sign up.');
      }
      
      const userData = JSON.parse(credsString);

      // In a real app, 'password' would be a hash.
      // We are comparing plain text as per the original file's logic.
      if (userData.password === password) {
        setUser(userData);
        setIsLoggedIn(true);
        await AsyncStorage.setItem(CURRENT_USER_KEY, email);
      } else {
        throw new Error('Invalid email or password.');
      }
    } catch (e) {
      console.error('Login error:', e);
      throw e; // Re-throw for the login screen to catch
    }
  };

  const signup = async (credentials) => {
    const { email, password } = credentials;
    try {
      // Check if user already exists
      const existingUser = await AsyncStorage.getItem(`@user_creds_${email}`);
      if (existingUser) {
        throw new Error('An account with this email already exists.');
      }
      
      // Save the new user's credentials under their email key
      await AsyncStorage.setItem(`@user_creds_${email}`, JSON.stringify(credentials));
      
      // Log them in
      setUser(credentials);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(CURRENT_USER_KEY, email);
    } catch (e) {
      console.error('Signup error:', e);
      throw e; // Re-throw for the signup screen to catch
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Logout failed', e);
      Alert.alert('Error', 'Could not log out');
    }
  };
  
  // For UserProfileSettingsPage to update user data
  const updateUser = async (newUserData) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...newUserData };
      // Save updated data
      await AsyncStorage.setItem(`@user_creds_${user.email}`, JSON.stringify(updatedUser));
      // Update state
      setUser(updatedUser);
      Alert.alert('Success', 'Profile updated.');
    } catch (e) {
      console.error('Failed to update user data', e);
      Alert.alert('Error', 'Could not update profile.');
    }
  };


  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    signup,
    logout,
    updateUser, // Expose for profile settings
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};