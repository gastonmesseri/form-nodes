import { describe, expect, it, vi } from 'vitest';
import { Injector, DestroyRef, computed, linkedSignal, signal, runInInjectionContext } from '@angular/core';
import { NavigationCancel, NavigationError, NavigationEnd, NavigationSkipped, NavigationCancellationCode, NavigationSkippedCode, type Navigation } from '@angular/router';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { group } from '../primitives/group';
import { array } from '../primitives/array';
import { syncQueryParams } from './public-api';
import { queryParam } from './query-param-codec';
import { setup, settle } from './tests/router.fixture';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';

describe('syncQueryParams', () => {
  it('hydrates a mixed map, preserves interaction and validation, and batches nested form changes', async () => {
    const { router, injector } = setup('/search?q=Ada&page=2&keep=yes#results');
    const filters = form({ search: field('', [required]), nested: form({ page: field(1), enabled: field(false) }) });
    filters.search.markAsTouched();
    filters.search.markAsDirty();
    const stop = syncQueryParams({ q: { source: filters.search, defaultValue: '', clearOnDefault: true }, page: { source: filters.nested.page, history: 'push' }, enabled: filters.nested.enabled }, { injector });
    expect(filters()).toEqual({ search: 'Ada', nested: { page: 2, enabled: false } });
    expect(filters.search.touched()).toBe(true);
    expect(filters.search.dirty()).toBe(true);
    expect(filters.valid()).toBe(true);
    await settle();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    filters.patch({ search: 'Grace', nested: { page: 3, enabled: true } });
    await settle();
    expect(router.requested).toHaveLength(1);
    expect(router.url).toBe('/search?q=Grace&page=3&keep=yes&enabled=true#results');
    expect(router.requested[0]!.replace).toBe(false);
    stop.unsubscribe(); stop.unsubscribe();
    filters.search.set('Lin');
    await settle();
    expect(router.requested).toHaveLength(1);
    injector.destroy();
  });

  it('shares a coordinator across helpers, replaces by default, and removes only opted-in defaults', async () => {
    const { router, injector } = setup('/search?q=Ada&page=2#results');
    const search = field.strict('');
    const page = field.strict(1);
    syncQueryParams({ q: { source: search, clearOnDefault: true } }, { injector });
    syncQueryParams({ page }, { injector });
    search.set(''); page.set(1);
    await settle();
    expect(router.url).toBe('/search?page=1#results');
    expect(router.requested).toHaveLength(1);
    expect(router.requested[0]!.replace).toBe(true);
    injector.destroy();
  });

  it('publishes committed changes hidden by public equality without initial or draft emissions', async () => {
    const { router, injector } = setup('/search?q=Ada');
    const search = field.strict('Ada', { equal: (a, b) => a.toLowerCase() === b.toLowerCase(), debounce: 'blur' });
    const listener = vi.fn();
    search.onValueChange(listener);
    syncQueryParams({ q: search }, { injector });
    search.set('ADA');
    await settle();
    expect(search()).toBe('Ada');
    expect(router.url).toBe('/search?q=ADA');
    expect(listener).not.toHaveBeenCalled();
    search.value.control.set('Grace');
    await settle();
    expect(router.requested).toHaveLength(1);
    search.markAsTouched();
    await settle();
    expect(router.url).toBe('/search?q=Grace');
    injector.destroy();
  });

  it('restores equal history values and cancels stale control debounce while preserving dirty and touched', async () => {
    const { router, injector } = setup('/search?q=Ada');
    const search = field.strict('Ada', { debounce: 'blur' });
    syncQueryParams({ q: search }, { injector });
    search.markAsTouched();
    search.value.control.set('pending');
    router.external('/search?q=Ada', 'popstate');
    expect(search.value.control()).toBe('Ada');
    expect(search.debouncing()).toBe(false);
    expect(search.dirty()).toBe(true);
    expect(search.touched()).toBe(true);
    search.flush();
    await settle();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('preserves newer drafts on own acknowledgments and unrelated incoming keys', async () => {
    const { router, injector } = setup('/search?q=Ada');
    router.automatic = false;
    const search = field.strict('Ada', { debounce: 'blur' });
    syncQueryParams({ q: search }, { injector });
    search.set('Grace');
    await settle();
    search.value.control.set('new draft');
    router.accept();
    await settle();
    expect(search.value.control()).toBe('new draft');
    expect(search.debouncing()).toBe(true);
    router.external('/search?q=Grace&unrelated=1');
    expect(search.value.control()).toBe('new draft');
    search.flush();
    await settle();
    expect(router.requested[1]!.url).toBe('/search?q=new%20draft&unrelated=1');
    router.accept();
    await settle();
    injector.destroy();
  });

  it('suspends pending writes for external navigation and resumes after rejection', async () => {
    const { router, injector } = setup('/search?q=Ada');
    const search = field('Ada');
    syncQueryParams({ q: search }, { injector });
    search.set('Grace');
    router.startExternal('/other');
    await settle();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(search()).toBe('Grace');
    router.events.next(new NavigationCancel(router.id, '/other', 'No', NavigationCancellationCode.GuardRejected));
    router.current = null;
    await settle();
    expect(router.url).toBe('/search?q=Grace');
    injector.destroy();
  });

  it('discards obsolete queued changes on accepted navigation to a new page', async () => {
    const { router, injector } = setup('/search?q=Ada');
    const search = field('');
    syncQueryParams({ q: search }, { injector });
    search.set('stale');
    router.external('/other');
    await settle();
    expect(search()).toBe('');
    expect(router.url).toBe('/other');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('preserves field data on rejected, thrown, and rejected-promise writes and reports without retrying', async () => {
    const { router, injector, handleError } = setup();
    router.automatic = false;
    const search = field('');
    syncQueryParams({ q: search }, { injector });
    search.set('Grace'); await settle();
    router.rejectNavigation(); await settle();
    expect(search()).toBe('Grace');
    expect(handleError).toHaveBeenCalledOnce();
    router.navigateByUrl.mockImplementationOnce(() => { throw new Error('sync'); });
    search.set('Lin'); await settle();
    expect(handleError).toHaveBeenCalledTimes(2);
    router.navigateByUrl.mockRejectedValueOnce(new Error('async'));
    search.set('Ada'); await settle();
    expect(handleError).toHaveBeenCalledTimes(3);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(3);
    injector.destroy();
  });

  it('uses explicit serializers, reports malformed input, and distinguishes empty, repeated, and absent parameters', async () => {
    const { router, injector } = setup('/search?q=&page=invalid&tag=a&tag=b');
    const search = field('fallback');
    const page = field(1);
    const tags = field.strict<string[]>([]);
    const onError = vi.fn();
    syncQueryParams({ q: search, page: { source: page, serializer: queryParam.integer() }, tag: { source: tags, serializer: queryParam.array() } }, { injector, onError });
    expect(search()).toBe('');
    expect(page()).toBe(1);
    expect(tags()).toEqual(['a', 'b']);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ key: 'page', phase: 'parse' }));
    await settle();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    router.external('/search?q=a&q=b');
    expect(search()).toBe('fallback');
    expect(onError).toHaveBeenCalledTimes(2);
    tags.set(['x y', '&']);
    await settle();
    expect(router.url).toContain('tag=x%20y&tag=%26');
    tags.set([]); search.set(null);
    await settle();
    expect(router.url).toBe('/search');
    injector.destroy();
  });

  it('cleans individual entry owners and the whole helper owner including pending work', async () => {
    const { router, injector } = setup();
    const owner = Injector.create({ providers: [], parent: injector });
    const first = field(''); const second = field('');
    runInInjectionContext(injector, () => syncQueryParams({ first: { source: first, injector: owner }, second }));
    first.set('stale'); second.set('live'); owner.destroy();
    await settle();
    expect(router.url).toBe('/search?keep=yes&second=live#results');
    second.set('stale'); injector.destroy();
    await settle();
    expect(router.requested).toHaveLength(1);
  });

  it('cleans a field owner independently of the helper and accepts a new binding for the released key', async () => {
    const { router, injector } = setup();
    const owner = Injector.create({ providers: [], parent: injector });
    const search = runInInjectionContext(owner, () => field(''));
    syncQueryParams({ q: search }, { injector });
    search.set('stale'); owner.destroy();
    const replacement = field('');
    syncQueryParams({ q: replacement }, { injector });
    replacement.set('live');
    await settle();
    expect(router.url).toBe('/search?keep=yes&q=live#results');
    injector.destroy();
  });

  it('preserves reset baselines, syncs resetToInitial, and still syncs disabled fields', async () => {
    const { router, injector } = setup('/search?q=url');
    const search = field.strict('initial');
    syncQueryParams({ q: search }, { injector });
    search.reset(); await settle();
    expect(router.requested).toHaveLength(0);
    search.resetToInitial(); await settle();
    expect(router.url).toBe('/search?q=initial');
    search.disable(); search.set('disabled'); await settle();
    expect(router.url).toBe('/search?q=disabled');
    injector.destroy();
  });

  it('hydrates on the server without scheduling URL writes', async () => {
    const { router, injector } = setup('/search?q=server', true);
    const search = field('');
    syncQueryParams({ q: search }, { injector });
    expect(search()).toBe('server');
    search.set('new'); await settle();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });

  it('rejects duplicate keys and unsupported inference before mutating existing fields', () => {
    const { injector } = setup('/search?q=url');
    const search = field('');
    const stop = syncQueryParams({ q: search }, { injector });
    expect(() => syncQueryParams({ q: field('') }, { injector })).toThrow('already has');
    expect(() => syncQueryParams({ object: field({ id: 1 }) }, { injector })).toThrow('serializer');
    expect(() => syncQueryParams({ empty: field(null) }, { injector })).toThrow('serializer');
    stop.unsubscribe();
    const stopEmpty = syncQueryParams({}, { injector });
    stopEmpty.unsubscribe(); stopEmpty.unsubscribe();
    injector.destroy();
  });

  it('reports serialization errors without losing input or changing the URL', async () => {
    const { router, injector } = setup();
    const page = field(1);
    const onError = vi.fn();
    syncQueryParams({ page }, { injector, onError });
    page.set(Infinity); await settle();
    expect(page()).toBe(Infinity);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ key: 'page', phase: 'serialize' }));
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    injector.destroy();
  });
});

