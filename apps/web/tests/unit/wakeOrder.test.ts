import { describe, expect, it } from 'vitest';
import { moveItem } from '../../src/components/wakeOrder';

describe('moveItem', () => {
  it('moves an item later and earlier', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('clamps a target past either end', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -4)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 9)).toEqual(['a', 'c', 'b']);
  });

  it('leaves the list alone for a missing item', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });

  it('does not change the original list', () => {
    const items = ['a', 'b'];
    moveItem(items, 0, 1);
    expect(items).toEqual(['a', 'b']);
  });
});
