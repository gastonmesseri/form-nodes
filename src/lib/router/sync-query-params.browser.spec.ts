import '@angular/compiler';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component, Injector, inject, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { syncQueryParams } from './sync-query-params';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'test-query-filters',
  template: '<input [formNode]="filters.search" />',
  imports: [FormNodeDirective],
})
class FiltersPage {
  router = inject(Router);
  filters = form({ search: field.strict('', { debounce: 'blur' }), page: field.strict(1) });
  errors = vi.fn();
  initialSync = vi.fn();
  urlSync = vi.fn();
  querySync = syncQueryParams({ q: { source: this.filters.search, clearOnDefault: true }, page: { source: this.filters.page, history: 'push' } }, { onError: this.errors, onInitialUrlSync: this.initialSync, onUrlSync: this.urlSync });
}

@Component({ selector: 'test-query-other', template: 'Other page' })
class OtherPage {}

it('hydrates real routed controls, batches form writes, and restores browser history over pending input', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'search', component: FiltersPage }, { path: 'other', component: OtherPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?q=Ada&page=2&keep=yes#results', FiltersPage);
  harness.detectChanges();
  const input = harness.routeNativeElement!.querySelector('input')!;
  expect(input.value).toBe('Ada');
  expect(page.initialSync).toHaveBeenCalledOnce();
  expect(page.urlSync).toHaveBeenCalledExactlyOnceWith({ reason: 'initial', values: { q: 'Ada', page: 2 } });
  expect(page.querySync.params.q()).toBe('Ada');
  expect(page.filters()).toEqual({ search: 'Ada', page: 2 });
  const navigate = vi.spyOn(page.router, 'navigateByUrl');
  page.filters.patch({ search: 'Grace', page: 3 });
  await vi.waitFor(() => expect(page.router.url).toBe('/search?q=Grace&page=3&keep=yes#results'));
  await vi.waitFor(() => expect(page.router.currentNavigation()).toBeNull());
  expect(navigate).toHaveBeenCalledOnce();
  expect(page.urlSync).toHaveBeenCalledOnce();
  expect(page.querySync.params.page()).toBe('3');
  expect(page.querySync.pending()).toBe(false);
  page.router.setUpLocationChangeListener();
  input.value = 'pending draft';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(page.filters.search.debouncing()).toBe(true);
  TestBed.inject(Location).back();
  await vi.waitFor(() => expect(page.filters.search()).toBe('Ada'));
  harness.detectChanges();
  expect(input.value).toBe('Ada');
  expect(page.filters.search.debouncing()).toBe(false);
  expect(page.filters.search.dirty()).toBe(true);
  expect(page.filters.search.touched()).toBe(false);
  expect(page.errors).not.toHaveBeenCalled();
  expect(page.urlSync).toHaveBeenCalledTimes(2);
  expect(page.urlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Ada', page: 2 } });
  expect(page.initialSync).toHaveBeenCalledOnce();
});

it('preserves edits on rejected query navigation and cancels old bindings when leaving a route', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([
    { path: 'search', component: FiltersPage, runGuardsAndResolvers: 'always', canActivate: [route => route.queryParamMap.get('q') !== 'blocked'] },
    { path: 'other', component: OtherPage },
  ]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?q=Ada', FiltersPage);
  page.filters.search.set('blocked');
  await vi.waitFor(() => expect(page.errors).toHaveBeenCalledOnce());
  expect(page.router.url).toBe('/search?q=Ada');
  expect(page.filters.search()).toBe('blocked');
  expect(page.querySync.params.q()).toBe('Ada');
  expect(page.querySync.pending()).toBe(false);
  page.filters.search.set('stale');
  await harness.navigateByUrl('/other', OtherPage);
  page.filters.search.set('after destruction');
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(page.router.url).toBe('/other');
  expect(page.querySync.closed()).toBe(true);
  expect(page.querySync.params.q()).toBe('Ada');
});

it('allows a query guard redirect to complete while the originating component is destroyed', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([
    { path: 'search', component: FiltersPage, runGuardsAndResolvers: 'always', canActivate: [route => route.queryParamMap.get('q') === 'redirect' ? inject(Router).parseUrl('/other') : true] },
    { path: 'other', component: OtherPage },
  ]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?q=Ada', FiltersPage);
  page.filters.search.set('redirect');
  await vi.waitFor(() => expect(page.router.url).toBe('/other'));
  await vi.waitFor(() => expect(page.router.currentNavigation()).toBeNull());
  expect(page.errors).not.toHaveBeenCalled();
});

it('restores pending input on same-URL Back even when Router emits only NavigationSkipped', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'search', component: FiltersPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?q=Ada', FiltersPage);
  page.router.setUpLocationChangeListener();
  const location = TestBed.inject(Location);
  location.go('/search?q=Ada');
  page.filters.search.value.control.set('draft');
  location.back();
  await vi.waitFor(() => expect(page.filters.search.value.control()).toBe('Ada'));
  expect(page.filters.search.debouncing()).toBe(false);
});

