import { assertInInjectionContext, computed, effect, inject, Injector, signal, untracked, type WritableSignal } from '@angular/core';
import { disabled, form as createAngularForm, hidden, readonly as configureReadonly, required, validate, type FieldTree, type FormFieldBinding, type SchemaPath } from '@angular/forms/signals';

import { shallowEqual } from '../utils/shallow-equal';
import type { InternalNode, Node } from '../types/node.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ValidationError } from '../validation/validation.type';

type AngularFieldAdapter = {
  readonly fieldTree: FieldTree<any>;
  readonly model: WritableSignal<any>;
};

type AngularInteractionState = ReturnType<FieldTree<any>> & {
  markAsPristine(): void;
  markAsUntouched(): void;
};

const nodeInjectors = new WeakMap<Node, Injector>();
const rootAdapters = new WeakMap<Node, AngularFieldAdapter>();
const angularFieldNodes = new WeakMap<FieldTree<any>, Node>();
const angularFormNodeBindings = new WeakMap<FormFieldBinding, FormNodeBinding>();

const getCurrentInjector = (): Injector | undefined => {
  try {
    assertInInjectionContext(getCurrentInjector);
    return inject(Injector);
  } catch {
    return undefined;
  }
};

const getRootNode = (node: Node): Node => {
  let current = node;
  let parent = ((current as InternalNode).$api as unknown as { parent: () => Node | null }).parent();
  while (parent) {
    current = parent;
    parent = ((current as InternalNode).$api as unknown as { parent: () => Node | null }).parent();
  }
  return current;
};

const getChildren = (node: InternalNode): readonly Node[] => {
  if (node.$api._nodeType === 'array') {
    return Array.from(node as unknown as Iterable<Node>);
  }
  if (node.$api._nodeType === 'form' || node.$api._nodeType === 'group') {
    return Object.values((node.$api as typeof node.$api & { children: Record<string, Node> }).children);
  }
  return [];
};

const configureNode = (path: SchemaPath<any>, resolveNode: () => Node, sample: Node) => {
  disabled(path, { when: () => resolveNode()!.$api.disabled() });
  configureReadonly(path, { when: () => resolveNode()!.$api.readonly() });
  hidden(path, { when: () => resolveNode()!.$api.hidden() });
  required(path, { when: () => resolveNode()!.$api.required() });
  validate(path, () => resolveNode()!.$api.errors().map(error => ({
    kind: error.kind,
  })));

  const internalSample = sample as InternalNode;
  if (internalSample.$api._nodeType !== 'form' && internalSample.$api._nodeType !== 'group') return;
  const children = (internalSample.$api as typeof internalSample.$api & { children: Record<string, Node> }).children;
  Object.entries(children).forEach(([key, child]) => {
    configureNode(
      (path as unknown as Record<string, SchemaPath<any>>)[key]!,
      () => {
        const parent = resolveNode()!;
        return ((parent as InternalNode).$api as typeof internalSample.$api & { children: Record<string, Node> }).children[key]!;
      },
      child,
    );
  });
};

const synchronizeInteractionState = (node: Node, fieldTree: FieldTree<any>, injector: Injector) => {
  const state = fieldTree() as AngularInteractionState;
  let previousNodeTouched = node.$api.touched();
  let previousFieldTouched = state.touched();
  let previousNodeDirty = node.$api.dirty();
  let previousFieldDirty = state.dirty();

  effect(() => {
    const nodeTouched = node.$api.touched();
    const fieldTouched = state.touched();
    const nodeDirty = node.$api.dirty();
    const fieldDirty = state.dirty();

    if (fieldTouched !== previousFieldTouched && nodeTouched === previousNodeTouched) {
      fieldTouched ? node.$api.markAsTouched({ skipDescendants: true }) : node.$api.markAsUntouched();
    } else if (nodeTouched !== fieldTouched) {
      nodeTouched ? state.markAsTouched({ skipDescendants: true }) : state.markAsUntouched();
    }
    if (fieldDirty !== previousFieldDirty && nodeDirty === previousNodeDirty) {
      fieldDirty ? node.$api.markAsDirty() : node.$api.markAsPristine();
    } else if (nodeDirty !== fieldDirty) {
      nodeDirty ? state.markAsDirty() : state.markAsPristine();
    }

    previousNodeTouched = node.$api.touched();
    previousFieldTouched = state.touched();
    previousNodeDirty = node.$api.dirty();
    previousFieldDirty = state.dirty();
  }, { injector });
};