it('keeps newer committed edits queued behind an older acknowledgment, including a return to the original value', async () => {
  const { router, injector } = setup('/search?q=Ada');
  router.automatic = false;
  const search = field('Ada');
  syncQueryParams({ q: search }, { injector });
  search.set('Grace'); await settle();
  search.set('Ada'); await settle();
  expect(router.requested).toHaveLength(1);
  router.accept(0); await settle();
  expect(search()).toBe('Ada');
  expect(router.requested[1]!.url).toBe('/search?q=Ada');
  router.accept(1); await settle();
  injector.destroy();
});

it('removes a pending write when another edit returns to the value in flight', async () => {
  const { router, injector } = setup('/search?q=Ada');
  router.automatic = false;
  const search = field('Ada');
  syncQueryParams({ q: search }, { injector });
  search.set('Grace'); await settle();
  search.set('Lin'); await settle();
  search.set('Grace'); await settle();
  router.accept(); await settle();
  expect(router.requested).toHaveLength(1);
  injector.destroy();
});

it('imports a redirected own write only when its final parameters differ', async () => {
  const { router, injector } = setup('/search?q=Ada');
  router.automatic = false;
  const search = field('Ada');
  syncQueryParams({ q: search }, { injector });
  search.set('Grace'); await settle();
  router.accept(0, '/search?q=canonical'); await settle();
  expect(search()).toBe('canonical');
  expect(router.requested).toHaveLength(1);
  injector.destroy();
});

