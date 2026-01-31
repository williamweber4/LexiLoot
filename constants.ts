
export const COLORS = {
  correct: 'bg-[#538d4e]',
  present: 'bg-[#b59f3b]',
  absent: 'bg-[#3a3a3c]',
  empty: 'bg-transparent border-[#3a3a3c]',
  active: 'border-[#565758]',
};

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

export const INITIAL_WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const REWARD_PERCENTILE = 0.10; // Top 10%
export const AD_WAIT_SECONDS = 5;
