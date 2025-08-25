// Generate Sudoku Grid
const gridContainer = document.getElementById('sudoku-grid');
for (let i = 0; i < 81; i++) {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.oninput = () => {
    input.value = input.value.replace(/[^1-9]/g, '');
  };
  gridContainer.appendChild(input);
}

function getGrid() {
  const cells = document.querySelectorAll('#sudoku-grid input');
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push([]);
    for (let j = 0; j < 9; j++) {
      const val = cells[i * 9 + j].value;
      grid[i].push(val ? parseInt(val) : 0);
    }
  }
  return grid;
}

function setGrid(grid) {
  const cells = document.querySelectorAll('#sudoku-grid input');
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const index = i * 9 + j;
      cells[index].value = grid[i][j] === 0 ? '' : grid[i][j];
      cells[index].readOnly = grid[i][j] !== 0;
    }
  }
}

function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + i % 3;
    if (grid[boxRow][boxCol] === num) return false;
  }
  return true;
}

function solve(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solve(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function solveSudoku() {
  const grid = getGrid();
  if (solve(grid)) {
    setGrid(grid);
  } else {
    alert('No solution exists!');
  }
}

function clearGrid() {
  const cells = document.querySelectorAll('#sudoku-grid input');
  cells.forEach(cell => {
    if (!cell.readOnly) {
      cell.value = '';
    }
  });
}

function resetGrid() {
  const cells = document.querySelectorAll('#sudoku-grid input');
  cells.forEach(cell => {
    cell.value = '';
    cell.readOnly = false;
  });
}

// Dark Mode Toggle
const toggle = document.getElementById('darkModeToggle');
toggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');
});
