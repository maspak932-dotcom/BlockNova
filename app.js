/* =========================================
   BLOCKNOVA — APP.JS
   ========================================= */

"use strict";

/* =========================================
   GAME SETTINGS
   ========================================= */

const BOARD_SIZE = 8;

const COLORS = [
    "blue",
    "purple",
    "green",
    "orange",
    "red",
    "cyan"
];


/* =========================================
   BLOCK SHAPES
   ========================================= */

const SHAPES = [
    [[1]],

    [[1, 1]],

    [[1],
     [1]],

    [[1, 1, 1]],

    [[1],
     [1],
     [1]],

    [[1, 1, 1, 1]],

    [[1],
     [1],
     [1],
     [1]],

    [[1, 1],
     [1, 1]],

    [[1, 1, 1],
     [1, 1, 1]],

    [[1, 0],
     [1, 1]],

    [[0, 1],
     [1, 1]],

    [[1, 1],
     [1, 0]],

    [[1, 1],
     [0, 1]],

    [[1, 0, 0],
     [1, 1, 1]],

    [[0, 0, 1],
     [1, 1, 1]],

    [[1, 1, 1],
     [0, 1, 0]],

    [[0, 1],
     [1, 1],
     [0, 1]],

    [[1, 0],
     [1, 1],
     [1, 0]],

    [[0, 1],
     [1, 1],
     [0, 1]],

    [[1, 1, 1],
     [0, 1, 0],
     [0, 1, 0]],

    [[0, 1, 0],
     [1, 1, 1]],

    [[1, 1, 1],
     [1, 0, 0]]
];


/* =========================================
   DOM ELEMENTS
   ========================================= */

const boardElement =
    document.getElementById("gameBoard");

const piecesContainer =
    document.getElementById("piecesContainer");

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("bestScore");

const comboElement =
    document.getElementById("combo");

const statusMessage =
    document.getElementById("statusMessage");

const restartButton =
    document.getElementById("restartBtn");

const gameOverElement =
    document.getElementById("gameOver");

const finalScoreElement =
    document.getElementById("finalScore");

const playAgainButton =
    document.getElementById("playAgainBtn");


/* =========================================
   GAME STATE
   ========================================= */

let board = [];

let pieces = [];

let selectedPieceIndex = null;

let score = 0;

let bestScore = 0;

let combo = 0;

let gameOver = false;

let previewCells = [];


/* =========================================
   BEST SCORE
   ========================================= */

try {
    bestScore =
        Number(localStorage.getItem("blocknova-best")) || 0;
} catch {
    bestScore = 0;
}

bestScoreElement.textContent = bestScore;


/* =========================================
   CREATE EMPTY BOARD
   ========================================= */

function createEmptyBoard() {

    board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {

        const currentRow = [];

        for (let col = 0; col < BOARD_SIZE; col++) {

            currentRow.push(null);
        }

        board.push(currentRow);
    }
}


/* =========================================
   CREATE BOARD UI
   ========================================= */

function renderBoard() {

    boardElement.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row++) {

        for (let col = 0; col < BOARD_SIZE; col++) {

            const cell = document.createElement("div");

            cell.className = "cell";

            cell.dataset.row = row;
            cell.dataset.col = col;

            boardElement.appendChild(cell);
        }
    }

    renderFilledCells();
}


/* =========================================
   RENDER FILLED CELLS
   ========================================= */

function renderFilledCells() {

    const cells =
        boardElement.querySelectorAll(".cell");

    cells.forEach(cell => {

        const row =
            Number(cell.dataset.row);

        const col =
            Number(cell.dataset.col);

        cell.className = "cell";

        const color =
            board[row][col];

        if (color) {

            cell.classList.add(
                "filled",
                `color-${color}`
            );
        }
    });
}


/* =========================================
   RANDOM COLOR
   ========================================= */

function randomColor() {

    return COLORS[
        Math.floor(
            Math.random() * COLORS.length
        )
    ];
}


/* =========================================
   COPY SHAPE
   ========================================= */

function copyShape(shape) {

    return shape.map(row => [...row]);
}


