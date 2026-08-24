import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationRef, Component, destroyPlatform } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';

import { field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { FormNodeDirective } from './form-node.directive';
import { registerSignalInputForJit } from '../../../../../testing/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

declare const __FORM_NODE_HYDRATION_HTML__: string;

@Component({
  selector: 'form-node-hydration-app',
  standalone: true,
  imports: [FormNodeDirective],
  template: '<input data-age type="text" [formNode]="age"><span data-value>{{ age() }}</span>',
})
class HydrationApp {
  readonly age = field(23, [required], { nullable: false });
}

const installServerDom = (): { host: HTMLElement; nodes: Node[] } => {
  const serverDocument = new DOMParser().parseFromString(atob(__FORM_NODE_HYDRATION_HTML__), 'text/html');
  const nodes = Array.from(serverDocument.body.childNodes, (node) => document.importNode(node, true));
  document.body.append(...nodes);
  const host = nodes.find((node): node is HTMLElement =>
    node instanceof HTMLElement && node.matches('form-node-hydration-app'),
  );
  if (!host) throw new Error('The SSR fixture does not contain the hydration application host.');
  return { host, nodes };
};

describe('FormNodeDirective hydration in Chromium', () => {
  it('claims the server-rendered control and connects state and events', async () => {
    destroyPlatform();
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const { host, nodes } = installServerDom();
    const serverInput = host.querySelector('[data-age]') as HTMLInputElement;

    expect(serverInput.required).toBe(true);
    expect(serverInput.value).toBe('23');
    expect(serverInput.getAttribute('aria-invalid')).toBe('false');

    let application: ApplicationRef | undefined;
    try {
      application = await bootstrapApplication(HydrationApp, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      const hydratedInput = host.querySelector('[data-age]') as HTMLInputElement;
      const instance = application.components[0]!.instance as HydrationApp;

      expect(hydratedInput).toBe(serverInput);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();

      hydratedInput.value = 'invalid';
      hydratedInput.dispatchEvent(new Event('input', { bubbles: true }));
      await application.whenStable();

      expect(instance.age()).toBe(23);
      expect(instance.age.getError('parse')?.kind).toBe('parse');
      expect(hydratedInput.value).toBe('invalid');
      expect(hydratedInput.getAttribute('aria-invalid')).toBe('true');
      expect(host.querySelector('[data-value]')?.textContent).toBe('23');

      hydratedInput.value = '42';
      hydratedInput.dispatchEvent(new Event('input', { bubbles: true }));
      await application.whenStable();

      expect(instance.age()).toBe(42);
      expect(instance.age.dirty()).toBe(true);
      expect(instance.age.getError('parse')).toBeUndefined();
      expect(hydratedInput.getAttribute('aria-invalid')).toBe('false');
      expect(host.querySelector('[data-value]')?.textContent).toBe('42');
    } finally {
      application?.destroy();
      error.mockRestore();
      warn.mockRestore();
      nodes.forEach((node) => node.parentNode?.removeChild(node));
      destroyPlatform();
    }
  });
});