it('retains interrupted own edits if an external attempt fails, then replays only current entries', async () => {
  const { router, injector } = setup('/search?q=Ada');
  router.automatic = false;
  const search = field('Ada');
  const onError = vi.fn();
  syncQueryParams({ q: search }, { injector, onError });
  search.set('Grace'); await settle();
  search.set('Lin'); await settle();
  const id = router.startExternal('/other');
  router.requested[0]!.resolve(false); await settle();
  router.events.next(new NavigationError(id, '/other', new Error('blocked')));
  router.current = null;
  await settle();
  expect(router.requested[1]!.url).toBe('/search?q=Lin');
  expect(onError).not.toHaveBeenCalled();
  router.accept(); await settle();
  injector.destroy();
});

it('waits through external redirects and superseded navigation before importing final state', async () => {
  const { router, injector } = setup('/search?q=Ada');
  const search = field('');
  syncQueryParams({ q: search }, { injector });
  search.set('draft');
  const first = router.startExternal('/redirect');
  router.events.next(new NavigationCancel(first, '/redirect', 'Redirect', NavigationCancellationCode.Redirect));
  await settle();
  expect(search()).toBe('draft');
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  const second = router.startExternal('/superseded');
  router.events.next(new NavigationCancel(second, '/superseded', 'Superseded', NavigationCancellationCode.SupersededByNewNavigation));
  router.external('/search?q=final'); await settle();
  expect(search()).toBe('final');
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  injector.destroy();
});

it('restores pending input when an equal history navigation is skipped', async () => {
  const { router, injector } = setup('/search?q=Ada');
  const search = field('Ada', { debounce: 'blur' });
  syncQueryParams({ q: search }, { injector });
  search.value.control.set('draft');
  const id = router.startExternal('/search?q=Ada', 'popstate');
  router.events.next(new NavigationSkipped(id, router.url, 'Same URL', NavigationSkippedCode.IgnoredSameUrlNavigation));
  router.current = null;
  await settle();
  expect(search.value.control()).toBe('Ada');
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  injector.destroy();
});

it('aborts a stopped in-flight entry and preserves another helper in the shared batch', async () => {
  const { router, injector } = setup();
  router.automatic = false;
  const first = field(''); const second = field('');
  const stop = syncQueryParams({ first }, { injector });
  const other = syncQueryParams({ second }, { injector });
  first.set('gone'); second.set('kept'); await settle();
  expect(stop.pending()).toBe(true);
  expect(other.pending()).toBe(true);
  stop.unsubscribe(); await settle();
  expect(stop.pending()).toBe(false);
  expect(stop.closed()).toBe(true);
  expect(other.pending()).toBe(true);
  expect(router.requested).toHaveLength(2);
  expect(router.requested[1]!.url).toBe('/search?keep=yes&second=kept#results');
  router.accept(); await settle();
  injector.destroy();
});

it('rejects incompatible router owners and unsupported entries without partially hydrating the map', () => {
  const { injector } = setup('/search?q=changed');
  const second = setup();
  const search = field('initial');
  expect(() => syncQueryParams({ q: search, other: { source: field(''), injector: second.injector } }, { injector })).toThrow('same Router');
  expect(search()).toBe('initial');
  expect(() => syncQueryParams({ q: null as never }, { injector })).toThrow('form node');
  injector.destroy(); second.injector.destroy();
});

it('cleans partial registration if an entry owner was already destroyed', () => {
  const { injector } = setup();
  const dead = Injector.create({ providers: [], parent: injector });
  const second = field('', { injector: dead });
  dead.destroy();
  expect(() => syncQueryParams({ first: field(''), second }, { injector })).toThrow();
  const stop = syncQueryParams({ first: field(''), second: field('') }, { injector });
  stop.unsubscribe(); injector.destroy();
});

it('does not echo noncanonical parsed values and handles nullable fallbacks through explicit serializers', async () => {
  const { router, injector } = setup('/search?page=01');
  const page = field<number>(null);
  syncQueryParams({ page: { source: page, serializer: queryParam.integer() } }, { injector });
  expect(page()).toBe(1);
  await settle();
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  router.external('/search');
  expect(page()).toBeNull();
  await settle();
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  page.set(2); await settle();
  expect(router.url).toBe('/search?page=2');
  injector.destroy();
});

it('supports custom null serialization and rejects invalid serializer output', async () => {
  const { router, injector } = setup();
  const search = field.strict('');
  const serializer = { parse: (values: readonly string[]) => values[0]!, serialize: (value: string) => value === '' ? null : [value] };
  syncQueryParams({ q: { source: search, serializer } }, { injector });
  search.set('Ada'); await settle();
  search.set(''); await settle();
  expect(router.url).toBe('/search?keep=yes#results');
  expect(() => syncQueryParams({ bad: { source: field.strict(''), serializer: { ...serializer, serialize: () => [1] as never } } }, { injector })).toThrow('serialize to strings');
  injector.destroy();
});

