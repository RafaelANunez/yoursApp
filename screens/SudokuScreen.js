import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Sudoku Puzzles Data ---
const SUDOKU_PUZZLES = [
  // Puzzle 1 (0 = empty cell)
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
  ],
  // Puzzle 2
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 0, 0],
    [9, 0, 0, 0, 0, 0, 7, 0, 0],
  ],
  // Puzzle 3
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 8, 5],
    [0, 0, 1, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 5, 0, 7, 0, 0, 0],
    [0, 0, 4, 0, 0, 0, 1, 0, 0],
    [0, 9, 0, 0, 0, 0, 0, 0, 0],
    [5, 0, 0, 0, 0, 0, 0, 7, 3],
    [0, 0, 2, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 9],
  ],
  // Puzzle 4
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 0],
    [5, 0, 7, 0, 0, 0, 0, 6, 0],
    [0, 4, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 5, 0, 0],
  ],
  // Puzzle 5
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 4, 0, 7],
    [0, 0, 0, 3, 0, 0, 2, 8, 0],
    [0, 6, 0, 5, 0, 0, 0, 0, 8],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
  }, [isEmergencyMode]); // Re-initialize if emergency mode changes

  const loadBypassCode = async () => {
    try {
      const code = await AsyncStorage.getItem('@bypass_code');
      setBypassCode(code || '');
    } catch (error) {
      console.error('Error loading bypass code:', error);
    }
  };

  const isValidPlacement = (grid, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  };

  const addRandomFilledCells = (baseGrid) => {
    const newGrid = baseGrid.map(row => [...row]);
    const emptyCells = [];
    // Find all empty cells (excluding first row for bypass code)
    for (let row = 1; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (newGrid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    // Shuffle empty cells
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }
    // Add 10-15 random valid numbers
    const targetCount = 10 + Math.floor(Math.random() * 6); // 10-15
    let addedCount = 0;
    for (const cell of emptyCells) {
      if (addedCount >= targetCount) break;
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      for (const num of numbers) {
        if (isValidPlacement(newGrid, cell.row, cell.col, num)) {
          newGrid[cell.row][cell.col] = num;
          addedCount++;
          break;
        }
      }
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
      // Don't clear selected cell to allow quick changes
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
      <View style={styles.sudokuContent}>
        <View style={styles.sudokuGrid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.sudokuRow}>
              {row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isOriginal = originalGrid[rowIndex][colIndex] !== 0;
                const isFirstRow = rowIndex === 0;
                const isThickRightBorder = (colIndex + 1) % 3 === 0 && colIndex < 8;
                const isThickBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex < 8;
                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.sudokuCell,
                      isFirstRow && styles.sudokuFirstRowCell,
                      isThickRightBorder && styles.sudokuCellThickRight,
                      isThickBottomBorder && styles.sudokuCellThickBottom,
                      isSelected && styles.sudokuCellSelected,
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    disabled={isOriginal}
                  >
                    <Text
                      style={[
                        styles.sudokuCellText,
                        isOriginal && styles.sudokuCellTextOriginal,
                        isFirstRow && styles.sudokuFirstRowText,
                      ]}
                    >
                      {cell !== 0 ? cell : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <YourSudokuLogo />
        <View style={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <TouchableOpacity key={number} style={styles.numberButton} onPress={() => handleNumberInput(number)}>
              <Text style={styles.numberButtonText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.numberButtonClear} onPress={() => handleNumberInput(0)}>
            <Text style={styles.numberButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const contentWidth = width > 500 ? 500 : width;
const gridSize = contentWidth * 0.9;
const cellSize = gridSize / 9;

const styles = StyleSheet.create({
  sudokuContainer: {
    flex: 1,
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  sudokuContent: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sudokuGrid: {
    width: gridSize,
    height: gridSize,
    borderWidth: 3,
    borderColor: '#374151',
    backgroundColor: 'white',
  },
  sudokuRow: {
    flexDirection: 'row',
  },
  sudokuCell: {
    width: cellSize,
    height: cellSize,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sudokuFirstRowCell: {
    backgroundColor: '#FEF2F2',
  },
  sudokuCellThickRight: {
    borderRightWidth: 2,
    borderRightColor: '#9CA3AF',
  },
  sudokuCellThickBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#9CA3AF',
  },
  sudokuCellSelected: {
    backgroundColor: '#FBCFE8',
    borderColor: '#F472B6',
    borderWidth: 1,
  },
  sudokuCellText: {
    fontSize: cellSize * 0.5,
    color: '#1F2937',
    fontWeight: '500',
  },
  sudokuCellTextOriginal: {
    fontWeight: 'bold',
  },
  sudokuFirstRowText: {
    color: '#BE123C',
    fontWeight: 'bold',
  },
  logoContainer: {
    paddingVertical: 15,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  numberButton: {
    width: cellSize * 0.9,
    height: cellSize * 0.9,
    borderRadius: (cellSize * 0.9) / 2,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  numberButtonClear: {
    width: cellSize * 1.8,
    height: cellSize * 0.9,
    borderRadius: 8,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  numberButtonText: {
    fontSize: cellSize * 0.45,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SudokuScreen;