import React from "react";
import {View, Text, Button, StyleSheet} from 'react-native';
import { loginUser } from '../utils/Storage.js';

export const LoginPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLogin = async () => {
        await loginUser();
        navigation.replace('HomeScreen');
    };
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Login" onPress={handleLogin} />
      </View>
    );
  };
  
  const loginstyles = StyleSheet.create({
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