const synchronizeTreeState = (node: Node, fieldTree: FieldTree<any>, injector: Injector) => {
  angularFieldNodes.set(fieldTree, node);
  synchronizeInteractionState(node, fieldTree, injector);
  const children = getChildren(node as InternalNode);
  children.forEach((child) => {
    const key = child.$api.keyInParent()!;
    synchronizeTreeState(child, (fieldTree as unknown as Record<PropertyKey, FieldTree<any>>)[key]!, injector);
  });
};

export const getFormNodeBindingForAngularField = (binding: FormFieldBinding): FormNodeBinding | undefined => {
  const resolveNode = () => {
    return angularFieldNodes.get(binding.state().fieldTree as FieldTree<any>);
  };
  if (!resolveNode()) return undefined;
  let adaptedBinding = angularFormNodeBindings.get(binding);
  if (adaptedBinding) return adaptedBinding;

  const node = computed(() => resolveNode()!);
  adaptedBinding = {
    element: binding.element,
    injector: binding.injector,
    node,
    errors: computed(() => node().$api.errors() as readonly ValidationError.WithTargetNode<Node>[], { equal: shallowEqual }),
    focus: (options?: FocusOptions) => binding.focus(options),
    flush: () => node().$api.flush(),
    reset: () => node().$api.reset(),
  };
  angularFormNodeBindings.set(binding, adaptedBinding);
  return adaptedBinding;
};

const createAdapter = (root: Node, injector: Injector): AngularFieldAdapter => {
  const model = signal(root());
  const fieldTree = createAngularForm(model, (path) => {
    configureNode(path as unknown as SchemaPath<any>, () => root, root);
  }, { injector });
  let previousNodeValue = root();
  let previousAngularValue = model();

  effect(() => {
    const nodeValue = root();
    const angularValue = model();
    const nodeChanged = !shallowEqual(nodeValue, previousNodeValue);
    const angularChanged = !shallowEqual(angularValue, previousAngularValue);

    if (angularChanged && !nodeChanged) {
      untracked(() => root.$api.set(angularValue));
    } else if (nodeChanged && !shallowEqual(nodeValue, angularValue)) {
      untracked(() => model.set(nodeValue));
    }
    previousNodeValue = root();
    previousAngularValue = model();
  }, { injector });
  synchronizeTreeState(root, fieldTree, injector);
  return { fieldTree, model };
};

export const getAngularField = <TValue>(node: Node): FieldTree<TValue> => {
  const root = getRootNode(node);
  const injector = nodeInjectors.get(root) ?? nodeInjectors.get(node);
  if (!injector) {
    throw new Error('Angular Signal Forms interoperability requires an Angular injection context or an explicit `injector` option.');
  }
  let adapter = rootAdapters.get(root);
  if (!adapter) {
    adapter = untracked(() => createAdapter(root, injector));
    rootAdapters.set(root, adapter);
  }
  return node.$api.path().reduce<FieldTree<any>>(
    (fieldTree, key) => (fieldTree as unknown as Record<string, FieldTree<any>>)[key]!,
    adapter.fieldTree,
  ) as FieldTree<TValue>;
};

export const registerAngularField = (node: Node, injector?: Injector) => {
  const resolvedInjector = injector ?? getCurrentInjector();
  if (resolvedInjector) nodeInjectors.set(node, resolvedInjector);
  Object.defineProperty(node, '$field', {
    configurable: false,
    enumerable: false,
    get: () => getAngularField(node),
  });
};