it('uses the in-progress activation URL for initial hydration', () => {
  const { router, injector } = setup('/previous');
  router.current = { extras: {}, finalUrl: router.parseUrl('/search?q=activated') } as Navigation;
  const search = field('');
  const sync = syncQueryParams({ q: search }, { injector, history: 'push' });
  expect(search()).toBe('activated');
  expect(sync.params.q()).toBe('activated');
  injector.destroy();
});

it('does not navigate when the pending batch already matches a newly accepted URL', async () => {
  const { router, injector } = setup('/search?q=Ada');
  const search = field('Ada');
  syncQueryParams({ q: search }, { injector });
  search.set('Grace');
  // The committed watcher enqueues before the coordinator's next microtask.
  await Promise.resolve();
  router.url = '/search?q=Grace';
  router.events.next(new NavigationEnd(++router.id, router.url, router.url));
  await settle();
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  injector.destroy();
});

it('preserves nested async validation execution, pending state, and stale-result cancellation', async () => {
  const { router, injector } = setup('/search?q=Ada');
  const completions: Array<(result: null) => void> = [];
  const validate = vi.fn(({ value }: { value: () => unknown }) => {
    value();
    return new Promise<null>(resolve => completions.push(resolve));
  });
  const profile = form({ nested: form({ search: field('', { validators: asyncValidator(validate) }) }) });
  syncQueryParams({ q: profile.nested.search }, { injector });
  await vi.waitFor(() => expect(validate).toHaveBeenCalledOnce());
  router.external('/search?q=Grace');
  await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(2));
  completions[0]!(null);
  await settle();
  expect(profile.pending()).toBe(true);
  completions[1]!(null);
  await vi.waitFor(() => expect(profile.pending()).toBe(false));
  expect(profile.valid()).toBe(true);
  expect(profile.nested.search()).toBe('Grace');
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  injector.destroy();
});

it('handles a skipped popstate without NavigationStart and reports rejected promises without a reason', async () => {
  const { router, injector } = setup('/search?q=Ada');
  const search = field('Ada', { debounce: 'blur' });
  const onError = vi.fn();
  syncQueryParams({ q: search }, { injector, onError });
  search.value.control.set('draft');
  router.current = { id: ++router.id, extras: {}, trigger: 'popstate' } as Navigation;
  router.events.next(new NavigationSkipped(router.id, router.url, 'Same URL', NavigationSkippedCode.IgnoredSameUrlNavigation));
  router.current = null;
  expect(search.value.control()).toBe('Ada');
  router.navigateByUrl.mockRejectedValueOnce(undefined);
  search.set('new'); await settle();
  expect(onError).toHaveBeenCalledWith({ key: null, phase: 'navigation', cause: undefined });
  injector.destroy();
});

it('reserves the entire map before initialization callbacks can register another helper', () => {
  const { injector } = setup('/search?q=Ada');
  const errors: unknown[] = [];
  const search = field('', { onValueChange() {
    try { syncQueryParams({ page: field(1) }, { injector }); } catch (error) { errors.push(error); }
  } });
  const page = field(1);
  const stop = syncQueryParams({ q: search, page }, { injector });
  expect(errors).toHaveLength(1);
  expect(String(errors[0])).toContain('already has an active binding');
  stop.unsubscribe();
  syncQueryParams({ page }, { injector });
  injector.destroy();
});

it('releases all reserved entries if the shared owner is destroyed during hydration', async () => {
  const { injector, router } = setup('/search?q=Ada&page=2');
  const search = field('', { onValueChange: () => injector.destroy() });
  const page = field(1);
  const stop = syncQueryParams({ q: search, page }, { injector });
  expect(search()).toBe('Ada');
  expect(page()).toBe(1);
  page.set(3);
  await settle();
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  stop.unsubscribe();
});

it('exposes decoded raw signals independently of serializers, defaults, and repeated values', () => {
  const { router, injector, handleError } = setup('/search?q=Ada+Lovelace&page=invalid&tag=a&tag=b&empty=&keep=yes');
  const page = field(1);
  const tags = field.strict<string[]>([]);
  const sync = syncQueryParams({ q: field(''), page, tag: { source: tags, serializer: queryParam.array() }, empty: field('fallback'), missing: field('fallback') }, { injector });
  expect(sync.params.q()).toBe('Ada Lovelace');
  expect(sync.params.page()).toBe('invalid');
  expect(page()).toBe(1);
  expect(handleError).toHaveBeenCalledOnce();
  expect(sync.params.tag()).toBe('a');
  expect(tags()).toEqual(['a', 'b']);
  expect(sync.params.empty()).toBe('');
  expect(sync.params.missing()).toBeNull();
  router.external('/search?page=2');
  expect(sync.params.page()).toBe('2');
  expect(sync.params.q()).toBeNull();
  injector.destroy();
});

it('tracks accepted URL and queued writes separately for each connection', async () => {
  const { router, injector } = setup('/search?q=Ada&page=1');
  router.automatic = false;
  const search = field('');
  const page = field(1);
  const sync = syncQueryParams({ q: search }, { injector });
  const other = syncQueryParams({ page }, { injector });
  const raw = computed(() => sync.params.q()?.toUpperCase());
  expect(raw()).toBe('ADA');
  expect(sync.pending()).toBe(false);
  expect(sync.closed()).toBe(false);
  router.startExternal('/search?keep=new');
  search.set('Grace');
  await settle();
  expect(sync.pending()).toBe(true);
  expect(other.pending()).toBe(false);
  expect(sync.params.q()).toBe('Ada');
  expect(router.requested).toHaveLength(0);
  router.events.next(new NavigationCancel(router.id, '/search?keep=new', 'Rejected', NavigationCancellationCode.GuardRejected));
  router.current = null;
  await settle();
  expect(sync.pending()).toBe(true);
  search.set('Lin');
  await settle();
  router.accept();
  await settle();
  expect(sync.params.q()).toBe('Grace');
  expect(raw()).toBe('GRACE');
  expect(search()).toBe('Lin');
  expect(sync.pending()).toBe(true);
  expect(other.pending()).toBe(false);
  router.accept();
  await settle();
  expect(sync.params.q()).toBe('Lin');
  expect(sync.pending()).toBe(false);
  expect(other.params.page()).toBe('1');
  injector.destroy();
  expect(sync.closed()).toBe(true);
  expect(other.closed()).toBe(true);
});

