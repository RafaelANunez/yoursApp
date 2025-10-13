import React from "react";
import {View, Text, Button, StyleSheet} from 'react-native';
import { signupUser } from "../utils/Storage";


const handleSignup = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    await signupUser();
};
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <Button title="Create Account" onPress={handleSignUp} />
        <Button title="Back to Login" onPress={navigation.replace('Login')} />
      </View>
    );