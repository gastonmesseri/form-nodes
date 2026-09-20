import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { field } from '../primitives/field';
import { setup, settle } from './tests/router.fixture';
import { syncQueryParams, queryParam, type QueryParamCodec } from './public-api';

describe('query parameter serializer compatibility', () => {
  it('keeps named and custom legacy codecs bidirectional alongside serializers', async () => {
    const { injector, router } = setup('/search?q=Ada&page=2&tag=a&tag=b');
    const q = field.strict('');
    const page = signal(1);
    const tags = signal<string[]>([]);
    const codec: QueryParamCodec<number> = queryParam.integer();
    const sync = syncQueryParams({ q: { source: q, serializer: 'string' }, page: { source: page, codec }, tag: { source: tags, codec: 'array' } }, { injector });
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

  it('never evaluates the legacy object when a named serializer is supplied', async () => {
    const { injector, router } = setup('/search?page=2');
    const parse = vi.fn(() => { throw new Error('Unused parse'); });
    const serialize = vi.fn(() => { throw new Error('Unused serialize'); });
    const page = signal(1);
    syncQueryParams({ page: { source: page, serializer: 'integer', codec: { parse, serialize } } }, { injector });
    expect(page()).toBe(2);
    page.set(3);
    await settle();
    expect(router.url).toBe('/search?page=3');
    expect(parse).not.toHaveBeenCalled();
    expect(serialize).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('prefers a custom serializer to a legacy name for parsing and publishing', async () => {
    const { injector, router } = setup('/search?page=0x10');
    const page = signal(1);
    syncQueryParams({ page: { source: page, codec: 'integer', serializer: {
      parse: values => Number(values[0]),
      serialize: value => [`0x${value.toString(16)}`],
    } } }, { injector });
    expect(page()).toBe(16);
    page.set(32);
    await settle();
    expect(router.url).toBe('/search?page=0x20');
    injector.destroy();
  });

  it('uses the normal fallback on a selected serializer error without trying the legacy codec', () => {
    const { injector, handleError } = setup('/search?page=0x10');
    const parse = vi.fn(() => 16);
    const page = field.strict(1);
    syncQueryParams({ page: { source: page, serializer: 'integer', codec: { parse, serialize: value => [String(value)] } } }, { injector });
    expect(page()).toBe(1);
    expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ key: 'page', phase: 'parse' }));
    expect(parse).not.toHaveBeenCalled();
    injector.destroy();
  });
});
