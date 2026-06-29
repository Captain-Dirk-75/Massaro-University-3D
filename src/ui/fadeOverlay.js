// ── Mood knobs ──
export const FADE_DURATION_MS = 520;

export function createFadeOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'scene-fade';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #0e0c0a;
    opacity: 0;
    pointer-events: none;
    z-index: 200;
    transition: opacity ${FADE_DURATION_MS}ms ease;
  `;
  document.body.appendChild(overlay);

  let busy = false;

  function fadeTo(opacity, onComplete) {
    return new Promise((resolve) => {
      const done = () => {
        overlay.removeEventListener('transitionend', onEnd);
        onComplete?.();
        resolve();
      };
      const onEnd = (event) => {
        if (event.propertyName !== 'opacity') return;
        done();
      };
      overlay.addEventListener('transitionend', onEnd);
      overlay.style.opacity = String(opacity);
      setTimeout(done, FADE_DURATION_MS + 80);
    });
  }

  return {
    isBusy: () => busy,
    async toBlack() {
      busy = true;
      overlay.style.pointerEvents = 'auto';
      await fadeTo(1);
    },
    async fromBlack() {
      await fadeTo(0);
      overlay.style.pointerEvents = 'none';
      busy = false;
    },
  };
}