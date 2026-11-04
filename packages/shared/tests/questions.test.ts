import { describe, expect, it } from 'vitest';
import {
  GYPSY_QUESTIONS,
  LOCALES,
  nextQuestionDeck,
  QUESTIONS_OFFERED,
  questionOffer,
} from '../src';

const deck = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

describe('GYPSY_QUESTIONS', () => {
  it('has 24 questions with unique ids that can be stored joined', () => {
    const ids = GYPSY_QUESTIONS.map((question) => question.id);
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('asks each one in every locale, as a question', () => {
    for (const { id, text } of GYPSY_QUESTIONS) {
      for (const locale of LOCALES) expect(text[locale].trim(), `${id}.${locale}`).toMatch(/\?$/);
    }
  });
});

describe('questionOffer', () => {
  it('offers the top of the deck, or what is left of it', () => {
    expect(questionOffer(deck)).toEqual(['a', 'b', 'c', 'd']);
    expect(questionOffer(deck)).toHaveLength(QUESTIONS_OFFERED);
    expect(questionOffer(['a', 'b'])).toEqual(['a', 'b']);
    expect(questionOffer([])).toEqual([]);
  });
});

describe('nextQuestionDeck', () => {
  it('keeps the same questions on top until one of them is picked', () => {
    expect(nextQuestionDeck(deck, [])).toEqual(deck);
    expect(nextQuestionDeck(deck, ['z'])).toEqual(deck);
  });

  it('moves the offer to the bottom after a pick, and drops the picked question', () => {
    expect(nextQuestionDeck(deck, ['b'])).toEqual(['e', 'f', 'g', 'h', 'a', 'c', 'd']);
  });

  it('brings the unpicked questions back only after the whole deck has been through', () => {
    const second = nextQuestionDeck(deck, ['b']);
    expect(questionOffer(second)).toEqual(['e', 'f', 'g', 'h']);
    const third = nextQuestionDeck(second, ['b', 'f']);
    expect(questionOffer(third)).toEqual(['a', 'c', 'd', 'e']);
    expect(third).not.toContain('b');
    expect(third).not.toContain('f');
  });

  it('drops both questions when two Gypsies pick from one offer', () => {
    expect(nextQuestionDeck(deck, ['a', 'c'])).toEqual(['e', 'f', 'g', 'h', 'b', 'd']);
  });

  it('runs out once every question has been picked', () => {
    expect(nextQuestionDeck(['a'], ['a'])).toEqual([]);
    expect(nextQuestionDeck([], ['a'])).toEqual([]);
  });
});
