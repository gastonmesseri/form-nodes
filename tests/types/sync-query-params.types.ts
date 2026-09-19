import { Injector, signal, type Signal } from '@angular/core';

import { form } from '../../src/lib/primitives/form';
import { array } from '../../src/lib/primitives/array';
import { field } from '../../src/lib/primitives/field';
import { syncQueryParams, queryParam, type QueryParamsSync, type QueryParamCodec, type QueryParamBinding } from '../../src/lib/router/public-api';

const injector = Injector.create({ providers: [] });
const filters = form({ q: field(''), page: field(1), nested: { active: field(false) } });
const sync = syncQueryParams({
  q: { field: filters.q, defaultValue: '', clearOnDefault: true },
  page: { field: filters.page, defaultValue: 1, history: 'push', injector, codec: queryParam.integer() },
  active: filters.nested.active,
}, { injector, onError(error) { const phase: 'parse' | 'serialize' | 'navigation' = error.phase; return phase; } });
const typed: QueryParamsSync<'q' | 'page' | 'active'> = sync;
const rawPage: Signal<string | null> = sync.params.page;
const pending: Signal<boolean> = sync.pending;
const closed: Signal<boolean> = sync.closed;
const tags: string[] = sync.paramMap().getAll('tag');
void [typed, rawPage, pending, closed, tags];
sync.unsubscribe();
// @ts-expect-error Only configured keys have named signals.
sync.params.missing;
// @ts-expect-error Raw parameter signals are read-only.
sync.params.page.set('2');
// @ts-expect-error Parameter signals cannot be replaced.
sync.params.page = signal('2');
// @ts-expect-error Connection state signals are read-only.
sync.pending.set(true);
const empty = syncQueryParams({}, { injector });
// @ts-expect-error An empty map has no named parameter signals.
empty.params.q;
const collisions = syncQueryParams({ pending: field(''), unsubscribe: field('') }, { injector });
const rawReserved: string | null = collisions.params.unsubscribe();
void rawReserved;
collisions.unsubscribe();
const nullable = field<number>(null);
syncQueryParams({ page: { field: nullable, codec: queryParam.integer(), defaultValue: null } }, { injector });
const object = field.strict({ id: 1 });
const codec: QueryParamCodec<{ id: number }> = { parse: values => ({ id: Number(values[0]) }), serialize: value => [String(value.id)] };
const binding: QueryParamBinding<{ id: number }> = { field: object, codec };
syncQueryParams({ object: binding }, { injector });

// @ts-expect-error A field's fallback must match its value type.
syncQueryParams({ page: { field: filters.page, defaultValue: 'one' } }, { injector });
// @ts-expect-error A codec must produce the field's value type.
syncQueryParams({ page: { field: filters.page, codec: queryParam.string() } }, { injector });
// @ts-expect-error Aggregate nodes are not field bindings.
syncQueryParams({ filters }, { injector });
// @ts-expect-error Plain Angular signals are not field nodes.
syncQueryParams({ q: signal('') }, { injector });
// @ts-expect-error History mode is constrained.
syncQueryParams({ q: { field: filters.q, history: 'append' } }, { injector });

const named = syncQueryParams({
  q: { field: filters.q, codec: 'string' },
  page: { field: filters.page, codec: 'number' },
  nullable: { field: nullable, codec: 'integer', defaultValue: null },
  active: { field: filters.nested.active, codec: 'boolean' },
  tags: { field: field.strict<string[]>([]), codec: 'array' },
  readonlyTags: { field: field.strict<readonly string[]>([]), codec: 'array' },
  optionalTags: { field: field<string[]>(undefined), codec: 'array' },
}, { injector });
const namedRaw: Signal<string | null> = named.params.tags;
void namedRaw;
const namedBinding: QueryParamBinding<string[]> = { field: field.strict<string[]>([]), codec: 'array' };
syncQueryParams({ tags: namedBinding }, { injector });

// @ts-expect-error A named numeric codec does not produce text.
syncQueryParams({ q: { field: filters.q, codec: 'number' } }, { injector });
// @ts-expect-error A named text codec does not produce numbers.
syncQueryParams({ page: { field: filters.page, codec: 'string' } }, { injector });
// @ts-expect-error Repeated strings require an array field.
syncQueryParams({ q: { field: filters.q, codec: 'array' } }, { injector });
// @ts-expect-error A scalar codec cannot read an array field.
syncQueryParams({ tags: { field: field.strict<string[]>([]), codec: 'string' } }, { injector });
// @ts-expect-error Numeric arrays need JSON or a custom codec.
syncQueryParams({ ids: { field: field.strict<number[]>([]), codec: 'array' } }, { injector });
// @ts-expect-error A named codec cannot safely populate a literal-only field.
syncQueryParams({ q: { field: field.strict<'a' | 'b'>('a'), codec: 'string' } }, { injector });
// @ts-expect-error Arbitrary strings need a known codec name or a custom codec object.
syncQueryParams({ page: { field: filters.page, codec: 'xml' } }, { injector });
// @ts-expect-error A mixed scalar field requires a codec that handles both value types.
syncQueryParams({ value: { field: field.strict<string | number>(''), codec: 'number' } }, { injector });

// @ts-expect-error Array nodes are aggregate nodes, not array-valued fields.
syncQueryParams({ tags: { field: array(field('')), codec: 'array' } }, { injector });

const jsonSync = syncQueryParams({
  object: { field: object, codec: 'json' },
  numbers: { field: field.strict<number[]>([]), codec: 'json' },
  optional: { field: field<{ id: number }>(null), codec: 'json' },
}, { injector });
const rawJson: Signal<string | null> = jsonSync.params.object;
void rawJson;
const typedJson = queryParam.json<{ id: number }>();
const parsedJson: { id: number } = typedJson.parse(['{"id":1}']);
void parsedJson;
syncQueryParams({ object: { field: object, codec: typedJson } }, { injector });
const unknownJson = queryParam.json();
// @ts-expect-error A JSON codec without an expected type returns unknown.
const guessedJson: { id: number } = unknownJson.parse(['{"id":1}']);
void guessedJson;
// @ts-expect-error JSON does not widen the field's default value type.
syncQueryParams({ object: { field: object, codec: 'json', defaultValue: [] } }, { injector });
// @ts-expect-error A typed JSON codec must produce the field's declared value type.
syncQueryParams({ object: { field: object, codec: queryParam.json<number[]>() } }, { injector });
