import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

function isQuotaError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('quota') || msg.includes('429') || msg.includes('rate limit') || msg.includes('exhausted');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ offline: true, error: 'GEMINI_API_KEY not configured' });
  }

  const { model, prompt, systemInstruction, history, message } = req.body || {};

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const requestedModel = model || DEFAULT_MODEL;
    const modelsToTry = [requestedModel, ...FALLBACK_MODELS].filter((v, i, a) => a.indexOf(v) === i);

    // Chat mode: stateless turn driven by client-supplied history + a new message.
    if (typeof message === 'string') {
      let lastErr = null;
      for (const modelName of modelsToTry) {
        try {
          const chatModel = genAI.getGenerativeModel({
            model: modelName,
            ...(systemInstruction ? { systemInstruction } : {}),
          });
          const chat = chatModel.startChat({ history: Array.isArray(history) ? history : [] });
          const result = await chat.sendMessage(message);
          return res.status(200).json({ text: result.response.text() });
        } catch (err) {
          if (isQuotaError(err) && modelName !== modelsToTry[modelsToTry.length - 1]) {
            console.warn(`Model ${modelName} hit quota limit, trying fallback...`);
            lastErr = err;
            continue;
          }
          throw err;
        }
      }
    }

    // One-shot mode.
    if (typeof prompt === 'string') {
      let lastErr = null;
      for (const modelName of modelsToTry) {
        try {
          const oneShot = genAI.getGenerativeModel({ model: modelName });
          const result = await oneShot.generateContent(prompt);
          return res.status(200).json({ text: result.response.text() });
        } catch (err) {
          if (isQuotaError(err) && modelName !== modelsToTry[modelsToTry.length - 1]) {
            console.warn(`Model ${modelName} hit quota limit, trying fallback...`);
            lastErr = err;
            continue;
          }
          throw err;
        }
      }
    }

    return res.status(400).json({ error: 'Provide either "message" (chat) or "prompt" (one-shot).' });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(502).json({ error: 'Upstream Gemini request failed' });
  }
}

