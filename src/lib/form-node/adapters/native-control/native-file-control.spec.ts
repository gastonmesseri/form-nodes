// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { readNativeControlValue, writeNativeControlValue } from './native-control-value';

afterEach(() => vi.unstubAllGlobals());

const fileList = (files: File[]): FileList => {
  return Object.assign([...files], { item: (index: number) => files[index] ?? null });
};

const setup = (multiple = false, files: File[] = []) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = multiple;
  Object.defineProperty(input, 'files', { configurable: true, writable: true, value: fileList(files) });
  return input;
};

describe('native file values', () => {
  it('reads single files and snapshots multiple selections as arrays', () => {
    const first = new File(['first'], 'first.txt');
    const second = new File(['second'], 'second.txt');
    const single = setup(false, [first]);
    expect(readNativeControlValue(single, () => null)).toBe(first);
    const multiple = setup(true, [first, second]);
    const value = readNativeControlValue(multiple, () => []);
    expect(value).toEqual([first, second]);
    expect(Array.isArray(value)).toBe(true);
    multiple.files = fileList([second]);
    expect(value).toEqual([first, second]);
    expect(readNativeControlValue(setup(), () => first)).toBeNull();
    expect(readNativeControlValue(setup(true), () => [first])).toEqual([]);
  });

  it('does not require browser file APIs for server DOM elements', () => {
    const input = setup();
    input.files = null;
    expect(readNativeControlValue(input, () => null)).toBeNull();
    expect(() => writeNativeControlValue(input, new File(['data'], 'server.txt'))).not.toThrow();
    expect(input.value).toBe('');
    input.multiple = true;
    expect(readNativeControlValue(input, () => [])).toEqual([]);
  });

  it.each([null, undefined, []])('clears a multiple selection for %s without DataTransfer', (value) => {
    const input = setup(true);
    const write = vi.spyOn(input, 'value', 'set');
    writeNativeControlValue(input, value);
    expect(write).toHaveBeenCalledWith('');
  });

  it('rejects model shapes incompatible with multiple', () => {
    expect(() => writeNativeControlValue(setup(), [])).toThrow('requires File or a nullish value');
    expect(() => writeNativeControlValue(setup(true), new File([], 'a.txt'))).toThrow('requires File[] or a nullish value');
  });

  it('preserves the existing FileList when file identities and order match', () => {
    const file = new File(['data'], 'a.txt');
    const input = setup(false, [file]);
    const selected = input.files;
    writeNativeControlValue(input, file);
    expect(input.files).toBe(selected);
    input.multiple = true;
    writeNativeControlValue(input, [file]);
    expect(input.files).toBe(selected);
  });

  it('reports unavailable DataTransfer when a nonempty selection needs replacing', () => {
    vi.stubGlobal('DataTransfer', undefined);
    expect(() => writeNativeControlValue(setup(), new File([], 'a.txt'))).toThrow('requires browser DataTransfer support');
  });

  it('reports missing browser ownership for detached documents', () => {
    const input = document.implementation.createHTMLDocument().createElement('input');
    input.type = 'file';
    expect(() => writeNativeControlValue(input, new File([], 'a.txt'))).toThrow('requires browser DataTransfer support');
  });

  it('uses the host window DataTransfer to replace or reorder selected files', () => {
    class Transfer {
      entries: File[] = [];

      items = { add: (file: File) => this.entries.push(file) };

      get files() { return fileList(this.entries); }
    }
    vi.stubGlobal('DataTransfer', Transfer);
    const first = new File(['one'], 'a.txt');
    const second = new File(['two'], 'b.txt');
    const input = setup(true, [first, second]);
    writeNativeControlValue(input, [second, first]);
    expect(Array.from(input.files!)).toEqual([second, first]);
    writeNativeControlValue(input, [first]);
    expect(Array.from(input.files!)).toEqual([first]);
    input.multiple = false;
    writeNativeControlValue(input, second);
    expect(input.files?.item(0)).toBe(second);
    expect(input.value).toBe('');
  });
});
