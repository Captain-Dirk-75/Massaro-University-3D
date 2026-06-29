export function createHud() {
  const overlay = document.createElement('div');
  overlay.id = 'hud';
  overlay.innerHTML = `
    <p class="hud-title">Massaro University</p>
    <p class="hud-hint" data-hint="start">Click to enter · WASD to move · Mouse to look</p>
    <p class="hud-hint hud-hint--hidden" data-hint="active">WASD to move · Mouse to look · Esc to release</p>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #hud {
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 2.5rem;
      color: rgba(255, 252, 245, 0.92);
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
    }

    .hud-title {
      position: absolute;
      top: 1.5rem;
      font-size: 0.85rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.75;
    }

    .hud-hint {
      font-size: 0.95rem;
      opacity: 0.9;
    }

    .hud-hint--hidden {
      display: none;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  const hintStart = overlay.querySelector('[data-hint="start"]');
  const hintActive = overlay.querySelector('[data-hint="active"]');

  function setPointerLocked(locked) {
    hintStart.classList.toggle('hud-hint--hidden', locked);
    hintActive.classList.toggle('hud-hint--hidden', !locked);
  }

  return { setPointerLocked };
}