import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { setup, settle } from './tests/router.fixture';
import { syncQueryParams, queryParam, type QueryParamSerializer } from './public-api';

describe('query parameter serializers', () => {
  it('keeps named and custom serializers bidirectional', async () => {
    const { injector, router } = setup('/search?q=Ada&page=2&tag=a&tag=b');
    const q = field.strict('');
    const page = signal(1);
    const tags = signal<string[]>([]);
    const serializer: QueryParamSerializer<number> = queryParam.integer();
    const sync = syncQueryParams({ q: { source: q, serializer: 'string' }, page: { source: page, serializer }, tag: { source: tags, serializer: 'array' } }, { injector });
    expect(q()).toBe('Ada');
    expect(page()).toBe(2);
    expect(tags()).toEqual(['a', 'b']);
    q.set('Grace'); page.set(3); tags.set(['c']);
    await settle();
    expect(router.url).toBe('/search?q=Grace&page=3&tag=c');
    expect(router.requested).toHaveLength(1);
    router.external('/search?q=Lin&page=4&tag=d', 'popstate');
    expect(page()).toBe(4);
    expect(tags()).toEqual(['d']);
    expect(sync.params.page()).toBe('4');
    injector.destroy();
  });

  it('uses a custom serializer for parsing and publishing', async () => {
    const { injector, router } = setup('/search?page=0x10');
    const page = signal(1);
    syncQueryParams({ page: { source: page, serializer: {
      parse: values => Number(values[0]),
      serialize: value => [`0x${value.toString(16)}`],
    } } }, { injector });
    expect(page()).toBe(16);
    page.set(32);
    await settle();
    expect(router.url).toBe('/search?page=0x20');
    injector.destroy();
  });

  it('restores the fallback and reports malformed input', () => {
    const { injector, handleError } = setup('/search?page=0x10');
    const page = field.strict(1);
    syncQueryParams({ page: { source: page, serializer: 'integer' } }, { injector });
    expect(page()).toBe(1);
    expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ key: 'page', phase: 'parse' }));
    injector.destroy();
  });
});
