 const gameState = {
            timer: 0,
            timerInterval: null,
            moves: 0,
            hints: 3,
            difficulty: 'medium',
            initialGrid: null,
            isSolving: false,
            selectedCell: null
        };

        // DOM Elements
        const sudokuGrid = document.getElementById('sudoku-grid');
        const solveBtn = document.getElementById('solveBtn');
        const hintBtn = document.getElementById('hintBtn');
        const clearBtn = document.getElementById('clearBtn');
        const newPuzzleBtn = document.getElementById('newPuzzleBtn');
        const resetBtn = document.getElementById('resetBtn');
        const themeToggle = document.getElementById('themeToggle');
        const timerElement = document.getElementById('timer');
        const movesElement = document.getElementById('moves');
        const hintsElement = document.getElementById('hints');
        const difficultyElement = document.getElementById('difficulty');
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');

        // Initialize the game
        function initGame() {
            createGrid();
            generatePuzzle();
            setupEventListeners();
            startTimer();
            updateStats();
        }

        // Create the Sudoku grid
        function createGrid() {
            sudokuGrid.innerHTML = '';
            
            for (let box = 0; box < 9; box++) {
                const boxDiv = document.createElement('div');
                boxDiv.classList.add('sudoku-box');
                
                for (let cell = 0; cell < 9; cell++) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.classList.add('sudoku-cell');
                    
                    // Calculate row and column
                    const row = Math.floor(box / 3) * 3 + Math.floor(cell / 3);
                    const col = (box % 3) * 3 + (cell % 3);
                    input.dataset.row = row;
                    input.dataset.col = col;
                    
                    // Event listeners
                    input.addEventListener('input', handleCellInput);
                    input.addEventListener('focus', handleCellFocus);
                    input.addEventListener('click', handleCellClick);
                    input.addEventListener('keydown', handleCellKeydown);
                    
                    boxDiv.appendChild(input);
                }
                
                sudokuGrid.appendChild(boxDiv);
            }
        }

        // Handle cell input
        function handleCellInput(event) {
            const input = event.target;
            input.value = input.value.replace(/[^1-9]/g, '');
            
            if (input.value) {
                validateGrid();
                gameState.moves++;
                updateStats();
                
                // Check if puzzle is solved
                if (isPuzzleSolved()) {
                    celebrateCompletion();
                }
            }
        }

        // Handle cell focus
        function handleCellFocus(event) {
            const cell = event.target;
            gameState.selectedCell = cell;
            highlightRelatedCells(cell);
        }

        // Handle cell click
        function handleCellClick(event) {
            const cell = event.target;
            gameState.selectedCell = cell;
            highlightRelatedCells(cell);
        }

        // Handle cell keydown for navigation
        function handleCellKeydown(event) {
            const cell = event.target;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            let newRow = row;
            let newCol = col;
            
            switch(event.key) {
                case 'ArrowUp': 
                    newRow = Math.max(0, row - 1); 
                    break;
                case 'ArrowDown': 
                    newRow = Math.min(8, row + 1); 
                    break;
                case 'ArrowLeft': 
                    newCol = Math.max(0, col - 1); 
                    break;
                case 'ArrowRight': 
                    newCol = Math.min(8, col + 1); 
                    break;
                default: 
                    return;
            }
            
            event.preventDefault();
            
            const newCell = document.querySelector(`.sudoku-cell[data-row="${newRow}"][data-col="${newCol}"]`);
            if (newCell) {
                newCell.focus();
                highlightRelatedCells(newCell);
            }
        }

        // Highlight related cells (row, column, box)
        function highlightRelatedCells(cell) {
            // Clear previous highlights
            document.querySelectorAll('.sudoku-cell').forEach(c => {
                c.classList.remove('highlight', 'same-number');
            });
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = cell.value;
            
            // Highlight row, column, and box
            document.querySelectorAll('.sudoku-cell').forEach(c => {
                const cRow = parseInt(c.dataset.row);
                const cCol = parseInt(c.dataset.col);
                
                if (cRow === row || cCol === col || 
                    (Math.floor(cRow / 3) === Math.floor(row / 3) && 
                     Math.floor(cCol / 3) === Math.floor(col / 3))) {
                    c.classList.add('highlight');
                }
                
                // Highlight cells with the same number
                if (c.value && c.value === value) {
                    c.classList.add('same-number');
                }
            });
            
            // Make the selected cell stand out
            cell.classList.remove('highlight');
            cell.classList.add('same-number');
        }

        // Validate the grid and mark conflicts
        function validateGrid() {
            const grid = getGrid();
            
            // Clear previous conflicts
            document.querySelectorAll('.sudoku-cell').forEach(cell => {
                cell.classList.remove('conflict');
            });
            
            let hasConflicts = false;
            
            // Check rows and columns
            for (let i = 0; i < 9; i++) {
                const rowNumbers = new Set();
                const colNumbers = new Set();
                
                for (let j = 0; j < 9; j++) {
                    // Check row
                    if (grid[i][j] !== 0) {
                        if (rowNumbers.has(grid[i][j])) {
                            markRowConflicts(i, grid[i][j]);
                            hasConflicts = true;
                        }
                        rowNumbers.add(grid[i][j]);
                    }
                    
                    // Check column
                    if (grid[j][i] !== 0) {
                        if (colNumbers.has(grid[j][i])) {
                            markColumnConflicts(i, grid[j][i]);
                            hasConflicts = true;
                        }
                        colNumbers.add(grid[j][i]);
                    }
                }
            }
            
            // Check 3x3 boxes
            for (let box = 0; box < 9; box++) {
                const boxNumbers = new Set();
                const boxRow = Math.floor(box / 3) * 3;
                const boxCol = (box % 3) * 3;
                
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const num = grid[boxRow + i][boxCol + j];
                        if (num !== 0) {
                            if (boxNumbers.has(num)) {
                                markBoxConflicts(box, num);
                                hasConflicts = true;
                            }
                            boxNumbers.add(num);
                        }
                    }
                }
            }
            
            return !hasConflicts;
        }

        // Mark conflicts in a row
        function markRowConflicts(row, num) {
            document.querySelectorAll(`.sudoku-cell[data-row="${row}"]`).forEach(cell => {
                if (cell.value == num) {
                    cell.classList.add('conflict');
                }
            });
        }

        // Mark conflicts in a column
        function markColumnConflicts(col, num) {
            document.querySelectorAll(`.sudoku-cell[data-col="${col}"]`).forEach(cell => {
                if (cell.value == num) {
                    cell.classList.add('conflict');
                }
            });
        }

        // Mark conflicts in a box
        function markBoxConflicts(box, num) {
            const boxRow = Math.floor(box / 3) * 3;
            const boxCol = (box % 3) * 3;
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const cell = document.querySelector(`.sudoku-cell[data-row="${boxRow + i}"][data-col="${boxCol + j}"]`);
                    if (cell && cell.value == num) {
                        cell.classList.add('conflict');
                    }
                }
            }
        }

        // Get the current grid state
        function getGrid() {
            const grid = Array(9).fill().map(() => Array(9).fill(0));
            const cells = document.querySelectorAll('.sudoku-cell');
            
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                grid[row][col] = cell.value ? parseInt(cell.value) : 0;
            });
            
            return grid;
        }

        // Set the grid state
        function setGrid(grid, lockInitial = false) {
            const cells = document.querySelectorAll('.sudoku-cell');
            
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const value = grid[row][col];
                
                cell.value = value === 0 ? '' : value;
                cell.classList.remove('given', 'conflict');
                
                if (lockInitial && value !== 0) {
                    cell.readOnly = true;
                    cell.classList.add('given');
                } else {
                    cell.readOnly = false;
                }
            });
            
            if (lockInitial) {
                gameState.initialGrid = JSON.parse(JSON.stringify(grid));
            }
        }

        // Check if the puzzle is solved
        function isPuzzleSolved() {
            const grid = getGrid();
            
            // Check if all cells are filled
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        return false;
                    }
                }
            }
            
            // Validate the solution
            return validateGrid();
        }

        // Solve the Sudoku puzzle
        function solveSudoku() {
            if (gameState.isSolving) return;
            
            gameState.isSolving = true;
            solveBtn.disabled = true;
            solveBtn.textContent = 'Solving...';
            
            const grid = getGrid();
            
            // Use a small delay to allow UI to update
            setTimeout(() => {
                const solved = solve(grid);
                
                if (solved) {
                    setGrid(grid);
                    celebrateCompletion();
                } else {
                    alert('No solution exists for this puzzle!');
                }
                
                gameState.isSolving = false;
                solveBtn.disabled = false;
                solveBtn.innerHTML = '<span>🚀</span> Solve Puzzle';
            }, 100);
        }

        // Sudoku solving algorithm
        function solve(grid) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (isValid(grid, row, col, num)) {
                                grid[row][col] = num;
                                
                                if (solve(grid)) {
                                    return true;
                                }
                                
                                grid[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }

        // Check if a number is valid in a position
        function isValid(grid, row, col, num) {
            // Check row
            for (let i = 0; i < 9; i++) {
                if (grid[row][i] === num) return false;
            }
            
            // Check column
            for (let i = 0; i < 9; i++) {
                if (grid[i][col] === num) return false;
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
        }

        // Generate a new puzzle
        function generatePuzzle() {
            const clues = {
                easy: 35,
                medium: 30,
                hard: 25,
                expert: 20
            };
            
            // Create a solved puzzle
            const grid = Array(9).fill().map(() => Array(9).fill(0));
            solve(grid);
            
            // Remove numbers based on difficulty
            const cellsToRemove = 81 - clues[gameState.difficulty];
            removeNumbers(grid, cellsToRemove);
            
            setGrid(grid, true);
            resetGameStats();
            startTimer();
        }

        // Remove numbers from a solved grid
        function removeNumbers(grid, count) {
            let removed = 0;
            
            while (removed < count) {
                const row = Math.floor(Math.random() * 9);
                const col = Math.floor(Math.random() * 9);
                
                if (grid[row][col] !== 0) {
                    grid[row][col] = 0;
                    removed++;
                }
            }
        }

        // Give a hint to the user
        function giveHint() {
            if (gameState.hints <= 0) {
                alert('No more hints available!');
                return;
            }
            
            const grid = getGrid();
            const emptyCells = [];
            
            // Find all empty cells
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            
            if (emptyCells.length === 0) return;
            
            // Pick a random empty cell
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            // Solve to find the correct number
            const tempGrid = JSON.parse(JSON.stringify(grid));
            if (solve(tempGrid)) {
                const correctNumber = tempGrid[randomCell.row][randomCell.col];
                const cell = document.querySelector(`.sudoku-cell[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
                
                cell.value = correctNumber;
                cell.classList.add('pulse');
                setTimeout(() => cell.classList.remove('pulse'), 500);
                
                gameState.hints--;
                gameState.moves++;
                updateStats();
                validateGrid();
                
                // Check if puzzle is solved
                if (isPuzzleSolved()) {
                    celebrateCompletion();
                }
            }
        }

        // Clear the grid
        function clearGrid() {
            const cells = document.querySelectorAll('.sudoku-cell');
            cells.forEach(cell => {
                if (!cell.classList.contains('given')) {
                    cell.value = '';
                    cell.classList.remove('conflict');
                }
            });
            validateGrid();
        }

        // Reset the grid to initial state
        function resetGrid() {
            if (gameState.initialGrid) {
                setGrid(gameState.initialGrid, true);
            } else {
                clearGrid();
            }
            resetGameStats();
            startTimer();
        }

        // Start the game timer
        function startTimer() {
            clearInterval(gameState.timerInterval);
            gameState.timer = 0;
            updateTimer();
            
            gameState.timerInterval = setInterval(() => {
                gameState.timer++;
                updateTimer();
            }, 1000);
        }

        // Update the timer display
        function updateTimer() {
            const minutes = Math.floor(gameState.timer / 60);
            const seconds = gameState.timer % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update game statistics
        function updateStats() {
            movesElement.textContent = gameState.moves;
            hintsElement.textContent = gameState.hints;
            difficultyElement.textContent = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
            
            hintBtn.disabled = gameState.hints <= 0;
        }

        // Reset game statistics
        function resetGameStats() {
            gameState.moves = 0;
            gameState.hints = 3;
            updateStats();
        }

        // Celebrate puzzle completion
        function celebrateCompletion() {
            clearInterval(gameState.timerInterval);
            
            document.querySelectorAll('.sudoku-cell').forEach(cell => {
                cell.classList.add('celebrate');
            });
            
            setTimeout(() => {
                document.querySelectorAll('.sudoku-cell').forEach(cell => {
                    cell.classList.remove('celebrate');
                });
                
                alert('🎉 Congratulations! You solved the puzzle!');
            }, 1000);
        }

        // Set up event listeners
        function setupEventListeners() {
            solveBtn.addEventListener('click', solveSudoku);
            hintBtn.addEventListener('click', giveHint);
            clearBtn.addEventListener('click', clearGrid);
            newPuzzleBtn.addEventListener('click', generatePuzzle);
            resetBtn.addEventListener('click', resetGrid);
            
            // Theme toggle
            themeToggle.addEventListener('change', toggleTheme);
            
            // Difficulty buttons
            difficultyBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    difficultyBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    gameState.difficulty = btn.dataset.difficulty;
                    updateStats();
                    generatePuzzle();
                });
            });
            
            // Keyboard number input
            document.addEventListener('keydown', (event) => {
                if (gameState.selectedCell && !gameState.selectedCell.readOnly && 
                    event.key >= '1' && event.key <= '9') {
                    gameState.selectedCell.value = event.key;
                    handleCellInput({ target: gameState.selectedCell });
                }
            });
        }

        // Toggle between light and dark themes
        function toggleTheme() {
            const isDark = themeToggle.checked;
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        // Load saved theme preference
        function loadThemePreference() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                themeToggle.checked = true;
                toggleTheme();
            }
        }

        // Initialize the game when the page loads
        window.addEventListener('DOMContentLoaded', () => {
            loadThemePreference();
            initGame();
        });