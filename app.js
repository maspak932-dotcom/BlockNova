/* =========================================
   BLOCKNOVA — APP.JS
   DRAG & DROP EDITION
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

let score = 0;
let bestScore = 0;
let combo = 0;

let gameOver = false;

let previewCells = [];

let dragging = false;
let draggedPieceIndex = null;

let dragGhost = null;

let currentDragRow = null;
let currentDragCol = null;


/* =========================================
   BEST SCORE
   ========================================= */

try {
    bestScore =
        Number(
            localStorage.getItem("blocknova-best")
        ) || 0;
} catch {
    bestScore = 0;
}

bestScoreElement.textContent =
    bestScore.toLocaleString();


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

            const cell =
                document.createElement("div");

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

        slot.setAttribute(
            "aria-label",
            `Drag block ${index + 1}`
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

        /*
         * IMPORTANT:
         * No normal click-to-select system.
         * The block is directly draggable.
         */

        if (!piece.used) {

            slot.addEventListener(
                "pointerdown",
                event => {

                    event.preventDefault();

                    startDrag(
                        event,
                        index,
                        slot
                    );
                }
            );
        }

        piecesContainer.appendChild(slot);
    });
}


/* =========================================
   CREATE FLOATING DRAG GHOST
   ========================================= */

function createDragGhost(piece) {

    removeDragGhost();

    dragGhost =
        document.createElement("div");

    dragGhost.className =
        "drag-ghost";

    dragGhost.style.gridTemplateColumns =
        `repeat(${piece.shape[0].length}, 28px)`;

    piece.shape.forEach(row => {

        row.forEach(value => {

            const cell =
                document.createElement("div");

            if (value) {

                cell.className =
                    `drag-ghost-cell color-${piece.color}`;

            } else {

                cell.className =
                    "drag-ghost-cell empty";
            }

            dragGhost.appendChild(cell);
        });
    });

    document.body.appendChild(dragGhost);
}


/* =========================================
   REMOVE DRAG GHOST
   ========================================= */

function removeDragGhost() {

    if (dragGhost) {

        dragGhost.remove();

        dragGhost = null;
    }
}


/* =========================================
   MOVE DRAG GHOST
   ========================================= */

function moveDragGhost(
    clientX,
    clientY
) {

    if (!dragGhost) return;

    const rect =
        dragGhost.getBoundingClientRect();

    const offsetX =
        rect.width / 2;

    const offsetY =
        rect.height + 25;

    dragGhost.style.left =
        `${clientX - offsetX}px`;

    dragGhost.style.top =
        `${clientY - offsetY}px`;
}


/* =========================================
   START DRAG
   ========================================= */

function startDrag(
    event,
    index,
    slot
) {

    if (gameOver) return;

    if (!pieces[index]) return;

    if (pieces[index].used) return;

    dragging = true;

    draggedPieceIndex = index;

    const piece =
        pieces[index];

    createDragGhost(piece);

    slot.classList.add("dragging");

    moveDragGhost(
        event.clientX,
        event.clientY
    );

    /*
     * Listen globally so dragging still works
     * even when the pointer leaves the piece area.
     */

    window.addEventListener(
        "pointermove",
        handleDragMove
    );

    window.addEventListener(
        "pointerup",
        handleDragEnd,
        { once: true }
    );

    window.addEventListener(
        "pointercancel",
        handleDragCancel,
        { once: true }
    );
}


/* =========================================
   HANDLE DRAG MOVE
   ========================================= */

function handleDragMove(event) {

    if (!dragging) return;

    event.preventDefault();

    moveDragGhost(
        event.clientX,
        event.clientY
    );

    const boardPosition =
        getBoardPositionFromPoint(
            event.clientX,
            event.clientY
        );

    if (!boardPosition) {

        clearPreview();

        currentDragRow = null;
        currentDragCol = null;

        return;
    }

    currentDragRow =
        boardPosition.row;

    currentDragCol =
        boardPosition.col;

    showDragPreview(
        currentDragRow,
        currentDragCol
    );
}


/* =========================================
   HANDLE DRAG END
   ========================================= */

function handleDragEnd(event) {

    if (!dragging) return;

    const row =
        currentDragRow;

    const col =
        currentDragCol;

    const index =
        draggedPieceIndex;

    finishDragVisuals();

    if (
        row !== null &&
        col !== null &&
        index !== null
    ) {

        attemptPlacement(
            index,
            row,
            col
        );
    }

    resetDragState();
}


/* =========================================
   HANDLE DRAG CANCEL
   ========================================= */

function handleDragCancel() {

    finishDragVisuals();

    resetDragState();
}


/* =========================================
   FINISH DRAG VISUALS
   ========================================= */

function finishDragVisuals() {

    document
        .querySelectorAll(".piece-slot.dragging")
        .forEach(slot => {
            slot.classList.remove("dragging");
        });

    removeDragGhost();

    clearPreview();
}


/* =========================================
   RESET DRAG STATE
   ========================================= */

function resetDragState() {

    dragging = false;

    draggedPieceIndex = null;

    currentDragRow = null;
    currentDragCol = null;

    window.removeEventListener(
        "pointermove",
        handleDragMove
    );
}


/* =========================================
   GET BOARD POSITION FROM POINT
   ========================================= */

function getBoardPositionFromPoint(
    clientX,
    clientY
) {

    const rect =
        boardElement.getBoundingClientRect();

    if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
    ) {
        return null;
    }

    const x =
        clientX - rect.left;

    const y =
        clientY - rect.top;

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

    if (
        row < 0 ||
        row >= BOARD_SIZE ||
        col < 0 ||
        col >= BOARD_SIZE
    ) {
        return null;
    }

    return {
        row,
        col
    };
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

function canPlacePiece(
    piece,
    startRow,
    startCol
) {

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
   SHOW DRAG PREVIEW
   ========================================= */

function showDragPreview(
    row,
    col
) {

    clearPreview();

    if (draggedPieceIndex === null) {
        return;
    }

    const piece =
        pieces[draggedPieceIndex];

    if (!piece || piece.used) {
        return;
    }

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
                valid
                    ? "preview"
                    : "invalid"
            );

            previewCells.push(cell);
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
   ATTEMPT PLACEMENT
   ========================================= */

function attemptPlacement(
    pieceIndex,
    row,
    col
) {

    const piece =
        pieces[pieceIndex];

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

        statusMessage.classList.remove(
            "combo"
        );

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

    renderBoard();

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

    renderPieces();

    if (
        pieces.every(
            currentPiece =>
                currentPiece.used
        )
    ) {

        setTimeout(
            createPieces,
            250
        );
    }

    setTimeout(
        checkGameOver,
        350
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

    for (
        let row = 0;
        row < BOARD_SIZE;
        row++
    ) {

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

    for (
        let col = 0;
        col < BOARD_SIZE;
        col++
    ) {

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
        total:
            rows.length +
            cols.length
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
        points += currentCombo * 10;
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

    dragging = false;

    draggedPieceIndex = null;

    currentDragRow = null;
    currentDragCol = null;

    clearPreview();

    removeDragGhost();

    gameOverElement.classList.add(
        "hidden"
    );

    createEmptyBoard();

    renderBoard();

    createPieces();

    updateScore();

    statusMessage.textContent =
        "Drag a block onto the board";
}


/* =========================================
   BUTTONS
   ========================================= */

restartButton.addEventListener(
    "click",
    resetGame
);

playAgainButton.addEventListener(
    "click",
    resetGame
);


/* =========================================
   INITIALIZE
   ========================================= */

resetGame();