it('retains the accepted snapshot on rejection and publishes a redirect destination', async () => {
  const { router, injector } = setup('/search?q=Ada');
  router.automatic = false;
  const search = field('');
  const onError = vi.fn(() => expect(sync.pending()).toBe(false));
  const sync = syncQueryParams({ q: search }, { injector, onError });
  search.set('blocked');
  await settle();
  expect(sync.pending()).toBe(true);
  router.rejectNavigation();
  await settle();
  expect(sync.params.q()).toBe('Ada');
  expect(search()).toBe('blocked');
  expect(onError).toHaveBeenCalledOnce();
  search.set('redirect');
  await settle();
  router.accept(1, '/search?q=canonical&extra=1');
  await settle();
  expect(sync.params.q()).toBe('canonical');
  expect(router.parseUrl(router.url).queryParamMap.get('extra')).toBe('1');
  expect(search()).toBe('canonical');
  expect(sync.pending()).toBe(false);
  injector.destroy();
});

it('keeps URL reads current through partial cleanup and freezes them when the last entry closes', async () => {
  const { router, injector } = setup('/search?q=Ada&page=1');
  const owner = Injector.create({ providers: [], parent: injector });
  const search = field('');
  const page = field(1);
  const sync = syncQueryParams({ q: { source: search, injector: owner }, page }, { injector });
  owner.destroy();
  expect(sync.closed()).toBe(false);
  router.external('/search?q=Grace&page=2');
  expect(sync.params.q()).toBe('Grace');
  expect(search()).toBe('Ada');
  expect(page()).toBe(2);
  router.automatic = false;
  page.set(3);
  await settle();
  expect(sync.pending()).toBe(true);
  sync.unsubscribe();
  sync.unsubscribe();
  expect(sync.closed()).toBe(true);
  expect(sync.pending()).toBe(false);
  router.external('/search?q=Lin&page=4');
  await settle();
  expect(sync.params.q()).toBe('Grace');
  expect(sync.params.page()).toBe('2');
  expect(page()).toBe(3);
  injector.destroy();
});

it('handles reserved names and empty connections without adding live observations', () => {
  const { router, injector } = setup('/search?unsubscribe=raw&pending=yes&__proto__=safe');
  const empty = syncQueryParams({}, { injector });
  expect(empty.params).toEqual({});
  expect(empty.closed()).toBe(true);
  expect(empty.pending()).toBe(false);
  expect(router.events.observed).toBe(false);
  empty.unsubscribe();
  const sync = syncQueryParams({ unsubscribe: field(''), pending: field(''), ['__proto__']: field('') }, { injector });
  expect(sync.params.unsubscribe()).toBe('raw');
  expect(sync.params.pending()).toBe('yes');
  // Angular's URL parser ignores the __proto__ key.
  expect(sync.params.__proto__()).toBeNull();
  router.external('/search?pending=no');
  expect(sync.params.pending()).toBe('no');
  expect(empty.params).toEqual({});
  sync.unsubscribe();
  expect(router.events.observed).toBe(false);
  injector.destroy();
});

it('resolves every named serializer and batches their encoded values with custom serializers', async () => {
  const { router, injector } = setup('/search?q=Ada+Lovelace&amount=1.5&page=2&active=false&tag=angular&tag=forms&custom=3');
  const filters = form({ q: field(''), amount: field(0), page: field<number>(null), active: field(true), tags: field.strict<string[]>([]), custom: field(1) });
  const sync = syncQueryParams({
    q: { source: filters.q, serializer: 'string' },
    amount: { source: filters.amount, serializer: 'number' },
    page: { source: filters.page, serializer: 'integer' },
    active: { source: filters.active, serializer: 'boolean' },
    tag: { source: filters.tags, serializer: 'array' },
    custom: { source: filters.custom, serializer: { parse: values => Number(values[0]), serialize: value => [String(value)] } },
  }, { injector });
  expect(filters()).toEqual({ q: 'Ada Lovelace', amount: 1.5, page: 2, active: false, tags: ['angular', 'forms'], custom: 3 });
  filters.patch({ q: 'a & b', amount: 2.5, page: 3, active: true, tags: ['one,two', '', 'a & b', 'one,two'], custom: 4 });
  await settle();
  expect(router.requested).toHaveLength(1);
  expect(router.url).toBe('/search?q=a%20%26%20b&amount=2.5&page=3&active=true&tag=one,two&tag=&tag=a%20%26%20b&tag=one,two&custom=4');
  expect(sync.params.tag()).toBe('one,two');
  expect(router.parseUrl(router.url).queryParamMap.getAll('tag')).toEqual(['one,two', '', 'a & b', 'one,two']);
  expect(sync.pending()).toBe(false);
  injector.destroy();
});

