type ValidityRoot = Document | ShadowRoot;
type TrackedValidityRoot = { readonly style: HTMLStyleElement; references: number };

const trackedRoots = new WeakMap<ValidityRoot, TrackedValidityRoot>();

const createValidityStyle = (root: ValidityRoot, nonce?: string): HTMLStyleElement => {
  const document = root instanceof Document ? root : root.ownerDocument;
  const style = document.createElement('style');
  if (nonce) style.nonce = nonce;
  style.textContent = `
    @keyframes form-node-valid {}
    @keyframes form-node-invalid {}
    input:valid, textarea:valid { animation: form-node-valid 0.001s; }
    input:invalid, textarea:invalid { animation: form-node-invalid 0.001s; }
  `;
  if (root instanceof Document) root.head?.appendChild(style);
  else root.appendChild(style);
  return style;
};

/** Whether the native control can change bad-input validity without dispatching an input event. */
export const nativeInputRequiresValidityTracking = (input: HTMLInputElement): boolean => {
  return input.type === 'date'
    || input.type === 'datetime-local'
    || input.type === 'month'
    || input.type === 'time'
    || input.type === 'week';
};

/** Observes browser validity transitions that may happen without a native input event. */
export const watchNativeInputValidity = (
  input: HTMLInputElement,
  callback: () => void,
  nonce?: string,
): (() => void) => {
  if (typeof AnimationEvent !== 'function') return () => { };
  const root = input.getRootNode() as ValidityRoot;
  let tracked = trackedRoots.get(root);
  if (!tracked) {
    tracked = { style: createValidityStyle(root, nonce), references: 0 };
    trackedRoots.set(root, tracked);
  }
  tracked.references++;

  const onAnimationStart = (event: Event) => {
    const name = (event as AnimationEvent).animationName;
    if (name === 'form-node-valid' || name === 'form-node-invalid') callback();
  };
  input.addEventListener('animationstart', onAnimationStart);
  let watching = true;
  return () => {
    if (!watching) return;
    watching = false;
    input.removeEventListener('animationstart', onAnimationStart);
    tracked.references--;
    if (tracked.references !== 0) return;
    tracked.style.remove();
    trackedRoots.delete(root);
  };
};
