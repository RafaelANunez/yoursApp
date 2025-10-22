import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const validate = () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Validation', 'Please fill all fields');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password should be at least 6 characters');
      return false;
    }
    if (password !== confirm) {
      Alert.alert('Validation', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      const creds = { name, email, password };
      await AsyncStorage.setItem('@user_credentials', JSON.stringify(creds));
      // Optionally auto-login
      await AsyncStorage.setItem('@logged_in', 'true');
      // Navigate to Home replacing stack so user can't go back to signup/login
      navigation.replace('Home');
    } catch (err) {
      console.error('Signup error:', err);
      Alert.alert('Error', 'Could not create account');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>
      <TextInput
        placeholder="Full name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
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
      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      <Button title="Sign up" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 16, textAlign: 'center' },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
});
