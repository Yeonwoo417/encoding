const COLS = 17;
const ROWS = 10;
const GAME_TIME = 120; // 2 minutes

let score = 0;
let timeLeft = GAME_TIME;
let timerId = null;
let grid = [];
let isDragging = false;
let isGameActive = false;
let selectedCells = [];

const board = document.getElementById('game-board');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');

// Setup global event listeners once
document.addEventListener('mouseup', onDragEnd);
board.addEventListener('touchstart', onTouchStart, {passive: false});
board.addEventListener('touchmove', onTouchMove, {passive: false});
board.addEventListener('touchend', onDragEnd);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function initTitleScreen() {
    isGameActive = false;
    scoreEl.innerText = "0";
    timerEl.innerText = GAME_TIME;
    generateBoard();
    updateLeaderboard();
    startOverlay.classList.remove('hidden');
    overlay.classList.add('hidden');
}

function startGame() {
    isGameActive = true;
    startOverlay.classList.add('hidden');
    overlay.classList.add('hidden');
    
    score = 0;
    timeLeft = GAME_TIME;
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    isDragging = false;
    selectedCells = [];
    
    generateBoard();
    
    clearInterval(timerId);
    timerId = setInterval(updateTimer, 1000);
}

function generateBoard() {
    board.innerHTML = '';
    grid = [];
    
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            const value = Math.floor(Math.random() * 9) + 1;
            cell.innerHTML = `<img src="apple.png" class="apple-img" draggable="false"><span class="number-label">${value}</span>`;
            cell.dataset.value = value;
            
            board.appendChild(cell);
            row.push(cell);
            
            cell.addEventListener('mousedown', onDragStart);
            cell.addEventListener('mouseenter', onDragEnter);
        }
        grid.push(row);
    }
}

function updateTimer() {
    if (!isGameActive) return;
    timeLeft--;
    timerEl.innerText = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

function endGame() {
    isGameActive = false;
    isDragging = false;
    selectedCells.forEach(c => c.classList.remove('selected'));
    selectedCells = [];
    
    clearInterval(timerId);
    
    const tier = getTier(score);
    saveScore(score, tier.name);
    
    document.getElementById('tier-icon').innerText = tier.initial;
    document.getElementById('tier-icon').style.background = tier.grad;
    document.getElementById('tier-name').innerText = tier.name;
    const tierColors = {
        "Master": "#f472b6", "Diamond": "#60a5fa", "Platinum": "#2dd4bf", 
        "Gold": "#fbbf24", "Silver": "#cbd5e1", "Bronze": "#fdba74", "Iron": "#a8a29e"
    };
    document.getElementById('tier-name').style.color = tierColors[tier.name] || "#fff";
    
    finalScoreEl.innerText = score;
    overlay.classList.remove('hidden');
}

function getCellFromTouch(e) {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el ? el.closest('.cell') : null;
    return cell;
}

function onTouchStart(e) {
    if (!isGameActive) return;
    e.preventDefault(); 
    const cell = getCellFromTouch(e);
    if (cell && !cell.classList.contains('cleared')) {
        startDrag(cell);
    }
}

function onTouchMove(e) {
    if (!isGameActive) return;
    e.preventDefault(); 
    if (!isDragging) return;
    const cell = getCellFromTouch(e);
    if (cell && !cell.classList.contains('cleared')) {
        updateSelection(cell);
    }
}

function onDragStart(e) {
    if (!isGameActive) return;
    const cell = e.target.closest('.cell');
    if (!cell || cell.classList.contains('cleared')) return;
    startDrag(cell);
}

function onDragEnter(e) {
    if (!isGameActive || !isDragging) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    updateSelection(cell);
}

function startDrag(cell) {
    isDragging = true;
    selectedCells.forEach(c => c.classList.remove('selected'));
    selectedCells = [cell];
    cell.classList.add('selected');
}

function updateSelection(cell) {
    if (selectedCells.length > 0) {
        const lastCell = selectedCells[selectedCells.length - 1];
        
        if (selectedCells.length >= 2 && selectedCells[selectedCells.length - 2] === cell) {
            lastCell.classList.remove('selected');
            selectedCells.pop();
            return;
        }

        if (selectedCells.includes(cell)) {
            const idx = selectedCells.indexOf(cell);
            const removed = selectedCells.splice(idx + 1);
            removed.forEach(c => c.classList.remove('selected'));
            return;
        }

        const r1 = parseInt(lastCell.dataset.r);
        const c1 = parseInt(lastCell.dataset.c);
        const r2 = parseInt(cell.dataset.r);
        const c2 = parseInt(cell.dataset.c);

        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
            cell.classList.add('selected');
            selectedCells.push(cell);
        }
    }
}

