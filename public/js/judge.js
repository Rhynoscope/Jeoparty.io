const VALID_MOODS = new Set(['thinking', 'accept', 'reject', 'announce']);

// A small hand-drawn pixel judge that shares the game's heavy ink outline and
// flat palette. The contestant's own customized avatar is shown beside it.
export function judgeCharacterHTML(mood = 'thinking') {
  const safeMood = VALID_MOODS.has(mood) ? mood : 'thinking';
  return `<svg class="judge-character" data-mood="${safeMood}" viewBox="0 0 64 76" role="img" aria-label="Pixel-art game-show judge with hair, mustache, suit, and tie" shape-rendering="crispEdges">
    <g class="judge-arm"><path d="M8 75V57l9-9h28l11 9v18H8Z" fill="#2456b8" stroke="#101018" stroke-width="3"/><path d="M24 49h16l-2 9-6 8-7-8Z" fill="#fff8e8" stroke="#101018" stroke-width="2"/><path d="M30 56h5l-1 5 2 11-4 4-4-4 2-11Z" fill="#e34853" stroke="#101018" stroke-width="2"/>
      <path d="M17 35V20l5-9 9-4 13 4 5 9v16l-6 12H23Z" fill="#f0bd8c" stroke="#101018" stroke-width="3"/>
      <path d="M17 24V15l8-9h19l7 8v12l-7-5-5-7-8 6-10 2Z" fill="#302017" stroke="#101018" stroke-width="3"/>
      <path d="M23 29h5v4h-5zm14 0h5v4h-5z" fill="#101018"/><path d="M28 39h10l-3 3h-5Z" fill="#fff8e8" stroke="#101018" stroke-width="1.5"/>
      <path d="M22 36h8l3 3 3-3h8l-3 7-8 3-8-3Z" fill="#302017" stroke="#101018" stroke-width="2"/>
      <path d="M23 51l8 8-5 6-8-10zm18 0-8 8 5 6 8-10z" fill="#fff8e8" stroke="#101018" stroke-width="2"/>
    </g>
    <path class="judge-raised-hand" d="M10 58 3 48l3-4 6 5 1-8 4 1 1 11-5 8Z" fill="#f0bd8c" stroke="#101018" stroke-width="2.5"/>
    <path class="judge-gavel" d="M49 25 56 18l4 4-7 7zm-3 5 4-4 3 3-4 4zm1 2 9 9-3 3-9-9z" fill="#ffd23f" stroke="#101018" stroke-width="2"/>
  </svg>`;
}
