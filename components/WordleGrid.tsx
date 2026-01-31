
import React from 'react';
import { LetterStatus, GuessResult } from '../types';
import { COLORS, MAX_GUESSES } from '../constants';

interface WordleGridProps {
  guesses: string[];
  feedback: GuessResult[][];
  currentGuess: string;
  wordLength: number;
  shake?: boolean;
}

const WordleGrid: React.FC<WordleGridProps> = ({ guesses, feedback, currentGuess, wordLength, shake }) => {
  const rows = new Array(MAX_GUESSES).fill(null);

  return (
    <div className={`grid grid-rows-6 gap-2 p-4 ${shake ? 'grid-shake' : ''}`}>
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const isPastRow = rowIndex < guesses.length;
        const rowFeedback = feedback[rowIndex];
        const rowWord = isCurrentRow ? currentGuess : (guesses[rowIndex] || "");

        return (
          <div key={rowIndex} className="grid grid-cols-5 gap-2">
            {new Array(wordLength).fill(null).map((__, colIndex) => {
              const char = rowWord[colIndex] || "";
              let statusClass = COLORS.empty;
              
              if (isPastRow && rowFeedback) {
                const status = rowFeedback[colIndex].status;
                statusClass = COLORS[status];
              } else if (isCurrentRow && char) {
                statusClass = COLORS.active;
              }

              return (
                <div
                  key={colIndex}
                  className={`w-14 h-14 border-2 flex items-center justify-center text-3xl font-bold uppercase transition-all duration-300
                    ${statusClass} ${isPastRow ? 'flip-letter border-transparent text-white' : 'text-zinc-100'}
                  `}
                  style={{ animationDelay: `${colIndex * 100}ms` }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default WordleGrid;