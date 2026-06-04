import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../context/AppContext';
import { chat } from '../lib/gemini';

// Language labels used in the system prompt
const LANG_LABELS = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi',
  ml: 'Malayalam',
};

// Build a farming-focused system prompt that instructs Gemini to answer in the
// selected language.
const buildSystemPrompt = (langCode) => {
  const lang = LANG_LABELS[langCode] || 'English';
  return `You are a powerful AI assistant inside the Karshaka AI dashboard application.
Your job is to answer every user question intelligently, accurately, and completely.

Instructions:
* Always provide a meaningful answer.
* Never return empty, vague, or incomplete responses.
* Understand the user's intent before answering.
* Respond naturally like a professional AI assistant.
* Maintain conversation context across messages.
* If the question is unclear, ask a short follow-up question.
* Give concise but detailed answers.
* Use step-by-step explanations when needed.
* Format responses cleanly using: headings, bullet points, numbered steps, and code blocks.

Capabilities:
* Answer general knowledge questions
* Solve coding problems
* Debug errors
* Generate production-ready code
* Explain concepts simply
* Summarize content
* Give recommendations on fertilizers, pest control, and crop diseases
* Help with agriculture, farming topics, and smart agribusiness.
* You are specially trained for agriculture in Kerala, India. Always consider Kerala's tropical climate, monsoons, and soil types (laterite, coastal sandy, etc).
* Provide expert advice on Kerala's major crops: Rice, Coconut, Rubber, Banana, Black Pepper, Cardamom, etc.

Coding Rules:
* Detect the programming language automatically
* Return optimized and correct code
* Explain errors clearly
* Add comments in code when useful
* Never output broken code intentionally

Behavior:
* Be fast, smart, and helpful
* Avoid repeating the same sentence
* Keep answers user-friendly
* Think before responding
* Prioritize accuracy and usefulness
* If multiple solutions exist, provide the best one first
* Even if the user input is short or imperfect, intelligently infer the most likely meaning and try to help instead of refusing.

Goal:
Deliver high-quality AI responses similar to top premium AI assistants with strong reasoning, conversation memory, and reliable answers for all user questions.

IMPORTANT LANGUAGE RULE:
- You MUST always respond in ${lang} language.
- If the user writes in any language, still reply in ${lang}.`;
};

