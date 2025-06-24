// backend/lang-utils.js — максимально совместимый с Wix Velo, c fallback и чистой логикой

import { franc as francCjs } from 'franc-cjs';
import langs from 'langs';

const MIN_LENGTH = 5;
const CONFIDENCE_THRESHOLD = 0.2;
const BLACKLIST = ['und', 'cmn', 'jpn', 'kor', 'zxx'];

export function detectLang(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
    .trim()
    .toLowerCase();

  if (cleaned.length < MIN_LENGTH) return null;

  let candidates = [];
  try {
    candidates = francCjs.all(cleaned);
  } catch (_) {
    try {
      const code = francCjs(cleaned);
      candidates = [[code, 1]];
    } catch (_) {
      return null;
    }
  }

  candidates = candidates.filter(([code]) => code && !BLACKLIST.includes(code));
  if (!candidates.length) return null;

  const [topLang, topScore] = candidates[0];
  const secondScore = candidates[1]?.[1] || 0;

  if (topScore - secondScore < 0.05 || topScore < CONFIDENCE_THRESHOLD) return null;

  const info = langs.where('3', topLang) || langs.where('2', topLang);
  return info ? info['1'] : null;
}