it('uses named serializers for malformed input and reports failures without navigation or validation errors', async () => {
  const { router, injector, handleError } = setup('/search?q=a&q=b&amount=bad&page=1.5&active=yes');
  const filters = form({ q: field('fallback'), amount: field(1), page: field(2), active: field(false) });
  syncQueryParams({ q: { source: filters.q, serializer: 'string' }, amount: { source: filters.amount, serializer: 'number' }, page: { source: filters.page, serializer: 'integer' }, active: { source: filters.active, serializer: 'boolean' } }, { injector });
  expect(filters()).toEqual({ q: 'fallback', amount: 1, page: 2, active: false });
  expect(handleError).toHaveBeenCalledTimes(4);
  expect(filters.valid()).toBe(true);
  filters.page.set(1.5);
  await settle();
  expect(handleError).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'page', phase: 'serialize' }));
  expect(router.requested).toHaveLength(0);
  expect(filters.page()).toBe(1.5);
  injector.destroy();
});

it.each(['unknown', 'constructor', '__proto__'])('rejects unknown serializer name %s before reserving keys or hydrating fields', (serializer) => {
  const { injector } = setup('/search?q=url');
  const search = field('initial');
  expect(() => syncQueryParams({ q: search, other: { source: field(''), serializer: serializer as never } }, { injector })).toThrow('Unknown query parameter serializer');
  expect(search()).toBe('initial');
  const sync = syncQueryParams({ q: search }, { injector });
  expect(search()).toBe('url');
  sync.unsubscribe();
  injector.destroy();
});

it('synchronizes numeric arrays using a custom element serializer', async () => {
  const { router, injector } = setup('/search?id=1&id=2');
  const ids = field.strict<number[]>([]);
  const integer = queryParam.integer();
  const sync = syncQueryParams({ id: { source: ids, serializer: {
    parse: values => values.map(value => integer.parse([value])),
    serialize: values => values.flatMap(value => integer.serialize(value)!),
  } } }, { injector });
  expect(ids()).toEqual([1, 2]);
  ids.set([3, 4]);
  await settle();
  expect(router.url).toBe('/search?id=3&id=4');
  expect(router.parseUrl(router.url).queryParamMap.getAll('id')).toEqual(['3', '4']);
  expect(sync.params.id()).toBe('3');
  injector.destroy();
});

it('synchronizes JSON fields in one encoded parameter alongside repeated array bindings', async () => {
  const initial = { ids: [1, 2], label: 'a & b', nested: { enabled: true } };
  const { router, injector } = setup(`/search?state=${encodeURIComponent(JSON.stringify(initial))}&tag=a&tag=b&keep=yes#results`);
  const state = field.strict({ ids: [] as number[], label: '', nested: { enabled: false } });
  const tags = field.strict<string[]>([]);
  const sync = syncQueryParams({ state: { source: state, serializer: 'json' }, tag: { source: tags, serializer: 'array' } }, { injector });
  expect(state()).toEqual(initial);
  expect(tags()).toEqual(['a', 'b']);
  expect(sync.params.state()).toBe(JSON.stringify(initial));
  state.set({ ids: [3], label: '"escaped" + / ü', nested: { enabled: false } });
  tags.set(['new']);
  await settle();
  const map = router.parseUrl(router.url).queryParamMap;
  expect(map.getAll('state')).toEqual([JSON.stringify(state())]);
  expect(map.getAll('tag')).toEqual(['new']);
  expect(map.get('keep')).toBe('yes');
  expect(router.parseUrl(router.url).fragment).toBe('results');
  expect(router.requested).toHaveLength(1);
  router.external(`/search?state=${encodeURIComponent(JSON.stringify(initial))}`, 'popstate');
  expect(state()).toEqual(initial);
  expect(tags()).toEqual([]);
  injector.destroy();
});

it('distinguishes JSON empty arrays and null from absent parameters and clears serialized defaults', async () => {
  const { router, injector } = setup('/search?ids=%5B1,2%5D');
  const ids = field<number[]>(null);
  const cleared = field.strict({ id: 1 });
  const sync = syncQueryParams({ ids: { source: ids, serializer: 'json' }, state: { source: cleared, serializer: queryParam.json<{ id: number }>(), clearOnDefault: true } }, { injector });
  expect(ids()).toEqual([1, 2]);
  ids.set([]);
  cleared.set({ id: 2 });
  await settle();
  expect(sync.params.ids()).toBe('[]');
  expect(router.parseUrl(router.url).queryParamMap.getAll('ids')).toEqual(['[]']);
  cleared.set({ id: 1 });
  ids.set(null);
  await settle();
  expect(router.url).toBe('/search');
  router.external('/search?ids=null');
  expect(ids()).toBeNull();
  expect(sync.params.ids()).toBe('null');
  router.external('/search');
  expect(sync.params.ids()).toBeNull();
  expect(cleared()).toEqual({ id: 1 });
  injector.destroy();
});

it('reports malformed and unserializable JSON without corrupting URL state or retrying', async () => {
  const { router, injector, handleError } = setup('/search?state=%7Bbroken');
  const initial = { id: 1 };
  const state = field<unknown>(initial);
  const sync = syncQueryParams({ state: { source: state, serializer: 'json' } }, { injector });
  expect(state()).toBe(initial);
  expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ phase: 'parse', key: 'state' }));
  router.external('/search?state=%7B%22id%22:2%7D&state=%7B%22id%22:3%7D');
  expect(state()).toBe(initial);
  expect(handleError).toHaveBeenCalledTimes(2);
  router.external('/search?state=%7B%22id%22:2%7D');
  const accepted = sync.params.state();
  const circular: { self?: unknown } = {};
  circular.self = circular;
  for (const value of [circular, 1n, { toJSON: () => undefined }]) {
    state.set(value);
    await settle();
    expect(state()).toBe(value);
    expect(sync.params.state()).toBe(accepted);
    expect(sync.pending()).toBe(false);
    expect(handleError).toHaveBeenLastCalledWith(expect.objectContaining({ phase: 'serialize', key: 'state' }));
  }
  expect(router.navigateByUrl).not.toHaveBeenCalled();
  state.set({ id: 3 });
  await settle();
  expect(sync.params.state()).toBe('{"id":3}');
  injector.destroy();
});

