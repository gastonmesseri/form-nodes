import type { Injector, Signal, OutputRef } from '@angular/core';

import type { AnyNode, NodeValue } from './node.type';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';

/** A native form submission attempt. Values are exposed snapshots; `form` is the bound node. */
export type FormNodeSubmitEvent<TNode extends AnyNode = AnyNode> = {
  /**
   * Exposed form value after pending control input has been flushed.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({
   *   selector: '[observeSubmit]',
   * })
   * export class ObserveSubmit {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeSubmit;
   *     changes.subscribe(event => {
   *       console.log(event.value);
   *       // Output: native submission data.
   *     });
   *   }
   * }
   * ```
   */
  readonly value: NodeValue<TNode>;
  /**
   * Bound form node. Use `$api` for collision-safe state and operations.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({
   *   selector: '[observeSubmit]',
   * })
   * export class ObserveSubmit {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeSubmit;
   *     changes.subscribe(event => {
   *       console.log(
   *         event.form.$api.nodeType(),
   *       );
   *       // 'form'
   *     });
   *   }
   * }
   * ```
   */
  readonly form: TNode;
  /**
   * Original native submit event, including SubmitEvent.submitter when available.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({
   *   selector: '[observeSubmit]',
   * })
   * export class ObserveSubmit {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeSubmit;
   *     changes.subscribe(event => {
   *       console.log(event.event.type);
   *       // 'submit'
   *     });
   *   }
   * }
   * ```
   */
  readonly event: Event;
};

/** Public view of a concrete `[formNode]` binding. */
export type FormNodeBinding<TNode extends AnyNode = AnyNode> = {
  /**
   * Control-originated value after it is committed, respecting debounce and flush.
   * Programmatic node writes do not emit. Synchronous state is current in the handler;
   * asynchronous validation may still be pending.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeValueChange;
   *     changes.subscribe(event => {
   *       console.log(event);
   *       // Output: each binding event.
   *     });
   *   }
   * }
   * ```
   */
  readonly formNodeValueChange: OutputRef<NodeValue<TNode>>;
  /**
   * Short name for formNodeValueChange. Both names share the same committed-value output.
   * Emits control-originated values after debounce; programmatic writes do not emit.
   * Listen with (formNodeChange) alongside [formNode], not [(formNode)].
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   imports: [FormNodeDirective],
   *   template: `
   *     <input [formNode]="form.username"
   *       (formNodeChange)="save($event)" />
   *   `,
   * })
   * export class ProfilePage {
   *   form = form({ username: field('') });
   *
   *   save(value: string) {
   *     console.log(value);
   *   }
   * }
   * ```
   */
  readonly formNodeChange: OutputRef<NodeValue<TNode>>;
  /**
   * Latest parsed value received from the selected control adapter, before waiting for debounce.
   * This does not guarantee a physical user interaction: custom controls can emit from code.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding
   *         .formNodeControlValueChange;
   *     changes.subscribe(event => {
   *       console.log(event);
   *       // Output: each binding event.
   *     });
   *   }
   * }
   * ```
   */
  readonly formNodeControlValueChange: OutputRef<NodeValue<TNode>>;
  /**
   * Native submission attempt on a form() binding, after preparing values and interaction state,
   * before the validation gate and declared action. Emits even without onSubmit or when blocked.
   * Programmatic submit() does not emit. Async listeners are not awaited.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeSubmit;
   *     changes.subscribe(event => {
   *       console.log(event);
   *       // Output: each binding event.
   *     });
   *   }
   * }
   * ```
   */
  readonly formNodeSubmit: OutputRef<FormNodeSubmitEvent<TNode>>;
  /**
   * Native attempt rejected by submitWhen, including pending validation with 'valid'.
   * Emits after formNodeSubmit, even without a declared onSubmit action. Concurrent attempts,
   * group bindings, and programmatic submit() do not emit this output.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   constructor() {
   *     const changes =
   *       this.binding.formNodeSubmitBlocked;
   *     changes.subscribe(event => {
   *       console.log(event);
   *       // Output: each binding event.
   *     });
   *   }
   * }
   * ```
   */
  readonly formNodeSubmitBlocked: OutputRef<FormNodeSubmitEvent<TNode>>;
  /**
   * Host element carrying the `[formNode]` directive.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     return this.binding.element;
   *   }
   * }
   * ```
   */
  readonly element: HTMLElement;
  /**
   * Injector belonging to the binding's host element.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     return this.binding.injector;
   *   }
   * }
   * ```
   */
  readonly injector: Injector;
  /**
   * Reactive reference to the node currently bound to the host.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     return this.binding.node();
   *   }
   * }
   * ```
   */
  readonly node: Signal<TNode>;
  /**
   * Errors visible to this binding, excluding errors owned by another binding.
   *
   * ```ts
   * provideFormNodesConfig({
   *   classes: {
   *     'has-errors': binding => {
   *       return binding.errors().length > 0;
   *     },
   *   },
   * });
   * ```
   */
  readonly errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
  /**
   * Focuses this binding using its native or custom-control focus behavior.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     this.binding.focus();
   *   }
   * }
   * ```
   */
  focus(options?: FocusOptions): void;
  /**
   * Commits pending control-originated values for the bound node.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     this.binding.flush();
   *   }
   * }
   * ```
   */
  flush(): void;
  /**
   * Resets interaction state and control-specific parsing state.
   *
   * ```ts
   * import { inject } from '@angular/core';
   * import { Directive } from '@angular/core';
   *
   * @Directive({ selector: '[observeNode]' })
   * export class ObserveNode {
   *   binding = inject(FORM_NODE);
   *
   *   inspect() {
   *     this.binding.reset();
   *   }
   * }
   * ```
   */
  reset(): void;
};
