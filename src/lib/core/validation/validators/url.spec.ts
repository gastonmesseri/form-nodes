import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { url } from './url';
import { field } from '../../primitives/field';

const context = <TValue>(value: TValue) => {
  return { value: signal(value).asReadonly() };
};

describe('url', () => {
  it('accepts absolute WHATWG URLs and rejects relative or malformed values', () => {
    expect(url({})(context('https://example.com/path?query=value#section'))).toBeNull();
    expect(url({})(context('http://localhost:4200'))).toBeNull();
    expect(url({})(context('mailto:user@example.com'))).toBeNull();
    expect(url({})(context('custom:value'))).toBeNull();
    expect(url({})(context('/relative/path'))).toEqual({
      kind: 'url',
      message: 'Please enter a valid absolute URL.',
    });
    expect(url({})(context('not a url'))).toEqual({
      kind: 'url',
      message: 'Please enter a valid absolute URL.',
    });
  });

  it('supports direct use, custom messages, and empty values', () => {
    expect(field('https://example.com', [url]).errors()).toEqual([]);
    expect(url({ message: 'Enter a complete URL' })(context('invalid'))).toEqual({
      kind: 'url',
      message: 'Enter a complete URL',
    });
    expect(url({})(context(''))).toBeNull();
    expect(url({})(context(null))).toBeNull();
  });
});
