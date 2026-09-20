import { Injector, signal, computed, linkedSignal, type Signal } from '@angular/core';

import { form } from '../../src/lib/primitives/form';
import { array } from '../../src/lib/primitives/array';
import { field } from '../../src/lib/primitives/field';
import { group } from '../../src/lib/primitives/group';
import { syncQueryParams, queryParam, type QueryParamsSync, type QueryParamCodec, type QueryParamSerializer, type QueryParamBinding } from '../../src/lib/router/public-api';

const injector = Injector.create({ providers: [] });
const filters = form({ q: field(''), page: field(1), nested: { active: field(false) } });
const sync = syncQueryParams({
  q: { source: filters.q, defaultValue: '', clearOnDefault: true },
  page: { source: filters.page, defaultValue: 1, history: 'push', injector, serializer: queryParam.integer() },
  active: filters.nested.active,
}, { injector, onError(error) { const phase: 'parse' | 'serialize' | 'navigation' = error.phase; return phase; } });
const typed: QueryParamsSync<'q' | 'page' | 'active'> = sync;
const rawPage: Signal<string | null> = sync.params.page;
const pending: Signal<boolean> = sync.pending;
const closed: Signal<boolean> = sync.closed;
void [typed, rawPage, pending, closed];
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
syncQueryParams({ page: { source: nullable, serializer: queryParam.integer(), defaultValue: null } }, { injector });
const object = field.strict({ id: 1 });
const serializer: QueryParamSerializer<{ id: number }> = { parse: values => ({ id: Number(values[0]) }), serialize: value => [String(value.id)] };
const binding: QueryParamBinding<{ id: number }> = { source: object, serializer };
syncQueryParams({ object: binding }, { injector });

// @ts-expect-error A field's fallback must match its value type.
syncQueryParams({ page: { source: filters.page, defaultValue: 'one' } }, { injector });
// @ts-expect-error A serializer must produce the field's value type.
syncQueryParams({ page: { source: filters.page, serializer: queryParam.string() } }, { injector });
syncQueryParams({ filters }, { injector });
// @ts-expect-error Readonly signals cannot receive URL imports.
syncQueryParams({ q: signal('').asReadonly() }, { injector });
// @ts-expect-error Computed signals cannot receive URL imports.
syncQueryParams({ q: { source: computed(() => ''), serializer: 'string' } }, { injector });
// @ts-expect-error History mode is constrained.
syncQueryParams({ q: { source: filters.q, history: 'append' } }, { injector });

const named = syncQueryParams({
  q: { source: filters.q, serializer: 'string' },
  page: { source: filters.page, serializer: 'number' },
  nullable: { source: nullable, serializer: 'integer', defaultValue: null },
  active: { source: filters.nested.active, serializer: 'boolean' },
  tags: { source: field.strict<string[]>([]), serializer: 'array' },
  readonlyTags: { source: field.strict<readonly string[]>([]), serializer: 'array' },
  optionalTags: { source: field<string[]>(undefined), serializer: 'array' },
}, { injector });
const namedRaw: Signal<string | null> = named.params.tags;
void namedRaw;
const namedBinding: QueryParamBinding<string[]> = { source: field.strict<string[]>([]), serializer: 'array' };
syncQueryParams({ tags: namedBinding }, { injector });

// @ts-expect-error A named numeric serializer does not produce text.
syncQueryParams({ q: { source: filters.q, serializer: 'number' } }, { injector });
// @ts-expect-error A named text serializer does not produce numbers.
syncQueryParams({ page: { source: filters.page, serializer: 'string' } }, { injector });
// @ts-expect-error Repeated strings require an array field.
syncQueryParams({ q: { source: filters.q, serializer: 'array' } }, { injector });
// @ts-expect-error A scalar serializer cannot read an array field.
syncQueryParams({ tags: { source: field.strict<string[]>([]), serializer: 'string' } }, { injector });
// @ts-expect-error Numeric arrays need JSON or a custom serializer.
syncQueryParams({ ids: { source: field.strict<number[]>([]), serializer: 'array' } }, { injector });
// @ts-expect-error A named serializer cannot safely populate a literal-only field.
syncQueryParams({ q: { source: field.strict<'a' | 'b'>('a'), serializer: 'string' } }, { injector });
// @ts-expect-error Arbitrary strings need a known serializer name or a custom serializer object.
syncQueryParams({ page: { source: filters.page, serializer: 'xml' } }, { injector });
// @ts-expect-error A mixed scalar field requires a serializer that handles both value types.
syncQueryParams({ value: { source: field.strict<string | number>(''), serializer: 'number' } }, { injector });

syncQueryParams({ tags: { source: array(field.strict('')), serializer: 'array' } }, { injector });

