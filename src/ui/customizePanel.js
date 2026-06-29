import { BODY_PRESETS, BODY_PRESET_IDS } from '../avatar/presets.js';
import { AVATAR_COLORS } from '../avatar/colors.js';
import { createAvatarPreview } from '../avatar/avatarPreview.js';
import {
  playerState,
  updateProfile,
  resetToDefaults,
} from '../state/playerState.js';
import { appState } from '../state/appState.js';

function formatCampusTime(seconds) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m on campus`;
  if (m > 0) return `${m}m on campus`;
  return `${total}s on campus`;
}

export function createCustomizePanel({ onChange, onOpenChange }) {
  const panel = document.createElement('div');
  panel.id = 'customize-panel';
  panel.className = 'customize-panel customize-panel--hidden';
  panel.innerHTML = `
    <div class="customize-panel__card">
      <header class="customize-panel__header">
        <h2>Your Avatar</h2>
        <button type="button" class="customize-panel__close" aria-label="Close">×</button>
      </header>

      <div class="customize-panel__preview-wrap">
        <canvas id="avatar-preview" class="customize-panel__preview"></canvas>
      </div>

      <label class="customize-panel__field">
        <span>Display name</span>
        <input type="text" id="avatar-name" maxlength="24" placeholder="Your name" />
      </label>

      <fieldset class="customize-panel__field">
        <legend>Body</legend>
        <div class="customize-panel__options" id="body-options"></div>
      </fieldset>

      <fieldset class="customize-panel__field">
        <legend>Colour</legend>
        <div class="customize-panel__swatches" id="color-options"></div>
      </fieldset>

      <p class="customize-panel__session" id="session-time"></p>

      <p class="customize-panel__status customize-panel__status--hidden" id="profile-status"></p>

      <button type="button" class="customize-panel__save" id="save-profile">
        Save profile
      </button>

      <button type="button" class="customize-panel__reset" id="reset-profile">
        Reset profile
      </button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .customize-panel {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(18, 22, 26, 0.55);
      backdrop-filter: blur(4px);
      pointer-events: auto;
    }

    .customize-panel--hidden {
      display: none;
    }

    .customize-panel__card {
      width: min(360px, 92vw);
      max-height: 92vh;
      overflow-y: auto;
      padding: 1.25rem 1.35rem 1.4rem;
      border-radius: 12px;
      background: rgba(32, 38, 44, 0.96);
      color: #f5f0e8;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .customize-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .customize-panel__header h2 {
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .customize-panel__close {
      border: none;
      background: transparent;
      color: #c8c0b4;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0.15rem 0.35rem;
    }

    .customize-panel__preview-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .customize-panel__preview {
      width: 140px;
      height: 200px;
      border-radius: 8px;
      display: block;
    }

    .customize-panel__field {
      display: block;
      margin-bottom: 1rem;
      border: none;
      padding: 0;
    }

    .customize-panel__field > span,
    .customize-panel__field > legend {
      display: block;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #a8a098;
      margin-bottom: 0.45rem;
    }

    .customize-panel__field input {
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.25);
      color: #f5f0e8;
      font-size: 0.95rem;
    }

    .customize-panel__options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.45rem;
    }

    .customize-panel__option {
      padding: 0.45rem 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.2);
      color: #e8e0d4;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .customize-panel__option--active {
      border-color: #c4a86a;
      background: rgba(196, 168, 106, 0.18);
      color: #fff8ee;
    }

    .customize-panel__swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .customize-panel__swatch {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
    }

    .customize-panel__swatch--active {
      border-color: #f5f0e8;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
    }

    .customize-panel__session {
      font-size: 0.8rem;
      color: #989088;
      margin: 0.5rem 0 0.75rem;
    }

    .customize-panel__status {
      font-size: 0.8rem;
      text-align: center;
      margin-bottom: 0.65rem;
      color: #b8e8c0;
    }

    .customize-panel__status--hidden {
      display: none;
    }

    .customize-panel__status--dirty {
      color: #e8dcc0;
    }

    .customize-panel__save {
      width: 100%;
      padding: 0.6rem;
      margin-bottom: 0.5rem;
      border: 1px solid rgba(196, 168, 106, 0.45);
      border-radius: 6px;
      background: rgba(196, 168, 106, 0.22);
      color: #fff8ee;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
    }

    .customize-panel__save:hover {
      background: rgba(196, 168, 106, 0.32);
    }

    .customize-panel__save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .customize-panel__reset {
      width: 100%;
      padding: 0.55rem;
      border: 1px solid rgba(255, 120, 100, 0.35);
      border-radius: 6px;
      background: rgba(255, 80, 60, 0.1);
      color: #f0a898;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  const nameInput = panel.querySelector('#avatar-name');
  const bodyOptions = panel.querySelector('#body-options');
  const colorOptions = panel.querySelector('#color-options');
  const sessionTime = panel.querySelector('#session-time');
  const statusEl = panel.querySelector('#profile-status');
  const saveBtn = panel.querySelector('#save-profile');
  const previewCanvas = panel.querySelector('#avatar-preview');
  const preview = createAvatarPreview(previewCanvas);

  let isOpen = false;
  let draftProfile = { ...playerState.profile };
  let isDirty = false;
  let isSaving = false;

  for (const id of BODY_PRESET_IDS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'customize-panel__option';
    btn.dataset.preset = id;
    btn.textContent = BODY_PRESETS[id].label;
    bodyOptions.appendChild(btn);
  }

  for (const color of AVATAR_COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'customize-panel__swatch';
    btn.dataset.colorId = color.id;
    btn.title = color.label;
    btn.style.background = `#${color.hex.toString(16).padStart(6, '0')}`;
    colorOptions.appendChild(btn);
  }

  function profilesMatch(a, b) {
    return (
      a.displayName === b.displayName &&
      a.bodyPreset === b.bodyPreset &&
      a.colorId === b.colorId
    );
  }

  function setStatus(message, tone = 'saved') {
    if (!message) {
      statusEl.classList.add('customize-panel__status--hidden');
      statusEl.classList.remove('customize-panel__status--dirty');
      statusEl.textContent = '';
      return;
    }
    statusEl.textContent = message;
    statusEl.classList.remove('customize-panel__status--hidden');
    statusEl.classList.toggle('customize-panel__status--dirty', tone === 'dirty');
  }

  function syncFormFromDraft() {
    const { displayName, bodyPreset, colorId } = draftProfile;
    nameInput.value = displayName;

    bodyOptions.querySelectorAll('.customize-panel__option').forEach((btn) => {
      btn.classList.toggle(
        'customize-panel__option--active',
        btn.dataset.preset === bodyPreset,
      );
    });

    colorOptions.querySelectorAll('.customize-panel__swatch').forEach((btn) => {
      btn.classList.toggle(
        'customize-panel__swatch--active',
        btn.dataset.colorId === colorId,
      );
    });

    sessionTime.textContent = formatCampusTime(
      playerState.session.totalTimeOnCampus,
    );
    preview.update({ bodyPreset, colorId });
    isDirty = !profilesMatch(draftProfile, playerState.profile);
    saveBtn.disabled = isSaving || !isDirty;
    setStatus(
      isDirty ? 'Unsaved changes' : isSaving ? 'Saving…' : null,
      isDirty ? 'dirty' : 'saved',
    );
  }

  function applyDraftToPreview() {
    onChange?.(draftProfile);
    syncFormFromDraft();
  }

  function resetDraftFromSaved() {
    draftProfile = { ...playerState.profile };
    syncFormFromDraft();
    onChange?.(playerState.profile);
  }

  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('customize-panel--hidden', !open);
    onOpenChange?.(open);

    if (open) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      draftProfile = { ...playerState.profile };
      syncFormFromDraft();
      preview.resize();
    } else if (isDirty) {
      resetDraftFromSaved();
    }
  }

  function toggle() {
    setOpen(!isOpen);
  }

  nameInput.addEventListener('input', () => {
    draftProfile.displayName = nameInput.value.trim() || 'Visitor';
    applyDraftToPreview();
  });

  bodyOptions.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-preset]');
    if (!btn) return;
    draftProfile.bodyPreset = btn.dataset.preset;
    applyDraftToPreview();
  });

  colorOptions.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-color-id]');
    if (!btn) return;
    draftProfile.colorId = btn.dataset.colorId;
    applyDraftToPreview();
  });

  saveBtn.addEventListener('click', async () => {
    if (!isDirty || isSaving) return;

    isSaving = true;
    saveBtn.disabled = true;
    setStatus('Saving…');

    try {
      await updateProfile({ ...draftProfile });
      isDirty = false;
      setStatus('Profile saved');
      onChange?.(playerState.profile);
      setTimeout(() => {
        if (!isDirty) setStatus(null);
      }, 2000);
    } catch {
      setStatus('Could not save — try again', 'dirty');
    } finally {
      isSaving = false;
      syncFormFromDraft();
    }
  });

  panel.querySelector('.customize-panel__close').addEventListener('click', () => {
    setOpen(false);
  });

  panel.querySelector('#reset-profile').addEventListener('click', async () => {
    await resetToDefaults();
    draftProfile = { ...playerState.profile };
    syncFormFromDraft();
    onChange?.(playerState.profile);
    setStatus('Profile reset to defaults');
    setTimeout(() => setStatus(null), 2000);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyC') return;
    if (event.repeat) return;
    if (event.target.matches('input, textarea, select')) return;
    if (appState.guidePanelOpen || appState.storePanelOpen) return;
    event.preventDefault();
    toggle();
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) setOpen(false);
  });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle,
    isOpen: () => isOpen,
    syncFormFromState: syncFormFromDraft,
    updateSessionDisplay() {
      sessionTime.textContent = formatCampusTime(
        playerState.session.totalTimeOnCampus,
      );
    },
  };
}