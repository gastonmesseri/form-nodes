import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationRef, Component, destroyPlatform } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';

import { field } from '../../primitives/field';
import { FormNode } from './form-node.directive';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

declare const __FORM_NODE_HYDRATION_HTML__: string;
declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;
declare const __FORM_NODE_SIGNAL_CONTROL_HYDRATION_HTML__: string;

@Component({
  selector: 'form-node-hydration-app',
  template: '<input data-age type="text" [formNode]="age"><span data-value>{{ age() }}</span>',
  standalone: true,
  imports: [FormNode],
})
class HydrationApp {
  readonly age = field(23, [required], { nullable: false });
}

const installServerDom = (encodedHtml: string, selector: string): { host: HTMLElement; nodes: Node[] } => {
  const serverDocument = new DOMParser().parseFromString(atob(encodedHtml), 'text/html');
  const nodes = Array.from(serverDocument.body.childNodes, node => document.importNode(node, true));
  document.body.append(...nodes);
  const host = nodes.find((node): node is HTMLElement =>
    node instanceof HTMLElement && node.matches(selector),
  );
  if (!host) throw new Error('The SSR fixture does not contain the hydration application host.');
  return { host, nodes };
};

describe('FormNode hydration in Chromium', () => {
  it('claims the server-rendered control and connects state and events', async () => {
    destroyPlatform();
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const { host, nodes } = installServerDom(__FORM_NODE_HYDRATION_HTML__, 'form-node-hydration-app');
    const serverInput = host.querySelector('[data-age]') as HTMLInputElement;

    expect(serverInput.required).toBe(true);
    expect(serverInput.value).toBe('23');
    expect(serverInput.name).toMatch(/\.form\d+$/);
    expect(serverInput.getAttribute('aria-invalid')).toBe('false');
    const serverName = serverInput.name;

    let application: ApplicationRef | undefined;
    try {
      application = await bootstrapApplication(HydrationApp, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      const hydratedInput = host.querySelector('[data-age]') as HTMLInputElement;
      const instance = application.components[0]!.instance as HydrationApp;

      expect(hydratedInput).toBe(serverInput);
      expect(hydratedInput.name).toBe(serverName);
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
      nodes.forEach(node => node.parentNode?.removeChild(node));
      destroyPlatform();
    }
  });

  it('hydrates a full-AOT Angular FormValueControl without an adapter provider', async () => {
    destroyPlatform();
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const { host, nodes } = installServerDom(__FORM_NODE_SIGNAL_CONTROL_HYDRATION_HTML__, 'aot-signal-control-host');
    const serverButton = host.querySelector('aot-signal-value-control button') as HTMLButtonElement;
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../tests/integration/form-node-signal-control.fixture');

    expect(serverButton.textContent).toContain('AOT initial');
    let application: ApplicationRef | undefined;
    try {
      application = await bootstrapApplication(module.AotSignalControlHost, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      const hydratedButton = host.querySelector('aot-signal-value-control button') as HTMLButtonElement;
      const instance = application.components[0]!.instance as InstanceType<typeof module.AotSignalControlHost>;
      expect(hydratedButton).toBe(serverButton);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();

      hydratedButton.click();
      hydratedButton.dispatchEvent(new Event('blur', { bubbles: true }));
      await application.whenStable();
      expect(instance.name()).toBe('AOT value');
      expect(instance.name.dirty()).toBe(true);
      expect(instance.name.touched()).toBe(true);
    } finally {
      application?.destroy();
      error.mockRestore();
      warn.mockRestore();
      nodes.forEach(node => node.parentNode?.removeChild(node));
      destroyPlatform();
    }
  });
});
