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

// --- ADDED: Helper function to migrate old data ---
// This will find all old keys and move them to new, user-specific keys
const migrateOldData = async (email, oldUserData) => {
  console.log('Starting data migration for user:', email);
  try {
    // 1. Define all old keys
    const oldKeys = [
      '@journal_entries',
      '@emergency_contacts',
      '@autofill_people',
      '@autofill_locations',
      '@fake_call_caller_name',
      '@fake_call_screen_hold_enabled',
      '@fake_call_volume_hold_enabled',
      '@fake_call_screen_hold_duration',
      '@fake_call_volume_hold_duration',
      '@discreet_mode_enabled',
      '@sudoku_screen_enabled',
      '@bypass_code',
      '@two_finger_trigger_enabled',
    ];

    // 2. Define their corresponding new keys
    const newKeysMap = {
      '@user_credentials': `@user_creds_${email}`,
      '@journal_entries': `@${email}_journal_entries`,
      '@emergency_contacts': `@${email}_emergency_contacts`,
      '@autofill_people': `@${email}_autofill_people`,
      '@autofill_locations': `@${email}_autofill_locations`,
      '@fake_call_caller_name': `@${email}_fake_call_caller_name`,
      '@fake_call_screen_hold_enabled': `@${email}_fake_call_screen_hold_enabled`,
      '@fake_call_volume_hold_enabled': `@${email}_fake_call_volume_hold_enabled`,
      '@fake_call_screen_hold_duration': `@${email}_fake_call_screen_hold_duration`,
      '@fake_call_volume_hold_duration': `@${email}_fake_call_volume_hold_duration`,
      '@discreet_mode_enabled': `@${email}_discreet_mode_enabled`,
      '@sudoku_screen_enabled': `@${email}_sudoku_screen_enabled`,
      '@bypass_code': `@${email}_bypass_code`,
      '@two_finger_trigger_enabled': `@${email}_two_finger_trigger_enabled`,
    };
    
    // 3. Get all old data
    const oldData = await AsyncStorage.multiGet(oldKeys);
    
    // 4. Prepare new data for multiSet
    const newData = [];
    
    // Add the user credentials
    newData.push([newKeysMap['@user_credentials'], JSON.stringify(oldUserData)]);
    
    // Add all other data
    oldData.forEach(([key, value]) => {
      if (value !== null) {
        const newKey = newKeysMap[key];
        if (newKey) {
          newData.push([newKey, value]);
        }
      }
    });

    // 5. Save all new data
    await AsyncStorage.multiSet(newData);
    
    // 6. Remove all old data (plus the old login flag)
    await AsyncStorage.multiRemove([...oldKeys, '@user_credentials', '@logged_in']);
    
    console.log('Data migration complete.');

  } catch (e) {
    console.error('Data migration failed:', e);
    // Don't block login, but alert the user
    Alert.alert('Data Migration Failed', 'Could not migrate all old app data. Some settings or entries may be missing.');
  }
};


export const AuthProvider = ({ children }) => {
  // ... (useState, useEffect for loadUserFromStorage remain the same) ...
  const [user, setUser] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userEmail = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (userEmail) {
          const credsString = await AsyncStorage.getItem(`@user_creds_${userEmail}`);
          if (credsString) {
            const userData = JSON.parse(credsString);
            setUser(userData);
            setIsLoggedIn(true);
          } else {
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

  // --- MODIFIED: The login function now handles migration ---
  const login = async (email, password) => {
    try {
      // 1. Try logging in with the NEW system first
      const newCredsString = await AsyncStorage.getItem(`@user_creds_${email}`);
      
      if (newCredsString) {
        const userData = JSON.parse(newCredsString);
        if (userData.password === password) {
          setUser(userData);
          setIsLoggedIn(true);
          await AsyncStorage.setItem(CURRENT_USER_KEY, email);
          return; // Login successful
        } else {
          throw new Error('Invalid email or password.');
        }
      }

      // 2. NEW system login failed. Try migrating from the OLD system.
      const oldCredsString = await AsyncStorage.getItem('@user_credentials');
      
      if (oldCredsString) {
        const oldUserData = JSON.parse(oldCredsString);
        
        // Check if old email and password match
        if (oldUserData.email === email && oldUserData.password === password) {
          // This is the old user! Start migration.
          await migrateOldData(email, oldUserData);
          
          // Now log them in
          setUser(oldUserData);
          setIsLoggedIn(true);
          await AsyncStorage.setItem(CURRENT_USER_KEY, email);
          return; // Migration and login successful
        }
      }
      
      // 3. Both new and old systems failed. User not found.
      throw new Error('User not found. Please sign up.');

    } catch (e) {
      console.error('Login error:', e);
      throw e; // Re-throw for the login screen to catch
    }
  };

  const signup = async (credentials) => {
    // ... (signup function remains the same)
    const { email, password } = credentials;
    try {
      const existingUser = await AsyncStorage.getItem(`@user_creds_${email}`);
      if (existingUser) {
        throw new Error('An account with this email already exists.');
      }
      
      await AsyncStorage.setItem(`@user_creds_${email}`, JSON.stringify(credentials));
      
      setUser(credentials);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(CURRENT_USER_KEY, email);
    } catch (e) {
      console.error('Signup error:', e);
      throw e; 
    }
  };

  const logout = async () => {
    // ... (logout function remains the same)
     try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Logout failed', e);
      Alert.alert('Error', 'Could not log out');
    }
  };
  
  const updateUser = async (newUserData) => {
    // ... (updateUser function remains the same)
    if (!user) return;
    try {
      const updatedUser = { ...user, ...newUserData };
      await AsyncStorage.setItem(`@user_creds_${user.email}`, JSON.stringify(updatedUser));
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
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};