import { describe, expect, it } from 'vitest';
import { parseRoute, paths } from '../../src/router';

describe('parseRoute', () => {
  it.each([
    ['/', { name: 'home' }],
    ['', { name: 'home' }],
    ['/new', { name: 'create' }],
    ['/new/', { name: 'create' }],
    ['/design', { name: 'design' }],
    ['/room/ab12cd34', { name: 'room', id: 'ab12cd34' }],
    ['/room/ab12cd34/', { name: 'room', id: 'ab12cd34' }],
  ])('reads %s', (path, route) => {
    expect(parseRoute(path)).toEqual(route);
  });

  it.each(['/room/Bad%20Id', '/room/', '/room/a/b', '/nope'])('sends %s home', (path) => {
    expect(parseRoute(path)).toEqual({ name: 'home' });
  });

  it('builds paths that parse back', () => {
    expect(parseRoute(paths.room('mill'))).toEqual({ name: 'room', id: 'mill' });
    expect(parseRoute(paths.create)).toEqual({ name: 'create' });
  });
});
