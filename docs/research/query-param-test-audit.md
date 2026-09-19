# Query parameter synchronization test audit

Audit date: **19 September 2026**. This follows the [design investigation](query-param-synchronization.md).
The goal is to reuse relevant regression scenarios through the Form Nodes public API. It is not
an assertion of compatibility with every upstream API, a verbatim copy of their suites, or proof
that every possible race has been eliminated. Upstream tests were read, not executed; the adapted
local tests are executed with this repository's tooling.

## Pinned references

These are the same snapshots used for the design investigation. The non-Angular snapshots can
include unreleased changes. Angular's latest stable 22 release was resolved again from remote tags.

| Project | Revision | Primary test sources |
| --- | --- | --- |
| nuqs | `63011ab82e643a66c1a7d77a69e585c2b8dd71d8` | [Hook, parser, queue, and encoding tests](https://github.com/47ng/nuqs/tree/63011ab82e643a66c1a7d77a69e585c2b8dd71d8/packages/nuqs/src), [shared browser scenarios](https://github.com/47ng/nuqs/tree/63011ab82e643a66c1a7d77a69e585c2b8dd71d8/packages/e2e/shared/specs). |
| VueUse | `c738f50c864beebbd4cbd2eee32c2384940e2e78` | [`useRouteQuery/index.test.ts`](https://github.com/vueuse/vueuse/blob/c738f50c864beebbd4cbd2eee32c2384940e2e78/packages/router/useRouteQuery/index.test.ts). |
| ngxtension | `6ad1af4198de986909ab21a883185418cba9087c` | [`linked-query-param.spec.ts`](https://github.com/ngxtension/ngxtension-platform/blob/6ad1af4198de986909ab21a883185418cba9087c/libs/ngxtension/linked-query-param/src/linked-query-param.spec.ts). |
| use-query-params | `f887e72fad1e28532421bf8bf0e34fb8e4b9745c` | [Hook/provider/router tests](https://github.com/pbeshai/use-query-params/tree/f887e72fad1e28532421bf8bf0e34fb8e4b9745c/packages/use-query-params/src/__tests__), [serialization tests](https://github.com/pbeshai/use-query-params/tree/f887e72fad1e28532421bf8bf0e34fb8e4b9745c/packages/serialize-query-params/src/__tests__). |
| Angular | **v22.1.7**, `f3358f24b884e34d44cfb8ec3db53965153d61e1` | [Control debounce](https://github.com/angular/angular/blob/v22.1.7/packages/forms/signals/test/node/api/debounce.spec.ts), [field nodes](https://github.com/angular/angular/blob/v22.1.7/packages/forms/signals/test/node/field_node.spec.ts), [Router navigation](https://github.com/angular/angular/blob/v22.1.7/packages/router/test/integration/navigation.spec.ts), [URL serialization](https://github.com/angular/angular/blob/v22.1.7/packages/router/test/url_serializer.spec.ts). |

The Angular implementation checks used `packages/forms/signals/src/field/node.ts`,
`packages/router/src/navigation_transition.ts`, and `packages/router/src/url_tree.ts`. Pending
control work must be invalidated by model replacement; dirty/touched and validation remain governed
by the existing node operations. Accepted, rejected, superseded, and redirected navigations are
separate outcomes. Query defaults, write batching, and equal-value history restoration are Form
Nodes integration contracts rather than Angular Signal Forms APIs.

## Local test locations

| Label | File | Role |
| --- | --- | --- |
| Core | [`sync-query-params.spec.ts`](../../src/lib/router/sync-query-params.spec.ts) | Existing deterministic navigation, ownership, signal/node, and error scenarios. |
| Codecs | [`query-param-codec.spec.ts`](../../src/lib/router/query-param-codec.spec.ts) | Scalar, repeated-array, JSON, malformed-input, and serializer contracts. |
| Adapted | [`sync-query-params.upstream.spec.ts`](../../src/lib/router/sync-query-params.upstream.spec.ts) | Added cross-library regressions, shared field/signal matrix, and generated Unicode round trips. |
| Browser | [`sync-query-params.browser.spec.ts`](../../src/lib/router/sync-query-params.browser.spec.ts) | Existing real Router, guard, redirect, history, array/JSON, and mixed-source integration. |
| Adapted browser | [`sync-query-params.upstream.browser.spec.ts`](../../src/lib/router/sync-query-params.upstream.browser.spec.ts) | Added history traversal, conditional components, late debounce completion, and model signal integration. |
| Primitives | [`field.spec.ts`](../../src/lib/primitives/field.spec.ts), [`form.spec.ts`](../../src/lib/primitives/form.spec.ts) | Public state, interaction, validation, and nested control-debounce transitions. |

The additions comprise **34 helper tests, 4 primitive tests, and 7 Chromium tests**. The helper
suite includes a deterministic property test with **100 generated Unicode key/repeated-value
cases** (seed `20260919`), plus explicit delimiter, literal percent, space, and Unicode examples.
Existing scenarios are retained rather than duplicated solely to increase the count.

## Scenario mapping

Upstream filenames below are relative to the directories linked above. Rows identify behavioral
families; platform-specific variants and different signatures are consolidated where they share
one observable contract.

| Upstream evidence | Form Nodes coverage | Adaptation or difference |
| --- | --- | --- |
| nuqs `useQueryState.browser.test.tsx`, `useQueryStates.browser.test.tsx`, `basic-io.spec.ts`; VueUse initialization/default tests; ngxtension default/parse tests | Core and Codecs; Adapted `captures … before hydration` for field/signal with null, undefined, zero, and nonzero fallbacks | Initial URL wins synchronously; absence or malformed input restores a fixed captured fallback; registration does not navigate. |
| nuqs defaults and `clearOnDefault`; VueUse default removal; use-query-params default configuration | Core `shares a coordinator…`, `does not echo noncanonical…`, `distinguishes JSON empty arrays…` | Default removal is opt-in and compares serialized values. JSON property order is significant. |
| VueUse null/undefined transformation tests; nuqs clearing tests; use-query-params null/undefined serialization | Adapted `removes only the bound key…`; Core nullable/custom-null/JSON cases; Codecs | Outgoing null/undefined removes the key; its acknowledgment preserves the local value. Later URL absence restores the fixed fallback. |
| nuqs multi-update sequencing; ngxtension coalescing; use-query-params functional updates and `JsonParam` updates | Adapted `composes functional updates…`, `composes JSON functional updates…` for field/form/signal; Core mixed-source batching | Source callbacks accumulate synchronously, followed by one microtask URL batch. JSON updates retain sibling properties. |
| nuqs `stitching.spec.ts`, queue tests; VueUse multiple simultaneous refs; ngxtension multiple parameters | Adapted `serializes staggered batches…`; Core older acknowledgment, reverting-to-in-flight, and multi-helper tests | One coordinator per Router serializes navigation and preserves newer revisions. |
| nuqs `push.spec.ts`; VueUse push/replace options; use-query-params router updates | Adapted `applies history overrides…`; Adapted browser `replays push entries…`; Core replace/push batching | Only changed entries influence batch history. Back and Forward restore both page and search values. |
| nuqs `hash-preservation.spec.ts`, `key-isolation.spec.ts`, `repro-982.spec.ts`; VueUse unrelated query/hash tests | Adapted malformed repeated scalar preservation, stable parsed/raw state, delimiter and generated encoding tests; Core merges | Scalar repetition is rejected here, not reduced to its first item. Updating a different key still preserves the repeated raw URL data. |
| nuqs `native-array.spec.ts`, array-boundary cases in hook tests; use-query-params array serialization | Adapted four comma/empty/repeated transition cases; Codecs and existing Browser repeated-array round trips | Repeated keys preserve order, duplicates, and empty strings. Commas are data; `[]` removes the key. |
| nuqs `json.spec.ts`; use-query-params object/JSON serialization and functional updates | Codecs, Core JSON cases, Adapted JSON update matrix, existing Browser JSON history | Native JSON syntax/coercion only; no implicit schema validation. JSON `[]` remains a value. |
| nuqs `lib/url-encoding.browser.test.ts`, `pretty-urls.spec.ts` | Adapted explicit delimiter/percent/Unicode and generated Unicode round trips | Assert decoded semantics, isolation, and fragment preservation; Angular controls the exact escaped URL spelling. |
| nuqs `constructor`/`hasOwnProperty` hook tests | Adapted `round trips scalar and repeated values under the key…`; Core helper-method-name collisions | `constructor` and `toString` work; Angular serializer limitations below prevent claiming all upstream reserved names work. |
| VueUse same-value and `computed` invalidation tests; use-query-params memoization/decode counts; nuqs equality/key isolation | Adapted `keeps structured values, derived computations, and raw keys stable…`; Core signal equality/same-reference/linked dependencies | Unrelated or fragment-only navigation does not reparse or invalidate unchanged keys. History intentionally restores even an equal committed value to discard pending input. |
| nuqs `conditional-rendering.spec.ts`, `life-and-death.spec.ts`, `queue-lifecycle.spec.ts`, `repro-1273.spec.ts`; VueUse scope disposal | Adapted unsubscribe/reconnect and independent Router ownership; Adapted browser conditional mounting and route recreation; Core pending/in-flight owner cleanup | Connections hydrate accepted state on creation and freeze after cleanup. Duplicate active writers are rejected; nuqs multi-subscriber sharing is not copied. |
| nuqs `popstate-queue-reset.spec.ts`, `flush-after-navigate.spec.ts` | Added field/form timed and promise debounce tests; Adapted browser Back/Forward, same-page conflicts, and departure; Core queued/in-flight cancellation | Node control debounce supplies delayed work. Restoration cancels stale work, preserves dirty/touched, updates validation, and accepts fresh input afterward. |
| nuqs navigation and queue race tests | Adapted browser `preserves a pending edit…`; Core own acknowledgment and unrelated-key tests | Same-page imperative navigation preserves drafts on unchanged keys; history restoration is deliberately stronger. |
| nuqs late-subscriber and URL-update regressions; ngxtension explicit-injector/`ngOnInit`/source tests | Adapted browser Angular `model()` with explicit injector after construction; Core initial activation URL, linkedSignal, and plain signals | Initial hydration precedes consumer use; subsequent model outputs occur once per accepted write with no URL echo. |
| use-query-params SSR tests | Core `hydrates on the server…` for nodes and writable signals | SSR reads the URL but schedules no outbound navigation. No React server rendering adapter is introduced. |
| Angular Router guards, redirects, cancellation, and supersession | Existing Browser guard/redirect/route-destruction tests; Core rejection/throw/rejected promise, redirected acknowledgment, navigation suspension, and skipped history tests | Preserve entered data on failure, report once, and avoid automatic retries. Redirect destinations become accepted state. |
| Angular Signal Forms direct model replacement during debounce, field/reset/state propagation | Added field/form regressions plus existing primitive and Core async validation, reset, disabled, aggregate equality, node owner, group, and array tests | URL import calls the existing node setter. It does not reset interaction or the initial reset baseline, and it publishes committed rather than draft data. |

## Deliberate exclusions

- React rendering lanes, Suspense, Activity, abandoned-render recovery, hook render counts, stable
  hook setter references, Next.js shallow routing, loaders, scroll restoration, and framework
  adapters are not APIs of this Angular helper. This includes the React-specific mechanisms in
  nuqs `repro-1444`, `repro-1501`, and discarded-reconciliation/mutation tests. Their broader
  late-work and remount risks are exercised through Angular navigation and component destruction;
  that is not a claim of equivalent framework coverage.
- nuqs supports multiple writers/subscribers for the same key. Form Nodes rejects duplicate active
  bindings; several helpers with distinct keys share a coordinator. Conditional component tests
  release the old key before reconnecting it.
- Reactive defaults/options, changing the bound key after registration, provider inheritance,
  per-setter URL options, custom adapter APIs, setter promise identity, queue throttle intervals,
  and React cache/loader utilities have no corresponding public contract here. Control debounce
  is tested on nodes; it is not an implementation of nuqs URL throttling.
- Unsupported upstream codecs (dates, enums, CSV, schemas, and other framework-specific parameter
  types) are not added by copying tests. Existing custom-codec and runtime error tests cover the
  extension point. Number/boolean parsing remains stricter than permissive upstream parsers.
- In-place mutation without an accepted signal/node notification is not an observable write.
  Existing same-reference notification tests cover deliberately permissive signal equality.
- Native `window.history.pushState` interception is not promised. Tests navigate through Angular
  Router and its location events. Raw URL snapshots follow accepted state, not optimistic source
  edits. A rejected write leaves those snapshots unchanged.

## Compatibility finding and test boundaries

The installed development baseline is **Angular 21.0.7**. Its `DefaultUrlSerializer` calls
`params.hasOwnProperty(...)` while reading query keys. A URL such as
`/search?hasOwnProperty=one&keep=yes` fails before synchronization can hydrate a source, because
that key overwrites the method. Repeated `hasOwnProperty` keys have the same problem. This was
observed while adapting the nuqs reserved-key cases; it is not a helper parser failure.

Angular **v22.1.7** instead calls `Object.hasOwn(...)` in
[`parseQueryParam`](https://github.com/angular/angular/blob/v22.1.7/packages/router/src/url_tree.ts).
Both inspected serializers still build ordinary query objects: `__proto__` is not retained as an
ordinary own query property. The existing local reserved-name test records that limitation.
Generated key tests exclude these known unsupported names on the baseline, as well as their
reserved fixture key. No custom parser or Angular monkey patch is introduced to hide the boundary.

The deterministic helper fixture uses Angular URL serialization but explicitly controls navigation
outcomes; it is useful for races that are hard to schedule reliably. Browser tests run real Angular
components, directives, guards, and Router in Chromium with `RouterTestingHarness` and
`provideLocationMocks()`. Back/Forward uses Angular's mock location history, not the browser's
native history stack. Timed node tests use Vitest's fake clock; promise tests explicitly release
stale work. These layers complement one another and do not constitute a full browser/Angular-version
matrix. Angular 22 source inspection is distinct from executing these tests on Angular 21.0.7.

## Verification

The focused command is:

```sh
npx vitest run src/lib/router/sync-query-params.upstream.spec.ts src/lib/router/sync-query-params.spec.ts src/lib/router/query-param-codec.spec.ts src/lib/primitives/field.spec.ts src/lib/primitives/form.spec.ts
```

It discovers five files and **739 tests**. The adapted Chromium file discovers **7 tests**.
Repository verification additionally runs `npm run typecheck` (including lint and public type,
template, and JSDoc checks), `npm run test:coverage`, and `npm run test:browser` (which starts with
`npm run build` and includes the production AOT browser suite). The serializer documentation
clarification is checked with `npm run docs:typecheck` followed by `npm run docs:build`.

All of those checks passed for this audit. The complete unit run discovered **2,038 tests in
118 files**; Chromium discovered **336 integration tests plus 11 production AOT tests**.
Router integration files achieved **100% statements, branches, functions, and lines**. Repository
coverage was 100% statements/functions/lines and 99.32% branches. The documentation build emitted
Node's experimental localStorage warning but completed successfully. No production
implementation changes were needed to satisfy the adapted contracts.

## Upstream attribution

The scenarios have been rewritten for Form Nodes. The following notices are retained for the
upstream tests and data consulted or adapted. Angular is a behavioral reference; its source and
test implementation is not copied into these additions.

### nuqs

```text
MIT License

Copyright (c) 2020 François Best <contact@francoisbest.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### vueuse

```text
MIT License

Copyright (c) 2019-PRESENT Anthony Fu<https://github.com/antfu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ngxtension

```text
MIT License

Copyright (c) 2023 Chau Tran

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### use-query-params

```text
ISC License

Copyright 2019-present Peter Beshai <peter.beshai@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
