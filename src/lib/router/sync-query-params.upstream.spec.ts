import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { computed, Injector, signal } from '@angular/core';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { queryParam } from './query-param-serializer';
import { syncQueryParams } from './sync-query-params';
import { setup, settle } from './tests/router.fixture';

// Scenario sources, adaptations, and excluded upstream contracts are recorded in
// docs/research/query-param-test-audit.md. These tests exercise our public API.
describe.each([
  { kind: 'field', create: (value: number | null | undefined) => field<number | undefined>(value) },
  { kind: 'signal', create: (value: number | null | undefined) => signal(value) },
])('upstream query scenarios with a $kind', ({ create }) => {
  it.each([null, undefined, 0, 7])('captures %s before hydration and restores it after later URL removal', async (fallback) => {
    const { router, injector, handleError } = setup('/search?page=3');
    try {
      const page = create(fallback);
      const sync = syncQueryParams({ page: { source: page, serializer: 'integer' } }, { injector });
      expect(page()).toBe(3);
      expect(sync.params.page()).toBe('3');
      await settle();
      expect(router.requested).toHaveLength(0);
      page.set(4);
      await settle();
      expect(sync.params.page()).toBe('4');
      router.external('/search', 'popstate');
      expect(page()).toBe(fallback);
      expect(sync.params.page()).toBeNull();
      router.external('/search?page=invalid');
      expect(page()).toBe(fallback);
      expect(sync.params.page()).toBe('invalid');
      expect(handleError).toHaveBeenCalledOnce();
      await settle();
      expect(router.requested).toHaveLength(1);
    } finally { injector.destroy(); }
  });

  it('composes functional updates immediately and publishes only the final batch', async () => {
    const { router, injector } = setup('/search?page=1');
    try {
      const page = create(0);
      const sync = syncQueryParams({ page: { source: page, serializer: 'integer' } }, { injector });
      const updates = vi.fn((previous: number | null | undefined) => (previous ?? 0) + 1);
      page.update(updates);
      page.update(updates);
      page.update(updates);
      expect(page()).toBe(4);
      expect(updates.mock.calls.map(([value]) => value)).toEqual([1, 2, 3]);
      expect(sync.params.page()).toBe('1');
      expect(router.requested).toHaveLength(0);
      await settle();
      expect(router.requested).toHaveLength(1);
      expect(sync.params.page()).toBe('4');
      page.set(9);
      page.set(4);
      await settle();
      expect(router.requested).toHaveLength(1);
      expect(sync.pending()).toBe(false);
    } finally { injector.destroy(); }
  });

  it('serializes staggered batches and resumes cleanly after a history interruption', async () => {
    const { router, injector } = setup('/search?a=1&b=1&c=1');
    router.automatic = false;
    try {
      const a = create(0); const b = create(0); const c = create(0);
      const first = syncQueryParams({ a: { source: a, serializer: 'integer' }, b: { source: b, serializer: 'integer' } }, { injector });
      const second = syncQueryParams({ c: { source: c, serializer: 'integer' } }, { injector });
      a.set(2); await settle();
      b.set(2); c.set(2); await settle();
      expect(router.requested).toHaveLength(1);
      expect(first.pending()).toBe(true);
      expect(second.pending()).toBe(true);
      router.external('/search?a=5&b=6&c=7', 'popstate');
      router.requested[0]!.resolve(false);
      await settle();
      expect([a(), b(), c()]).toEqual([5, 6, 7]);
      expect(first.pending()).toBe(false);
      expect(second.pending()).toBe(false);
      expect(router.requested).toHaveLength(1);
      a.update(value => value! + 1); await settle();
      b.update(value => value! + 1); c.update(value => value! + 1); await settle();
      router.accept(1); await settle();
      expect(router.requested).toHaveLength(3);
      expect(router.requested[2]!.url).toBe('/search?a=6&b=7&c=8');
      router.accept(2); await settle();
      expect([a(), b(), c()]).toEqual([6, 7, 8]);
      expect(first.pending()).toBe(false);
      expect(second.pending()).toBe(false);
    } finally { injector.destroy(); }
  });

  it('releases a queued binding and reconnects from the accepted URL without stale work', async () => {
    const { router, injector } = setup('/search?page=2');
    try {
      const old = create(1);
      const oldSync = syncQueryParams({ page: { source: old, serializer: 'integer' } }, { injector });
      old.set(3);
      oldSync.unsubscribe();
      const current = create(1);
      const currentSync = syncQueryParams({ page: { source: current, serializer: 'integer' } }, { injector });
      expect(current()).toBe(2);
      await settle();
      expect(router.requested).toHaveLength(0);
      expect(old()).toBe(3);
      current.set(4); await settle();
      expect(oldSync.params.page()).toBe('2');
      expect(currentSync.params.page()).toBe('4');
      old.set(5); await settle();
      expect(router.requested).toHaveLength(1);
    } finally { injector.destroy(); }
  });

  it.each([null, undefined])('removes only the bound key when writing %s and restores the fixed default on history', async (empty) => {
    const { router, injector } = setup('/search?page=2&keep=a&keep=b#results');
    try {
      const page = create(1);
      const sync = syncQueryParams({ page: { source: page, serializer: 'integer' } }, { injector });
      page.set(empty); await settle();
      expect(page()).toBe(empty);
      expect(sync.params.page()).toBeNull();
      expect(router.url).toBe('/search?keep=a&keep=b#results');
      expect(router.parseUrl(router.url).queryParamMap.getAll('keep')).toEqual(['a', 'b']);
      router.external('/search?page=3', 'popstate');
      router.external('/search?keep=a&keep=b#results', 'popstate');
      expect(page()).toBe(1);
      await settle();
      expect(router.requested).toHaveLength(1);
    } finally { injector.destroy(); }
  });
});

