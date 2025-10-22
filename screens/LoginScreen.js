import React, { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, StyleSheet, TextInput, Button, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
      try {
        // Try stored credentials first
        const stored = await AsyncStorage.getItem('@user_credentials');
        if (stored) {
          const creds = JSON.parse(stored);
          if (creds.email === email && creds.password === password) {
            await AsyncStorage.setItem('@logged_in', 'true');
            navigation.replace('Home');
            return;
          }
        }

        // Fallback test account
        if (email === 'test@example.com' && password === 'password') {
          await AsyncStorage.setItem('@logged_in', 'true');
          navigation.replace('Home'); // Switch to the main app
        } else {
          Alert.alert('Login Failed', 'Invalid credentials');
        }
      } catch (err) {
        console.error('Login error:', err);
        Alert.alert('Error', 'An error occurred during login');
      }
    };

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Login" onPress={handleLogin} />

        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={{ color: '#2563EB' }}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F8', paddingTop: Platform.OS === 'android' ? 0 : 0 },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: {
      height: 50,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
  });