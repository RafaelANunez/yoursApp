import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Sudoku Puzzles Data ---
const SUDOKU_PUZZLES = [
    [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
];

// --- YourSudoku Logo ---
const YourSudokuLogo = () => (
  <View style={styles.logoContainer}>
    <Text style={styles.logoText}>YOURSUDOKU</Text>
  </View>
);

// --- Sudoku Screen Component ---
const SudokuScreen = ({ onBypassSuccess, isEmergencyMode = false }) => {
  const [selectedPuzzle] = useState(() => {
    return SUDOKU_PUZZLES[Math.floor(Math.random() * SUDOKU_PUZZLES.length)];
  });
  const [grid, setGrid] = useState([]);
  const [originalGrid, setOriginalGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [bypassCode, setBypassCode] = useState('');

  useEffect(() => {
    loadBypassCode();
    initializeGrid();
  }, []);

  const loadBypassCode = async () => {
    try {
      const code = await AsyncStorage.getItem('@bypass_code');
      setBypassCode(code || '');
    } catch (error) {
      console.error('Error loading bypass code:', error);
    }
  };

  const isValidPlacement = (grid, row, col, num) => {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num || grid[x][col] === num) {
        return false;
      }
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) {
          return false;
        }
      }
    }
    return true;
  };

  const addRandomFilledCells = (baseGrid) => {
    let newGrid = baseGrid.map(row => [...row]);
    let emptyCells = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    let cellsToFill = Math.floor(emptyCells.length * 0.25);
    for (let k = 0; k < cellsToFill; k++) {
      if (emptyCells.length === 0) break;

      let randomIndex = Math.floor(Math.random() * emptyCells.length);
      let { row, col } = emptyCells[randomIndex];

      let num = Math.floor(Math.random() * 9) + 1;
      if (isValidPlacement(newGrid, row, col, num)) {
        newGrid[row][col] = num;
      }
      emptyCells.splice(randomIndex, 1);
    }
    return newGrid;
  };

  const initializeGrid = () => {
    let newGrid = selectedPuzzle.map(row => [...row]);

    if (isEmergencyMode) {
      newGrid = addRandomFilledCells(newGrid);
    }

    setGrid(newGrid);
    setOriginalGrid(newGrid.map(row => [...row]));
  };

  const handleCellPress = (row, col) => {
    if (originalGrid[row][col] === 0) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (number) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const newGrid = grid.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? number : c)) : [...r]
      );
      setGrid(newGrid);
      setSelectedCell(null);

      if (row === 0) {
        setTimeout(() => checkBypassCode(newGrid), 150);
      }
    }
  };

  const checkBypassCode = (currentGrid) => {
    if (!bypassCode) return;

    const firstRow = currentGrid[0];
    const codeLength = bypassCode.length;

    const relevantCells = firstRow.slice(0, codeLength);
    const areRelevantCellsFilled = relevantCells.every(cell => cell !== 0);

    if (areRelevantCellsFilled) {
      const enteredCode = relevantCells.join('');
      if (enteredCode === bypassCode) {
        onBypassSuccess();
      }
    }
  };

  return (
    <View style={styles.sudokuContainer}>
      <YourSudokuLogo />
      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex && styles.selectedCell,
                  originalGrid[rowIndex][colIndex] !== 0 && styles.originalCell,
                  (colIndex + 1) % 3 === 0 && colIndex < 8 && styles.boldRight,
                  (rowIndex + 1) % 3 === 0 && rowIndex < 8 && styles.boldBottom,
                ]}
                onPress={() => handleCellPress(rowIndex, colIndex)}
                disabled={originalGrid[rowIndex][colIndex] !== 0}
              >
                <Text style={styles.cellText}>{cell !== 0 ? cell : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberInput(number)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const gridSize = width * 0.9;
const cellSize = gridSize / 9;

const styles = StyleSheet.create({
  sudokuContainer: {
    flex: 1,
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 2,
  },
  grid: {
    width: gridSize,
    height: gridSize,
    borderWidth: 2,
    borderColor: '#374151',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  selectedCell: {
    backgroundColor: '#FEF2F2',
  },
  originalCell: {
    backgroundColor: '#F3F4F6',
  },
  cellText: {
    fontSize: cellSize * 0.6,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  boldRight: {
    borderRightWidth: 2,
    borderRightColor: '#9CA3AF',
  },
  boldBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#9CA3AF',
  },
  numberPad: {
    flexDirection: 'row',
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numberButton: {
    width: 60,
    height: 60,
    margin: 5,
    borderRadius: 30,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  numberButtonText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SudokuScreen;