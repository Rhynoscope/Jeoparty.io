'use strict';

/**
 * JEOPARTY MASTER CATEGORIES & QUESTIONS DATABASE
 * Combines curated trivia across Serious Science, Deep History, Pop Culture,
 * Everyday Knowledge, Hilarious Absurdities, and Final Jeopardy showdowns.
 */

const { FUNNY_CATEGORIES } = require('./categories/funny');
const { SCIENCE_CATEGORIES } = require('./categories/science');
const { HISTORY_CATEGORIES } = require('./categories/history');
const { POP_CATEGORIES } = require('./categories/pop');
const { EVERYDAY_CATEGORIES } = require('./categories/everyday');
const { FINAL_JEOPARDY_POOL } = require('./categories/final');

// Master list of all builtin categories available for matchmaking
const BUILTIN_CATEGORIES = [
  ...FUNNY_CATEGORIES,
  ...SCIENCE_CATEGORIES,
  ...HISTORY_CATEGORIES,
  ...POP_CATEGORIES,
  ...EVERYDAY_CATEGORIES,
];

module.exports = {
  BUILTIN_CATEGORIES,
  FINAL_JEOPARDY_POOL,
};
