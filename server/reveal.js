'use strict';

/**
 * REVEAL UTILITIES (PROGRESSIVE QUESTION TYPING REMOVED)
 *
 * Full questions appear immediately upon clue selection so all players
 * (human and bot) have the complete text available to read before buzzing.
 * Supporting stubs are preserved for backward compatibility.
 */

function tokenizeWords(text) {
  const source = String(text || '');
  const tokens = [];
  const re = /\S+/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    tokens.push({
      word: match[0],
      endIndex: re.lastIndex,
    });
  }
  return tokens;
}

function buildRevealPlan() {
  return null;
}

function revealVisibleWords() {
  return Infinity;
}

function freezeReveal() {
  return null;
}

function resumeReveal() {
  return null;
}

function completeReveal() {}

function serializeReveal() {
  return null;
}

module.exports = {
  tokenizeWords,
  buildRevealPlan,
  revealVisibleWords,
  freezeReveal,
  resumeReveal,
  completeReveal,
  serializeReveal,
};
