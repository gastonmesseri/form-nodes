import { Injector, computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { NavigationSkipped, NavigationSkippedCode } from '@angular/router';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { group } from '../primitives/group';
import { array } from '../primitives/array';
import { setup, settle } from './tests/router.fixture';
import { syncQueryParams, type QueryParamUrlSyncEvent } from './public-api';

describe('syncQueryParams URL hooks', () => {
  it('notifies synchronously in order with a complete committed snapshot for every source kind', async () => {
    const { router, injector } = setup('/search?q=Ada&page=2&state=%7B%22name%22:%22Grace%22%7D&group=%7B%22enabled%22:true%7D&tags=a&tags=b');
    const q = field.strict('');
    const page = signal<number | null>(null);
    const state = form({ name: field.strict('') });
    const settings = group({ enabled: field.strict(false) });
    const tags = array(field.strict(''));
    const order: string[] = [];
    let initial!: QueryParamUrlSyncEvent;
    let general!: QueryParamUrlSyncEvent;
    let returned = false;
    syncQueryParams({ q, page: { source: page, codec: 'integer' }, state: { source: state, codec: 'json' }, group: { source: settings, codec: 'json' }, tags: { source: tags, codec: 'array' } }, {
      injector,
      onInitialUrlSync(event) {
        expect(returned).toBe(false);
        expect(event.values).toEqual({ q: 'Ada', page: 2, state: { name: 'Grace' }, group: { enabled: true }, tags: ['a', 'b'] });
        expect(state()).toEqual({ name: 'Grace' });
        order.push('initial');
        initial = event;
        q.set('edited');
      },
      onUrlSync(event) { order.push(event.reason); general = event; },
    });
    returned = true;
    expect(order).toEqual(['initial', 'initial']);
    expect(general).toBe(initial);
    expect(initial.values.q).toBe('Ada');
    expect(Object.isFrozen(initial.values)).toBe(true);
    await settle();
    expect(router.url).toContain('q=edited');
    expect(order).toHaveLength(2);
    router.external('/search?q=Lin&page=3');
    expect(order).toEqual(['initial', 'initial', 'navigation']);
    expect(general.values).toEqual({ q: 'Lin', page: 3, state: { name: '' }, group: { enabled: false }, tags: [] });
    injector.destroy();
  });

  it('uses fallback and signal equality results rather than raw or merely parsed values', () => {
    const { router, injector, handleError } = setup('/search?q=ADA&page=invalid');
    const q = signal('Ada', { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const onUrlSync = vi.fn();
    syncQueryParams({ q, page: { source: signal(1), defaultValue: 5 } }, { injector, onUrlSync });
    expect(handleError).toHaveBeenCalledOnce();
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'initial', values: { q: 'Ada', page: 5 } });
    router.external('/search');
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Ada', page: 5 } });
    injector.destroy();
  });

  it('reads committed node values even when public equality retains an earlier value', () => {
    const { injector } = setup('/search?q=ADA');
    const q = field.strict('Ada', { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    expect(q()).toBe('Ada');
    const onUrlSync = vi.fn();
    syncQueryParams({ q }, { injector, onUrlSync });
    expect(q()).toBe('Ada');
    expect(onUrlSync).toHaveBeenCalledWith({ reason: 'initial', values: { q: 'ADA' } });
    injector.destroy();
  });

  it('ignores unrelated and own URL updates but imports redirects and accepted external changes once', async () => {
    const { router, injector } = setup('/search?q=Ada&page=1');
    const q = field.strict('');
    const page = signal(0);
    const onUrlSync = vi.fn();
    const onInitialUrlSync = vi.fn();
    const sync = syncQueryParams({ q, page }, { injector, onUrlSync, onInitialUrlSync });
    router.external('/search?q=Ada&page=1&other=changed#fragment');
    expect(onUrlSync).toHaveBeenCalledOnce();
    q.set('Grace'); page.set(2);
    await settle();
    expect(onUrlSync).toHaveBeenCalledOnce();
    router.automatic = false;
    q.set('redirect');
    await settle();
    router.accept(1, '/search?q=normalized&page=3');
    await settle();
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'normalized', page: 3 } });
    expect(sync.params.q()).toBe('normalized');
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    router.external('/search?q=Lin&page=4');
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Lin', page: 4 } });
    expect(onUrlSync).toHaveBeenCalledTimes(3);
    expect(onInitialUrlSync).toHaveBeenCalledOnce();
    sync.unsubscribe();
    router.external('/search?q=stopped');
    expect(onUrlSync).toHaveBeenCalledTimes(3);
    injector.destroy();
  });

  it('does not notify for rejected writes or rejected external navigation', async () => {
    const { router, injector } = setup('/search?q=Ada');
    router.automatic = false;
    const q = signal('');
    const onUrlSync = vi.fn();
    syncQueryParams({ q }, { injector, onUrlSync });
    q.set('blocked');
    await settle();
    router.rejectNavigation();
    await settle();
    router.startExternal('/search?q=blocked');
    router.rejectNavigation(router.current!, () => {});
    expect(onUrlSync).toHaveBeenCalledOnce();
    expect(q()).toBe('blocked');
    injector.destroy();
  });

  it('notifies for history restoration even when the URL values are unchanged', () => {
    const { router, injector } = setup('/search?q=Ada');
    const q = field.strict('', { debounce: 'blur' });
    const onUrlSync = vi.fn();
    syncQueryParams({ q }, { injector, onUrlSync });
    q.value.control.set('draft');
    router.external('/search?q=Ada', 'popstate');
    expect(q.value.control()).toBe('Ada');
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    q.value.control.set('another draft');
    const id = router.startExternal(router.url, 'popstate');
    router.events.next(new NavigationSkipped(id, router.url, 'Same URL', NavigationSkippedCode.IgnoredSameUrlNavigation));
    expect(q.debouncing()).toBe(false);
    expect(q.value.control()).toBe('Ada');
    expect(onUrlSync).toHaveBeenCalledTimes(3);
    const imperative = router.startExternal(router.url);
    router.events.next(new NavigationSkipped(imperative, router.url, 'Same URL', NavigationSkippedCode.IgnoredSameUrlNavigation));
    expect(onUrlSync).toHaveBeenCalledTimes(3);
    injector.destroy();
  });

  it('preserves initial hook edits through the activation acknowledgment', async () => {
    const { router, injector } = setup('/other');
    router.startExternal('/search?q=Ada');
    router.current!.finalUrl = router.parseUrl('/search?q=Ada');
    const q = field.strict('');
    const onUrlSync = vi.fn();
    syncQueryParams({ q }, { injector, onInitialUrlSync: () => q.set('edited'), onUrlSync });
    await settle();
    router.endExternal('/search?q=Ada');
    await settle();
    expect(q()).toBe('edited');
    expect(router.url).toBe('/search?q=edited');
    expect(onUrlSync).toHaveBeenCalledOnce();
    injector.destroy();
  });

  it('imports a final URL that differs from the activation URL', () => {
    const { router, injector } = setup('/other');
    router.startExternal('/search?q=Ada');
    router.current!.finalUrl = router.parseUrl('/search?q=Ada');
    const onUrlSync = vi.fn();
    syncQueryParams({ q: signal('') }, { injector, onUrlSync });
    router.endExternal('/search?q=Grace');
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Grace' } });
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    injector.destroy();
  });

  it('captures all connection snapshots before running callbacks and honors early unsubscribe', () => {
    const { router, injector } = setup('/search?a=1&b=2&c=3');
    const b = signal(0);
    const second = vi.fn();
    const third = vi.fn();
    syncQueryParams({ a: signal(0) }, { injector, onUrlSync: (event) => {
      if (event.reason === 'navigation') { b.set(99); thirdSync.unsubscribe(); }
    } });
    syncQueryParams({ b }, { injector, onUrlSync: second });
    const thirdSync = syncQueryParams({ c: signal(0) }, { injector, onUrlSync: third });
    router.external('/search?a=4&b=5&c=6');
    expect(second).toHaveBeenLastCalledWith({ reason: 'navigation', values: { b: 5 } });
    expect(b()).toBe(99);
    expect(third).toHaveBeenCalledOnce();
    injector.destroy();
  });

  it('suppresses stale sibling notifications when a hook starts a newer synchronous URL import', () => {
    const { router, injector } = setup('/search?a=1&b=2');
    const second = vi.fn();
    syncQueryParams({ a: signal(0) }, { injector, onUrlSync: (event) => {
      if (event.values.a === 3) router.external('/search?a=5&b=6');
    } });
    syncQueryParams({ b: signal(0) }, { injector, onUrlSync: second });
    router.external('/search?a=3&b=4');
    expect(second.mock.calls.map(([event]) => event.values.b)).toEqual([2, 6]);
    injector.destroy();
  });

  it('allows an initial hook to destroy its owner without notifying the general hook', () => {
    const { injector } = setup('/search?q=Ada');
    const onUrlSync = vi.fn();
    const sync = syncQueryParams({ q: signal('') }, { injector, onInitialUrlSync: () => injector.destroy(), onUrlSync });
    expect(sync.closed()).toBe(true);
    expect(onUrlSync).not.toHaveBeenCalled();
  });

  it('reports thrown and rejected callback errors without failing initialization or sibling hooks', async () => {
    const { injector, router, handleError } = setup('/search?q=Ada');
    const initialError = new Error('Initial callback');
    const laterError = new Error('Async callback');
    const onError = vi.fn();
    const onUrlSync = vi.fn(async () => { throw laterError; });
    const sync = syncQueryParams({ q: signal('') }, { injector, onError, onInitialUrlSync() { throw initialError; }, onUrlSync });
    expect(sync.closed()).toBe(false);
    expect(handleError).toHaveBeenCalledWith(initialError);
    await settle();
    expect(handleError).toHaveBeenCalledWith(laterError);
    router.external('/search?q=Grace');
    await settle();
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    expect(handleError).toHaveBeenCalledTimes(3);
    expect(onError).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('supports an initial-only callback and does not notify empty bindings', () => {
    const { injector, router } = setup('/search?q=Ada');
    const onInitialUrlSync = vi.fn();
    syncQueryParams({ q: signal('') }, { injector, onInitialUrlSync });
    router.external('/search?q=Grace');
    expect(onInitialUrlSync).toHaveBeenCalledOnce();
    const onUrlSync = vi.fn();
    syncQueryParams({}, { injector, onInitialUrlSync, onUrlSync });
    expect(onInitialUrlSync).toHaveBeenCalledOnce();
    expect(onUrlSync).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('runs initial callbacks during SSR without writing a URL for callback edits', async () => {
    const { injector, router } = setup('/search?q=Ada', true);
    const q = signal('');
    const onUrlSync = vi.fn();
    syncQueryParams({ q }, { injector, onInitialUrlSync: () => q.set('edited'), onUrlSync });
    await settle();
    expect(onUrlSync).toHaveBeenCalledWith({ reason: 'initial', values: { q: 'Ada' } });
    expect(q()).toBe('edited');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('does not prepare callbacks after a source listener disconnects during restoration', () => {
    const { injector, router } = setup('/search?q=Ada');
    const q = field.strict('');
    const onUrlSync = vi.fn();
    const sync = syncQueryParams({ q }, { injector, onUrlSync });
    q.onValueChange(() => sync.unsubscribe());
    router.external('/search?q=Grace');
    expect(q()).toBe('Grace');
    expect(sync.closed()).toBe(true);
    expect(onUrlSync).toHaveBeenCalledOnce();
    injector.destroy();
  });

  it('keeps inactive source snapshots while another entry remains active', () => {
    const { injector, router } = setup('/search?q=Ada&page=1');
    const owner = Injector.create({ providers: [], parent: injector });
    const q = signal('');
    const page = signal(0);
    const onUrlSync = vi.fn();
    const sync = syncQueryParams({ q: { source: q, injector: owner }, page }, { injector, onUrlSync });
    owner.destroy();
    router.external('/search?q=Grace&page=2');
    expect(sync.closed()).toBe(false);
    expect(sync.params.q()).toBe('Grace');
    expect(onUrlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Ada', page: 2 } });
    injector.destroy();
  });

  it('does not track callback reads or rerun URL hooks when asynchronous work resolves', async () => {
    const { injector, router } = setup('/search?q=Ada');
    const unrelated = signal(0);
    let complete!: () => void;
    const promise = new Promise<void>((resolve) => { complete = resolve; });
    const onUrlSync = vi.fn(() => { unrelated(); return promise; });
    const connect = vi.fn(() => syncQueryParams({ q: signal('') }, { injector, onUrlSync }));
    const connection = computed(connect);
    connection();
    unrelated.set(1);
    connection();
    expect(connect).toHaveBeenCalledOnce();
    router.external('/search?q=Grace');
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    complete();
    await settle();
    expect(onUrlSync).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });
});
