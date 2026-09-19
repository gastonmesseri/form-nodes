import '@angular/compiler';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component, Injector, inject } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterTestingHarness } from '@angular/router/testing';
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
  querySync = syncQueryParams({ q: { field: this.filters.search, clearOnDefault: true }, page: { field: this.filters.page, history: 'push' } }, { onError: this.errors });
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
  expect(page.querySync.params.q()).toBe('Ada');
  expect(page.filters()).toEqual({ search: 'Ada', page: 2 });
  const navigate = vi.spyOn(page.router, 'navigateByUrl');
  page.filters.patch({ search: 'Grace', page: 3 });
  await vi.waitFor(() => expect(page.router.url).toBe('/search?q=Grace&page=3&keep=yes#results'));
  await vi.waitFor(() => expect(page.router.currentNavigation()).toBeNull());
  expect(navigate).toHaveBeenCalledOnce();
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
  const sync = syncQueryParams({ tag: { field: tags, codec: 'array', history: 'push' } }, { injector: TestBed.inject(Injector) });
  expect(tags()).toEqual(['angular', 'forms']);
  page.router.setUpLocationChangeListener();
  tags.set(['a & b', '', 'a & b']);
  await vi.waitFor(() => expect(page.router.url).toBe('/search?tag=a%20%26%20b&tag=&tag=a%20%26%20b'));
  await vi.waitFor(() => expect(sync.pending()).toBe(false));
  expect(sync.paramMap().getAll('tag')).toEqual(['a & b', '', 'a & b']);
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
  const sync = syncQueryParams({ state: { field: state, codec: 'json', history: 'push' } }, { injector: TestBed.inject(Injector) });
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
