import { DestroyRef, afterEveryRender, inject } from '@angular/core';

import { attempt } from '../utils/attempt';
import type { ControlState, ControlStateError } from '../form-node-state/form-node-state';

/** Context supplied once to the projected #message template when visible messages exist. */
export type FormNodeErrorsContext = {
  /** First visible resolved message, available through let-message. */
  readonly $implicit: string;
  /** Named alias of the first visible resolved message. */
  readonly message: string;
  /** Visible resolved messages, after filtering and maxMessages. */
  readonly messages: readonly string[];
  /** Error details corresponding to the visible messages, in the same order. */
  readonly errors: readonly ControlStateError[];
};

export function shouldShowMessages(
  when: unknown,
  source: Pick<ControlState<unknown>, 'touched' | 'dirty'>,
  submitted: () => boolean,
) {
  if (typeof when === 'boolean') return when;

  switch (when) {
    case 'always': return true;
    case 'dirty': return source.dirty();
    case 'submit': return submitted();
    case 'touched': return source.touched();
    default: return source.touched() || submitted();
  }
}

export function resolveMessage(error: ControlStateError, resolve: unknown, fallback: string) {
  const details = { ...error };
  let message: unknown = typeof resolve === 'function' ? attempt(() => resolve(details), undefined) : undefined;

  if (message === null) message = '';
  if (typeof message === 'string') return { message, error: details };

  return {
    message: typeof error.message === 'string' ? error.message : fallback,
    error: details,
  };
}

/** Animates measured content height while leaving natural layout in control between transitions. */
export const animateErrorHeight = (host: HTMLElement, content: HTMLElement, enabled: () => boolean) => {
  const view = host.ownerDocument.defaultView;
  let height = 0;
  let destroyed = false;
  let animation: Animation | undefined;
  const cancel = () => {
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
    }
    animation = undefined;
  };
  const refresh = () => {
    if (destroyed) return;
    const next = content.getBoundingClientRect().height;
    const animate = enabled() && typeof host.animate === 'function';
    if (!animate) {
      cancel();
      height = next;
      return;
    }
    if (next === height) return;
    const from = animation && animation.playState !== 'finished' ? host.getBoundingClientRect().height : height;
    cancel();
    height = next;
    if (from === next) return;
    animation = host.animate([{ height: `${from}px` }, { height: `${next}px` }], {
      duration: 160,
      easing: 'ease-out',
    });
    animation.onfinish = () => { animation = undefined; };
  };
  const observer = view?.ResizeObserver ? new view.ResizeObserver(refresh) : undefined;
  observer?.observe(content);
  return {
    refresh,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      cancel();
    },
  };
};

/** Connects height animation to rendering and destruction in the current injection context. */
export function setupErrorHeightAnimation(host: HTMLElement, enabled: () => boolean) {
  let animation: ReturnType<typeof animateErrorHeight> | undefined;
  afterEveryRender(() => {
    animation ??= animateErrorHeight(host, host.firstElementChild as HTMLElement, enabled);
    animation.refresh();
  });
  inject(DestroyRef).onDestroy(() => animation?.destroy());
}
