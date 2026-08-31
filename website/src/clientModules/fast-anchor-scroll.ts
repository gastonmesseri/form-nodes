import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const scrollDuration = 180;
let animationFrame: number | undefined;

const cancelScroll = () => {
  if (animationFrame === undefined) return;
  cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
};

const scrollToTarget = (target: HTMLElement) => {
  cancelScroll();

  const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const start = window.scrollY;
  const destination = Math.max(0, target.getBoundingClientRect().top + start - scrollMargin);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: destination });
    return;
  }

  const distance = destination - start;
  const startedAt = performance.now();

  const step = (time: number) => {
    const progress = Math.min((time - startedAt) / scrollDuration, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    window.scrollTo({ top: start + distance * easedProgress });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step);
    } else {
      animationFrame = undefined;
    }
  };

  animationFrame = requestAnimationFrame(step);
};

const findHashTarget = (hash: string) => {
  if (hash.length <= 1) return document.documentElement;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
};

if (ExecutionEnvironment.canUseDOM) {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;

    const url = new URL(link.href, window.location.href);
    if (!url.hash || url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.search !== window.location.search) return;

    const target = findHashTarget(url.hash);
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, '', url.hash);
    scrollToTarget(target);
  }, { capture: true });

  window.addEventListener('wheel', cancelScroll, { passive: true });
  window.addEventListener('touchstart', cancelScroll, { passive: true });
  window.addEventListener('keydown', cancelScroll);
}
