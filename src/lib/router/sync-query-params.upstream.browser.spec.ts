import '@angular/compiler';
import { Location } from '@angular/common';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { Component, Injector, inject, model, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../primitives/field';
import { syncQueryParams } from './sync-query-params';
import type { QueryParamsSync } from './sync-query-params.type';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

// Adapted scenario inventory and upstream attribution: docs/research/query-param-test-audit.md.
registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({ selector: 'audit-history', template: '{{ query.params.page() }}' })
class HistoryPage {
  page = signal<number | null>(null);

  q = field.strict('');

  query = syncQueryParams({ page: { source: this.page, serializer: 'integer', history: 'push' }, q: this.q });
}

@Component({ selector: 'audit-other', template: 'Other' })
class OtherPage {}

it('replays push entries in both history directions and replaces only the current entry', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'history', component: HistoryPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/history?page=1', HistoryPage);
  const router = TestBed.inject(Router);
  const location = TestBed.inject(Location);
  router.setUpLocationChangeListener();
  page.page.set(2);
  await vi.waitFor(() => expect(page.query.params.page()).toBe('2'));
  page.page.set(3);
  await vi.waitFor(() => expect(page.query.params.page()).toBe('3'));
  page.q.set('replacement');
  await vi.waitFor(() => expect(page.query.pending()).toBe(false));
  await vi.waitFor(() => expect(router.url).toBe('/history?page=3&q=replacement'));
  location.back();
  await vi.waitFor(() => expect(page.page()).toBe(2));
  expect(page.q()).toBe('');
  location.back();
  await vi.waitFor(() => expect(page.page()).toBe(1));
  location.forward();
  await vi.waitFor(() => expect(page.page()).toBe(2));
  location.forward();
  await vi.waitFor(() => expect(page.page()).toBe(3));
  expect(page.q()).toBe('replacement');
  expect(page.query.pending()).toBe(false);
});

@Component({ selector: 'audit-panel', template: '{{ query.params.q() }}' })
class QueryPanel {
  q = field<string>(null);

  query = syncQueryParams({ q: { source: this.q, serializer: 'string' } });
}

@Component({
  selector: 'audit-panel-host',
  template: '@if (visible()) { <audit-panel /> }',
  imports: [QueryPanel],
})
class PanelHost {
  visible = signal(false);
}

it('hydrates conditional components from the current URL and cancels queued writes before remounting', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'panel', component: PanelHost }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const host = await harness.navigateByUrl('/panel?q=initial', PanelHost);
  const router = TestBed.inject(Router);
  host.visible.set(true); harness.detectChanges();
  const first = harness.routeDebugElement!.query(By.directive(QueryPanel)).componentInstance as QueryPanel;
  expect(first.q()).toBe('initial');
  first.q.set('accepted');
  await vi.waitFor(() => expect(router.url).toBe('/panel?q=accepted'));
  first.q.set('discarded');
  host.visible.set(false); harness.detectChanges();
  expect(first.query.closed()).toBe(true);
  await harness.navigateByUrl('/panel?q=external', PanelHost);
  host.visible.set(true); harness.detectChanges();
  const second = harness.routeDebugElement!.query(By.directive(QueryPanel)).componentInstance as QueryPanel;
  expect(second).not.toBe(first);
  expect(second.q()).toBe('external');
  expect(first.q()).toBe('discarded');
  second.q.set('fresh');
  await vi.waitFor(() => expect(router.url).toBe('/panel?q=fresh'));
  expect(first.query.params.q()).toBe('accepted');
  expect(second.query.params.q()).toBe('fresh');
});

@Component({
  selector: 'audit-delayed',
  template: '<input [formNode]="q" />',
  imports: [FormNodeDirective],
})
class DelayedPage {
  releases: Array<() => void> = [];

  q = field.strict('', { debounce: () => new Promise<void>(resolve => this.releases.push(resolve)) });

  second = field.strict('', { debounce: () => new Promise<void>(resolve => this.releases.push(resolve)) });

  query = syncQueryParams({ q: this.q, second: this.second });
}

