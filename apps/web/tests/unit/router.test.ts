import { describe, expect, it } from 'vitest';
import { parseRoute, paths } from '../../src/router';

describe('parseRoute', () => {
  it.each([
    ['/', { name: 'home' }],
    ['', { name: 'home' }],
    ['/new', { name: 'create' }],
    ['/new/', { name: 'create' }],
    ['/rules', { name: 'rules' }],
    ['/rules/', { name: 'rules' }],
    ['/design', { name: 'design' }],
    ['/room/ab12cd34', { name: 'room', id: 'ab12cd34' }],
    ['/room/ab12cd34/', { name: 'room', id: 'ab12cd34' }],
  ])('reads %s', (path, route) => {
    expect(parseRoute(path)).toEqual(route);
  });

  it.each(['/room/Bad%20Id', '/room/', '/room/a/b', '/room/short', '/nope'])(
    'sends %s home',
    (path) => {
      expect(parseRoute(path)).toEqual({ name: 'home' });
    },
  );

  it('builds paths that parse back', () => {
    expect(parseRoute(paths.room('mill0000'))).toEqual({ name: 'room', id: 'mill0000' });
    expect(parseRoute(paths.create)).toEqual({ name: 'create' });
    expect(parseRoute(paths.rules)).toEqual({ name: 'rules' });
  });
});
