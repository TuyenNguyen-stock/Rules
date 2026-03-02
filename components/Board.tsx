import React, { useRef, useEffect } from 'react';
import { Cell } from './Cell';
import { CellValue, Position } from '../types';
import { BOARD_SIZE } from '../constants';

interface BoardProps {
  board: CellValue[][];
  lastMove: Position | null;
  winningLine: Position[] | null;
  onCellClick: (x: number, y: number) => void;
  disabled: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, lastMove, winningLine, onCellClick, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const CELL_SIZE = 36; // Fixed pixel size for stability

  // Auto scroll to center on mount
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, []);

  const isWinning = (x: number, y: number) => {
    if (!winningLine) return false;
    return winningLine.some(p => p.x === x && p.y === y);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-slate-900 border-2 border-slate-700 rounded-lg shadow-2xl relative"
    >
      <div 
        className="grid gap-[1px] bg-slate-700 mx-auto my-4"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          width: 'max-content', 
          padding: '1px'
        }}
      >
        {board.map((row, y) => (
          row.map((cell, x) => (
            <Cell
              key={`${x}-${y}`}
              x={x}
              y={y}
              value={cell}
              isLastMove={lastMove?.x === x && lastMove?.y === y}
              isWinningCell={isWinning(x, y)}
              onClick={() => onCellClick(x, y)}
              disabled={disabled || cell !== null}
            />
          ))
        ))}
      </div>
    </div>
  );
};
