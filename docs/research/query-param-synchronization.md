# Query parameter synchronization research

Research date: **19 September 2026**. Form Nodes baseline: **4.4.0**, commit `06ebef468afe9a17be3f71156b66e005c9be45c1`.

This is a design investigation, not a shipped API or an implementation commitment. The comparison selects representative libraries for their relevant designs; it does not claim an objective popularity or quality ranking.

The strongest starting point is an optional Angular Router integration with shared write coordination, explicit parsing, and navigation-aware cancellation. nuqs provides the clearest inspected precedent for cancellation of pending URL writes. VueUse and ngxtension provide useful precedents for a small reactive binding API and shared batching. None of those findings alone specifies Form Nodes interaction or validation behavior.

## Evidence scope

Source and test inspection used these exact repository snapshots. Except for Angular, these are default-branch snapshots, which can include unreleased changes. Documentation describes the currently published websites and can differ from a snapshot.

| Project | Inspected revision | Scope |
| --- | --- | --- |
| nuqs | `63011ab82e643a66c1a7d77a69e585c2b8dd71d8` | Queues, navigation adapters, queue reset browser tests, documentation. |
| VueUse | `c738f50c864beebbd4cbd2eee32c2384940e2e78` | `useRouteQuery` implementation and unit tests. |
| ngxtension | `6ad1af4198de986909ab21a883185418cba9087c` | `linkedQueryParam` implementation and integration tests. |
| use-query-params | `f887e72fad1e28532421bf8bf0e34fb8e4b9745c` | Defaults, update queue, router tests. |
| Angular | **v22.1.7**, `f3358f24b884e34d44cfb8ec3db53965153d61e1` | Signal Forms state, control debounce, reset tests, Router navigation cancellation. Latest stable Angular 22 tag resolved from remote tags; later prereleases excluded. |
| TanStack Router, React Router, Vue Router | Current documentation | Search validation, update contracts, and navigation failure semantics only. Their implementations and test suites were not audited. |

Upstream tests were **read, not executed**. Absence of a policy in an inspected helper is not proof that every application using it has the corresponding bug.

## Comparison

