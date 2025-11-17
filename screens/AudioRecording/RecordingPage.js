import React, { useState } from 'react';
import { View, Text, StyleSheet,SafeAreaView, Pressable } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RecordAudio } from '../AudioRecording/RecordAudio';
import { SavedRecords } from '../AudioRecording/SavedRecords';

const Tab = createMaterialTopTabNavigator();

function RecordingTabBar({ navigation })
{
  return (
    <View style={{flexDirection: 'row' }}>
      <Text>options.title</Text>
    </View>
  )
}

export const RecordingPage = ({ navigation }) => {

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PageHeader title="Audio Recorder" onBack={() => navigation.goBack()} />
      <View style={{flex:1}}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle:{fontSize: 14, color: '#F87171', },
            tabBarAllowFontScaling:true,
          }}
        >
            <Tab.Screen name='Record Audio' component={RecordAudio} options={{ title: 'Record Audio'}}/>
            <Tab.Screen name='Saved Recordings' component={SavedRecords} options={{ title: 'Recordings'}}/>
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  )
}