// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Component, InjectionToken, NgModule, inject, signal, type Provider, type Signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { provideFormNodesConfig } from './provide-form-nodes-config';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', '_formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

describe('unified Form Nodes configuration', () => {
  it.each(['module', 'component'])('configures messages and classes from a %s provider', (location) => {
    const language = signal('en');
    const LANGUAGE = new InjectionToken<Signal<string>>('Language');
    const factory = vi.fn(() => {
      const locale = inject(LANGUAGE);
      return { required: () => `Required:${locale()}` };
    });
    const providers: Provider[] = [
      { provide: LANGUAGE, useValue: language },
      provideFormNodesConfig({
        validatorMessages: factory,
        classes: { 'has-error': binding => binding.node().$api.invalid() },
      }),
    ];
    expect(factory).not.toHaveBeenCalled();
    @NgModule({
      imports: [FormNodeDirective],
      providers: location === 'module' ? providers : [],
      exports: [FormNodeDirective],
    })
    class SharedModule {}
    @Component({
      template: '<input [formNode]="profile.name">',
      imports: [SharedModule],
      providers: location === 'component' ? providers : [],
    })
    class Host {
      profile = form({ name: field('', [required]) });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const node = fixture.componentInstance.profile.name;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(node.getError('required')?.message).toBe('Required:en');
    expect(input.classList.contains('has-error')).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    language.set('fr');
    fixture.detectChanges();
    expect(node.getError('required')?.message).toBe('Required:fr');
    expect(factory).toHaveBeenCalledTimes(1);
    node.set('Marco');
    fixture.detectChanges();
    expect(node.errors()).toEqual([]);
    expect(input.classList.contains('has-error')).toBe(false);
  });

  it.each(['messages', 'classes', 'sync', 'empty', 'nullClasses', 'nullSync', 'nullMessages'])('inherits omitted options with a %s override', (section) => {
    @NgModule({
      imports: [FormNodeDirective],
      providers: [provideFormNodesConfig({
        validatorMessages: { required: 'Parent message' },
        classes: { 'parent-invalid': binding => binding.node().$api.invalid() },
      })],
      exports: [FormNodeDirective],
    })
    class SharedModule {}
    const config = section === 'messages'
      ? { validatorMessages: () => ({ required: 'Local message' }) }
      : section === 'classes' ? { classes: {} }
        : section === 'sync' ? { syncInputs: false as const }
          : section === 'nullClasses' ? { classes: null }
            : section === 'nullSync' ? { syncInputs: null }
              : section === 'nullMessages' ? { validatorMessages: null } : {};
    @Component({
      template: '<input [formNode]="name">',
      imports: [SharedModule],
      providers: [provideFormNodesConfig(config)],
    })
    class Host {
      name = field('', [required]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.componentInstance.name.getError('required')?.message).toBe(section === 'messages' ? 'Local message' : section === 'nullMessages' ? 'This field is required.' : 'Parent message');
    expect(input.classList.contains('parent-invalid')).toBe(section !== 'classes' && section !== 'nullClasses');
  });
});