describe('upstream query isolation and conversion scenarios', () => {
  it.each([
    { kind: 'field', create: () => field.strict({ count: 0, label: '' }) },
    { kind: 'form', create: () => form({ count: field.strict(0), label: field.strict('') }) },
    { kind: 'signal', create: () => signal({ count: 0, label: '' }) },
  ])('composes JSON functional updates for a $kind without losing sibling properties', async ({ create }) => {
    const { router, injector } = setup('/search?state=%7B%22count%22:1,%22label%22:%22initial%22%7D');
    try {
      const state = create();
      const sync = syncQueryParams({ state: { source: state, serializer: 'json' } }, { injector });
      state.update(previous => ({ ...previous, count: previous.count + 1 }));
      state.update(previous => ({ ...previous, label: 'updated' }));
      state.update(previous => ({ ...previous, count: previous.count + 1 }));
      expect(state()).toEqual({ count: 3, label: 'updated' });
      await settle();
      expect(router.requested).toHaveLength(1);
      expect(JSON.parse(sync.params.state()!)).toEqual({ count: 3, label: 'updated' });
      router.external('/search?state=%7B%22count%22:1,%22label%22:%22initial%22%7D', 'popstate');
      expect(state()).toEqual({ count: 1, label: 'initial' });
      await settle();
      expect(router.requested).toHaveLength(1);
    } finally { injector.destroy(); }
  });

  it('round trips URL delimiters, literal percent sequences, spaces, and Unicode without double decoding', async () => {
    const { router, injector } = setup('/search?keep=one&keep=two#results');
    try {
      const q = field.strict('');
      const sync = syncQueryParams({ q }, { injector });
      for (const value of ['a+b c%20d%2B', '&q=other#fragment?/[]{}=;:@', 'café 日本語 🙂']) {
        q.set(value); await settle();
        expect(sync.params.q()).toBe(value);
        expect(router.parseUrl(router.url).queryParamMap.get('q')).toBe(value);
        expect(router.parseUrl(router.url).queryParamMap.getAll('keep')).toEqual(['one', 'two']);
        expect(router.parseUrl(router.url).fragment).toBe('results');
        const accepted = router.url;
        router.external('/search', 'popstate');
        router.external(accepted, 'popstate');
        expect(q()).toBe(value);
      }
      await settle();
      expect(router.requested).toHaveLength(3);
    } finally { injector.destroy(); }
  });

  it('keeps structured values, derived computations, and raw keys stable on unrelated and fragment-only navigation', async () => {
    const { router, injector } = setup('/search?state=%7B%22id%22:1%7D&other=a#first');
    try {
      const initial = { id: 0 };
      const state = field.strict(initial);
      const parse = vi.fn(queryParam.json<{ id: number }>().parse);
      const sync = syncQueryParams({ state: { source: state, serializer: { ...queryParam.json<{ id: number }>(), parse } }, other: signal('') }, { injector });
      const readValue = vi.fn(() => state());
      const readRaw = vi.fn(() => sync.params.state());
      const derivedValue = computed(readValue);
      const derivedRaw = computed(readRaw);
      const parsed = derivedValue();
      const raw = derivedRaw();
      router.external('/search?state=%7B%22id%22:1%7D&other=b#second');
      expect(derivedValue()).toBe(parsed);
      expect(derivedRaw()).toBe(raw);
      router.external('/search?state=%7B%22id%22:1%7D&other=b#third');
      expect(derivedValue()).toBe(parsed);
      expect(derivedRaw()).toBe(raw);
      expect(parse).toHaveBeenCalledOnce();
      expect(readValue).toHaveBeenCalledOnce();
      expect(readRaw).toHaveBeenCalledOnce();
      router.external('/search?other=b');
      expect(state()).toBe(initial);
      await settle();
      expect(router.requested).toHaveLength(0);
    } finally { injector.destroy(); }
  });

  it.each(['constructor', 'toString'])('round trips scalar and repeated values under the key %s', async (key) => {
    const { router, injector } = setup(`/search?${key}=one&keep=yes`);
    try {
      const value = field.strict('');
      const scalar = syncQueryParams({ [key]: value }, { injector });
      expect(value()).toBe('one');
      value.set('two'); await settle();
      expect(scalar.params[key]!()).toBe('two');
      scalar.unsubscribe();
      const values = signal<string[]>([]);
      const repeated = syncQueryParams({ [key]: { source: values, serializer: 'array' } }, { injector });
      expect(values()).toEqual(['two']);
      values.set(['three', '', 'four']); await settle();
      expect(router.parseUrl(router.url).queryParamMap.getAll(key)).toEqual(['three', '', 'four']);
      expect(repeated.params[key]!()).toBe('three');
      expect(router.parseUrl(router.url).queryParamMap.get('keep')).toBe('yes');
    } finally { injector.destroy(); }
  });

  it.each([
    ['?a=a%2Cb', '?a=a&a=b', ['a,b'], ['a', 'b']],
    ['?a=a&a=b', '?a=a%2Cb', ['a', 'b'], ['a,b']],
    ['?a=', '', [''], []],
    ['?a=a%2C', '?a=a&a=', ['a,'], ['a', '']],
  ] as const)('distinguishes repeated-array transitions from %s to %s', async (from, to, initial, expected) => {
    const { router, injector } = setup(`/search${from}`);
    try {
      const values = field.strict<string[]>([]);
      const sync = syncQueryParams({ a: { source: values, serializer: 'array' } }, { injector });
      expect(values()).toEqual(initial);
      router.external(`/search${to}`);
      expect(values()).toEqual(expected);
      expect(sync.params.a()).toBe(expected[0] ?? null);
      expect(router.parseUrl(router.url).queryParamMap.getAll('a')).toEqual(expected);
      await settle();
      expect(router.requested).toHaveLength(0);
    } finally { injector.destroy(); }
  });

  it('keeps malformed repeated scalar input intact while another key is updated', async () => {
    const { router, injector, handleError } = setup('/search?q=one&q=two&page=1#results');
    try {
      const q = field.strict('fallback');
      const page = signal(1);
      const sync = syncQueryParams({ q, page }, { injector });
      expect(q()).toBe('fallback');
      expect(handleError).toHaveBeenCalledOnce();
      page.set(2); await settle();
      expect(router.parseUrl(router.url).queryParamMap.getAll('q')).toEqual(['one', 'two']);
      expect(sync.params.q()).toBe('one');
      expect(q()).toBe('fallback');
      expect(handleError).toHaveBeenCalledOnce();
      expect(router.url).toBe('/search?q=one&q=two&page=2#results');
    } finally { injector.destroy(); }
  });

  it('applies history overrides only for keys whose serialized values changed', async () => {
    const { router, injector } = setup('/search?q=one&page=1');
    try {
      const q = field.strict(''); const page = signal(0);
      syncQueryParams({ q: { source: q, history: 'replace' }, page }, { injector, history: 'push' });
      q.set('two'); page.set(2); page.set(1); await settle();
      expect(router.requested[0]!.replace).toBe(true);
      page.set(2); await settle();
      expect(router.requested[1]!.replace).toBe(false);
    } finally { injector.destroy(); }
  });

  it('keeps independent Routers and injector scopes isolated during batching and disposal', async () => {
    const left = setup('/left?page=1'); const right = setup('/right?page=2');
    try {
      const leftOwner = Injector.create({ parent: left.injector, providers: [] });
      const leftPage = signal(0); const rightPage = signal(0);
      const a = syncQueryParams({ page: leftPage }, { injector: leftOwner });
      const b = syncQueryParams({ page: rightPage }, { injector: right.injector });
      leftPage.set(3); rightPage.set(4);
      leftOwner.destroy(); await settle();
      expect(left.router.url).toBe('/left?page=1');
      expect(right.router.url).toBe('/right?page=4');
      expect(a.closed()).toBe(true);
      expect(b.closed()).toBe(false);
      expect(leftPage()).toBe(3);
      right.router.external('/right?page=5');
      expect(rightPage()).toBe(5);
    } finally { left.injector.destroy(); right.injector.destroy(); }
  });

  it('preserves URL-derived siblings when a value callback makes a dependent write', async () => {
    const { router, injector } = setup('/search?a=1&b=1&c=1');
    try {
      const filters = form({ a: field.strict(0), b: field.strict(0), c: field.strict(0) });
      syncQueryParams({ a: filters.a, b: filters.b, c: filters.c }, { injector });
      filters.b.onValueChange(value => filters.c.set(value));
      filters.a.set(9);
      router.external('/search?a=2&b=3&c=4', 'popstate');
      await settle();
      expect(filters()).toEqual({ a: 2, b: 3, c: 4 });
      expect(router.requested).toHaveLength(0);
      filters.a.update(value => value + 1); await settle();
      expect(router.url).toBe('/search?a=3&b=3&c=4');
    } finally { injector.destroy(); }
  });

  it('round trips generated Unicode keys and repeated values without corrupting other parameters or the fragment', async () => {
    const text = fc.string({ unit: 'binary', maxLength: 30 });
    // Reserved-key limitations of Angular's serializer are documented in the audit.
    const key = text.filter(value => value.length > 0 && !['__proto__', 'hasOwnProperty', 'keep'].includes(value));
    await fc.assert(fc.asyncProperty(key, fc.array(text, { minLength: 1, maxLength: 4 }), async (key, values) => {
      const { router, injector } = setup('/search?keep=one&keep=two#results');
      try {
        const source = field.strict<string[]>([]);
        const sync = syncQueryParams({ [key]: { source, serializer: 'array' } }, { injector });
        source.set(values); await settle();
        const parsed = router.parseUrl(router.url);
        expect(parsed.queryParamMap.getAll(key)).toEqual(values);
        expect(parsed.queryParamMap.getAll('keep')).toEqual(['one', 'two']);
        expect(parsed.fragment).toBe('results');
        expect(sync.params[key]!()).toBe(values[0]);
        router.external('/search', 'popstate');
        router.external(router.requested[0]!.url, 'popstate');
        expect(source()).toEqual(values);
        await settle();
        expect(router.requested).toHaveLength(1);
      } finally { injector.destroy(); }
    }), { seed: 20260919, numRuns: 100 });
  });
});
