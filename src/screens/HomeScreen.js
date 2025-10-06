import React from "react";
import {View, Text, Button, StyleSheet} from 'react-native';
import { logoutUser } from utils/Storage.js;

export default function HomeScreen({ navigation })
{
    const handleLogout = async () => {
          await logoutUser();
          navigation.replace('Login');
      };

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Welcome to Yours</Text>
          <Text>You're in a safe space</Text>
          <Button title="Log Out" onPress={handleLogout} />
        </View>
      );
}


  