/* =========================================
   CREATE RANDOM PIECE
   ========================================= */

function createRandomPiece() {

    const shape =
        SHAPES[
            Math.floor(
                Math.random() * SHAPES.length
            )
        ];

    return {
        shape: copyShape(shape),
        color: randomColor(),
        used: false
    };
}


/* =========================================
   CREATE THREE PIECES
   ========================================= */

function createPieces() {

    pieces = [];

    for (let i = 0; i < 3; i++) {

        pieces.push(
            createRandomPiece()
        );
    }

    selectedPieceIndex = null;

    renderPieces();
}


/* =========================================
   RENDER PIECES
   ========================================= */

function renderPieces() {

    piecesContainer.innerHTML = "";

    pieces.forEach((piece, index) => {

        const slot =
            document.createElement("button");

        slot.type = "button";

        slot.className = "piece-slot";

        if (piece.used) {
            slot.classList.add("used");
        }

        if (selectedPieceIndex === index) {
            slot.classList.add("selected");
        }

        slot.setAttribute(
            "aria-label",
            `Select block ${index + 1}`
        );

        const mini =
            document.createElement("div");

        mini.className = "mini-piece";

        mini.style.gridTemplateColumns =
            `repeat(${piece.shape[0].length}, 20px)`;

        piece.shape.forEach(row => {

            row.forEach(value => {

                const miniCell =
                    document.createElement("div");

                if (value) {

                    miniCell.className =
                        `mini-cell color-${piece.color}`;
                } else {

                    miniCell.style.visibility =
                        "hidden";
                }

                mini.appendChild(miniCell);
            });
        });

        slot.appendChild(mini);

        slot.addEventListener(
            "click",
            () => selectPiece(index)
        );

        piecesContainer.appendChild(slot);
    });
}


/* =========================================
   SELECT PIECE
   ========================================= */

function selectPiece(index) {

    if (gameOver) return;

    if (!pieces[index] || pieces[index].used) {
        return;
    }

    selectedPieceIndex = index;

    clearPreview();

    renderPieces();

    statusMessage.textContent =
        "Now choose a place on the board";

    statusMessage.classList.add("combo");
}


/* =========================================
   GET BOARD CELL
   ========================================= */

function getCell(row, col) {

    return boardElement.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
    );
}


/* =========================================
   CHECK VALID PLACEMENT
   ========================================= */

function canPlacePiece(piece, startRow, startCol) {

    if (!piece) return false;

    for (
        let r = 0;
        r < piece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < piece.shape[r].length;
            c++
        ) {

            if (!piece.shape[r][c]) {
                continue;
            }

            const row =
                startRow + r;

            const col =
                startCol + c;

            if (
                row < 0 ||
                row >= BOARD_SIZE ||
                col < 0 ||
                col >= BOARD_SIZE
            ) {
                return false;
            }

            if (board[row][col]) {
                return false;
            }
        }
    }

    return true;
}


/* =========================================
   PLACE PIECE
   ========================================= */

function placePiece(
    piece,
    startRow,
    startCol
) {

    for (
        let r = 0;
        r < piece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < piece.shape[r].length;
            c++
        ) {

            if (!piece.shape[r][c]) {
                continue;
            }

            board[startRow + r][startCol + c] =
                piece.color;
        }
    }
}


/* =========================================
   CLEAR PREVIEW
   ========================================= */

function clearPreview() {

    previewCells.forEach(cell => {

        cell.classList.remove(
            "preview",
            "invalid"
        );
    });

    previewCells = [];
}


/* =========================================
   SHOW PREVIEW
   ========================================= */

function showPreview(row, col) {

    clearPreview();

    if (
        selectedPieceIndex === null ||
        !pieces[selectedPieceIndex]
    ) {
        return;
    }

    const piece =
        pieces[selectedPieceIndex];

    if (piece.used) return;

    const valid =
        canPlacePiece(
            piece,
            row,
            col
        );

    for (
        let r = 0;
        r < piece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < piece.shape[r].length;
            c++
        ) {

            if (!piece.shape[r][c]) {
                continue;
            }

            const targetRow =
                row + r;

            const targetCol =
                col + c;

            if (
                targetRow < 0 ||
                targetRow >= BOARD_SIZE ||
                targetCol < 0 ||
                targetCol >= BOARD_SIZE
            ) {
                continue;
            }

            const cell =
                getCell(
                    targetRow,
                    targetCol
                );

            if (!cell) continue;

            cell.classList.add(
                valid ? "preview" : "invalid"
            );

            previewCells.push(cell);
        }
    }
}


