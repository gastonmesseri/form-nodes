import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalInputForJit(FormNodeDirective, 'formNodeValue', '_formNodeValue');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const select = (input: HTMLInputElement, files: File[]) => {
  const transfer = new DataTransfer();
  files.forEach(file => transfer.items.add(file));
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('native file bindings', () => {
  it('updates a nested field, reactive filename and parent validation once per selection', () => {
    const changes = vi.fn();
    @Component({
      template: `<input type="file" [formNode]="upload.details.avatar" (formNodeValueChange)="changes($event)"><output>{{ fileName() }}</output>`,
      imports: [FormNodeDirective],
    })
    class Host {
      upload = form({ details: { avatar: field<File>(null, [required]) } });

      changes = changes;

      fileName = computed(() => this.upload.details.avatar()?.name ?? 'No file');
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });
    expect(host.upload.invalid()).toBe(true);
    expect(host.upload.dirty()).toBe(false);
    select(input, [file]);
    fixture.detectChanges();
    expect(host.upload.details.avatar()).toBe(file);
    expect(host.upload().details.avatar).toBe(file);
    expect(host.upload.valid()).toBe(true);
    expect(host.upload.details.dirty()).toBe(true);
    expect(host.upload.dirty()).toBe(true);
    expect(host.upload.touched()).toBe(false);
    expect(changes).toHaveBeenCalledExactlyOnceWith(file);
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('avatar.png');
    input.dispatchEvent(new Event('blur'));
    expect(host.upload.touched()).toBe(true);
    input.dispatchEvent(new Event('cancel'));
    expect(changes).toHaveBeenCalledTimes(1);
    expect(host.upload.details.avatar()).toBe(file);

    // Reset without a value restores the current selection and clears interaction state.
    input.value = '';
    host.upload.reset();
    fixture.detectChanges();
    expect(input.files?.item(0)).toBe(file);
    expect(host.upload.pristine()).toBe(true);
    expect(host.upload.untouched()).toBe(true);
    host.upload.details.avatar.reset(null);
    fixture.detectChanges();
    expect(input.files?.length).toBe(0);
    expect(host.upload.invalid()).toBe(true);
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('No file');
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('synchronizes multiple hosts, programmatic replacement, order and initial reset', () => {
    const initial = new File(['initial'], 'initial.txt');
    @Component({
      template: `<input type="file" multiple [formNode]="upload.files"><input type="file" multiple [formNode]="upload.files">`,
      imports: [FormNodeDirective],
    })
    class Host {
      upload = form({ files: field<File[]>([initial]) });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const node = fixture.componentInstance.upload;
    const [first, second] = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(first!.files?.item(0)).toBe(initial);
    expect(second!.files?.item(0)).toBe(initial);
    const a = new File(['a'], 'a.txt');
    const b = new File(['b'], 'b.txt');
    select(first!, [a, b]);
    fixture.detectChanges();
    expect(node.files()).toEqual([a, b]);
    expect(Array.from(second!.files!)).toEqual([a, b]);
    node.files.set([b, a]);
    fixture.detectChanges();
    expect(Array.from(first!.files!)).toEqual([b, a]);
    expect(Array.from(second!.files!)).toEqual([b, a]);
    node.resetToInitial();
    fixture.detectChanges();
    expect(node.files()?.[0]).toBe(initial);
    expect(first!.files?.item(0)).toBe(initial);
    expect(second!.files?.item(0)).toBe(initial);
    expect(node.dirty()).toBe(false);
    node.files.set([]);
    fixture.detectChanges();
    expect(first!.files?.length).toBe(0);
    expect(second!.files?.length).toBe(0);
    expect(node.dirty()).toBe(false);
    select(second!, [a]);
    select(second!, []);
    fixture.detectChanges();
    expect(node.files()).toEqual([]);
    expect(first!.files?.length).toBe(0);
    expect(node.dirty()).toBe(true);
  });

  it('buffers file drafts, flushes on submission, and cancels drafts on reset', async () => {
    const drafts = vi.fn();
    const commits = vi.fn();
    const submitted = vi.fn();
    @Component({
      template: `<form [formNode]="upload"><input type="file" [formNode]="upload.file" (formNodeControlValueChange)="drafts($event)" (formNodeValueChange)="commits($event)"><button type="reset">Reset</button></form>`,
      imports: [FormNodeDirective],
    })
    class Host {
      upload = form({ file: field<File>(null, [required], { debounce: 'blur' }) }, {
        onSubmit: (value) => { submitted(value); },
      });

      drafts = drafts;

      commits = commits;
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const node = fixture.componentInstance.upload;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const file = new File(['data'], 'data.txt');
    select(input, [file]);
    fixture.detectChanges();
    expect(node.file()).toBeNull();
    expect(node.file.value.control()).toBe(file);
    expect(node.debouncing()).toBe(true);
    expect(input.files?.item(0)).toBe(file);
    expect(drafts).toHaveBeenCalledExactlyOnceWith(file);
    expect(commits).not.toHaveBeenCalled();
    expect(await node.submit()).toBe(true);
    expect(submitted).toHaveBeenCalledExactlyOnceWith({ file });
    expect(commits).toHaveBeenCalledExactlyOnceWith(file);
    expect(node.debouncing()).toBe(false);
    expect(node.touched()).toBe(true);
    select(input, [new File(['draft'], 'draft.txt')]);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(node.file()).toBe(file);
    expect(input.files?.item(0)).toBe(file);
    expect(node.debouncing()).toBe(false);
    expect(node.pristine()).toBe(true);
    expect(node.untouched()).toBe(true);
    expect(commits).toHaveBeenCalledTimes(1);
  });

  it('supports standalone two-way File[] values and programmatic clearing', () => {
    @Component({
      template: `<input type="file" multiple [(formNodeValue)]="files"><output>{{ files()[0]?.name }}</output>`,
      imports: [FormNodeDirective],
    })
    class Host {
      files = signal<File[]>([]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const file = new File(['data'], 'standalone.txt');
    select(input, [file]);
    fixture.detectChanges();
    expect(host.files()[0]).toBe(file);
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('standalone.txt');
    host.files.set([]);
    fixture.detectChanges();
    expect(input.files?.length).toBe(0);
  });

  it('moves the selection and event ownership on rebinding and releases them on destruction', () => {
    const original = new File(['first'], 'first.txt');
    const next = new File(['second'], 'second.txt');
    const first = field<File>(original);
    const second = field<File>(next);
    @Component({
      template: `<input type="file" [formNode]="active()">`,
      imports: [FormNodeDirective],
    })
    class Host {
      active = signal(first);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.files?.item(0)).toBe(original);
    fixture.componentInstance.active.set(second);
    fixture.detectChanges();
    expect(input.files?.item(0)).toBe(next);
    select(input, []);
    expect(second()).toBeNull();
    expect(second.dirty()).toBe(true);
    expect(first()).toBe(original);
    expect(first.dirty()).toBe(false);
    fixture.destroy();
    select(input, [original]);
    expect(second()).toBeNull();
  });

  it('retains distinct files with identical metadata and updates reactive content', async () => {
    const changes = vi.fn();
    @Component({
      template: `<input type="file" [formNode]="file" (formNodeValueChange)="changes($event)">`,
      imports: [FormNodeDirective],
    })
    class Host {
      file = field<File>(null);

      changes = changes;
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const first = new File(['aaa'], 'same.txt', { lastModified: 1 });
    const second = new File(['bbb'], 'same.txt', { lastModified: 1 });
    select(input, [first]);
    fixture.detectChanges();
    select(input, [second]);
    fixture.detectChanges();
    expect(changes).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.file()).toBe(second);
    expect(await fixture.componentInstance.file()!.text()).toBe('bbb');
  });
});
