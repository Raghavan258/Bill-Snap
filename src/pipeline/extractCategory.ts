import type { ExpenseCategory } from '../domain/categories';
import { documentText, missing } from './text';
import type { Field, OcrDocument } from './types';

const WORDS: Record<ExpenseCategory, string[]> = {
  Food: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'swiggy', 'zomato', 'bakery', 'kitchen', 'biryani', 'dhaba', 'tiffin', 'tea', 'food', 'foods', 'meals', 'hotel', 'dine'],
  Groceries: ['grocery', 'groceries', 'grocers', 'grocer', 'supermarket', 'kirana', 'provisions', 'dmart', 'bazaar', 'bigbasket', 'vegetable', 'mart'],
  Utilities: ['electricity', 'bescom', 'msedcl', 'bijli', 'broadband', 'internet', 'recharge', 'airtel', 'jio', 'bsnl', 'indane', 'utility', 'water', 'power', 'postpaid'],
};

/** Suggests a category only when one category's keywords clearly win. */
export function extractCategory(doc: OcrDocument): Field<ExpenseCategory> {
  const text = documentText(doc);
  const scores = (Object.keys(WORDS) as ExpenseCategory[]).map((category) => ({
    category,
    score: scoreWords(text, WORDS[category]),
  }));
  const best = scores.reduce((top, item) => (item.score > top.score ? item : top));
  const tied = scores.filter((item) => item.score === best.score && item.score > 0);
  if (best.score === 0 || tied.length !== 1) return missing();
  return { value: best.category, confidence: best.score >= 2 ? 'high' : 'low' };
}

function scoreWords(text: string, words: string[]): number {
  return words.reduce((total, word) => total + (hasWord(text, word) ? 1 : 0), 0);
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}
