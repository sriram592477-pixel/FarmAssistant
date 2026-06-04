import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

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

    // Chat mode: stateless turn driven by client-supplied history + a new message.
    if (typeof message === 'string') {
      const chatModel = genAI.getGenerativeModel({
        model: model || DEFAULT_MODEL,
        ...(systemInstruction ? { systemInstruction } : {}),
      });
      const chat = chatModel.startChat({ history: Array.isArray(history) ? history : [] });
      const result = await chat.sendMessage(message);
      return res.status(200).json({ text: result.response.text() });
    }

    // One-shot mode.
    if (typeof prompt === 'string') {
      const oneShot = genAI.getGenerativeModel({ model: model || DEFAULT_MODEL });
      const result = await oneShot.generateContent(prompt);
      return res.status(200).json({ text: result.response.text() });
    }

    return res.status(400).json({ error: 'Provide either "message" (chat) or "prompt" (one-shot).' });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(502).json({ error: 'Upstream Gemini request failed' });
  }
}