/* =========================================
   GET BOARD POSITION FROM POINTER
   ========================================= */

function getBoardPosition(event) {

    const rect =
        boardElement.getBoundingClientRect();

    const x =
        event.clientX - rect.left;

    const y =
        event.clientY - rect.top;

    const col =
        Math.floor(
            (x / rect.width) *
            BOARD_SIZE
        );

    const row =
        Math.floor(
            (y / rect.height) *
            BOARD_SIZE
        );

    return {
        row,
        col
    };
}


/* =========================================
   BOARD POINTER MOVE
   ========================================= */

boardElement.addEventListener(
    "pointermove",
    event => {

        if (
            selectedPieceIndex === null ||
            gameOver
        ) {
            return;
        }

        const position =
            getBoardPosition(event);

        showPreview(
            position.row,
            position.col
        );
    }
);


/* =========================================
   BOARD POINTER LEAVE
   ========================================= */

boardElement.addEventListener(
    "pointerleave",
    () => {

        clearPreview();
    }
);


/* =========================================
   BOARD POINTER DOWN
   ========================================= */

boardElement.addEventListener(
    "pointerdown",
    event => {

        if (
            selectedPieceIndex === null ||
            gameOver
        ) {
            return;
        }

        const position =
            getBoardPosition(event);

        attemptPlacement(
            position.row,
            position.col
        );
    }
);


/* =========================================
   ATTEMPT PLACEMENT
   ========================================= */

function attemptPlacement(row, col) {

    if (selectedPieceIndex === null) {
        return;
    }

    const piece =
        pieces[selectedPieceIndex];

    if (!piece || piece.used) {
        return;
    }

    if (
        !canPlacePiece(
            piece,
            row,
            col
        )
    ) {

        statusMessage.textContent =
            "That block cannot fit there";

        return;
    }

    placePiece(
        piece,
        row,
        col
    );

    piece.used = true;

    const placedCells =
        countCells(piece.shape);

    score += placedCells;

    selectedPieceIndex = null;

    clearPreview();

    renderBoard();

    renderPieces();

    const cleared =
        findCompletedLines();

    if (cleared.total > 0) {

        combo++;

        score +=
            calculateClearScore(
                cleared,
                combo
            );

        showClearAnimation(
            cleared
        );

    } else {

        combo = 0;
    }

    updateScore();

    if (
        pieces.every(
            currentPiece =>
                currentPiece.used
        )
    ) {

        createPieces();
    }

    setTimeout(
        checkGameOver,
        250
    );

    statusMessage.classList.remove(
        "combo"
    );

    if (cleared.total > 0) {

        statusMessage.textContent =
            `${cleared.total} line${cleared.total > 1 ? "s" : ""} cleared!`;
        
        statusMessage.classList.add(
            "combo"
        );

    } else {

        statusMessage.textContent =
            "Nice move! Keep going.";
    }
}


/* =========================================
   COUNT BLOCK CELLS
   ========================================= */

function countCells(shape) {

    let total = 0;

    shape.forEach(row => {

        row.forEach(value => {

            if (value) {
                total++;
            }
        });
    });

    return total;
}


/* =========================================
   FIND COMPLETED LINES
   ========================================= */

function findCompletedLines() {

    const rows = [];
    const cols = [];

    for (let row = 0; row < BOARD_SIZE; row++) {

        let complete = true;

        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {

            if (!board[row][col]) {
                complete = false;
                break;
            }
        }

        if (complete) {
            rows.push(row);
        }
    }


    for (let col = 0; col < BOARD_SIZE; col++) {

        let complete = true;

        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {

            if (!board[row][col]) {
                complete = false;
                break;
            }
        }

        if (complete) {
            cols.push(col);
        }
    }

    return {
        rows,
        cols,
        total: rows.length + cols.length
    };
}


