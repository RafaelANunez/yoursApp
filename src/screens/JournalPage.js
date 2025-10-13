import React from "react";
import {View, Text, Button, StyleSheet} from 'react-native';

export const JournalPage = ({ onBack }) => (
    <View style={styles.fullPage}>
      <PageHeader title="My Journal" onBack={onBack} />
      <PageContainer>
        <Text style={styles.pageText}>Your journal entries will appear here.</Text>
        <TouchableOpacity style={styles.floatingActionButton}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </PageContainer>
    </View>
  );