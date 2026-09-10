import { NgTemplateOutlet } from '@angular/common';
import { TemplateRef, ChangeDetectionStrategy, Component, ElementRef, computed, contentChild, inject, input, booleanAttribute } from '@angular/core';

import { isNotNil } from '../utils/is-nil';
import { attempt } from '../utils/attempt';
import type { AnyNode } from '../types/node.type';
import type { FormNode } from '../primitives/form';
import { isFormNode } from '../primitives/is-form-node';
import type { FormNodeErrorsContext } from './form-node-errors-context.type';
import type { ControlState, ControlStateError } from '../form-node-state/form-node-state';
import { resolveMessage, shouldShowMessages, setupErrorHeightAnimation } from './form-node-errors.utils';

/** Read-only validation messages for a node or a custom control's useFormNodeState() facade. */
@Component({
  selector: 'form-node-errors',
  template: `
    <div class="form-node-errors-content">
      @if (context(); as context) {
        @if (messageTemplate(); as template) {
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="context" />
        } @else {
          @for (message of context.messages; track $index) {
            <div class="form-node-error">{{ message }}</div>
          }
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      color: var(--form-node-errors-color, #dc2626);
      font-size: var(--form-node-errors-font-size, 0.875rem);
      line-height: var(--form-node-errors-line-height, 1.5);
    }
    .form-node-errors-content { display: flow-root; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
  exportAs: 'formNodeErrors',
})
export class FormNodeErrors {
  node = input<AnyNode | null | undefined>();

  state = input<ControlState<any> | null | undefined>();

  maxMessages = input<number>(1);

  fallbackMessage = input<string>('Invalid value.');

  animate = input(true, { transform: booleanAttribute });

  message = input<((error: ControlStateError) => string | null | undefined) | undefined>();

  showWhen = input<'touched-or-submit' | 'touched' | 'dirty' | 'submit' | 'always' | boolean>('touched-or-submit');

  messageTemplate = contentChild('message', { read: TemplateRef });

  host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  displayedMessages = computed(() => {
    return attempt(() => {
      const node = this.node();
      const state = this.state();
      const when = this.showWhen();
      const max = this.maxMessages();
      const resolve = this.message();
      const fallback = this.fallbackMessage();
      if (isNotNil(node) && (!isFormNode(node) || isNotNil(state))) return [];

      const source = node?.$api ?? state;
      if (!source || source.disabled() || source.hidden()) return [];

      const visible = shouldShowMessages(when, source, () => {
        if (state) return state.formSubmitted();
        const form = node?.$api.form() as FormNode<any> | null | undefined;
        return form?.$api.submitted() ?? false;
      });

      if (!visible) return [];
      if (max !== Infinity && (!Number.isInteger(max) || max <= 0)) return [];

      const errors = source.errors();
      if (!Array.isArray(errors)) return [];
      const fallbackText = typeof fallback === 'string' ? fallback : 'Invalid value.';
      return errors
        .filter(error => isNotNil(error) && typeof error.kind === 'string')
        .map(error => resolveMessage(error, resolve, fallbackText))
        .filter(item => item.message.trim().length > 0)
        .slice(0, max);
    }, []);
  });

  context = computed((): FormNodeErrorsContext | null => {
    const items = this.displayedMessages();
    const first = items[0];
    if (!first) return null;
    return {
      $implicit: first.message,
      message: first.message,
      messages: items.map(item => item.message),
      errors: items.map(item => item.error),
    };
  });

  constructor() {
    setupErrorHeightAnimation(this.host, () => this.animate() !== false);
  }
}