it('round trips named array codecs through real Router navigation and history', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'search', component: FiltersPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?tag=angular&tag=forms', FiltersPage);
  const tags = field.strict<string[]>([]);
  const sync = syncQueryParams({ tag: { source: tags, codec: 'array', history: 'push' } }, { injector: TestBed.inject(Injector) });
  expect(tags()).toEqual(['angular', 'forms']);
  page.router.setUpLocationChangeListener();
  tags.set(['a & b', '', 'a & b']);
  await vi.waitFor(() => expect(page.router.url).toBe('/search?tag=a%20%26%20b&tag=&tag=a%20%26%20b'));
  await vi.waitFor(() => expect(sync.pending()).toBe(false));
  expect(page.router.parseUrl(page.router.url).queryParamMap.getAll('tag')).toEqual(['a & b', '', 'a & b']);
  tags.set([]);
  await vi.waitFor(() => expect(page.router.url).toBe('/search'));
  await vi.waitFor(() => expect(sync.pending()).toBe(false));
  expect(sync.params.tag()).toBeNull();
  TestBed.inject(Location).back();
  await vi.waitFor(() => expect(tags()).toEqual(['a & b', '', 'a & b']));
  sync.unsubscribe();
});

it('round trips JSON through real Router encoding and restores an object on Back', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'search', component: FiltersPage }]), provideLocationMocks()] });
  const initial = { ids: [1, 2], text: 'a & b' };
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl(`/search?state=${encodeURIComponent(JSON.stringify(initial))}`, FiltersPage);
  const state = field.strict({ ids: [] as number[], text: '' });
  const sync = syncQueryParams({ state: { source: state, codec: 'json', history: 'push' } }, { injector: TestBed.inject(Injector) });
  expect(state()).toEqual(initial);
  page.router.setUpLocationChangeListener();
  const next = { ids: [3], text: '"quotes" + ü' };
  state.set(next);
  await vi.waitFor(() => expect(sync.params.state()).toBe(JSON.stringify(next)));
  await vi.waitFor(() => expect(sync.pending()).toBe(false));
  expect(page.router.parseUrl(page.router.url).queryParamMap.getAll('state')).toEqual([JSON.stringify(next)]);
  TestBed.inject(Location).back();
  await vi.waitFor(() => expect(state()).toEqual(initial));
  sync.unsubscribe();
});

@Component({ selector: 'test-query-mixed', template: '<input [formNode]="filters.search" />', imports: [FormNodeDirective] })
class MixedPage {
  filters = form({ search: field.strict('', { debounce: 'blur' }) });
  page = signal(1);
  querySync = syncQueryParams({ state: { source: this.filters, codec: 'json' }, page: { source: this.page, history: 'push' } });
}

it('batches a whole form and a signal with real Router history and cancels both on route destruction', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'mixed', component: MixedPage }, { path: 'other', component: OtherPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const raw = '{ "search": "Ada" }';
  const initial = `/mixed?state=${encodeURIComponent(raw)}&page=2`;
  const page = await harness.navigateByUrl(initial, MixedPage);
  harness.detectChanges();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl');
  const input = harness.routeNativeElement!.querySelector('input')!;
  expect(input.value).toBe('Ada');
  expect(page.page()).toBe(2);
  expect(page.querySync.params.state()).toBe(raw);
  page.filters.search.set('Grace');
  page.page.set(3);
  await vi.waitFor(() => expect(page.querySync.params.page()).toBe('3'));
  expect(navigate).toHaveBeenCalledOnce();
  expect(page.querySync.params.state()).toBe('{"search":"Grace"}');
  input.value = 'draft';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  router.setUpLocationChangeListener();
  TestBed.inject(Location).back();
  await vi.waitFor(() => expect(page.page()).toBe(2));
  harness.detectChanges();
  expect(input.value).toBe('Ada');
  expect(page.filters.search.debouncing()).toBe(false);
  expect(page.filters.dirty()).toBe(true);
  expect(page.querySync.params.state()).toBe(raw);
  expect(navigate).toHaveBeenCalledOnce();
  await harness.navigateByUrl('/other', OtherPage);
  expect(page.querySync.closed()).toBe(true);
  page.page.set(4);
  page.filters.search.set('stopped');
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(router.url).toBe('/other');
});

@Component({ selector: 'test-query-initial-edit', template: '' })
class InitialEditPage {
  search = signal('');
  urlSync = vi.fn();
  querySync = syncQueryParams({ q: this.search }, {
    onInitialUrlSync: () => this.search.set('edited'),
    onUrlSync: this.urlSync,
  });
}

it('retains edits made by the initial hook during real component activation without a duplicate notification', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'search', component: InitialEditPage }])] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/search?q=Ada', InitialEditPage);
  await vi.waitFor(() => expect(page.querySync.params.q()).toBe('edited'));
  expect(page.search()).toBe('edited');
  expect(page.urlSync).toHaveBeenCalledExactlyOnceWith({ reason: 'initial', values: { q: 'Ada' } });
  await harness.navigateByUrl('/search?q=Grace', InitialEditPage);
  expect(page.urlSync).toHaveBeenCalledTimes(2);
  expect(page.urlSync).toHaveBeenLastCalledWith({ reason: 'navigation', values: { q: 'Grace' } });
});