const jsonSync = syncQueryParams({
  object: { source: object, serializer: 'json' },
  numbers: { source: field.strict<number[]>([]), serializer: 'json' },
  optional: { source: field<{ id: number }>(null), serializer: 'json' },
}, { injector });
const rawJson: Signal<string | null> = jsonSync.params.object;
void rawJson;
const typedJson = queryParam.json<{ id: number }>();
const parsedJson: { id: number } = typedJson.parse(['{"id":1}']);
void parsedJson;
syncQueryParams({ object: { source: object, serializer: typedJson } }, { injector });
const unknownJson = queryParam.json();
// @ts-expect-error A JSON serializer without an expected type returns unknown.
const guessedJson: { id: number } = unknownJson.parse(['{"id":1}']);
void guessedJson;
// @ts-expect-error JSON does not widen the field's default value type.
syncQueryParams({ object: { source: object, serializer: 'json', defaultValue: [] } }, { injector });
// @ts-expect-error A typed JSON serializer must produce the field's declared value type.
syncQueryParams({ object: { source: object, serializer: queryParam.json<number[]>() } }, { injector });

const signalBindings = syncQueryParams({
  q: signal(''),
  page: { source: signal(1), serializer: 'integer', defaultValue: 1 },
  linked: linkedSignal(() => 1),
  tags: { source: signal<string[]>([]), serializer: 'array' },
  state: { source: signal({ id: 1 }), serializer: 'json' },
  nullable: { source: signal<number | null>(null), serializer: 'number' },
  field: filters.q,
}, { injector });
const signalRaw: Signal<string | null> = signalBindings.params.page;
void signalRaw;
// @ts-expect-error The source's type determines compatible defaults.
syncQueryParams({ page: { source: signal(1), defaultValue: '1' } }, { injector });
// @ts-expect-error The source's type determines compatible named serializers.
syncQueryParams({ page: { source: signal(1), serializer: 'string' } }, { injector });
// @ts-expect-error The source's type determines compatible custom serializers.
syncQueryParams({ page: { source: signal(1), serializer: queryParam.string() } }, { injector });
// @ts-expect-error Plain functions are not Angular writable signals.
syncQueryParams({ q: () => '' }, { injector });

const aggregates = syncQueryParams({
  form: { source: filters, serializer: 'json' },
  group: { source: group({ enabled: field(false) }), serializer: 'json' },
  nested: { source: filters.nested, serializer: 'json', defaultValue: { active: true } },
  items: { source: array({ id: field(0) }), serializer: 'json' },
  tags: { source: array(field.strict('')), serializer: 'array' },
  collision: { source: form({ set: field(''), source: field('') }), serializer: 'json' },
}, { injector });
const aggregateRaw: Signal<string | null> = aggregates.params.form;
void aggregateRaw;
// @ts-expect-error Aggregate defaults retain their complete value type.
syncQueryParams({ state: { source: filters, serializer: 'json', defaultValue: { q: '' } } }, { injector });
// @ts-expect-error An object aggregate cannot use a scalar serializer.
syncQueryParams({ state: { source: filters, serializer: 'string' } }, { injector });
// @ts-expect-error Repeated string serializers cannot populate numeric array nodes.
syncQueryParams({ ids: { source: array(field.strict(0)), serializer: 'array' } }, { injector });
const inlineSignal: QueryParamBinding<number> = { source: signal(1), serializer: 'integer' };
syncQueryParams({ inlineSignal }, { injector });

syncQueryParams({
  query: filters.q,
  page: { source: signal<number | null>(null), serializer: 'integer' },
  state: { source: filters, serializer: 'json' },
  tags: { source: array(field.strict('')), serializer: 'array' },
}, {
  injector,
  onInitialUrlSync(event) {
    const reason: 'initial' = event.reason;
    const query: string | null | undefined = event.values.query;
    const page: number | null = event.values.page;
    const state: ReturnType<typeof filters> = event.values.state;
    const tags: string[] = event.values.tags;
    void [reason, query, page, state, tags];
    // @ts-expect-error Only configured query names are present.
    event.values.q;
    // @ts-expect-error Parsed numeric values retain nullability.
    const nonNullable: number = event.values.page;
    void nonNullable;
    // @ts-expect-error Payload snapshots are readonly.
    event.values.page = 3;
    // @ts-expect-error Payload reasons are readonly.
    event.reason = 'initial';
  },
  onUrlSync(event) {
    const reason: 'initial' | 'navigation' = event.reason;
    const page: number | null = event.values.page;
    // @ts-expect-error General callbacks also include subsequent navigation.
    const initial: 'initial' = event.reason;
    void [reason, page, initial];
  },
});

// Deprecated aliases retain the same type restrictions and remain assignable.
const legacyCodec: QueryParamCodec<number> = queryParam.integer();
const preferredSerializer: QueryParamSerializer<number> = legacyCodec;
const legacyBinding: QueryParamBinding<number> = { source: signal(1), codec: legacyCodec };
syncQueryParams({ page: legacyBinding }, { injector });
syncQueryParams({ page: { source: signal(1), serializer: preferredSerializer, codec: 'integer' } }, { injector });
// @ts-expect-error The deprecated name still checks custom output types.
syncQueryParams({ page: { source: signal(1), codec: queryParam.string() } }, { injector });
// @ts-expect-error The deprecated name still checks named serializers.
syncQueryParams({ page: { source: signal(1), codec: 'string' } }, { injector });
// @ts-expect-error Supplying the new name does not widen the legacy option's type.
syncQueryParams({ page: { source: signal(1), serializer: 'integer', codec: 'string' } }, { injector });
