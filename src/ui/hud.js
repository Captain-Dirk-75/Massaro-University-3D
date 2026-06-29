import { getColorById } from '../avatar/colors.js';

export function createHud({ onCustomizeClick } = {}) {
  const overlay = document.createElement('div');
  overlay.id = 'hud';
  overlay.innerHTML = `
    <p class="hud-title">Massaro University</p>
    <div class="hud-player">
      <span class="hud-player__swatch" id="hud-color-swatch"></span>
      <span class="hud-player__name" id="hud-player-name">Visitor</span>
    </div>
    <button type="button" class="hud-customize" id="hud-customize-btn" title="Customize avatar (C)">
      Customize
    </button>
    <p class="hud-hint" data-hint="start">Click to enter · WASD to move · Mouse to look · C to customize</p>
    <p class="hud-hint hud-hint--hidden" data-hint="active">WASD to move · Mouse to look · Esc to release · C to customize</p>
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

    .hud-player {
      position: absolute;
      top: 3.2rem;
      left: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .hud-player__swatch {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
    }

    .hud-player__name {
      opacity: 0.9;
    }

    .hud-customize {
      position: absolute;
      top: 1.35rem;
      right: 1.5rem;
      pointer-events: auto;
      padding: 0.4rem 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 6px;
      background: rgba(20, 24, 28, 0.45);
      color: rgba(255, 252, 245, 0.92);
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      cursor: pointer;
      backdrop-filter: blur(4px);
    }

    .hud-customize:hover {
      background: rgba(20, 24, 28, 0.65);
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
  const nameEl = overlay.querySelector('#hud-player-name');
  const swatchEl = overlay.querySelector('#hud-color-swatch');
  const customizeBtn = overlay.querySelector('#hud-customize-btn');

  customizeBtn.addEventListener('click', () => {
    onCustomizeClick?.();
  });

  function setPointerLocked(locked) {
    hintStart.classList.toggle('hud-hint--hidden', locked);
    hintActive.classList.toggle('hud-hint--hidden', !locked);
  }

  function setPlayerProfile({ displayName, colorId }) {
    nameEl.textContent = displayName || 'Visitor';
    const color = getColorById(colorId);
    swatchEl.style.background = `#${color.hex.toString(16).padStart(6, '0')}`;
  }

  return { setPointerLocked, setPlayerProfile };
}