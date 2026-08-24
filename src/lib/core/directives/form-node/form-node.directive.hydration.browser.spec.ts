import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationRef, Component, destroyPlatform } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';

import { field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { FormNodeDirective } from './form-node.directive';

declare const __FORM_NODE_HYDRATION_HTML__: string;

@Component({
  selector: 'form-node-hydration-app',
  standalone: true,
  imports: [FormNodeDirective],
  template: '<input data-name [formNode]="name"><span data-value>{{ name() }}</span>',
})
class HydrationApp {
  readonly name = field('', [required], { nullable: false });
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
    const serverInput = host.querySelector('[data-name]') as HTMLInputElement;

    expect(serverInput.required).toBe(true);
    expect(serverInput.getAttribute('aria-invalid')).toBe('true');

    let application: ApplicationRef | undefined;
    try {
      application = await bootstrapApplication(HydrationApp, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      const hydratedInput = host.querySelector('[data-name]') as HTMLInputElement;
      const instance = application.components[0]!.instance as HydrationApp;

      expect(hydratedInput).toBe(serverInput);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();

      hydratedInput.value = 'Marco';
      hydratedInput.dispatchEvent(new Event('input', { bubbles: true }));
      await application.whenStable();

      expect(instance.name()).toBe('Marco');
      expect(instance.name.dirty()).toBe(true);
      expect(hydratedInput.getAttribute('aria-invalid')).toBe('false');
      expect(host.querySelector('[data-value]')?.textContent).toBe('Marco');
    } finally {
      application?.destroy();
      error.mockRestore();
      warn.mockRestore();
      nodes.forEach((node) => node.parentNode?.removeChild(node));
      destroyPlatform();
    }
  });
});