it('hydrates and batches a mixed map of writable signals and fields in an injection context', async () => {
  const { router, injector } = setup('/search?q=Ada&page=2&active=false&tag=a&tag=b&keep=yes#results');
  const filters = form({ q: field('', [required]) });
  const page = signal(1);
  const active = signal(true);
  const tags = signal<string[]>([]);
  const sync = runInInjectionContext(injector, () => syncQueryParams({ q: filters.q, page: { source: page, serializer: 'integer', history: 'push' }, active, tag: { source: tags, serializer: 'array' } }));
  expect(filters.q()).toBe('Ada');
  expect(page()).toBe(2);
  expect(active()).toBe(false);
  expect(tags()).toEqual(['a', 'b']);
  expect(filters.valid()).toBe(true);
  await settle();
  expect(router.requested).toHaveLength(0);
  filters.q.set('Grace'); page.set(3); active.set(true); tags.set(['c']);
  await settle();
  expect(router.requested).toHaveLength(1);
  expect(router.requested[0]!.replace).toBe(false);
  expect(router.url).toBe('/search?q=Grace&page=3&active=true&tag=c&keep=yes#results');
  expect(sync.params.page()).toBe('3');
  router.external('/search?q=&page=4', 'popstate');
  expect(page()).toBe(4);
  expect(active()).toBe(true);
  expect(tags()).toEqual([]);
  expect(filters.invalid()).toBe(true);
  await settle();
  expect(router.requested).toHaveLength(1);
  injector.destroy();
  expect(sync.closed()).toBe(true);
});

