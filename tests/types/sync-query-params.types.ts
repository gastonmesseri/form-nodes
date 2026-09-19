import { Injector, signal, computed, linkedSignal, type Signal } from '@angular/core';

import { form } from '../../src/lib/primitives/form';
import { array } from '../../src/lib/primitives/array';
import { field } from '../../src/lib/primitives/field';
import { group } from '../../src/lib/primitives/group';
import { syncQueryParams, queryParam, type QueryParamsSync, type QueryParamCodec, type QueryParamBinding } from '../../src/lib/router/public-api';

const injector = Injector.create({ providers: [] });
const filters = form({ q: field(''), page: field(1), nested: { active: field(false) } });
const sync = syncQueryParams({
  q: { source: filters.q, defaultValue: '', clearOnDefault: true },
  page: { source: filters.page, defaultValue: 1, history: 'push', injector, codec: queryParam.integer() },
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
syncQueryParams({ page: { source: nullable, codec: queryParam.integer(), defaultValue: null } }, { injector });
const object = field.strict({ id: 1 });
const codec: QueryParamCodec<{ id: number }> = { parse: values => ({ id: Number(values[0]) }), serialize: value => [String(value.id)] };
const binding: QueryParamBinding<{ id: number }> = { source: object, codec };
syncQueryParams({ object: binding }, { injector });

// @ts-expect-error A field's fallback must match its value type.
syncQueryParams({ page: { source: filters.page, defaultValue: 'one' } }, { injector });
// @ts-expect-error A codec must produce the field's value type.
syncQueryParams({ page: { source: filters.page, codec: queryParam.string() } }, { injector });
syncQueryParams({ filters }, { injector });
// @ts-expect-error Readonly signals cannot receive URL imports.
syncQueryParams({ q: signal('').asReadonly() }, { injector });
// @ts-expect-error Computed signals cannot receive URL imports.
syncQueryParams({ q: { source: computed(() => ''), codec: 'string' } }, { injector });
// @ts-expect-error History mode is constrained.
syncQueryParams({ q: { source: filters.q, history: 'append' } }, { injector });

const named = syncQueryParams({
  q: { source: filters.q, codec: 'string' },
  page: { source: filters.page, codec: 'number' },
  nullable: { source: nullable, codec: 'integer', defaultValue: null },
  active: { source: filters.nested.active, codec: 'boolean' },
  tags: { source: field.strict<string[]>([]), codec: 'array' },
  readonlyTags: { source: field.strict<readonly string[]>([]), codec: 'array' },
  optionalTags: { source: field<string[]>(undefined), codec: 'array' },
}, { injector });
const namedRaw: Signal<string | null> = named.params.tags;
void namedRaw;
const namedBinding: QueryParamBinding<string[]> = { source: field.strict<string[]>([]), codec: 'array' };
syncQueryParams({ tags: namedBinding }, { injector });

// @ts-expect-error A named numeric codec does not produce text.
syncQueryParams({ q: { source: filters.q, codec: 'number' } }, { injector });
// @ts-expect-error A named text codec does not produce numbers.
syncQueryParams({ page: { source: filters.page, codec: 'string' } }, { injector });
// @ts-expect-error Repeated strings require an array field.
syncQueryParams({ q: { source: filters.q, codec: 'array' } }, { injector });
// @ts-expect-error A scalar codec cannot read an array field.
syncQueryParams({ tags: { source: field.strict<string[]>([]), codec: 'string' } }, { injector });
// @ts-expect-error Numeric arrays need JSON or a custom codec.
syncQueryParams({ ids: { source: field.strict<number[]>([]), codec: 'array' } }, { injector });
// @ts-expect-error A named codec cannot safely populate a literal-only field.
syncQueryParams({ q: { source: field.strict<'a' | 'b'>('a'), codec: 'string' } }, { injector });
// @ts-expect-error Arbitrary strings need a known codec name or a custom codec object.
syncQueryParams({ page: { source: filters.page, codec: 'xml' } }, { injector });
// @ts-expect-error A mixed scalar field requires a codec that handles both value types.
syncQueryParams({ value: { source: field.strict<string | number>(''), codec: 'number' } }, { injector });

syncQueryParams({ tags: { source: array(field.strict('')), codec: 'array' } }, { injector });

const jsonSync = syncQueryParams({
  object: { source: object, codec: 'json' },
  numbers: { source: field.strict<number[]>([]), codec: 'json' },
  optional: { source: field<{ id: number }>(null), codec: 'json' },
}, { injector });
const rawJson: Signal<string | null> = jsonSync.params.object;
void rawJson;
const typedJson = queryParam.json<{ id: number }>();
const parsedJson: { id: number } = typedJson.parse(['{"id":1}']);
void parsedJson;
syncQueryParams({ object: { source: object, codec: typedJson } }, { injector });
const unknownJson = queryParam.json();
// @ts-expect-error A JSON codec without an expected type returns unknown.
const guessedJson: { id: number } = unknownJson.parse(['{"id":1}']);
void guessedJson;
// @ts-expect-error JSON does not widen the field's default value type.
syncQueryParams({ object: { source: object, codec: 'json', defaultValue: [] } }, { injector });
// @ts-expect-error A typed JSON codec must produce the field's declared value type.
syncQueryParams({ object: { source: object, codec: queryParam.json<number[]>() } }, { injector });

const signalBindings = syncQueryParams({
  q: signal(''),
  page: { source: signal(1), codec: 'integer', defaultValue: 1 },
  linked: linkedSignal(() => 1),
  tags: { source: signal<string[]>([]), codec: 'array' },
  state: { source: signal({ id: 1 }), codec: 'json' },
  nullable: { source: signal<number | null>(null), codec: 'number' },
  field: filters.q,
}, { injector });
const signalRaw: Signal<string | null> = signalBindings.params.page;
void signalRaw;
// @ts-expect-error The source's type determines compatible defaults.
syncQueryParams({ page: { source: signal(1), defaultValue: '1' } }, { injector });
// @ts-expect-error The source's type determines compatible named codecs.
syncQueryParams({ page: { source: signal(1), codec: 'string' } }, { injector });
// @ts-expect-error The source's type determines compatible custom codecs.
syncQueryParams({ page: { source: signal(1), codec: queryParam.string() } }, { injector });
// @ts-expect-error Plain functions are not Angular writable signals.
syncQueryParams({ q: () => '' }, { injector });

const aggregates = syncQueryParams({
  form: { source: filters, codec: 'json' },
  group: { source: group({ enabled: field(false) }), codec: 'json' },
  nested: { source: filters.nested, codec: 'json', defaultValue: { active: true } },
  items: { source: array({ id: field(0) }), codec: 'json' },
  tags: { source: array(field.strict('')), codec: 'array' },
  collision: { source: form({ set: field(''), source: field('') }), codec: 'json' },
}, { injector });
const aggregateRaw: Signal<string | null> = aggregates.params.form;
void aggregateRaw;
// @ts-expect-error Aggregate defaults retain their complete value type.
syncQueryParams({ state: { source: filters, codec: 'json', defaultValue: { q: '' } } }, { injector });
// @ts-expect-error An object aggregate cannot use a scalar codec.
syncQueryParams({ state: { source: filters, codec: 'string' } }, { injector });
// @ts-expect-error Repeated string codecs cannot populate numeric array nodes.
syncQueryParams({ ids: { source: array(field.strict(0)), codec: 'array' } }, { injector });
const inlineSignal: QueryParamBinding<number> = { source: signal(1), codec: 'integer' };
syncQueryParams({ inlineSignal }, { injector });
