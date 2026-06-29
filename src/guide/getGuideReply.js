import { getOfflineReply } from './offlineResponses.js';

/**
 * ── LIVE AI SEAM — the ONLY function to change for real AI later ──
 *
 * TODO: Replace the body of this function with a fetch() call to your
 * backend proxy (e.g. POST /api/guide/reply). The proxy calls Grok/Claude
 * server-side. The API key must live on that backend — NEVER in this
 * browser code, NEVER in this repository.
 *
 * @param {{ message: string, history: Array<{role: string, text: string}>, context: object }} params
 * @returns {Promise<string>}
 */
export async function getGuideReply({ message, history, context }) {
  // OFFLINE PATH (active today) — no network, no API key
  const reply = getOfflineReply({ message, history, context });
  return reply;

  // LIVE PATH (future) — example only, do not uncomment without a backend:
  // const response = await fetch('/api/guide/reply', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message, history, context }),
  // });
  // const data = await response.json();
  // return data.reply;
}