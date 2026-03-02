import { BOARD_SIZE, WIN_CONDITION } from '../constants';
import { CellValue, Player, Position } from '../types';

export const createEmptyBoard = (): CellValue[][] => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
};

export const checkWin = (board: CellValue[][], x: number, y: number, player: Player): Position[] | null => {
  const directions = [
    [1, 0],   // Horizontal
    [0, 1],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    const line: Position[] = [{x, y}];

    // Check forward
    for (let i = 1; i < WIN_CONDITION; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
      if (board[ny][nx] === player) {
        count++;
        line.push({x: nx, y: ny});
      } else {
        break;
      }
    }

    // Check backward
    for (let i = 1; i < WIN_CONDITION; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
      if (board[ny][nx] === player) {
        count++;
        line.push({x: nx, y: ny});
      } else {
        break;
      }
    }

    if (count >= WIN_CONDITION) {
      return line;
    }
  }

  return null;
};

// --- Heuristic AI ---

const countConsecutive = (board: CellValue[][], x: number, y: number, player: Player): number => {
  let totalScore = 0;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    let consecutive = 0;
    let blocked = 0;
    
    // Forward
    for (let i = 1; i <= 4; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) { blocked++; break; }
        if (board[ny][nx] === player) consecutive++;
        else if (board[ny][nx] !== null) { blocked++; break; }
        else break;
    }

    // Backward
    for (let i = 1; i <= 4; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) { blocked++; break; }
        if (board[ny][nx] === player) consecutive++;
        else if (board[ny][nx] !== null) { blocked++; break; }
        else break;
    }

    // Scoring Rules
    if (consecutive >= 4) { 
        totalScore += 100000; 
    } else if (consecutive === 3 && blocked === 0) {
        totalScore += 10000;
    } else if (consecutive === 3 && blocked === 1) {
        totalScore += 1500; 
    } else if (consecutive === 2 && blocked === 0) {
        totalScore += 1000;
    } else if (consecutive === 2 && blocked === 1) {
        totalScore += 100;
    } else if (consecutive === 1 && blocked === 0) {
        totalScore += 50;
    } else if (consecutive === 1 && blocked === 1) {
        totalScore += 10;
    }
  }
  return totalScore;
}

const evaluateMove = (board: CellValue[][], x: number, y: number, aiPlayer: Player, humanPlayer: Player): number => {
  const attackScore = countConsecutive(board, x, y, aiPlayer);
  const defenseScore = countConsecutive(board, x, y, humanPlayer);

  if (attackScore >= 100000) return 200000000; // Win now
  if (defenseScore >= 100000) return 100000000; // Block loss
  if (attackScore >= 10000) return 50000000;    // Open 4
  if (defenseScore >= 10000) return 20000000;   // Block Open 4

  return attackScore * 1.2 + defenseScore;
}

export const getBestMove = (board: CellValue[][], aiPlayer: Player): Position => {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  let bestScore = -Infinity;
  let move: Position = { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) };
  
  // If board is empty, play center
  if (board.every(row => row.every(cell => cell === null))) {
     return move;
  }

  const potentialMoves: Position[] = [];
  const radius = 2; 

  // Identify candidate moves (neighboring existing stones)
  for(let y = 0; y < BOARD_SIZE; y++) {
    for(let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== null) continue;

      let hasNeighbor = false;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE && board[ny][nx] !== null) {
            hasNeighbor = true;
            break;
          }
        }
        if (hasNeighbor) break;
      }
      if (hasNeighbor) potentialMoves.push({x, y});
    }
  }

  for (const pos of potentialMoves) {
    const score = evaluateMove(board, pos.x, pos.y, aiPlayer, humanPlayer);
    if (score > bestScore) {
      bestScore = score;
      move = pos;
    }
  }

  return move;
};