it('respects signal equality and discards obsolete queued values without canonicalizing incoming URLs', async () => {
  const { router, injector } = setup('/search?q=ADA&page=01');
  const q = signal('Ada', { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
  const page = signal(1);
  const sync = syncQueryParams({ q, page }, { injector });
  expect(q()).toBe('Ada');
  expect(sync.params.q()).toBe('ADA');
  q.set('ada'); page.set(2);
  router.external('/search?q=ADA&page=01', 'popstate');
  await settle();
  expect(page()).toBe(1);
  expect(router.requested).toHaveLength(0);
  router.external('/search?q=GRACE&page=02');
  await settle();
  expect(q()).toBe('GRACE');
  expect(page()).toBe(2);
  expect(router.requested).toHaveLength(0);
  q.set('Lin'); page.update(value => value + 1);
  await settle();
  expect(router.url).toBe('/search?q=Lin&page=3');
  injector.destroy();
});

it('publishes same-reference signal notifications while consuming URL imports without echoes', async () => {
  const { router, injector } = setup('/search?state=%7B%22count%22:1%7D');
  const state = signal({ count: 0 }, { equal: () => false });
  const sync = syncQueryParams({ state: { source: state, serializer: 'json' } }, { injector });
  const same = state();
  same.count = 2;
  state.set(same);
  await settle();
  expect(sync.params.state()).toBe('{"count":2}');
  expect(router.requested).toHaveLength(1);
  router.external('/search?state=%7B%22count%22:3%7D');
  const restored = state();
  restored.count = 4;
  state.set(restored);
  await settle();
  expect(sync.params.state()).toBe('{"count":4}');
  expect(router.requested).toHaveLength(2);
  router.external('/search?state=%7B%20%22count%22:%205%20%7D');
  await settle();
  expect(state()).toEqual({ count: 5 });
  expect(sync.params.state()).toBe('{ "count": 5 }');
  expect(router.requested).toHaveLength(2);
  injector.destroy();
});

it('observes linked signal dependencies and excludes incidental serializer reads from tracking', async () => {
  const { router, injector } = setup('/search?page=3');
  const base = signal(1);
  const incidental = signal(0);
  const page = linkedSignal(() => base() * 2);
  const serialize = vi.fn((value: number) => { incidental(); return [String(value)]; });
  syncQueryParams({ page: { source: page, serializer: { parse: values => Number(values[0]), serialize } } }, { injector });
  expect(page()).toBe(3);
  base.set(4);
  await settle();
  expect(router.url).toBe('/search?page=8');
  const count = serialize.mock.calls.length;
  incidental.set(1);
  await settle();
  expect(serialize).toHaveBeenCalledTimes(count);
  expect(router.requested).toHaveLength(1);
  injector.destroy();
});

it('keeps newer signal writes pending through rejection and imports accepted redirects', async () => {
  const { router, injector, handleError } = setup('/search?q=old');
  router.automatic = false;
  const q = signal('');
  const sync = syncQueryParams({ q }, { injector });
  q.set('first'); await settle();
  q.set('second'); await settle();
  expect(sync.pending()).toBe(true);
  router.rejectNavigation(); await settle();
  expect(handleError).toHaveBeenCalledOnce();
  expect(q()).toBe('second');
  expect(sync.params.q()).toBe('old');
  expect(router.requested).toHaveLength(2);
  router.accept(1, '/search?q=canonical'); await settle();
  expect(q()).toBe('canonical');
  expect(sync.params.q()).toBe('canonical');
  expect(sync.pending()).toBe(false);
  expect(router.requested).toHaveLength(2);
  injector.destroy();
});

it('cleans a signal entry owner while preserving a field in the same in-flight batch', async () => {
  const { router, injector } = setup('/search');
  const owner = Injector.create({ parent: injector, providers: [] });
  router.automatic = false;
  const q = signal(''); const page = field(1);
  const sync = syncQueryParams({ q: { source: q, injector: owner }, page }, { injector });
  q.set('discarded'); page.set(2); await settle();
  owner.destroy(); await settle();
  expect(sync.closed()).toBe(false);
  expect(router.requested[1]!.url).toBe('/search?page=2');
  router.accept(); await settle();
  q.set('detached'); await settle();
  expect(router.requested).toHaveLength(2);
  expect(sync.pending()).toBe(false);
  injector.destroy();
  expect(sync.closed()).toBe(true);
});

it('cancels queued signal work and releases keys on manual and injector cleanup', async () => {
  const { router, injector } = setup('/search?q=initial');
  const q = signal('');
  const sync = syncQueryParams({ q }, { injector });
  q.set('queued');
  sync.unsubscribe(); sync.unsubscribe();
  await settle();
  expect(router.requested).toHaveLength(0);
  expect(sync.closed()).toBe(true);
  const next = syncQueryParams({ q }, { injector });
  expect(q()).toBe('initial');
  q.set('queued again');
  injector.destroy();
  await settle();
  expect(next.closed()).toBe(true);
  expect(router.requested).toHaveLength(0);
});

it('hydrates signals on the server without scheduling outbound navigation', async () => {
  const { router, injector } = setup('/search?q=server', true);
  const q = signal('');
  const sync = syncQueryParams({ q }, { injector });
  expect(q()).toBe('server');
  q.set('changed'); await settle();
  expect(router.requested).toHaveLength(0);
  expect(sync.pending()).toBe(false);
  injector.destroy();
});

it('rejects readonly signals and ordinary functions before mutating valid sources', () => {
  const { injector } = setup('/search?q=url');
  const q = signal('initial');
  for (const source of [signal('').asReadonly(), computed(() => ''), () => '', Object.assign(() => '', { set() {} })]) {
    expect(() => syncQueryParams({ q, invalid: { source: source as never } }, { injector })).toThrow('writable signal');
    expect(q()).toBe('initial');
  }
  injector.destroy();
});

it('releases reservations when registering a signal lifetime fails', async () => {
  const { router, injector } = setup('/search?q=initial');
  const owner = Injector.create({ parent: injector, providers: [] });
  const registration = vi.spyOn(owner.get(DestroyRef), 'onDestroy').mockImplementation(() => { throw new Error('Owner unavailable'); });
  const q = signal('');
  expect(() => syncQueryParams({ q: { source: q, injector: owner } }, { injector })).toThrow('Owner unavailable');
  q.set('unobserved'); await settle();
  expect(router.requested).toHaveLength(0);
  registration.mockRestore();
  const sync = syncQueryParams({ q }, { injector });
  expect(q()).toBe('initial');
  sync.unsubscribe();
  owner.destroy(); injector.destroy();
});

it('synchronizes groups, array nodes, and signals in one batch without echoing imported aggregates', async () => {
  const raw = '{ "set": "Ada", "active": true }';
  const { router, injector } = setup(`/search?state=${encodeURIComponent(raw)}&tag=a&tag=a&page=2`);
  const state = group({ set: field(''), active: field(false) });
  const tags = array(field.strict(''));
  const page = signal(1);
  const sync = syncQueryParams({ state: { source: state, serializer: 'json' }, tag: { source: tags, serializer: 'array' }, page }, { injector });
  expect(state()).toEqual({ set: 'Ada', active: true });
  expect(tags()).toEqual(['a', 'a']);
  expect(page()).toBe(2);
  await settle();
  expect(router.requested).toHaveLength(0);
  state.set.set('Grace');
  tags.push('b');
  page.set(3);
  await settle();
  expect(router.requested).toHaveLength(1);
  expect(sync.params.state()).toBe('{"set":"Grace","active":true}');
  expect(router.parseUrl(router.url).queryParamMap.getAll('tag')).toEqual(['a', 'a', 'b']);
  router.external(`/search?state=${encodeURIComponent(raw)}&tag=c`, 'popstate');
  await settle();
  expect(state.set()).toBe('Ada');
  expect(tags()).toEqual(['c']);
  expect(page()).toBe(1);
  expect(router.requested).toHaveLength(1);
  expect(sync.params.state()).toBe(raw);
  tags.clear();
  await settle();
  expect(router.parseUrl(router.url).queryParamMap.has('tag')).toBe(false);
  injector.destroy();
});

it('observes committed aggregate values behind child and parent equality and releases node ownership', async () => {
  const { router, injector } = setup('/search');
  const owner = Injector.create({ parent: injector, providers: [] });
  const state = group({ name: field.strict('Ada', { equal: () => true }) }, { equal: () => true, injector: owner });
  const items = array({ name: field.strict('Ada', { equal: () => true }) }, { equal: () => true, initialValue: 1 });
  const page = signal(1);
  expect(state()).toEqual({ name: 'Ada' });
  expect(items()).toEqual([{ name: 'Ada' }]);
  const sync = syncQueryParams({ state: { source: state, serializer: 'json' }, items: { source: items, serializer: 'json' }, page }, { injector });
  state.name.set('Grace');
  items.at(0)!.name.set('Lin');
  await settle();
  expect(state()).toEqual({ name: 'Ada' });
  expect(items()).toEqual([{ name: 'Ada' }]);
  expect(sync.params.state()).toBe('{"name":"Grace"}');
  expect(sync.params.items()).toBe('[{"name":"Lin"}]');
  expect(router.requested).toHaveLength(1);
  owner.destroy();
  state.name.set('Stopped');
  page.set(2);
  await settle();
  expect(sync.params.state()).toBe('{"name":"Grace"}');
  expect(sync.params.page()).toBe('2');
  expect(sync.closed()).toBe(false);
  injector.destroy();
  expect(sync.closed()).toBe(true);
});
