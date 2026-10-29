/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { MARKS } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { MARK_TONE, MARK_TONES, markChipClass } from '../../src/design/markTone';

// Read from disk: Vitest turns CSS imports, even `?raw` ones, into empty strings.
const tokens = readFileSync(new URL('../../src/design/tokens.css', import.meta.url), 'utf8');

function color(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`).exec(tokens);
  if (!match?.[1]) throw new Error(`tokens.css has no --color-${name}`);
  return match[1];
}

// WCAG relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

describe('mark inks', () => {
  it('gives every mark an ink, and only known ones', () => {
    for (const mark of MARKS) expect(Object.hasOwn(MARK_TONE, mark.id), mark.id).toBe(true);
    const known = new Set(MARKS.map((mark) => mark.id));
    for (const id of Object.keys(MARK_TONE)) expect(known.has(id), id).toBe(true);
  });

  it('tells apart the marks one player often carries together', () => {
    for (const [a, b] of [
      ['heal-used', 'kill-used'],
      ['lover', 'cursed'],
      ['power-used', 'life-lost'],
      ['power-used', 'blessed'],
      ['doomed', 'blessed'],
      ['amulet', 'blessed'],
      ['cursed', 'charmed'],
      ['role-model', 'turned'],
    ] as const) {
      expect(MARK_TONE[a], `${a} / ${b}`).not.toBe(MARK_TONE[b]);
    }
  });

  it('keeps each ink readable on its wash at caption size', () => {
    for (const tone of MARK_TONES) {
      const ratio = contrast(color(`mark-${tone}`), color(`mark-${tone}-wash`));
      expect(ratio, tone).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('never uses a faction wash for a chip', () => {
    const factions = ['village-wash', 'werewolf-wash', 'solo-wash'].map(color);
    for (const tone of MARK_TONES) expect(factions).not.toContain(color(`mark-${tone}-wash`));
  });

  it('leaves a mark the app no longer knows plain', () => {
    expect(markChipClass('sheriff')).toBe('bg-field text-ink');
    expect(markChipClass('lover')).toBe('bg-mark-rose-wash text-mark-rose');
  });
});