| Reference | State and scheduling | History and defaults | Useful lesson |
| --- | --- | --- | --- |
| [nuqs options](https://nuqs.dev/docs/options) | Local state updates immediately; URL writes can be throttled or debounced. | Replaces history by default; push is opt-in. Default-valued parameters are normally removed. | Separate UI/model timing from transport timing. Clearing or confirming input can bypass URL debounce. |
| [VueUse implementation](https://github.com/vueuse/vueuse/blob/c738f50c864beebbd4cbd2eee32c2384940e2e78/packages/router/useRouteQuery/index.ts) | Optimistic ref, shared per-Router queue, one `nextTick` flush. | Replace by default; merges current query and preserves hash. Writing the default removes the parameter. | A small API can still coordinate multiple independent bindings. |
| [ngxtension implementation](https://github.com/ngxtension/ngxtension-platform/blob/6ad1af4198de986909ab21a883185418cba9087c/libs/ngxtension/linked-query-param/src/linked-query-param.ts) | Synchronous signal writes and a shared navigation handler; source-signal support is marked experimental in source. | Merge by default; forwards navigation extras. Does not default `replaceUrl` to true. | Use Angular Router and DI ownership; history replacement is a product choice, not ecosystem consensus. |
| [use-query-params defaults](https://github.com/pbeshai/use-query-params/blob/f887e72fad1e28532421bf8bf0e34fb8e4b9745c/packages/use-query-params/src/options.ts) | Optional experimental batching, disabled by default. | Defaults to `pushIn`: push and merge. Removing defaults is opt-in. | History, merging, and default removal are separate policies. |
| [TanStack Router search parameters](https://tanstack.com/router/latest/docs/framework/react/guide/search-params) | Validates parsed search state through `validateSearch`; supports fallback values or route errors. | Supports explicit middleware for preserving parameters and stripping defaults. | Specify the URL data contract separately from field validation. |

React Router's own [`useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams) explicitly says repeated setter callbacks in one tick do not accumulate like React state updates. A router API alone does not guarantee safe multi-field composition.

## Navigation versus pending edits

nuqs has direct browser tests for pending debounce followed by Back, Back/Forward, and navigation with several queued parameters. They check that old values do not appear on the destination URL. Its reset operation aborts debounce queues and the throttle queue. This is stronger evidence than merely documenting bidirectional synchronization. [Browser tests](https://github.com/47ng/nuqs/blob/63011ab82e643a66c1a7d77a69e585c2b8dd71d8/packages/e2e/shared/specs/popstate-queue-reset.spec.ts), [queue reset](https://github.com/47ng/nuqs/blob/63011ab82e643a66c1a7d77a69e585c2b8dd71d8/packages/nuqs/src/lib/queues/reset.ts).

That guarantee still depends on the adapter. The inspected Next App Router adapter explicitly leaves pending work intact for external `history.replaceState()` calls on the same pathname, because those calls cannot reliably be distinguished from Next's own follow-up history updates. It separately handles popstate, external push, and pathname changes. We should not describe this as a universal rule that every navigation cancels every pending update. [Adapter implementation](https://github.com/47ng/nuqs/blob/63011ab82e643a66c1a7d77a69e585c2b8dd71d8/packages/nuqs/src/adapters/next/impl.app.ts).

VueUse's inspected helper watches incoming parameter changes and writes through a queued Router call. It contains no explicit cancellation of that queue on navigation and does not process the navigation result. Its tests cover immediate state, several parameter writes, incoming changes, disposal, null/undefined, and preservation of other parameters and the fragment; they do not establish the same delayed-write cancellation guarantee. [Tests](https://github.com/vueuse/vueuse/blob/c738f50c864beebbd4cbd2eee32c2384940e2e78/packages/router/useRouteQuery/index.test.ts).

ngxtension's inspected handler batches parameters, calls `navigate()`, and clears its accumulators when the promise resolves. It has no dedicated navigation-event cancellation or optimistic-state rollback policy in that handler. Its tests exercise coalescing, parsing, source signals, dynamic keys, and initialization, but do not establish recovery from a guard rejecting a write. [Tests](https://github.com/ngxtension/ngxtension-platform/blob/6ad1af4198de986909ab21a883185418cba9087c/libs/ngxtension/linked-query-param/src/linked-query-param.spec.ts).

use-query-params folds queued changes into the preceding calculated search string and selects the last update's adapter and navigation mode. This is evidence for composition of updates, not a general cancellation protocol for long-lived external debounce timers. [Queue implementation](https://github.com/pbeshai/use-query-params/blob/f887e72fad1e28532421bf8bf0e34fb8e4b9745c/packages/use-query-params/src/updateSearchString.ts), [router tests](https://github.com/pbeshai/use-query-params/blob/f887e72fad1e28532421bf8bf0e34fb8e4b9745c/packages/use-query-params/src/__tests__/routers/shared.tsx).

## Requested navigation is not accepted navigation

Vue Router distinguishes navigation aborted by a guard, superseded by another navigation, and duplicated navigation. Its promise result can represent failure rather than success. [Navigation failures](https://router.vuejs.org/guide/advanced/navigation-failures.html).

Angular v22.1.7 similarly cancels superseded navigation and handles guard rejection. The integration tests explicitly cover a new navigation during guard execution. A field binding must distinguish its own write acknowledgment from external navigation and cannot assume that calling `navigate()` commits the requested URL. [Router implementation](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/router/src/navigation_transition.ts), [navigation tests](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/router/test/integration/navigation.spec.ts).

## Proposed Form Nodes behavior

These are recommendations derived from the evidence, not claims about existing APIs or universal library behavior.

| Concern | Recommended contract |
| --- | --- |
| Placement | Optional Router helper or entry point accepting existing fields. Keep ordinary `field()` and `form()` usable without DI. A binding needs an Angular routing context or explicit injector and releases its work on disposal. |
| Initial state | A present, successfully parsed URL value takes precedence. An absent parameter uses a declared binding fallback, defaulting to a captured initial field value. Do not use the last edited value as the fallback, which would make identical URLs restore different states. |
| Incoming accepted state | Apply a programmatic field write, preserving dirty/touched, updating control and committed values, and retaining ordinary validation and ancestor propagation. Do not call reset merely because a URL changed. |
| Outgoing state | Publish committed field data. Follow the repository rule for infrastructure: use `$api._value()` across node boundaries. Do not accidentally serialize pending control text or an equality-filtered exposed snapshot. |
| Debounce | Reuse field debounce for control-to-model commits. Batch URL patches without adding another typing delay by default. A future URL throttle/debounce is a separate transport feature and must not silently postpone validation. |
| History | Replace for continuous edits by default. Allow explicit push for meaningful navigation steps. Preserve unrelated query parameters and the fragment. |
| Batching | Use a coordinator scoped to the Router, with ownership per binding. Accumulate key patches, use the current accepted URL when constructing a write, and define deterministic behavior for duplicate keys and incompatible history options. |
| Equality and loops | Distinguish field-value equality from serialized-parameter equality. Avoid redundant navigations and do not echo incoming URL writes back out. |
| Parsing | Distinguish absent, empty, malformed, and repeated parameters. Support explicit codecs and fallback rules. A successfully parsed but business-invalid value should still use normal field validators. |
| Default removal | Make omission of default-valued parameters explicit and configurable. It produces shorter URLs but changes their interpretation when application defaults change. |
| Reset | Preserve existing semantics: `reset()` keeps values; `resetToInitial()` restores the field's captured baseline. Binding must not silently redefine that baseline. Serialize actual resulting value changes normally. |
| Failure | Preserve entered field data if an outbound navigation fails; expose synchronization failure independently of field validity and validation pending state. Avoid automatic retry loops. |

### Refined conflict policy

The initial suggestion that navigation always wins needs a more precise boundary:

1. On an external navigation attempt, suspend outbound writes so a debounce callback cannot start a competing navigation. Preserve the draft until the navigation outcome is known.
2. On accepted history restoration or a conflicting incoming parameter change, invalidate obsolete writes and import the accepted value. History restoration must be able to discard pending control text even when the committed value is already equal to the restored value.
3. On navigation to another page, dispose or invalidate work owned by the old binding so it cannot leak into the destination.
4. On a rejected external navigation, retain the draft. Resume according to the binding's scheduling policy without treating the rejected destination as accepted state.
5. Treat successful writes from the binding as acknowledgments, tagged with their originating revision. An acknowledgment for an older value must not overwrite newer edits or cancel their control debounce.
6. For an unrelated parameter update on the same page, preserve this binding's draft when its accepted parameter has not changed. History restoration is an explicit exception. This scoped policy is a Form Nodes design recommendation, not a consensus established by all inspected libraries.

Use navigation identity and a monotonically increasing binding revision to implement this distinction. Equality checks alone cannot distinguish an old acknowledgment, unrelated navigation, and deliberate history restoration.

### Angular Signal Forms alignment

Angular v22.1.7 separates interaction state from the model and has explicit reset operations. Its control debounce tests cover direct model replacement while async control work is pending. Reset clears interaction state and therefore has different semantics from ordinary URL hydration. [Field state](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/forms/signals/src/field/state.ts), [field node](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/forms/signals/src/field/node.ts), [field tests](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/forms/signals/test/node/field_node.spec.ts), [debounce tests](https://github.com/angular/angular/blob/f3358f24b884e34d44cfb8ec3db53965153d61e1/packages/forms/signals/test/node/api/debounce.spec.ts).

Locally, [FieldNode.set](../../src/lib/primitives/field-node.ts) already cancels pending control work, synchronizes committed/control values, and preserves interaction state. Consequently, applying every own navigation acknowledgment through `set()` would be harmful: it could cancel a newer in-progress edit even when the acknowledged value equals the committed value. This is an integration concern beyond basic two-way signal binding.

## Acceptance cases for an implementation

| Scenario | Required observable result |
| --- | --- |
| Initial URL includes a typed value; absent, empty, repeated, or malformed variants | Deterministic parsing/fallback with no mount-time navigation loop. |
| Type several values under field debounce | Control changes immediately; model validation and URL publication follow the committed value; no extra typing delay. |
| Two fields change together, including inside a nested form | One composed navigation retains both values, unrelated parameters, and the fragment. |
| Back/Forward during timed or custom async control debounce | Accepted historical state wins; stale callbacks cannot change the field or URL afterward. |
| History restores an equal committed value while control text differs | Pending text is discarded without resetting dirty/touched. |
| An older own navigation completes while newer input is pending | Newer control text and its debounce survive. |
| Another binding updates an unrelated key | Existing draft survives; no field-to-URL echo. |
| An external navigation is rejected, redirected, or superseded | Only the final accepted destination is imported; rejected attempts do not erase the draft. |
| An outbound URL write is rejected or throws | Entered data survives, synchronization failure is observable, and no automatic retry loop starts. |
| Unmount, rebind, or route destruction with pending work | No old writes, retained subscriptions, or updates on the destination page. |
| Programmatic set, reset, resetToInitial, disable, and re-enable | Existing field/form contracts remain intact; sync policy does not silently erase values or redefine baselines. |
| Incoming state changes while async validation is pending | Validator triggers, cancellation counts, pending/errors, and ancestor validity follow the ordinary public field/form rules. |
| SSR and hydration | Server and browser agree on initial parsed state; server execution does not schedule browser history writes. |

The minimum useful first implementation is static field-to-key binding with codecs, replace/push, preservation of other parameters, shared batching, lifecycle cleanup, and tested navigation conflict handling. Dynamic keys and independent URL rate limiting can follow once this contract is stable.

## Verification

Executed `npm test -- src/lib/primitives/field.spec.ts src/lib/primitives/form.spec.ts`: **2 files, 594 tests passed**. This verifies the existing local behavioral baseline, not the proposed integration or upstream libraries. No source, public API, consumer examples, build configuration, or generated output changed in this research task.