function onDragEnd() {
    if (!isGameActive || !isDragging) return;
    isDragging = false;
    
    let sum = 0;
    selectedCells.forEach(cell => {
        sum += parseInt(cell.dataset.value);
    });
    
    if (sum === 10 && selectedCells.length > 0) {
        clearSelected();
    } else if (selectedCells.length > 0) {
        // Penalty for invalid sum
        score = Math.max(0, score - 10);
        scoreEl.innerText = score;
        const statBox = scoreEl.parentElement;
        statBox.classList.add('error-highlight'); // assuming CSS class is added or we just reuse highlight but maybe add it to style.css
        
        // Quick red blink for error
        scoreEl.style.color = "var(--primary)";
        setTimeout(() => {
            scoreEl.style.color = "";
            statBox.classList.remove('error-highlight');
        }, 300);

        selectedCells.forEach(c => c.classList.remove('selected'));
    }
    selectedCells = [];
}

function clearSelected() {
    let count = 0;
    const cellsToReset = [];
    
    selectedCells.forEach(cell => {
        if (!cell.classList.contains('cleared')) {
            count++;
            cell.classList.add('cleared');
            cell.classList.remove('selected');
            cellsToReset.push(cell);
        }
    });
    
    score += count * 10;
    scoreEl.innerText = score;
    
    const statBox = scoreEl.parentElement;
    statBox.classList.add('highlight');
    setTimeout(() => statBox.classList.remove('highlight'), 300);

    setTimeout(() => {
        cellsToReset.forEach(cell => {
            const newValue = Math.floor(Math.random() * 9) + 1;
            cell.querySelector('.number-label').innerText = newValue;
            cell.dataset.value = newValue;
            cell.classList.remove('cleared');
            cell.classList.add('pop-in');
            setTimeout(() => cell.classList.remove('pop-in'), 300);
        });
    }, 300);
}

const tiers = [
    { name: "Master", initial: "M", minScore: 1500, grad: "linear-gradient(135deg, #f472b6, #db2777)" },
    { name: "Diamond", initial: "D", minScore: 1200, grad: "linear-gradient(135deg, #93c5fd, #3b82f6)" },
    { name: "Platinum", initial: "P", minScore: 900, grad: "linear-gradient(135deg, #5eead4, #0d9488)" },
    { name: "Gold", initial: "G", minScore: 600, grad: "linear-gradient(135deg, #fde047, #ca8a04)" },
    { name: "Silver", initial: "S", minScore: 300, grad: "linear-gradient(135deg, #cbd5e1, #64748b)" },
    { name: "Bronze", initial: "B", minScore: 150, grad: "linear-gradient(135deg, #fdba74, #b45309)" },
    { name: "Iron", initial: "I", minScore: 0, grad: "linear-gradient(135deg, #a8a29e, #57534e)" }
];

function getTier(score) {
    for (let t of tiers) {
        if (score >= t.minScore) return t;
    }
    return tiers[tiers.length - 1]; // Fallback to Iron
}

function updateLeaderboard() {
    const listEl = document.getElementById('ranking-list');
    const panel = document.getElementById('ranking-panel');
    let leaderboard = JSON.parse(localStorage.getItem('appleRankings') || '[]');
    
    if (leaderboard.length === 0) {
        panel.classList.add('hidden');
        return;
    }
    
    panel.classList.remove('hidden');
    listEl.innerHTML = leaderboard.map((l, i) => {
        const t = tiers.find(tier => tier.name === l.tier) || tiers[tiers.length - 1];
        // extract the darker color of the gradient for text color if possible, or just use a generic color mapping.
        // Actually we can just apply gradient text using background-clip but for simplicity, we map simple hexes.
        const tierColors = {
            "Master": "#f472b6", "Diamond": "#60a5fa", "Platinum": "#2dd4bf", 
            "Gold": "#fbbf24", "Silver": "#cbd5e1", "Bronze": "#fdba74", "Iron": "#a8a29e"
        };
        const color = tierColors[l.tier] || "#fff";
        return `
        <li>
            <span class="rank-num">${i+1}위</span>
            <span class="rank-score">${l.score}점</span>
            <span class="rank-tier" style="color: ${color}">${l.tier}</span>
        </li>
        `;
    }).join('');
}

function saveScore(score, tierName) {
    let leaderboard = JSON.parse(localStorage.getItem('appleRankings') || '[]');
    leaderboard.push({ score: score, tier: tierName, date: new Date().toLocaleDateString() });
    leaderboard.sort((a,b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); // Keep top 5
    localStorage.setItem('appleRankings', JSON.stringify(leaderboard));
}

shuffleBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    score = Math.max(0, score - 10);
    scoreEl.innerText = score;
    
    let values = [];
    let emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (!cell.classList.contains('cleared')) {
                values.push(cell.dataset.value);
                emptyCells.push({r, c});
                cell.classList.remove('selected');
            }
        }
    }
    
    values.sort(() => Math.random() - 0.5);
    
    emptyCells.forEach((pos, idx) => {
        const cell = grid[pos.r][pos.c];
        cell.querySelector('.number-label').innerText = values[idx];
        cell.dataset.value = values[idx];
        cell.classList.add('pop-in');
        setTimeout(() => cell.classList.remove('pop-in'), 300);
    });
});

window.onload = initTitleScreen;
