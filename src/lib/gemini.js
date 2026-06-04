// Client helpers that talk to the server-side Gemini proxy (/api/gemini).
// The API key lives only on the server, never in the browser bundle.

async function callProxy(body) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error || '';
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail || `Gemini proxy returned ${res.status}`);
  }

  const data = await res.json();
  return data.text ?? '';
}

// One-shot generation (used by Market, SoilMoisture).
export function generate({ model, prompt }) {
  return callProxy({ model, prompt });
}

// Multi-turn chat (used by AIAssistant). `history` is an array of
// { role: 'user' | 'model', parts: [{ text }] } turns.
export function chat({ model, systemInstruction, history, message }) {
  return callProxy({ model, systemInstruction, history, message });
}