it('prevents delayed writes from an old route after Back and Forward and accepts fresh input on recreation', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'delayed', component: DelayedPage }, { path: 'other', component: OtherPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/other', OtherPage);
  const first = await harness.navigateByUrl('/delayed?q=initial', DelayedPage);
  harness.detectChanges();
  const router = TestBed.inject(Router);
  const location = TestBed.inject(Location);
  router.setUpLocationChangeListener();
  const input = harness.routeNativeElement!.querySelector('input')!;
  input.value = 'stale'; input.dispatchEvent(new Event('input', { bubbles: true }));
  first.second.value.control.set('also stale');
  expect(first.releases).toHaveLength(2);
  expect(first.q.value.control()).toBe('stale');
  expect(first.q()).toBe('initial');
  location.back();
  await vi.waitFor(() => expect(router.url).toBe('/other'));
  expect(first.query.closed()).toBe(true);
  first.releases.forEach(release => release());
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(router.url).toBe('/other');
  location.forward();
  await vi.waitFor(() => expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(DelayedPage));
  harness.detectChanges();
  const second = harness.routeDebugElement!.componentInstance as DelayedPage;
  expect(second).not.toBe(first);
  expect(second.q()).toBe('initial');
  expect(second.second()).toBe('');
  second.q.value.control.set('fresh');
  second.releases[0]!();
  await vi.waitFor(() => expect(router.url).toBe('/delayed?q=fresh'));
  expect(second.query.pending()).toBe(false);
});

it.each(['/delayed?q=destination&second=destination', '/other?q=destination'])('keeps accepted navigation to %s safe from late control completions', async (destination) => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'delayed', component: DelayedPage }, { path: 'other', component: OtherPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/delayed?q=initial', DelayedPage);
  page.q.value.control.set('stale');
  page.second.value.control.set('also stale');
  await harness.navigateByUrl(destination);
  page.releases.forEach(release => release());
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(TestBed.inject(Router).url).toBe(destination);
  if (destination.startsWith('/delayed')) {
    expect(page.q()).toBe('destination');
    expect(page.q.value.control()).toBe('destination');
    expect(page.second()).toBe('destination');
    expect(page.q.debouncing()).toBe(false);
    expect(page.second.debouncing()).toBe(false);
    expect(page.query.closed()).toBe(false);
  } else {
    expect(page.query.closed()).toBe(true);
  }
});

it('preserves a pending edit when same-page navigation changes only another parameter', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'delayed', component: DelayedPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/delayed?q=initial', DelayedPage);
  page.q.value.control.set('stale');
  page.second.value.control.set('preserved');
  await harness.navigateByUrl('/delayed?q=destination', DelayedPage);
  expect(page.q.value.control()).toBe('destination');
  expect(page.q.debouncing()).toBe(false);
  expect(page.second()).toBe('');
  expect(page.second.value.control()).toBe('preserved');
  expect(page.second.debouncing()).toBe(true);
  page.releases.forEach(release => release());
  await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/delayed?q=destination&second=preserved'));
  expect(page.second()).toBe('preserved');
  expect(page.second.debouncing()).toBe(false);
  expect(page.query.pending()).toBe(false);
});

@Component({ selector: 'audit-model', template: '{{ page() }}' })
class ModelPage {
  injector = inject(Injector);

  page = model<number | null>(null);

  query!: QueryParamsSync<'page'>;

  ngOnInit() {
    this.query = syncQueryParams({ page: { source: this.page, serializer: 'integer' } }, { injector: this.injector });
  }
}

it('connects an Angular model signal with an explicit injector after construction', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'model', component: ModelPage }]), provideLocationMocks()] });
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/model?page=2', ModelPage);
  expect(page.page()).toBe(2);
  const emitted = vi.fn();
  const subscription = page.page.subscribe(emitted);
  page.page.update(value => value! + 1);
  await vi.waitFor(() => expect(page.query.params.page()).toBe('3'));
  expect(emitted.mock.calls).toEqual([[3]]);
  await harness.navigateByUrl('/model?page=4', ModelPage);
  expect(page.page()).toBe(4);
  expect(emitted.mock.calls).toEqual([[3], [4]]);
  expect(page.query.pending()).toBe(false);
  subscription.unsubscribe();
});
