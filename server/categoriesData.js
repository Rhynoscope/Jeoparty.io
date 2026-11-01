'use strict';

/**
 * Jeoparty Category & Question Database
 * Aggregates 53 handcrafted categories (over 1,100+ unique questions) across:
 * - Pop Culture & Entertainment
 * - Gaming & Tech
 * - Science & Nature
 * - History & Geography
 * - Funny & Absurd
 * - Food, Wordplay & Everyday Life
 * Plus expanded Final Jeoparty Pool (35 clues).
 */

const popCulture = require('./categories/popCulture');
const gamingTech = require('./categories/gamingTech');
const scienceNature = require('./categories/scienceNature');
const historyGeography = require('./categories/historyGeography');
const funnyAbsurd = require('./categories/funnyAbsurd');
const everydayLife = require('./categories/everydayLife');
const finalJeopardy = require('./categories/finalJeopardy');
const { HALLOWEEN_CATEGORIES, HALLOWEEN_FINAL_POOL } = require('./categories/halloween');

const BUILTIN_CATEGORIES = [
  ...popCulture,
  ...gamingTech,
  ...scienceNature,
  ...historyGeography,
  ...funnyAbsurd,
  ...everydayLife,
].map((cat) => ({
  ...cat,
  icon: cat.id,
}));

const HALLOWEEN_CATEGORIES_MAPPED = HALLOWEEN_CATEGORIES.map((cat) => ({
  ...cat,
  icon: cat.id,
}));

module.exports = {
  BUILTIN_CATEGORIES,
  FINAL_JEOPARDY_POOL: finalJeopardy,
  HALLOWEEN_CATEGORIES: HALLOWEEN_CATEGORIES_MAPPED,
  HALLOWEEN_FINAL_POOL,
};
