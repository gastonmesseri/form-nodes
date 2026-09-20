import type { Subscription } from 'rxjs';
import { untracked } from '@angular/core';
import { Router, UrlTree, NavigationEnd, NavigationStart, NavigationError, NavigationCancel, NavigationSkipped, NavigationCancellationCode, NavigationSkippedCode, type ParamMap } from '@angular/router';

import type { QueryParamSyncError } from './sync-query-params.type';

export const sameValues = (a: readonly string[], b: readonly string[]) => {
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

export type QueryEntry = {
  key: string;
  history: 'replace' | 'push';
  active: boolean;
  read(): readonly string[];
  accept(params: ParamMap): void;
  setPending(pending: boolean): void;
  restore(values: readonly string[]): void;
  acknowledgesInitial(values: readonly string[], navigationId: number): boolean;
  prepareNotification(): (() => void) | undefined;
  stop(): void;
  report(error: QueryParamSyncError): void;
};

type Flight = {
  patches: Map<QueryEntry, readonly string[]>;
  interrupted: boolean;
};

const coordinators = new WeakMap<Router, QueryParamCoordinator>();

export class QueryParamCoordinator {
  entries = new Map<string, QueryEntry>();

  pending = new Map<QueryEntry, readonly string[]>();

  accepted: UrlTree;

  flight: Flight | undefined;

  external: number | undefined;

  historyRestoration = false;

  scheduled = false;

  subscription: Subscription;

  constructor(public router: Router, public browser: boolean) {
    this.accepted = router.parseUrl(router.url);
    this.external = untracked(router.currentNavigation)?.id;
    this.subscription = router.events.subscribe(event => untracked(() => this.handle(event)));
  }

  handle(event: unknown) {
    if (event instanceof NavigationStart) {
      const navigation = untracked(this.router.currentNavigation);
      if (this.flight && navigation?.extras.info === this.flight) return;
      this.external = event.id;
      this.historyRestoration = event.navigationTrigger !== 'imperative';
      if (this.flight) {
        this.flight.interrupted = true;
        for (const [entry, value] of this.flight.patches) {
          if (entry.active && !this.pending.has(entry)) this.pending.set(entry, value);
        }
      }
    } else if (event instanceof NavigationEnd) {
      const next = this.router.parseUrl(event.urlAfterRedirects);
      const own = untracked(this.router.currentNavigation)?.extras.info === this.flight && this.flight !== undefined && !this.flight.interrupted;
      const changedPage = this.router.serializeUrl(new UrlTree(this.accepted.root)) !== this.router.serializeUrl(new UrlTree(next.root));
      const previous = this.accepted;
      this.accepted = next;
      this.external = undefined;
      const notifications = new Set<QueryEntry['prepareNotification']>();
      for (const accept of new Set([...this.entries.values()].map(entry => entry.accept))) accept(next.queryParamMap);
      for (const entry of this.entries.values()) {
        const values = next.queryParamMap.getAll(entry.key);
        const sent = own ? this.flight!.patches.get(entry) : undefined;
        if ((sent && sameValues(sent, values)) || entry.acknowledgesInitial(values, event.id)) continue;
        if (this.historyRestoration || changedPage || !sameValues(previous.queryParamMap.getAll(entry.key), values)) {
          this.pending.delete(entry);
          entry.restore(values);
          notifications.add(entry.prepareNotification);
        }
      }
      this.historyRestoration = false;
      this.schedule();
      this.notify(notifications);
    } else if (event instanceof NavigationCancel || event instanceof NavigationError || event instanceof NavigationSkipped) {
      if (event instanceof NavigationSkipped && event.code === NavigationSkippedCode.IgnoredSameUrlNavigation && untracked(this.router.currentNavigation)?.trigger === 'popstate') {
        this.historyRestoration = true;
        this.external = event.id;
      }
      if (event.id !== this.external) return;
      if (event instanceof NavigationCancel && (event.code === NavigationCancellationCode.Redirect || event.code === NavigationCancellationCode.SupersededByNewNavigation)) return;
      this.external = undefined;
      const notifications = new Set<QueryEntry['prepareNotification']>();
      if (event instanceof NavigationSkipped && this.historyRestoration) {
        this.pending.clear();
        for (const entry of this.entries.values()) {
          entry.restore(this.accepted.queryParamMap.getAll(entry.key));
          notifications.add(entry.prepareNotification);
        }
      }
      this.historyRestoration = false;
      this.schedule();
      this.notify(notifications);
    }
  }

  notify(preparations: Set<QueryEntry['prepareNotification']>) {
    // Capture every connection before a callback can edit another connection's sources.
    const notifications = [...preparations].map(prepare => prepare());
    for (const notify of notifications) notify?.();
  }

  enqueue(entry: QueryEntry) {
    if (!entry.active || !this.browser) return;
    try {
      const values = entry.read();
      const inFlight = this.flight?.patches.get(entry);
      if (sameValues(values, inFlight ?? this.accepted.queryParamMap.getAll(entry.key))) this.pending.delete(entry);
      else this.pending.set(entry, values);
      this.schedule();
    } catch (cause) {
      this.pending.delete(entry);
      this.refreshPending();
      entry.report({ key: entry.key, phase: 'serialize', cause });
    }
  }

  refreshPending() {
    for (const entry of this.entries.values()) {
      entry.setPending(this.pending.has(entry) || !!(this.flight && !this.flight.interrupted && this.flight.patches.has(entry)));
    }
  }

  schedule() {
    this.refreshPending();
    if (this.scheduled || this.flight || this.external !== undefined || !this.pending.size) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (!this.flight && this.external === undefined && this.pending.size) this.flush();
    });
  }

  flush() {
    const patches = new Map(this.pending);
    this.pending.clear();
    const params = { ...this.accepted.queryParams };
    let push = false;
    for (const [entry, values] of patches) {
      if (values.length) Object.defineProperty(params, entry.key, { value: [...values], configurable: true, enumerable: true, writable: true });
      else delete params[entry.key];
      push ||= entry.history === 'push';
    }
    const flight: Flight = { patches, interrupted: false };
    this.flight = flight;
    const target = new UrlTree(this.accepted.root, params, this.accepted.fragment);
    try {
      Promise.resolve(this.router.navigateByUrl(target, { replaceUrl: !push, info: flight })).then(
        accepted => this.finish(flight, accepted, accepted ? undefined : new Error('Query parameter navigation was rejected.')),
        error => this.finish(flight, false, error),
      );
    } catch (error) {
      this.finish(flight, false, error);
    }
  }

  finish(flight: Flight, accepted: boolean, cause?: unknown) {
    if (this.flight === flight) this.flight = undefined;
    this.refreshPending();
    if (!accepted && !flight.interrupted) {
      const reporters = new Set([...flight.patches.keys()].filter(entry => entry.active).map(entry => entry.report));
      for (const report of reporters) report({ key: null, phase: 'navigation', cause });
    }
    this.schedule();
  }

  remove(entry: QueryEntry) {
    entry.active = false;
    this.entries.delete(entry.key);
    this.pending.delete(entry);
    entry.setPending(false);
    if (this.flight?.patches.has(entry)) {
      this.flight.interrupted = true;
      for (const [other, values] of this.flight.patches) {
        if (other.active && !this.pending.has(other)) this.pending.set(other, values);
      }
      const navigation = untracked(this.router.currentNavigation);
      if (navigation?.extras.info === this.flight) navigation.abort();
    }
    this.refreshPending();
    if (!this.entries.size) {
      this.subscription.unsubscribe();
      coordinators.delete(this.router);
    }
  }
}

export const getCoordinator = (router: Router, browser: boolean) => {
  let coordinator = coordinators.get(router);
  if (!coordinator) {
    coordinator = new QueryParamCoordinator(router, browser);
    coordinators.set(router, coordinator);
  }
  return coordinator;
};
