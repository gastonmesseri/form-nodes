import { describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext, ɵSIGNAL as SIGNAL, type ɵInputSignalNode as InputSignalNode } from '@angular/core';

import { form } from '../../primitives/form';
import { field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { FormRootDirective } from './form-root.directive';

const bindForm = (directive: FormRootDirective, formNode: ReturnType<typeof form>): void => {
  const node = directive.form[SIGNAL] as InputSignalNode<ReturnType<typeof form>, ReturnType<typeof form>>;
  node.applyValueToInputSignal(node, formNode);
};
const createDirective = (): FormRootDirective =>
  runInInjectionContext(Injector.create({ providers: [] }), () => new FormRootDirective());

describe('FormRootDirective', () => {
  it('prevents native submission and submits the bound form node', async () => {
    const action = vi.fn();
    const profile = form({ name: field('Marco') }, { submission: { action } });
    const directive = createDirective();
    const event = new Event('submit', { cancelable: true });
    bindForm(directive, profile);

    directive.submit(event);
    await Promise.resolve();

    expect(event.defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledWith(profile, { name: 'Marco' });
  });

  it('delegates native reset to the complete form tree', () => {
    const action = vi.fn();
    const profile = form({ name: field('', [required]) }, { submission: { action } });
    const directive = createDirective();
    bindForm(directive, profile);

    directive.submit(new Event('submit', { cancelable: true }));
    expect(action).not.toHaveBeenCalled();
    expect(profile.name.touched()).toBe(true);

    profile.name.set('changed');
    profile.name.markAsDirty();
    const event = new Event('reset', { cancelable: true });
    directive.reset(event);

    expect(event.defaultPrevented).toBe(true);
    expect(profile()).toEqual({ name: 'changed' });
    expect(profile.touched()).toBe(false);
    expect(profile.dirty()).toBe(false);
  });
});
