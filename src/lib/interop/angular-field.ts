import { computed, effect, Injector, signal, untracked, type EffectRef, type WritableSignal } from '@angular/core';
import { applyEach, disabled, form as createAngularForm, hidden, MAX, MAX_DATE, MAX_LENGTH, MAX_NUMBER, metadata, MIN, MIN_DATE, MIN_LENGTH, MIN_NUMBER, PATTERN, readonly as configureReadonly, required, validate, type FieldTree, type FormFieldBinding, type SchemaPath } from '@angular/forms/signals';

import { shallowEqual } from '../utils/shallow-equal';
import { resolveNodeInjector } from '../utils/node-injector';
import type { InternalNode, Node } from '../types/node.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ValidationError } from '../validation/validation.type';
import { registerExternalValidationErrors } from '../validation/external-validation-errors';

type AngularFieldAdapter = {
  readonly fieldTree: FieldTree<any>;
  readonly model: WritableSignal<any>;
  connect(node: Node, fieldTree: FieldTree<any>): void;
};

type AngularControlValueSnapshots = WeakMap<Node, unknown>;

type AngularInteractionState = ReturnType<FieldTree<any>> & {
  markAsPristine(): void;
  markAsUntouched(): void;
};

type AngularParseError = ValidationError & Readonly<Record<string, unknown>>;
type AngularFieldBindingWithParseErrors = FormFieldBinding & {
  readonly parseErrors: () => readonly AngularParseError[];
};

type ConstraintNode = Node & {
  max(): number | Date | null;
  maxLength(): number | null;
  min(): number | Date | null;
  minLength(): number | null;
  pattern(): readonly RegExp[];
};

type ArrayNodeWithSchemaSample = InternalNode & {
  $api: InternalNode['$api'] & { _getSchemaSample(): Node };
};

const rootAdapters = new WeakMap<Node, AngularFieldAdapter>();
const angularFieldNodes = new WeakMap<object, Node>();
const angularFormNodeBindings = new WeakMap<FormFieldBinding, FormNodeBinding>();
const adaptedAngularFormNodeBindings = new WeakSet<FormNodeBinding>();

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
  if (node.$api.nodeType() === 'array') {
    return Array.from(node as unknown as Iterable<Node>);
  }
  if (node.$api.nodeType() === 'form' || node.$api.nodeType() === 'group') {
    return Object.values((node.$api as typeof node.$api & { children: Record<string, Node> }).children);
  }
  return [];
};

const resolveConfiguredNode = (resolveNode: () => Node, fieldTree: object): Node => {
  return angularFieldNodes.get(fieldTree) ?? resolveNode();
};

const configureConstraints = (path: SchemaPath<any>, resolveNode: () => Node) => {
  const resolveConstraintNode = (fieldTree: object) => resolveConfiguredNode(resolveNode, fieldTree) as ConstraintNode;
  metadata(path, MIN_NUMBER, ({ fieldTree }) => {
    const value = resolveConstraintNode(fieldTree).min();
    return typeof value === 'number' ? value : undefined;
  });
  metadata(path, MIN_DATE, ({ fieldTree }) => {
    const value = resolveConstraintNode(fieldTree).min();
    return value instanceof Date ? value : undefined;
  });
  metadata(path, MIN, ({ fieldTree }) => resolveConstraintNode(fieldTree).min() instanceof Date ? MIN_DATE : MIN_NUMBER);
  metadata(path, MAX_NUMBER, ({ fieldTree }) => {
    const value = resolveConstraintNode(fieldTree).max();
    return typeof value === 'number' ? value : undefined;
  });
  metadata(path, MAX_DATE, ({ fieldTree }) => {
    const value = resolveConstraintNode(fieldTree).max();
    return value instanceof Date ? value : undefined;
  });
  metadata(path, MAX, ({ fieldTree }) => resolveConstraintNode(fieldTree).max() instanceof Date ? MAX_DATE : MAX_NUMBER);
  metadata(path, MIN_LENGTH, ({ fieldTree }) => resolveConstraintNode(fieldTree).minLength() ?? undefined);
  metadata(path, MAX_LENGTH, ({ fieldTree }) => resolveConstraintNode(fieldTree).maxLength() ?? undefined);
  const patternSlots = Math.max((resolveNode() as ConstraintNode).pattern().length, 1);
  for (let index = 0; index < patternSlots; index++) {
    metadata(path, PATTERN, ({ fieldTree }) => resolveConstraintNode(fieldTree).pattern()[index]);
  }
};

