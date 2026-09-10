// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { animateErrorHeight } from './form-node-errors.utils';

afterEach(() => vi.unstubAllGlobals());

const setup = () => {
  const host = document.createElement('div');
  const content = document.createElement('div');
  let contentHeight = 40;
  let hostHeight = 18;
  let enabled = true;
  let resize!: () => void;
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe = vi.fn();
    disconnect = disconnect;
  });
  vi.spyOn(content, 'getBoundingClientRect').mockImplementation(() => ({ height: contentHeight }) as DOMRect);
  vi.spyOn(host, 'getBoundingClientRect').mockImplementation(() => ({ height: hostHeight }) as DOMRect);
  const animations: { cancel: ReturnType<typeof vi.fn>; onfinish?: () => void; playState?: string }[] = [];
  const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    const animation = { cancel: vi.fn() };
    animations.push(animation);
    return animation as unknown as Animation;
  });
  host.animate = animate;
  const controller = animateErrorHeight(host, content, () => enabled);
  return {
    host, controller, animate, animations, disconnect,
    resize: () => resize(),
    setHeight: (height: number) => { contentHeight = height; },
    setHostHeight: (height: number) => { hostHeight = height; },
    setEnabled: (value: boolean) => { enabled = value; },
  };
};

describe('error height animation', () => {
  it('animates entry, expansion, interruption and collapse from measured heights', () => {
    const view = setup();
    view.controller.refresh();
    expect(view.animate).toHaveBeenLastCalledWith([{ height: '0px' }, { height: '40px' }], { duration: 160, easing: 'ease-out' });
    view.resize();
    expect(view.animate).toHaveBeenCalledTimes(1);
    view.setHeight(80);
    view.resize();
    expect(view.animations[0]!.cancel).toHaveBeenCalledOnce();
    expect(view.animate.mock.calls[1]![0]).toEqual([{ height: '18px' }, { height: '80px' }]);
    view.animations[1]!.onfinish!();
    view.setHeight(0);
    view.resize();
    expect(view.animate.mock.calls[2]![0]).toEqual([{ height: '80px' }, { height: '0px' }]);
    view.controller.destroy();
    expect(view.animations[2]!.cancel).toHaveBeenCalledOnce();
    view.setHeight(100);
    view.resize();
    expect(view.animate).toHaveBeenCalledTimes(3);
    expect(view.disconnect).toHaveBeenCalledOnce();
  });

  it('cancels when disabled and resumes from natural height when enabled', () => {
    const view = setup();
    view.controller.refresh();
    view.setEnabled(false);
    view.controller.refresh();
    expect(view.animations[0]!.cancel).toHaveBeenCalledOnce();
    view.setHeight(60);
    view.controller.refresh();
    expect(view.animate).toHaveBeenCalledTimes(1);
    view.setHeight(80);
    view.resize();
    expect(view.animate).toHaveBeenCalledTimes(1);
    view.setEnabled(true);
    view.setHeight(0);
    view.resize();
    expect(view.animate.mock.calls[1]![0]).toEqual([{ height: '80px' }, { height: '0px' }]);
    view.controller.destroy();
  });

  it('skips a replacement animation when the current animated height matches the target', () => {
    const view = setup();
    view.controller.refresh();
    view.setHostHeight(20);
    view.setHeight(20);
    view.resize();
    expect(view.animate).toHaveBeenCalledTimes(1);
    view.controller.destroy();
  });

  it('uses the previous target after finishing even before the finish event is delivered', () => {
    const view = setup();
    view.controller.refresh();
    view.animations[0]!.playState = 'finished';
    view.setHostHeight(80);
    view.setHeight(80);
    view.resize();
    expect(view.animate.mock.calls[1]![0]).toEqual([{ height: '40px' }, { height: '80px' }]);
    view.controller.destroy();
  });

  it('supports missing optional browser APIs and detached documents', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    for (const doc of [document, document.implementation.createHTMLDocument()]) {
      const host = doc.createElement('div');
      const controller = animateErrorHeight(host, host, () => true);
      controller.refresh();
      controller.destroy();
    }
  });
});
