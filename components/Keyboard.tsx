
import React from 'react';
import { KEYBOARD_ROWS } from '../constants';
import { LetterStatus, GuessResult } from '../types';

interface KeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  guessFeedback: GuessResult[][];
}

const Keyboard: React.FC<KeyboardProps> = ({ onChar, onEnter, onDelete, guessFeedback }) => {
  const charStatusMap: Record<string, LetterStatus> = {};

  guessFeedback.forEach(row => {
    row.forEach(cell => {
      const current = charStatusMap[cell.letter];
      if (cell.status === LetterStatus.CORRECT) {
        charStatusMap[cell.letter] = LetterStatus.CORRECT;
      } else if (cell.status === LetterStatus.PRESENT && current !== LetterStatus.CORRECT) {
        charStatusMap[cell.letter] = LetterStatus.PRESENT;
      } else if (cell.status === LetterStatus.ABSENT && !current) {
        charStatusMap[cell.letter] = LetterStatus.ABSENT;
      }
    });
  });

  const getKeyColor = (key: string) => {
    const status = charStatusMap[key];
    switch (status) {
      case LetterStatus.CORRECT: return 'bg-[#538d4e]';
      case LetterStatus.PRESENT: return 'bg-[#b59f3b]';
      case LetterStatus.ABSENT: return 'bg-[#3a3a3c]';
      default: return 'bg-[#818384]';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-2">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center mb-2 gap-1.5">
          {row.map(key => {
            const isSpecial = key === 'ENTER' || key === 'DEL';
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'ENTER') onEnter();
                  else if (key === 'DEL') onDelete();
                  else onChar(key);
                }}
                className={`${isSpecial ? 'px-4 text-xs font-bold' : 'w-10 h-14 text-lg font-bold'} 
                  ${getKeyColor(key)} rounded flex items-center justify-center transition-all active:scale-95`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
