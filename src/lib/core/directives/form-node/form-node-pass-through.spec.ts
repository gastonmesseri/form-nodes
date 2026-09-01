import { describe, expect, it } from 'vitest';

import { FORM_NODE_PASS_THROUGH, provideFormNodePassThrough } from './form-node-pass-through';

describe('provideFormNodePassThrough', () => {
  it('registers the pass-through marker on the host injector', () => {
    expect(provideFormNodePassThrough()).toEqual({
      provide: FORM_NODE_PASS_THROUGH,
      useValue: true,
    });
  });
});
