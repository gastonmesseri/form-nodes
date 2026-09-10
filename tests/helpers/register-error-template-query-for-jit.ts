import { TemplateRef, ɵɵcontentQuerySignal, ɵɵqueryAdvance } from '@angular/core';

import { FormNodeErrors } from '../../src/lib/form-node-errors/form-node-errors.component';

/** Mirrors AOT query instructions omitted by Vitest's plain TypeScript transpilation. */
export const registerErrorTemplateQueryForJit = () => {
  const definition = (FormNodeErrors as unknown as {
    ɵcmp: { contentQueries: (flags: number, instance: FormNodeErrors, index: number) => void };
  }).ɵcmp;
  definition.contentQueries = (flags, instance, index) => {
    if (flags & 1) ɵɵcontentQuerySignal(index, instance.messageTemplate, ['message'], 1 | 4, TemplateRef);
    if (flags & 2) ɵɵqueryAdvance();
  };
};