/* =========================================
   CLEAR COMPLETED LINES
   ========================================= */

function clearCompletedLines(cleared) {

    const cellsToClear =
        new Set();

    cleared.rows.forEach(row => {

        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {

            cellsToClear.add(
                `${row}-${col}`
            );
        }
    });

    cleared.cols.forEach(col => {

        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {

            cellsToClear.add(
                `${row}-${col}`
            );
        }
    });


    cellsToClear.forEach(key => {

        const [row, col] =
            key.split("-").map(Number);

        board[row][col] = null;
    });

    return cellsToClear;
}


/* =========================================
   CLEAR ANIMATION
   ========================================= */

function showClearAnimation(cleared) {

    const cellsToClear =
        new Set();

    cleared.rows.forEach(row => {

        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {

            cellsToClear.add(
                `${row}-${col}`
            );
        }
    });

    cleared.cols.forEach(col => {

        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {

            cellsToClear.add(
                `${row}-${col}`
            );
        }
    });


    cellsToClear.forEach(key => {

        const [row, col] =
            key.split("-").map(Number);

        const cell =
            getCell(row, col);

        if (cell) {
            cell.classList.add(
                "clearing"
            );
        }
    });


    setTimeout(() => {

        clearCompletedLines(cleared);

        renderBoard();

    }, 280);
}


/* =========================================
   CLEAR SCORE
   ========================================= */

function calculateClearScore(
    cleared,
    currentCombo
) {

    const lines =
        cleared.total;

    let points =
        lines * 10;

    if (lines >= 2) {
        points += lines * 10;
    }

    if (lines >= 3) {
        points += lines * 15;
    }

    if (currentCombo > 1) {

        points +=
            currentCombo * 10;
    }

    return points;
}


/* =========================================
   UPDATE SCORE
   ========================================= */

function updateScore() {

    scoreElement.textContent =
        score.toLocaleString();

    comboElement.textContent =
        combo;

    if (score > bestScore) {

        bestScore = score;

        bestScoreElement.textContent =
            bestScore.toLocaleString();

        try {

            localStorage.setItem(
                "blocknova-best",
                String(bestScore)
            );

        } catch {
            /* Storage unavailable */
        }
    }
}


/* =========================================
   CHECK GAME OVER
   ========================================= */

function checkGameOver() {

    if (gameOver) return;

    const availablePieces =
        pieces.filter(
            piece => !piece.used
        );

    if (availablePieces.length === 0) {
        return;
    }


    const hasMove =
        availablePieces.some(
            piece => {

                for (
                    let row = 0;
                    row < BOARD_SIZE;
                    row++
                ) {

                    for (
                        let col = 0;
                        col < BOARD_SIZE;
                        col++
                    ) {

                        if (
                            canPlacePiece(
                                piece,
                                row,
                                col
                            )
                        ) {

                            return true;
                        }
                    }
                }

                return false;
            }
        );


    if (!hasMove) {
        endGame();
    }
}


/* =========================================
   GAME OVER
   ========================================= */

function endGame() {

    gameOver = true;

    finalScoreElement.textContent =
        score.toLocaleString();

    gameOverElement.classList.remove(
        "hidden"
    );
}


/* =========================================
   RESET GAME
   ========================================= */

function resetGame() {

    gameOver = false;

    score = 0;

    combo = 0;

    selectedPieceIndex = null;

    clearPreview();

    gameOverElement.classList.add(
        "hidden"
    );

    createEmptyBoard();

    renderBoard();

    createPieces();

    updateScore();

    statusMessage.textContent =
        "Choose a block and place it on the board";
}


/* =========================================
   RESTART BUTTON
   ========================================= */

restartButton.addEventListener(
    "click",
    resetGame
);


/* =========================================
   PLAY AGAIN
   ========================================= */

playAgainButton.addEventListener(
    "click",
    resetGame
);


/* =========================================
   INITIALIZE GAME
   ========================================= */

resetGame();
