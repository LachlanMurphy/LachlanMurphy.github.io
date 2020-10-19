window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const canvas2 = document.getElementById('savedPiece');
const context2 = canvas2.getContext('2d');

context2.fillStyle = 'white';
context2.fillRect(0, 200, 200, 4);
context2.font = '20px arial';
context2.fillText('Saved Piece', 50, 20);
context2.fillText('Next Piece', 55, 225);

var pause = false;
var resetCheck = false;
var gameStart = false;
var savedPieceCheck = false;
var moveTimeout = 0;
var timeout;

context.scale(20, 20);
context2.scale(40, 40);

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 1;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset, ghost) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (ghost === 1) {
                    context.fillStyle = 'white';
                } else {
                    context.fillStyle = colors[value];
                }
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        if (moveTimeout === 0) {
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
localStorage.getItem('savedPieceValue')
    if (resetCheck === false) {
        if (player.matrix === null) {
            player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
            localStorage.setItem('nextPiece', pieces[pieces.length * Math.random() | 0]);
            changeNextPiece(createPiece(localStorage.getItem('nextPiece')), player.pos, 5);
        } else {
            player.matrix = createPiece(localStorage.getItem('nextPiece'));
            localStorage.setItem('nextPiece', pieces[pieces.length * Math.random() | 0]);
        changeNextPiece(createPiece(localStorage.getItem('nextPiece')), player.pos, 5);
        }
    } else {
        player.matrix = createPiece(localStorage.getItem('savedPieceValue'));
    }
    ghostPlayer.matrix = player.matrix;

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        document.getElementById("gameOver").style.visibility = "visible";
        pause = true;
        gameStart = false;
        if (localStorage.getItem('highScore') === null) {
            localStorage.setItem('highScore', player.score)
        } else if (localStorage.getItem('highScore') < player.score) {
            localStorage.setItem('highScore', player.score)
        }
        document.getElementById("gameOver").innerText = "Game Over" + "\nScore: " + player.score + "\nHigh Score: " + localStorage.getItem('highScore');
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
var speedDrop = false;

let lastTime = 0;
function update(time = 0) {
    if (pause !== true) {
        if (resetCheck === true) {
            localStorage.setItem('savedPieceMatrix', player.matrix);
        }

        if (speedDrop === true) {
            var dropInterval = 0;
            speedDrop = false;
        } else {
            if (player.score >= 70) {
                var dropInterval = 120;
            } else {
                var dropInterval = 1000 * (1.050 - (.025 * player.level));
            }
        }
        const deltaTime = time - lastTime;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        lastTime = time;

        const ghostPlayer = {
            pos: {x: player.pos.x, y: player.pos.y},
            matrix: player.matrix,
            score: player.score,
            level: player.level,
        }
        while (collide(arena, ghostPlayer) === false) {
            ghostPlayer.pos.y++;
        }
        ghostPlayer.pos.y--;
        localStorage.setItem('ghostPlayer.pos.y', ghostPlayer.pos.y);
        draw();
        drawMatrix(ghostPlayer.matrix, ghostPlayer.pos, 1);
        drawMatrix(player.matrix, player.pos, 0);
        requestAnimationFrame(update);
    }
}

function updateScore() {
    player.level = Math.floor(player.score / 2) + 1;
    document.getElementById('score').innerText = "Score: " + player.score + " Level: " + player.level;
}

document.addEventListener('keydown', event => {
    if (gameStart === true) {
        if (event.keyCode === 37) {
            playerMove(-1);
        } else if (event.keyCode === 39) {
            playerMove(1);
        } else if (event.keyCode === 40) {
            playerDrop();
        } else if (event.keyCode === 81) {
            playerRotate(-1);
        } else if (event.keyCode === 38) {
            playerRotate(1);
        }
    }
    moveTimeout = 1;
    clearTimeout(timeout);
    timeout = setTimeout(function() {moveTimeout = 0;}, 200);
});

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    level: 1,
};

const ghostPlayer = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: -1,
    level: 1,
}

const pieces = 'TSZOJLI';


updateScore();
document.getElementById("gameStart").onmousedown = function() {
    if (gameStart === false) {
        player.score = 0;
        player.level = 1
        arena.forEach(row => row.fill(0));
        context.clearRect(0, 0, canvas.width, canvas.height);
        gameStart = true;
        document.getElementById("gameOver").style.visibility = "hidden";
        pause = false;
        playerReset();
        updateScore();
        update();
    }
}

document.onkeydown = function(event) {
    if (gameStart === true) {
        if (document.getElementById("gameOver").style.visibility != "visible") {
            if (event.keyCode === 27) {
                if (pause === false) {
                    pause = true;
                    document.getElementById("pause").style.visibility = 'visible';
                } else {
                    pause = false;
                    document.getElementById("pause").style.visibility = 'hidden';
                    update();
                }
            }
        }

        if (event.keyCode === 32) {
            player.pos.y = localStorage.getItem('ghostPlayer.pos.y');
            speedDrop = true;
            moveTimeout = 0;
        }

        if (event.keyCode === 67) {
            if (savedPieceCheck === false) {
                context2.clearRect(0, 1, 5, 4);

                savedPieceCheck = true;
                resetCheck = true;
                update();

                const pieces = 'TSZOJLI';
                var savedMatrix = localStorage.getItem('savedPieceMatrix').split(',');
                for (var i = 0; i < savedMatrix.length; i++) {
                    if (parseInt(savedMatrix[i]) !== 0) {
                        localStorage.setItem('savedPieceValue', pieces[pieces.length - savedMatrix[i]]);
                    }
                }
                changeNextPiece(createPiece(localStorage.getItem('savedPieceValue')), player.pos, 0);

                resetCheck = false;
                playerReset();
            } else {
                resetCheck = true;
                playerReset();
                context2.clearRect(0, 1, 5, 4);
                savedPieceCheck = false;
                resetCheck = false;
            }
        }
    }
}

function changeNextPiece(matrix, offset, yOffset) {
    if (yOffset > 0) {
        context2.clearRect(0, 6, 5, 10);
    } else {
        context2.clearRect(0, 1, 5, 4);
    }
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context2.fillStyle = colors[value];
                context2.fillRect(x + 1, y + 1 + yOffset, 1, 1);
            }
        });
    });
}