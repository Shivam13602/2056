class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = 0;
        this.gridSize = 4;
        this.undoStack = [];
        this.initializeGrid();
        this.setupEventListeners();
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.addRandomTile();
        this.addRandomTile();
        this.updateGrid();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateGrid() {
        const gridContainer = document.querySelector('.grid');
        gridContainer.innerHTML = '';
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                const span = document.createElement('span');
                span.textContent = this.grid[i][j] || '';
                cell.appendChild(span);
                cell.dataset.value = this.grid[i][j];
                gridContainer.appendChild(cell);
            }
        }
        document.getElementById('score').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
    }

    move(direction) {
        const oldGrid = JSON.parse(JSON.stringify(this.grid));
        const oldScore = this.score;

        let moved = false;
        if (direction === 'up' || direction === 'down') {
            for (let j = 0; j < this.gridSize; j++) {
                const column = this.grid.map(row => row[j]);
                const newColumn = this.mergeTiles(direction === 'up' ? column : column.reverse());
                if (JSON.stringify(column) !== JSON.stringify(newColumn)) {
                    moved = true;
                }
                if (direction === 'down') newColumn.reverse();
                for (let i = 0; i < this.gridSize; i++) {
                    this.grid[i][j] = newColumn[i];
                }
            }
        } else {
            for (let i = 0; i < this.gridSize; i++) {
                const row = this.grid[i];
                const newRow = this.mergeTiles(direction === 'left' ? row : row.reverse());
                if (JSON.stringify(row) !== JSON.stringify(newRow)) {
                    moved = true;
                }
                this.grid[i] = direction === 'right' ? newRow.reverse() : newRow;
            }
        }

        if (moved) {
            this.addRandomTile();
            this.updateGrid();
            this.undoStack.push({grid: oldGrid, score: oldScore});
            this.saveGame();
        }

        if (this.isGameOver()) {
            alert('Game Over!');
        }
    }

    mergeTiles(line) {
        const newLine = line.filter(tile => tile !== 0);
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                this.score += newLine[i];
                this.bestScore = Math.max(this.bestScore, this.score);
                newLine.splice(i + 1, 1);
            }
        }
        while (newLine.length < this.gridSize) {
            newLine.push(0);
        }
        return newLine;
    }

    isGameOver() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
                if (
                    (i < this.gridSize - 1 && this.grid[i][j] === this.grid[i + 1][j]) ||
                    (j < this.gridSize - 1 && this.grid[i][j] === this.grid[i][j + 1])
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            this.grid = lastState.grid;
            this.score = lastState.score;
            this.updateGrid();
        }
    }

    saveGame() {
        localStorage.setItem('game2048', JSON.stringify({
            grid: this.grid,
            score: this.score,
            bestScore: this.bestScore
        }));
    }

    loadGame() {
        const savedGame = JSON.parse(localStorage.getItem('game2048'));
        if (savedGame) {
            this.grid = savedGame.grid;
            this.score = savedGame.score;
            this.bestScore = savedGame.bestScore;
            this.updateGrid();
        }
    }

    setupEventListeners() {
        const gameContainer = document.getElementById('game');
        
        const handleKeyDown = (e) => {
            console.log('Key pressed:', e.key); // Debugging line
            e.preventDefault(); // Prevent default scroll behavior
            switch(e.key) {
                case 'ArrowUp': 
                    console.log('Moving up');
                    this.move('up'); 
                    break;
                case 'ArrowDown': 
                    console.log('Moving down');
                    this.move('down'); 
                    break;
                case 'ArrowLeft': 
                    console.log('Moving left');
                    this.move('left'); 
                    break;
                case 'ArrowRight': 
                    console.log('Moving right');
                    this.move('right'); 
                    break;
            }
        };

        // Add keydown event listener to the game container
        gameContainer.addEventListener('keydown', handleKeyDown);

        // Make the game container focusable
        gameContainer.setAttribute('tabindex', '0');

        // Focus the game container when it becomes visible
        gameContainer.addEventListener('focus', () => {
            console.log('Game container focused');
        });

        const hammer = new Hammer(document.querySelector('.grid-container'));
        hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
        hammer.on('swipeleft', () => this.move('left'));
        hammer.on('swiperight', () => this.move('right'));
        hammer.on('swipeup', () => this.move('up'));
        hammer.on('swipedown', () => this.move('down'));

        document.getElementById('undoButton').addEventListener('click', () => this.undo());
    }
}

let game;
let backgroundMusic = document.getElementById('backgroundMusic');

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startGame').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        const gameContainer = document.getElementById('game');
        gameContainer.style.display = 'block';
        game = new Game2048();
        gameContainer.focus(); // Focus the game container
        testKeyEvents(); // Run the test after initializing the game
        
        // Start playing music automatically
        backgroundMusic.play();
        document.getElementById('toggleMusic').textContent = 'Music: On';
    });

    document.getElementById('highScores').addEventListener('click', () => {
        alert('High Score: ' + (localStorage.getItem('bestScore') || 0));
    });

    document.getElementById('toggleMusic').addEventListener('click', (e) => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            e.target.textContent = 'Music: On';
        } else {
            backgroundMusic.pause();
            e.target.textContent = 'Music: Off';
        }
    });
});

function testKeyEvents() {
    console.log('Starting key event test');
    const keyEvents = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    keyEvents.forEach(key => {
        const event = new KeyboardEvent('keydown', {'key': key});
        document.getElementById('game').dispatchEvent(event);
    });
    console.log('Key event test complete');
}