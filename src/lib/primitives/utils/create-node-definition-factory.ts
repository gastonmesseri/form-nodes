import { field } from '../field';
import { isNode } from './node-marker';
import { isPlainObject } from '../../utils/is-plain-object';
import { mapObjectValues } from '../../utils/map-object-values';
import type { InternalNode, NodeDefinition, NodeDefinitions } from '../../types/node.type';

/**
 * Compiles a node definition into a reusable factory without retaining the live definition tree.
 *
 * A node's internal `_clone()` operation recreates only its declarative configuration: its
 * declared initial value, validators, state sources, debounce configuration, injector, and child
 * definition recipes. Every invocation creates fresh signals and fresh descendant nodes.
 *
 * Runtime state is deliberately never copied. Parent links, paths, current values written after
 * declaration, dirty/touched flags, active errors, pending validation, debounce timers, abort
 * controllers, subscriptions, and reactive watchers all belong to one live node and must not be
 * shared with a clone.
 *
 * Plain object definitions are compiled recursively. The resulting closure retains only property
 * keys and child clone closures, rather than the original object or node instances. Values stored
 * inside a leaf field are passed back to `field()` with their original identity; this utility does
 * not attempt to deep-clone arbitrary application data.
 *
 * Compilation does not destroy or otherwise mutate the source nodes. A source node is already a
 * live node before this function receives it and keeps its own lifecycle if application code
 * retains it. An inline source that becomes unreachable is not retained by the compiled factory
 * and can be garbage-collected together with its independently owned reactive resources.
 */
export const createNodeDefinitionFactory = (definition: unknown): (() => NodeDefinition) => {
  if (isNode(definition)) {
    const clone = (definition as InternalNode).$api._clone;
    return clone;
  }

  if (definition !== null && typeof definition === 'object' && isPlainObject(definition)) {
    const childFactories = mapObjectValues(definition, child => createNodeDefinitionFactory(child));
    return (() => mapObjectValues(childFactories, createChild => createChild()) as NodeDefinitions);
  }

  return (() => field(definition));
};
