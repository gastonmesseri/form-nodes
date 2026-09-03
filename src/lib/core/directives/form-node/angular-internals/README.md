# Angular internals compatibility boundary

Files in this directory isolate behavior that depends on Angular implementation details rather
than its supported public API. Keep this boundary small, structural, and covered by JIT, AOT,
server-rendering, hydration, OnPush, and browser tests.

Re-check these adapters against the latest Angular maintenance release whenever Angular is
upgraded. Prefer a public Angular input-writing API as soon as one can target an existing host
component from a directive.

Every private lookup and write must fail closed: return `false` and leave the rest of the
`[formNode]` binding operational. A changed Angular internal may disable synchronization of an
optional state input, but must not prevent value/event binding or node behavior. Do not suppress
exceptions thrown by consumer-authored input transforms.

When a recognized input cannot be written, warn once per control instance and input name. The
warning must state that the control remains connected, identify the potentially stale state, and
recommend deriving state from a writable `node` signal. Mention `ControlValueAccessor` only as an
alternative for value and disabled interoperability; it does not represent every optional state.