const AIAssistant = () => {
  const { t, language } = useAppContext();

  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: t('aiWelcomeMsg') },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Conversation history sent to the proxy on each turn.
  // Array of { role: 'user' | 'model', parts: [{ text }] }.
  const historyRef = useRef([]);

  // Reset conversation history when language changes (system prompt changes too).
  useEffect(() => {
    historyRef.current = [];
  }, [language]);

  // Update welcome message when language changes (only if user hasn't started chatting)
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'ai') {
      setMessages([{ id: 1, sender: 'ai', text: t('aiWelcomeMsg') }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage = { id: Date.now(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError('');

    // -----------------------------------------------------------------------
    // Gemini call via server-side proxy. Falls back to the offline bot on any
    // error (including when the server has no API key configured).
    // -----------------------------------------------------------------------
    try {
      const aiText = await chat({
        model: 'gemini-2.5-flash',
        systemInstruction: buildSystemPrompt(language),
        history: historyRef.current,
        message: userText,
      });

      historyRef.current.push(
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: aiText }] },
      );

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiText }]);
    } catch (err) {
      console.error('Gemini API error:', err);
      setError('Gemini API connection issue. Using offline bot...');
      const fbText = getFallbackResponse(userText, language);
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: fbText }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-nature-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-nature-500/30">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('aiTitle')}</h2>
          <p className="text-sm font-medium text-nature-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {t('poweredBy')}
          </p>
        </div>

        {/* Language badge */}
        <span className="ml-auto px-3 py-1 bg-nature-50 border border-nature-200 text-nature-700 text-xs font-semibold rounded-full">
          {LANG_LABELS[language]}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 bg-white rounded-t-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[82%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 text-white shadow-sm ${msg.sender === 'user' ? 'bg-gray-800' : 'bg-gradient-to-tr from-nature-400 to-teal-500'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-gray-800 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
                }`}>
                  {msg.sender === 'ai' ? (
                    <div className="prose prose-sm prose-p:leading-relaxed prose-strong:text-nature-700 max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-nature-400 to-teal-500 flex items-center justify-center mt-1 text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-nature-500 animate-spin" />
                  <span className="text-sm text-gray-400 font-medium">{t('typing')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          {/* Quick Action Prompt Starters */}
          <div className="flex overflow-x-auto gap-2 pb-3 mb-1 hide-scrollbar">
            {[
              { label: '🌿 Crop Disease Check', prompt: 'How do I identify and treat leaf yellowing in banana plants?' },
              { label: '💧 Fertilizer Tips', prompt: 'What is the best fertilizer schedule for coconut trees in Kerala?' },
              { label: '🌦️ Monsoon Prep', prompt: 'How should I prepare my rubber plantation for the heavy monsoon?' },
              { label: '📈 Market Advice', prompt: 'When is the best time to sell black pepper for maximum profit?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setInput(chip.prompt)}
                className="whitespace-nowrap px-4 py-2 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('askAnything')}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-nature-500/50 focus:bg-white focus:border-nature-500 transition-all text-gray-700 text-sm md:text-base pr-14"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`absolute right-2 p-2 rounded-lg transition-all ${
                input.trim() && !isTyping
                  ? 'bg-nature-500 text-white hover:bg-nature-600 shadow-md transform hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">{t('aiWarning')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rich offline fallback engine (used if all network APIs fail)
// Supports English, Tamil, Hindi, Malayalam
// ---------------------------------------------------------------------------
function getFallbackResponse(prompt, lang) {
  const p = prompt.toLowerCase();

  const responses = {
    en: {
      hello: "Hello! I am Karshaka AI, your smart farming assistant. How can I help you today? You can ask me about crop diseases, market forecasts, or optimal harvesting times.",
      price: "Based on current market trends, **Wheat** prices are rising. Hold your harvest for another week if storage allows to maximise profit.\n\n*Current avg: ₹2,800/quintal*",
      disease: "Yellowing leaves often indicate **Nitrogen deficiency** or fungal **Rust**.\n\n**Steps:**\n1. Check soil moisture levels\n2. Apply nitrogen-rich fertilizer\n3. If brown spots appear, use a mild fungicide\n4. Consult your local Krishi Vigyan Kendra",
      weather: "Light rain is expected tonight. Skip manual irrigation today to avoid waterlogging. Ensure drainage channels are clear.",
      harvest: "The best time to harvest is when grain moisture is **12–14%**. Early morning harvesting reduces grain loss and improves quality.",
      soil: "Good soil health starts with regular testing. Aim for pH 6.0–7.5. Add organic compost to improve water retention and nutrient levels.",
      water: "Drip irrigation saves up to 50% water compared to flood irrigation. Water your crops early morning or evening to reduce evaporation.",
      fertilizer: "Use a balanced NPK fertilizer (e.g., 14-35-14) during sowing. Top-dress with urea at tillering stage for better yield.",
      pest: "For pest control, first try neem oil spray (5ml/litre). For severe infestations, consult your local agriculture officer for approved pesticides.",
      default: "That's a great question! As a farming expert, I recommend checking your local Krishi Vigyan Kendra for region-specific advice. Could you give me more details about your crop type and location?",
    },
    ml: {
      hello: "നമസ്കാരം! ഞാൻ യുധിഷ്ഠിര, നിങ്ങളുടെ AI കൃഷി സഹായിയാണ്. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?",
      price: "നിലവിലെ വിപണി ട്രെൻഡ് അനുസരിച്ച്, **ഗോതമ്പ്** വില ഉയരുകയാണ്. സ്റ്റോറേജ് സൗകര്യമുണ്ടെങ്കിൽ ഒരാഴ്ച കൂടി കാത്തിരിക്കൂ.\n\n*ശരാശരി വില: ₹2,800/ക്വിന്റൽ*",
      disease: "ഇലകൾ മഞ്ഞളിക്കുന്നത് പലപ്പോഴും **നൈട്രജൻ കുറവ്** അല്ലെങ്കിൽ **ഫംഗസ്** മൂലമാണ്.\n\n**ചെയ്യേണ്ടത്:**\n1. മണ്ണിന്റെ ഈർപ്പം പരിശോധിക്കുക\n2. നൈട്രജൻ സമ്പന്നമായ വളം ഇടുക\n3. തവിട്ട് പൊട്ടുകൾ കണ്ടാൽ ഫംഗ്സൈഡ് ഉപയോഗിക്കുക\n4. കൃഷി വിജ്ഞാൻ കേന്ദ്ര സഹായം തേടുക",
      weather: "ഇന്ന് രാത്രി നേരിയ മഴ പ്രതീക്ഷിക്കുന്നു. ജലസേചനം ഒഴിവാക്കുക. നീർത്തടം സുഗമമായി ഒഴുകുന്നുണ്ടെന്ന് ഉറപ്പ് വരുത്തുക.",
      harvest: "വിളവെടുപ്പിന്റെ ഏറ്റവും നല്ല സമയം ധാന്യ ഈർപ്പം **12–14%** ആകുമ്പോഴാണ്. രാവിലെ വിളവെടുക്കുന്നത് നഷ്ടം കുറയ്ക്കും.",
      soil: "മണ്ണ് ആരോഗ്യകരമാക്കാൻ pH 6.0–7.5 ആണ് ഉത്തമം. ജൈവ കമ്പോസ്റ്റ് ചേർക്കുന്നത് ഈർപ്പം നിലനിർത്താൻ സഹായിക്കും.",
      water: "ഡ്രിപ്പ് ജലസേചനം ഉപയോഗിക്കുന്നത് 50% വരെ ജലം ലാഭിക്കും. രാവിലെ അല്ലെങ്കിൽ വൈകിട്ട് നനയ്ക്കൂ.",
      fertilizer: "വിത്ത് ഇടുന്ന സമയത്ത് NPK (14-35-14) ഉപയോഗിക്കുക. ടില്ലറിംഗ് ഘട്ടത്തിൽ യൂറിയ ടോപ്-ഡ്രസ്സ് ചെയ്യുക.",
      pest: "കീടനിയന്ത്രണത്തിന് ആദ്യം വേപ്പ് എണ്ണ (5ml/ലിറ്റർ) ഉപയോഗിക്കൂ. കൂടുതൽ ഗുരുതരമാണെങ്കിൽ കൃഷി ഓഫീസറെ കണ്ടുമുട്ടൂ.",
      default: "നല്ല ചോദ്യം! നിങ്ങളുടെ വിളയുടെ തരവും സ്ഥലവും കൂടി പറഞ്ഞാൽ കൂടുതൽ കൃത്യമായ ഉത്തരം തരാൻ കഴിയും. നിങ്ങളുടെ പ്രദേശത്തെ കൃഷി വിജ്ഞാൻ കേന്ദ്ര ഉദ്യോഗസ്ഥരോടും ആലോചിക്കൂ.",
    },
    ta: {
      hello: "வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர். உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
      price: "தற்போதைய சந்தை நிலவரப்படி, **கோதுமை** விலை உயர்கிறது. சேமிப்பு வசதி இருந்தால் இன்னொரு வாரம் காத்திருங்கள்.\n\n*சராசரி விலை: ₹2,800/குவிண்டால்*",
      disease: "இலைகள் மஞ்சளாவது **நைட்ரஜன் குறைபாடு** அல்லது **பூஞ்சை நோய்** காரணமாக இருக்கலாம்.\n\n**செய்ய வேண்டியவை:**\n1. மண் ஈரப்பதத்தை சரிபார்க்கவும்\n2. நைட்ரஜன் உரம் இடவும்\n3. பழுப்பு புள்ளிகள் தெரிந்தால் பூஞ்சைக்கொல்லி பயன்படுத்தவும்",
      weather: "இன்று இரவு லேசான மழை எதிர்பார்க்கப்படுகிறது. நீர்ப்பாசனத்தை தவிர்க்கவும். வடிகால் சரியாக உள்ளதா என்று பார்க்கவும்.",
      harvest: "அறுவடைக்கு சிறந்த நேரம் தானியத்தின் ஈரப்பதம் **12–14%** ஆக இருக்கும்போது. காலை நேரத்தில் அறுவடை செய்வது நல்லது.",
      soil: "மண் ஆரோக்கியத்திற்கு pH 6.0–7.5 சிறந்தது. கரிம உரம் சேர்ப்பது ஈரப்பதத்தை தக்க வைக்கும்.",
      water: "சொட்டுநீர் பாசனம் 50% வரை தண்ணீரை சேமிக்கும். காலை அல்லது மாலையில் நீர் பாய்ச்சுங்கள்.",
      fertilizer: "விதைப்பு நேரத்தில் NPK (14-35-14) பயன்படுத்தவும். கதிர் கட்டும் தருணத்தில் யூரியா மேல் இடவும்.",
      pest: "பூச்சி கட்டுப்பாட்டிற்கு முதலில் வேப்பெண்ணெய் (5ml/லிட்டர்) தெளிக்கவும். தீவிரமானால் வேளாண் அதிகாரியை அணுகவும்.",
      default: "நல்ல கேள்வி! உங்கள் பயிர் வகை மற்றும் இடம் பற்றி கூறினால் மேலும் துல்லியமான ஆலோசனை தர இயலும்.",
    },
    hi: {
      hello: "नमस्ते! मैं युधिष्ठिर हूँ, आपका AI कृषि सहायक। मैं आपकी कैसे मदद कर सकता हूँ?",
      price: "वर्तमान बाजार रुझान के अनुसार, **गेहूं** की कीमतें बढ़ रही हैं। यदि भंडारण उपलब्ध है तो एक सप्ताह और प्रतीक्षा करें।\n\n*औसत मूल्य: ₹2,800/क्विंटल*",
      disease: "पत्तियों का पीला होना अक्सर **नाइट्रोजन की कमी** या **फंगल रोग** के कारण होता है।\n\n**क्या करें:**\n1. मिट्टी की नमी जांचें\n2. नाइट्रोजन युक्त खाद डालें\n3. भूरे धब्बे दिखें तो कवकनाशी का उपयोग करें",
      weather: "आज रात हल्की बारिश की संभावना है। सिंचाई से बचें और जल निकासी साफ रखें।",
      harvest: "कटाई का सही समय तब है जब अनाज की नमी **12–14%** हो। सुबह काटने से नुकसान कम होता है।",
      soil: "स्वस्थ मिट्टी के लिए pH 6.0–7.5 आदर्श है। जैविक खाद मिलाएं।",
      water: "ड्रिप सिंचाई से 50% पानी बचता है। सुबह या शाम को सिंचाई करें।",
      fertilizer: "बुवाई के समय NPK (14-35-14) उपयोग करें। कल्ले निकलते समय यूरिया छिड़काव करें।",
      pest: "कीट नियंत्रण के लिए पहले नीम तेल (5ml/लीटर) छिड़कें। गंभीर होने पर कृषि अधिकारी से मिलें।",
      default: "अच्छा प्रश्न! आपकी फसल और क्षेत्र के बारे में अधिक जानकारी दें ताकि मैं सटीक सलाह दे सकूं।",
    },
  };

  const r = responses[lang] || responses.en;

  if (/\b(hi|hello|hey|greetings)\b/i.test(p) || p.includes('வணக்கம்') || p.includes('നമസ്കാരം') || p.includes('नमस्ते')) return r.hello;
  if (/\b(price|market|cost|sell)\b/i.test(p) || p.includes('விலை') || p.includes('വില') || p.includes('कीमत')) return r.price;
  if (/\b(disease|yellow|leaf|leaves|sick)\b/i.test(p) || p.includes('நோய்') || p.includes('ഇല') || p.includes('रोग') || p.includes('पत्त')) return r.disease;
  if (/\b(weather|rain|storm|climate)\b/i.test(p) || p.includes('மழை') || p.includes('മഴ') || p.includes('बारिश') || p.includes('मौसम')) return r.weather;
  if (/\b(harvest|yield|cut)\b/i.test(p) || p.includes('அறுவடை') || p.includes('വിളവെടുപ്പ്') || p.includes('कटाई')) return r.harvest;
  if (/\b(soil|dirt|land|black)\b/i.test(p) || p.includes('மண்') || p.includes('മണ്ണ്') || p.includes('मिट्टी')) return r.soil;
  if (/\b(water|irrigat|irrigation)\b/i.test(p) || p.includes('தண்ணீர்') || p.includes('ജലം') || p.includes('पानी')) return r.water;
  if (/\b(fertilizer|urea|npk|compost)\b/i.test(p) || p.includes('உரம்') || p.includes('വളം') || p.includes('खाद')) return r.fertilizer;
  if (/\b(pest|insect|bug|worms)\b/i.test(p) || p.includes('பூச்சி') || p.includes('കീടം') || p.includes('कीट')) return r.pest;

  return r.default;
}

export default AIAssistant;
