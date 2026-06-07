// Server-side proxy that talks to OpenRouter (OpenAI-compatible API).
// The API key lives only on the server, never in the browser bundle.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free models — work without OpenRouter credits (rate-limited).
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-chat-v3-0324:free',
];

function isQuotaError(status, text) {
  const msg = (text || '').toLowerCase();
  return status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('exhausted');
}

// Normalize model IDs. Legacy Google SDK IDs ("gemini-2.5-flash") and paid
// Gemini IDs are remapped to the free default so the app works without
// OpenRouter credits. Pass any other namespaced id ("vendor/model") through.
function normalizeModel(name) {
  if (!name) return DEFAULT_MODEL;
  // Paid Gemini models return 402 without credits — fall back to free default.
  if (name.includes('gemini') && !name.endsWith(':free')) return DEFAULT_MODEL;
  if (name.includes('/')) return name;
  return DEFAULT_MODEL;
}

// Convert Gemini-style history ({ role: 'user'|'model', parts: [{text}] })
// into OpenAI-style messages ({ role: 'user'|'assistant', content }).
function toMessages({ systemInstruction, history, message, prompt }) {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  if (Array.isArray(history)) {
    for (const turn of history) {
      const text = (turn?.parts || []).map((p) => p?.text || '').join('');
      messages.push({ role: turn.role === 'model' ? 'assistant' : 'user', content: text });
    }
  }
  if (typeof message === 'string') {
    messages.push({ role: 'user', content: message });
  } else if (typeof prompt === 'string') {
    messages.push({ role: 'user', content: prompt });
  }
  return messages;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ offline: true, error: 'OPENROUTER_API_KEY not configured' });
  }

  const { model, prompt, systemInstruction, history, message } = req.body || {};

  if (typeof message !== 'string' && typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Provide either "message" (chat) or "prompt" (one-shot).' });
  }

  const messages = toMessages({ systemInstruction, history, message, prompt });
  const requestedModel = normalizeModel(model);
  const modelsToTry = [requestedModel, ...FALLBACK_MODELS].filter((v, i, a) => a.indexOf(v) === i);

  try {
    for (const modelName of modelsToTry) {
      const upstream = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelName, messages }),
      });

      if (upstream.ok) {
        const data = await upstream.json();
        const text = data?.choices?.[0]?.message?.content ?? '';
        return res.status(200).json({ text });
      }

      const errText = await upstream.text();
      const isLast = modelName === modelsToTry[modelsToTry.length - 1];
      if (isQuotaError(upstream.status, errText) && !isLast) {
        console.warn(`Model ${modelName} hit quota/rate limit, trying fallback...`);
        continue;
      }
      console.error(`OpenRouter error (${upstream.status}) for ${modelName}: ${errText}`);
      return res.status(502).json({ error: 'Upstream OpenRouter request failed' });
    }
  } catch (err) {
    console.error('OpenRouter proxy error:', err);
    return res.status(502).json({ error: 'Upstream OpenRouter request failed' });
  }
}
