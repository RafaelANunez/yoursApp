import React, { useState, useEffect, useRef } from 'react'; // --- MODIFIED: Added useRef ---
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, SafeAreaView, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';

// (Initial grid and solution data remain the same)
const initialGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const emergencyGrid = [
  [0, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 0],
];

const SudokuScreen = ({ onBypassSuccess, isEmergencyMode }) => {
  const { user } = useAuth(); // Get the current user
  
  const [grid, setGrid] = useState(isEmergencyMode ? emergencyGrid : initialGrid);
  const [bypassCode, setBypassCode] = useState('');
  const [userInput, setUserInput] = useState(Array(9).fill(''));
  const [activeCell, setActiveCell] = useState(null);
  
  const [bypassCodeKey, setBypassCodeKey] = useState(null);
  
  // --- ADDED: Create a ref to hold all cell input references ---
  const cellRefs = useRef({});

  // (useEffect for setting bypassCodeKey remains the same)
  useEffect(() => {
    if (user?.email) {
      setBypassCodeKey(`@${user.email}_bypass_code`);
    }
  }, [user]);

  // (useEffect for loading bypassCode remains the same)
  useEffect(() => {
    if (bypassCodeKey) {
      loadBypassCode();
    }
  }, [bypassCodeKey]);

  const loadBypassCode = async () => {
    if (!bypassCodeKey) return; 
    try {
      const code = await AsyncStorage.getItem(bypassCodeKey);
      if (code) {
        setBypassCode(code);
      } else {
        console.warn('No bypass code set for this user.');
      }
    } catch (e) {
      console.error('Failed to load bypass code', e);
    }
  };

  const handleInputChange = (text, index) => {
    const newInputs = [...userInput];
    newInputs[index] = text.replace(/[^1-9]/g, ''); // Only allow 1-9
    setUserInput(newInputs);

    // Check for bypass
    const enteredCode = newInputs.join('');
    if (bypassCode && enteredCode.length === bypassCode.length && enteredCode === bypassCode) {
      Alert.alert('Bypass Activated', 'Loading app...');
      onBypassSuccess();
    }
    
    // Auto-focus next cell
    if (text && index < 8) {
      // --- MODIFIED: Use the cellRefs.current object instead of 'this' ---
      cellRefs.current[`cell_${index + 1}`]?.focus();
    }
  };

  const renderCell = (row, col) => {
    const value = grid[row][col];
    const isFirstRow = row === 0;
    const cellIndex = col;

    if (isFirstRow) {
      return (
        <TextInput
          style={[
            styles.cell,
            styles.inputCell,
            activeCell === cellIndex && styles.activeCell,
          ]}
          value={userInput[cellIndex]}
          onChangeText={(text) => handleInputChange(text, cellIndex)}
          onFocus={() => setActiveCell(cellIndex)}
          onBlur={() => setActiveCell(null)}
          keyboardType="number-pad"
          maxLength={1}
          // --- MODIFIED: Save the input reference to cellRefs.current ---
          ref={(input) => { cellRefs.current[`cell_${cellIndex}`] = input; }}
        />
      );
    }

    return (
      <Text style={styles.cellText}>{value !== 0 ? value : ''}</Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title="Sudoku" />
      <View style={styles.container}>
        <Text style={styles.title}>Sudoku</Text>
        <Text style={styles.subtitle}>Enter bypass code in the first row to unlock</Text>
        <View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={[
              styles.row,
              (rowIndex + 1) % 3 === 0 && rowIndex !== 8 && styles.thickBorderBottom,
            ]}>
              {row.map((_, colIndex) => (
                <View key={colIndex} style={[
                  styles.cell,
                  (colIndex + 1) % 3 === 0 && colIndex !== 8 && styles.thickBorderRight,
                  rowIndex === 0 && styles.inputRow, // Highlight the input row
                ]}>
                  {renderCell(rowIndex, colIndex)}
                </View>
              ))}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.keypadDismiss} onPress={() => Keyboard.dismiss()}>
          <Text style={styles.keypadDismissText}>Dismiss Keyboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 40,
    height: 40,
    borderWidth: 0.5,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    backgroundColor: '#FFF8F8',
  },
  inputCell: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F87171',
    textAlign: 'center',
    padding: 0,
  },
  activeCell: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
  },
  cellText: {
    fontSize: 22,
    color: '#333',
  },
  thickBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  thickBorderRight: {
    borderRightWidth: 2,
    borderRightColor: '#333',
  },
  keypadDismiss: {
    marginTop: 20,
    padding: 10,
  },
  keypadDismissText: {
    fontSize: 16,
    color: '#F87171',
  },
});

export default SudokuScreen;