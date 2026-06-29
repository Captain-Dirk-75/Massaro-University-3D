import { buildGuideContext } from '../guide/context.js';
import { getGuideReply } from '../guide/getGuideReply.js';
import { playerState } from '../state/playerState.js';

const MAX_TURNS = 8;
const GUIDE_NAME = 'Sage Grove';

export function createGuidePanel({ onOpenChange }) {
  const panel = document.createElement('div');
  panel.id = 'guide-panel';
  panel.className = 'guide-panel guide-panel--hidden';
  panel.innerHTML = `
    <div class="guide-panel__card">
      <header class="guide-panel__header">
        <div>
          <h2>${GUIDE_NAME}</h2>
          <p class="guide-panel__subtitle">Your campus guide</p>
        </div>
        <button type="button" class="guide-panel__close" aria-label="Close">×</button>
      </header>
      <div class="guide-panel__thread" id="guide-thread"></div>
      <form class="guide-panel__form" id="guide-form">
        <input type="text" id="guide-input" placeholder="Ask Sage Grove…" maxlength="280" autocomplete="off" />
        <button type="submit" class="guide-panel__send">Send</button>
      </form>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .guide-panel {
      position: fixed;
      inset: 0;
      z-index: 26;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(18, 22, 26, 0.58);
      backdrop-filter: blur(5px);
      pointer-events: auto;
    }

    .guide-panel--hidden { display: none; }

    .guide-panel__card {
      width: min(440px, 94vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      padding: 1.15rem 1.25rem 1.2rem;
      border-radius: 12px;
      background: rgba(34, 40, 44, 0.97);
      color: #f0ebe2;
      box-shadow: 0 14px 44px rgba(0, 0, 0, 0.38);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .guide-panel__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.85rem;
      flex-shrink: 0;
    }

    .guide-panel__header h2 {
      font-size: 1.05rem;
      font-weight: 600;
      color: #d8e8d4;
      letter-spacing: 0.03em;
    }

    .guide-panel__subtitle {
      font-size: 0.76rem;
      color: #909888;
      margin-top: 0.15rem;
    }

    .guide-panel__close {
      border: none;
      background: transparent;
      color: #b8b0a4;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .guide-panel__thread {
      flex: 1;
      overflow-y: auto;
      min-height: 220px;
      max-height: 52vh;
      padding: 0.65rem 0.5rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .guide-turn {
      margin-bottom: 0.75rem;
      line-height: 1.5;
      font-size: 0.86rem;
    }

    .guide-turn__who {
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
      opacity: 0.7;
    }

    .guide-turn--user .guide-turn__who { color: #c8d0e0; }
    .guide-turn--guide .guide-turn__who { color: #a8c8a8; }

    .guide-turn--guide .guide-turn__text {
      color: #e8e4dc;
      font-style: italic;
    }

    .guide-turn--user .guide-turn__text { color: #f5f0e8; }

    .guide-turn--thinking {
      opacity: 0.55;
      font-style: italic;
    }

    .guide-panel__form {
      display: flex;
      gap: 0.45rem;
      flex-shrink: 0;
    }

    .guide-panel__form input {
      flex: 1;
      padding: 0.55rem 0.65rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.28);
      color: #f5f0e8;
      font-size: 0.9rem;
    }

    .guide-panel__send {
      padding: 0.55rem 0.85rem;
      border: 1px solid rgba(168, 200, 168, 0.35);
      border-radius: 6px;
      background: rgba(106, 138, 114, 0.25);
      color: #e0f0e0;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .guide-panel__send:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  const thread = panel.querySelector('#guide-thread');
  const form = panel.querySelector('#guide-form');
  const input = panel.querySelector('#guide-input');
  let isOpen = false;
  let history = [];
  let isReplying = false;
  let greeted = false;

  function trimHistory() {
    while (history.length > MAX_TURNS) {
      history.shift();
    }
  }

  function renderThread(extra) {
    const turns = [...history];
    if (extra) turns.push(extra);

    thread.replaceChildren();

    for (const turn of turns) {
      const row = document.createElement('div');
      row.className = `guide-turn guide-turn--${turn.role === 'user' ? 'user' : 'guide'}${turn.thinking ? ' guide-turn--thinking' : ''}`;

      const who = document.createElement('div');
      who.className = 'guide-turn__who';
      who.textContent = turn.role === 'user' ? 'You' : GUIDE_NAME;

      const text = document.createElement('div');
      text.className = 'guide-turn__text';
      text.textContent = turn.text;

      row.append(who, text);
      thread.append(row);
    }

    thread.scrollTop = thread.scrollHeight;
  }

  async function sendMessage(message) {
    if (!message.trim() || isReplying) return;

    isReplying = true;
    input.disabled = true;
    panel.querySelector('.guide-panel__send').disabled = true;

    history.push({ role: 'user', text: message.trim() });
    trimHistory();
    renderThread({ role: 'guide', text: '…', thinking: true });

    const context = buildGuideContext(playerState);
    const reply = await getGuideReply({
      message: message.trim(),
      history,
      context,
    });

    history.push({ role: 'guide', text: reply });
    trimHistory();
    isReplying = false;
    input.disabled = false;
    panel.querySelector('.guide-panel__send').disabled = false;
    renderThread();
    input.focus();
  }

  async function sendGreeting() {
    if (greeted) return;
    greeted = true;

    isReplying = true;
    renderThread({ role: 'guide', text: '…', thinking: true });

    const context = buildGuideContext(playerState);
    const reply = await getGuideReply({
      message: '__greeting__',
      history: [],
      context,
    });

    history.push({ role: 'guide', text: reply });
    trimHistory();
    isReplying = false;
    renderThread();
  }

  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('guide-panel--hidden', !open);
    onOpenChange?.(open);

    if (open) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      renderThread();
      sendGreeting();
      setTimeout(() => input.focus(), 50);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value;
    input.value = '';
    sendMessage(text);
  });

  panel.querySelector('.guide-panel__close').addEventListener('click', () => {
    setOpen(false);
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) setOpen(false);
  });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    isOpen: () => isOpen,
  };
}