const toAngularValidationError = (error: ValidationError.WithTargetNode<Node>): ValidationError => {
  const angularError = { ...error } as Record<string, unknown>;
  Reflect.deleteProperty(angularError, 'targetNode');
  Reflect.deleteProperty(angularError, 'formNode');
  return angularError as unknown as ValidationError;
};

const configureNode = (path: SchemaPath<any>, resolveNode: () => Node, sample: Node) => {
  disabled(path, { when: ({ fieldTree }) => resolveConfiguredNode(resolveNode, fieldTree).$api.disabled() });
  configureReadonly(path, { when: ({ fieldTree }) => resolveConfiguredNode(resolveNode, fieldTree).$api.readonly() });
  hidden(path, { when: ({ fieldTree }) => resolveConfiguredNode(resolveNode, fieldTree).$api.hidden() });
  required(path, { when: ({ fieldTree }) => resolveConfiguredNode(resolveNode, fieldTree).$api.required() });
  validate(path, ({ fieldTree }) => {
    const targetNode = resolveConfiguredNode(resolveNode, fieldTree);
    return (getRootNode(targetNode).$api.allErrors() as readonly ValidationError.WithTargetNode<Node>[])
      .filter(error => error.targetNode === targetNode && (!error.formNode || !adaptedAngularFormNodeBindings.has(error.formNode)))
      .map(error => toAngularValidationError(error));
  });

  const internalSample = sample as InternalNode;
  if (internalSample.$api.nodeType() === 'field') configureConstraints(path, resolveNode);
  if (internalSample.$api.nodeType() === 'array') {
    const sampleItem = getChildren(internalSample)[0]
      ?? (internalSample as ArrayNodeWithSchemaSample).$api._getSchemaSample();
    applyEach(path, itemPath => configureNode(itemPath as unknown as SchemaPath<any>, () => sampleItem, sampleItem));
    return;
  }
  if (internalSample.$api.nodeType() !== 'form' && internalSample.$api.nodeType() !== 'group') return;
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

const synchronizeInteractionState = (node: Node, fieldTree: FieldTree<any>, injector: Injector): EffectRef => {
  const state = fieldTree() as AngularInteractionState;
  let previousNodeTouched = node.$api.touched();
  let previousFieldTouched = state.touched();
  let previousNodeDirty = node.$api.dirty();
  let previousFieldDirty = state.dirty();

  return effect(() => {
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

const synchronizeNodeState = (node: Node, fieldTree: FieldTree<any>, injector: Injector): (() => void) => {
  angularFieldNodes.set(fieldTree, node);
  const interactionEffect = synchronizeInteractionState(node, fieldTree, injector);
  const bindingEffect = effect((onCleanup) => {
    const unregister = fieldTree().formFieldBindings().flatMap((binding) => {
      const angularBinding = binding as AngularFieldBindingWithParseErrors;
      const adaptedBinding = getFormNodeBindingForAngularField(binding)!;
      const parseErrors = computed(() => {
        return angularBinding.parseErrors().map((error) => {
          const { fieldTree: angularFieldTree, formField: angularFormField, ...parseError } = error;
          void angularFieldTree;
          void angularFormField;
          return { ...parseError, formNode: adaptedBinding };
        });
      });
      return [
        (node as InternalNode).$api._registerControlBinding({
          element: binding.element,
          focus: options => binding.focus(options),
          reset: () => {
            if (fieldTree().formFieldBindings()[0] === binding) fieldTree().reset((node as InternalNode).$api._value());
          },
        }),
        registerExternalValidationErrors(node, binding, parseErrors),
      ];
    });
    onCleanup(() => unregister.forEach(cleanup => cleanup()));
  }, { injector });
  return () => {
    angularFieldNodes.delete(fieldTree);
    interactionEffect.destroy();
    bindingEffect.destroy();
  };
};

const createConnectedNodeSynchronizer = (root: Node, injector: Injector) => {
  const synchronizedNodes = new Map<Node, { readonly fieldTree: FieldTree<any>; readonly cleanup: () => void }>();
  const prune = () => {
    synchronizedNodes.forEach((entry, node) => {
      if (getRootNode(node) === root) return;
      entry.cleanup();
      synchronizedNodes.delete(node);
    });
  };
  const connect = (node: Node, fieldTree: FieldTree<any>) => {
    const current = synchronizedNodes.get(node);
    if (current?.fieldTree === fieldTree) return;
    current?.cleanup();
    synchronizedNodes.set(node, {
      fieldTree,
      cleanup: untracked(() => synchronizeNodeState(node, fieldTree, injector)),
    });
  };
  const reconcile = (rootFieldTree: FieldTree<any>) => {
    prune();
    synchronizedNodes.forEach((_entry, node) => {
      const fieldTree = node.$api.path().reduce<FieldTree<any>>(
        (current, key) => (current as unknown as Record<string, FieldTree<any>>)[key]!,
        rootFieldTree,
      );
      connect(node, fieldTree);
    });
  };
  return { connect, prune, reconcile };
};

const captureAngularControlValues = (node: Node, fieldTree: FieldTree<any>, snapshots: AngularControlValueSnapshots) => {
  snapshots.set(node, fieldTree().controlValue());
  getChildren(node as InternalNode).forEach((child) => {
    const key = child.$api.keyInParent()!;
    captureAngularControlValues(child, (fieldTree as unknown as Record<PropertyKey, FieldTree<any>>)[key]!, snapshots);
  });
};

const routeAngularControlValues = (node: Node, fieldTree: FieldTree<any>, snapshots: AngularControlValueSnapshots): boolean => {
  const state = fieldTree();
  const controlValue = state.controlValue();
  let routed = false;
  if (!shallowEqual(controlValue, snapshots.get(node)) && state.formFieldBindings().length > 0) {
    (node as InternalNode).$api._setControlValue(controlValue);
    routed = true;
  }
  getChildren(node as InternalNode).forEach((child) => {
    const key = child.$api.keyInParent()!;
    routed = routeAngularControlValues(
      child,
      (fieldTree as unknown as Record<PropertyKey, FieldTree<any>>)[key]!,
      snapshots,
    ) || routed;
  });
  return routed;
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
  adaptedAngularFormNodeBindings.add(adaptedBinding);
  return adaptedBinding;
};

const createAdapter = (root: Node, injector: Injector): AngularFieldAdapter => {
  const value = (root as InternalNode).$api._value;
  const model = signal(value());
  const fieldTree = createAngularForm(model, (path) => {
    configureNode(path as unknown as SchemaPath<any>, () => root, root);
  }, { injector });
  let previousNodeValue = value();
  let previousAngularValue = model();
  const angularControlValues: AngularControlValueSnapshots = new WeakMap();
  captureAngularControlValues(root, fieldTree, angularControlValues);
  const connectedNodeSynchronizer = createConnectedNodeSynchronizer(root, injector);

  effect(() => {
    const nodeValue = value();
    const angularValue = model();
    const nodeChanged = !shallowEqual(nodeValue, previousNodeValue);
    const angularChanged = !shallowEqual(angularValue, previousAngularValue);
    let routedControlValue = false;

    if (nodeChanged) untracked(() => connectedNodeSynchronizer.prune());
    if (angularChanged) {
      routedControlValue = untracked(() => routeAngularControlValues(root, fieldTree, angularControlValues));
    }
    if (angularChanged && !nodeChanged && !routedControlValue) {
      untracked(() => (root as InternalNode).$api._setControlValue(angularValue));
    } else if (nodeChanged && !routedControlValue && !shallowEqual(nodeValue, angularValue)) {
      untracked(() => model.set(nodeValue));
    }
    previousNodeValue = value();
    previousAngularValue = model();
    captureAngularControlValues(root, fieldTree, angularControlValues);
    untracked(() => connectedNodeSynchronizer.reconcile(fieldTree));
  }, { injector });
  connectedNodeSynchronizer.connect(root, fieldTree);
  return { fieldTree, model, connect: connectedNodeSynchronizer.connect };
};

export const getAngularField = <TValue>(node: Node): FieldTree<TValue> => {
  const root = getRootNode(node);
  const injector = resolveNodeInjector(root) ?? resolveNodeInjector(node);
  if (!injector) {
    throw new Error('Angular Signal Forms interoperability requires an Angular injection context or an explicit `injector` option.');
  }
  let adapter = rootAdapters.get(root);
  if (!adapter) {
    adapter = untracked(() => createAdapter(root, injector));
    rootAdapters.set(root, adapter);
  }
  const fieldTree = node.$api.path().reduce<FieldTree<any>>(
    (fieldTree, key) => (fieldTree as unknown as Record<string, FieldTree<any>>)[key]!,
    adapter.fieldTree,
  );
  adapter.connect(node, fieldTree);
  return fieldTree as FieldTree<TValue>;
};

export const registerAngularField = (node: Node) => {
  Object.defineProperty(node, '$field', {
    configurable: false,
    enumerable: false,
    get: () => getAngularField(node),
  });
};
