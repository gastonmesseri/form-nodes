import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { Injector, PLATFORM_ID, ErrorHandler, signal } from '@angular/core';
import { Router, DefaultUrlSerializer, NavigationStart, NavigationEnd, NavigationCancel, NavigationCancellationCode, type Navigation } from '@angular/router';

export class TestRouter {
  events = new Subject<unknown>();
  serializer = new DefaultUrlSerializer();
  url = '/search?keep=yes#results';
  currentNavigation = signal<Navigation | null>(null);
  get current() { return this.currentNavigation(); }
  set current(value: Navigation | null) { this.currentNavigation.set(value); }
  id = 0;
  automatic = true;
  requested: Array<{ url: string; replace: boolean; resolve: (accepted: boolean) => void; reject: (error: unknown) => void; navigation: Navigation }> = [];
  parseUrl = (url: string) => this.serializer.parse(url);
  serializeUrl = (url: ReturnType<DefaultUrlSerializer['parse']>) => this.serializer.serialize(url);
  navigateByUrl = vi.fn((url: ReturnType<DefaultUrlSerializer['parse']>, extras: { replaceUrl: boolean; info: unknown }) => {
    let resolve!: (accepted: boolean) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<boolean>((yes, no) => { resolve = yes; reject = no; });
    const navigation = { id: ++this.id, extras, abort: () => this.rejectNavigation(navigation, resolve) } as unknown as Navigation;
    this.requested.push({ url: this.serializeUrl(url), replace: extras.replaceUrl, resolve, reject, navigation });
    this.current = navigation;
    this.events.next(new NavigationStart(navigation.id, this.serializeUrl(url)));
    if (this.automatic) queueMicrotask(() => this.accept());
    return promise;
  });
  accept(index = this.requested.length - 1, redirected?: string) {
    const request = this.requested[index]!;
    this.current = request.navigation;
    this.url = redirected ?? request.url;
    this.events.next(new NavigationEnd(request.navigation.id, request.url, this.url));
    this.current = null;
    request.resolve(true);
  }
  rejectNavigation(navigation = this.current!, resolve = this.requested.at(-1)!.resolve) {
    this.events.next(new NavigationCancel(navigation.id, this.url, 'Rejected', NavigationCancellationCode.GuardRejected));
    this.current = null;
    resolve(false);
  }
  startExternal(url: string, trigger: 'imperative' | 'popstate' = 'imperative') {
    this.current = { id: ++this.id, extras: {} } as Navigation;
    this.events.next(new NavigationStart(this.id, url, trigger));
    return this.id;
  }
  endExternal(url: string) {
    this.url = url;
    this.events.next(new NavigationEnd(this.id, url, url));
    this.current = null;
  }
  external(url: string, trigger: 'imperative' | 'popstate' = 'imperative') {
    this.startExternal(url, trigger);
    this.endExternal(url);
  }
}

export const settle = async () => {
  for (let index = 0; index < 12; index++) await Promise.resolve();
};
export const setup = (url?: string, server = false) => {
  const router = new TestRouter();
  if (url) router.url = url;
  const handleError = vi.fn();
  const injector = Injector.create({ providers: [
    { provide: Router, useValue: router },
    { provide: PLATFORM_ID, useValue: server ? 'server' : 'browser' },
    { provide: ErrorHandler, useValue: { handleError } },
  ] });
  return { router, injector, handleError };
};

