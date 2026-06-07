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
// Smart offline fallback engine (used if all network APIs fail)
// Uses multi-keyword scoring + crop-specific + soil-type-specific responses
// Supports English, Tamil, Hindi, Malayalam
// ---------------------------------------------------------------------------

// Crop-specific knowledge base (English). Other languages use the generic
// category responses but English gets detailed crop+context answers.
const CROP_KB = {
  coconut: {
    soil: "**Coconut trees** thrive best in:\n\n- **Sandy loam** and **red laterite** soils\n- Well-drained, deep soils (at least 1.2m depth)\n- pH range: **5.5–7.0**\n- Avoid waterlogged or heavy clay soils\n\n**Kerala-specific tip:** Laterite soils in Malabar and coastal sandy soils in Alappuzha/Thrissur are ideal. Add dolomite lime if pH is below 5.5.",
    fertilizer: "**Coconut Fertilizer Schedule (per palm/year):**\n\n| Stage | Fertilizer | Qty |\n|-------|-----------|-----|\n| Year 1–3 | 1/3 of adult dose | — |\n| Adult palm | **Urea** | 1.3 kg |\n| | **Super Phosphate** | 2.0 kg |\n| | **Muriate of Potash (MOP)** | 2.0 kg |\n\n**When to apply:** Split into **two doses** — first during May–June (pre-monsoon), second during Sep–Oct (post-monsoon).\n\n**Kerala Tip:** Apply 25 kg organic manure (compost/FYM) per palm. In laterite soils, add **MgSO₄ (0.5 kg)** to prevent yellowing.",
    disease: "**Common Coconut Diseases in Kerala:**\n\n1. **Bud Rot** — Crown wilting, rotting smell\n   - Remove infected tissue, apply Bordeaux paste\n2. **Root Wilt (Kerala Wilt)** — Yellowing, flaccidity of leaflets\n   - No cure; manage with balanced fertilization\n3. **Leaf Blight** — Brown/grey lesions on leaflets\n   - Spray 1% Bordeaux mixture\n\n**Pests:** Rhinoceros beetle — use hook to remove, fill with neem cake.",
    harvest: "**Coconut Harvesting Guide:**\n\n- Harvest every **45–60 days** (6–7 times/year)\n- **Tender coconut:** 7–8 months after pollination\n- **Copra:** 11–12 months (fully mature, brown husk)\n- Best method: Trained climber or coconut climbing machine\n\n**Kerala Tip:** Avoid harvesting during heavy monsoon (Jun–Jul) to prevent fungal entry through cut surfaces.",
    water: "**Coconut Irrigation (Kerala):**\n\n- Summer (Feb–May): **250 litres per palm** every 4 days\n- Drip irrigation: Install **4 drippers** per palm (8 LPH each)\n- Basin irrigation radius: 1.8m from trunk\n- **Husk burial** in basins conserves 40% moisture\n\n**Monsoon:** Ensure drainage; waterlogging causes root rot.",
    default: "**Coconut (Cocos nucifera)** is Kerala's iconic crop, grown on 7.6 lakh hectares.\n\n**Key practices:**\n- Spacing: 7.5m × 7.5m (triangular)\n- Varieties: WCT (West Coast Tall), Chowghat Dwarf, Hybrid (Laksha Ganga)\n- Intercrop with banana, pepper, or cocoa for added income\n\nAsk me about coconut fertilizer, diseases, soil, or harvesting for detailed advice!",
  },
  sugarcane: {
    soil: "**Best Soil for Sugarcane:**\n\n- **Well-drained loamy** to **sandy loam** soils\n- pH range: **6.0–7.5**\n- Deep fertile soils with good organic matter\n- **Red soil** is suitable with proper irrigation and manuring\n- Avoid waterlogged or highly saline soils\n\n**Soil Preparation:** Deep plough to 30cm, add 25 tonnes/ha FYM before planting.",
    fertilizer: "**Sugarcane Fertilizer Schedule (per hectare):**\n\n| Timing | Fertilizer | Qty |\n|--------|-----------|-----|\n| Basal (planting) | **DAP** | 150 kg |\n| 30 days | **Urea** (1st top dress) | 100 kg |\n| 60 days | **Urea** (2nd top dress) | 100 kg |\n| 90 days | **MOP** | 120 kg |\n\n**NPK ratio:** 280:62:120 kg/ha\n\n**Tip:** Apply **Azospirillum** (2 kg/ha) to fix atmospheric nitrogen and reduce urea need by 25%.",
    default: "**Sugarcane** grows well in tropical climates with 75–120 cm rainfall.\n\n**Key info:**\n- Planting season: Jan–Mar or Oct–Nov\n- Spacing: 90cm row spacing, 30cm between setts\n- Duration: 12–18 months\n- Major varieties: Co 86032, CoC 671, Co 0238\n\nAsk me about sugarcane soil, fertilizer, or pest management!",
  },
  rubber: {
    soil: "**Best Soil for Rubber:**\n\n- **Laterite** and **red loamy** soils (common in Kerala)\n- Well-drained, deep soils (2m+ depth)\n- pH: **4.5–6.0** (tolerates acidic soils)\n- Avoid flat, waterlogged areas\n\n**Kerala Tip:** Kottayam, Ernakulam, and Wayanad have ideal laterite soils for rubber.",
    fertilizer: "**Rubber Fertilizer Schedule:**\n\n| Age | NPK Mix | Qty/tree/year |\n|-----|---------|---------------|\n| Year 1–5 | 10:10:4:1.5 (MgO) | 225–900g |\n| Tapping trees | 10:10:10 | 1.2 kg |\n\n**Apply in 2 splits:** Apr–May and Sep–Oct\n\n**Kerala Tip:** In laterite soils, add **rock phosphate** (150g/tree) and **dolomite** (500g/tree) annually.",
    default: "**Rubber (Hevea brasiliensis)** is Kerala's second largest plantation crop.\n\n**Key info:**\n- Spacing: 4.9m × 4.9m (approx. 420 trees/ha)\n- Tapping starts: Year 6–7\n- Avg yield: 1,500–2,000 kg dry rubber/ha/year\n- Best clones: RRII 105, RRII 430, RRII 414\n\nAsk about rubber tapping, diseases, or fertilizer schedule!",
  },
  banana: {
    soil: "**Best Soil for Banana:**\n\n- **Rich loamy** to **clay loam** soils\n- pH: **6.0–7.5**\n- Deep, well-drained, fertile soil with high organic matter\n- **Red soil** works well with good irrigation\n- Avoid rocky or poorly drained soils\n\n**Kerala varieties:** Nendran (cooking), Palayankodan, Robusta, Red Banana",
    fertilizer: "**Banana (Nendran) Fertilizer Schedule:**\n\n| Timing | N | P₂O₅ | K₂O |\n|--------|---|------|-----|\n| Planting (basal) | 50g | 200g | 100g |\n| 2 months | 50g | — | 100g |\n| 4 months | 50g | — | 100g |\n| 6 months | 50g | — | 100g |\n\n**Total/plant:** 200:200:400 g NPK\n\n**Kerala Tip:** Apply 10 kg FYM + 2 kg neem cake per pit. Mulch with dried leaves to retain moisture.",
    disease: "**Common Banana Diseases:**\n\n1. **Panama Wilt (Fusarium)** — Yellowing leaves, pseudostem splitting\n   - Remove infected plants, avoid replanting in same spot for 3 years\n2. **Sigatoka Leaf Spot** — Yellow streaks turning brown\n   - Spray Propiconazole (0.1%), remove infected leaves\n3. **Bunchy Top Virus** — Narrow, bunched leaves\n   - Destroy infected plants, control aphids\n\n**Kerala Tip:** Apply Trichoderma (50g/plant) in the planting pit for biocontrol.",
    default: "**Banana** is one of Kerala's most important fruit crops.\n\n**Key info:**\n- Popular varieties: Nendran, Palayankodan, Robusta, Poovan\n- Spacing: 2m × 2m (Nendran), 1.8m × 1.8m (Robusta)\n- Duration: 10–14 months\n- Yield: 20–25 kg/bunch (Nendran)\n\nAsk about banana fertilizer, diseases, or soil preparation!",
  },
  pepper: {
    soil: "**Best Soil for Black Pepper:**\n\n- **Red laterite** and **virgin forest loam** soils\n- Well-drained slopes, not flat waterlogged areas\n- pH: **5.5–6.5**\n- Rich in organic matter and humus\n\n**Kerala Tip:** Wayanad, Idukki, and Kannur hillsides have the ideal soil. Pepper grows as a vine on support trees (erythrina, silver oak).",
    fertilizer: "**Black Pepper Fertilizer (per vine/year):**\n\n| Nutrient | Qty |\n|----------|-----|\n| **FYM/Compost** | 10 kg |\n| **Urea** | 100g |\n| **Super Phosphate** | 200g |\n| **MOP** | 280g |\n\n**Apply in 2 splits:** May–Jun and Sep–Oct\n\n**Kerala Tip:** Mulch basins with green leaves (25 kg/vine). Apply **Trichoderma** (50g) + neem cake (1 kg) for disease prevention.",
    default: "**Black Pepper** (King of Spices) is Kerala's most valuable spice crop.\n\n**Key info:**\n- Propagation: Rooted cuttings on standards\n- Bearing age: Year 3–4\n- Harvest: Dec–Feb (berries turn red)\n- Avg yield: 2–4 kg dry pepper/vine\n\nAsk about pepper soil, fertilizer, or disease management!",
  },
  cardamom: {
    soil: "**Best Soil for Cardamom:**\n\n- **Forest loam** with thick humus layer\n- Well-drained slopes at 600–1500m elevation\n- pH: **5.0–6.5**\n- Partial shade (40–60% canopy cover)\n\n**Kerala Tip:** Idukki district is the \"Cardamom capital.\" Maintain shade trees and avoid clearing forest canopy.",
    default: "**Cardamom** (Queen of Spices) grows in Kerala's Western Ghats.\n\n**Key info:**\n- Varieties: Malabar, Mysore, Vazhukka\n- Spacing: 2m × 2m under shade\n- Harvest: Aug–Feb (capsules turn green-ripe)\n- Yield: 150–300 kg/ha dried capsules\n\nAsk about cardamom soil, fertilizer, or disease management!",
  },
  rice: {
    soil: "**Best Soil for Rice (Paddy):**\n\n- **Clay** and **clay loam** soils that retain water\n- pH: **5.5–7.0**\n- Level fields that can be flooded\n- **Alluvial** and **deltaic** soils are excellent\n- **Red soil** can work for upland/aerobic rice with adequate irrigation\n\n**Kerala Tip:** Kuttanad (below sea level) and Palakkad are prime rice regions. Pokkali rice grows in saline coastal soils.",
    fertilizer: "**Rice Fertilizer Schedule (per hectare):**\n\n| Timing | Fertilizer | Qty |\n|--------|-----------|-----|\n| Basal (transplanting) | DAP | 100 kg |\n| 21 days (tillering) | **Urea** | 50 kg |\n| 42 days (panicle) | **Urea + MOP** | 50 + 50 kg |\n\n**NPK ratio:** 90:45:45 kg/ha\n\n**Kerala Tip:** For Pokkali fields, reduce chemical fertilizer and rely more on organic manure (green manure + azolla).",
    default: "**Rice** is Kerala's staple food crop.\n\n**Key info:**\n- Seasons: Virippu (Apr–Sep), Mundakan (Sep–Jan), Puncha (Jan–May)\n- Popular varieties: Jyothi, Uma, Kanchana, Pokkali\n- Spacing: 20cm × 15cm\n- Yield: 4–6 tonnes/ha\n\nAsk about rice fertilizer, diseases, or water management!",
  },
};

// Soil-type specific crop recommendations
const SOIL_CROP_KB = {
  en: {
    red: "**Crops Suitable for Red Soil:**\n\n| Crop | Suitability | Notes |\n|------|------------|-------|\n| 🥜 **Groundnut** | ★★★★★ | Excellent in red sandy loam |\n| 🌻 **Sunflower** | ★★★★★ | Thrives in well-drained red soil |\n| 🍅 **Tomato** | ★★★★☆ | With adequate irrigation |\n| 🌶️ **Chilli** | ★★★★☆ | Red loam is ideal |\n| 🫘 **Pulses (Redgram, Bengalgram)** | ★★★★☆ | Low water requirement |\n| 🥭 **Mango** | ★★★★★ | Deep red loam preferred |\n| 🍌 **Banana** | ★★★☆☆ | Needs good organic manuring |\n| 🌾 **Millets (Ragi, Bajra)** | ★★★★★ | Drought tolerant |\n\n**Red Soil Tips:**\n- Rich in **iron oxide** but poor in nitrogen, phosphorus, and humus\n- Add **FYM/compost** (10–15 tonnes/ha) to improve fertility\n- Apply **lime** if pH is below 5.5\n- **Mulching** is critical to prevent moisture loss\n\n**Kerala Context:** Red laterite soils in Wayanad, Kannur, and Kasaragod support cashew, rubber, coconut, pepper, and cocoa.",
    laterite: "**Crops for Laterite Soil (Common in Kerala):**\n\n- 🌴 **Coconut** — Primary crop, excellent with organic manuring\n- 🫚 **Rubber** — Thrives in deep laterite\n- 🌶️ **Black Pepper** — On laterite hill slopes\n- 🥥 **Cashew** — Low-input, drought-tolerant\n- 🍫 **Cocoa** — As intercrop with coconut\n- 🍌 **Banana** — With adequate FYM and irrigation\n\n**Laterite Soil Tips:** High in iron/aluminium, low in nutrients. Apply dolomite lime + organic manure annually.",
    sandy: "**Crops for Sandy/Coastal Soil:**\n\n- 🌴 **Coconut** — Excellent in coastal sandy soils\n- 🥒 **Cucumber & Watermelon** — Light sandy soils are ideal\n- 🥜 **Groundnut** — Well-drained sandy loam\n- 🥕 **Carrot & Radish** — Root crops love loose sandy soil\n- 🧅 **Onion** — Sandy loam with good drainage\n\n**Tips:** Sandy soil drains fast — use mulching + drip irrigation. Add organic compost to improve water-holding capacity.",
    clay: "**Crops for Clay/Heavy Soil:**\n\n- 🌾 **Rice (Paddy)** — Perfect for water-retaining clay\n- 🌿 **Sugarcane** — Clay loam with good drainage\n- 🥬 **Cabbage & Cauliflower** — Heavy soils with good nutrition\n- 🌻 **Sunflower** — Clay loam soils\n- 🫘 **Soybean** — Clay to loamy soils\n\n**Tips:** Clay retains moisture but can waterlog. Add **gypsum** (500 kg/ha) and organic matter to improve tilth and drainage.",
    black: "**Crops for Black (Regur) Soil:**\n\n- 🌿 **Cotton** — Black soil is called \"cotton soil\" for a reason!\n- 🌻 **Sunflower** — Deep black soils\n- 🌿 **Sugarcane** — Rich, moisture-retaining black soil\n- 🫘 **Soybean & Pigeon pea** — Excellent in deep black soil\n- 🌾 **Wheat & Jowar** — Good moisture retention\n\n**Tips:** Black soil swells when wet and cracks when dry. Practice dry farming techniques and add **sand + organic matter** to improve structure.",
  },
  ml: {
    red: "**ചുവന്ന മണ്ണിന് അനുയോജ്യമായ വിളകൾ:**\n\n- 🥜 **നിലക്കടല** — ചുവന്ന മണൽ ലോമിൽ മികച്ചത്\n- 🌻 **സൂര്യകാന്തി** — നന്നായി വറ്റുന്ന ചുവന്ന മണ്ണിൽ\n- 🍅 **തക്കാളി** — മതിയായ ജലസേചനത്തോടെ\n- 🌶️ **മുളക്** — ചുവന്ന ലോം അനുയോജ്യം\n- 🥭 **മാവ്** — ആഴമുള്ള ചുവന്ന ലോം\n- 🌾 **റാഗി, കമ്പം** — വരൾച്ചാ സഹിഷ്ണുത\n\n**കേരള സന്ദർഭം:** വയനാട്, കണ്ണൂർ, കാസർഗോഡ് ജില്ലകളിലെ ലാറ്ററൈറ്റ് മണ്ണിൽ കശുമാവ്, റബ്ബർ, തെങ്ങ്, കുരുമുളക് നന്നായി വളരും.",
    default: "നിങ്ങളുടെ മണ്ണിന്റെ തരം പറഞ്ഞാൽ (ചുവന്ന, ലാറ്ററൈറ്റ്, മണൽ, കളിമണ്ണ്) കൃത്യമായ വിള ശുപാർശകൾ നൽകാൻ കഴിയും.",
  },
  ta: {
    red: "**சிவப்பு மண்ணுக்கு ஏற்ற பயிர்கள்:**\n\n- 🥜 **நிலக்கடலை** — சிவப்பு மணல் களிமண்ணில் சிறந்தது\n- 🌻 **சூரியகாந்தி** — நன்கு வடிகட்டிய சிவப்பு மண்\n- 🍅 **தக்காளி** — போதுமான நீர்ப்பாசனத்துடன்\n- 🌶️ **மிளகாய்** — சிவப்பு களிமண் சிறந்தது\n- 🥭 **மாம்பழம்** — ஆழமான சிவப்பு மண்\n- 🌾 **கேழ்வரகு, கம்பு** — வறட்சியைத் தாங்கும்",
    default: "உங்கள் மண் வகையைக் கூறினால் (சிவப்பு, மணல், களிமண்) துல்லியமான பயிர் பரிந்துரைகள் தர இயலும்.",
  },
  hi: {
    red: "**लाल मिट्टी के लिए उपयुक्त फसलें:**\n\n- 🥜 **मूंगफली** — लाल दोमट में उत्कृष्ट\n- 🌻 **सूरजमुखी** — अच्छी जल निकासी वाली लाल मिट्टी\n- 🍅 **टमाटर** — पर्याप्त सिंचाई के साथ\n- 🌶️ **मिर्च** — लाल दोमट आदर्श\n- 🥭 **आम** — गहरी लाल दोमट\n- 🌾 **रागी, बाजरा** — सूखा सहनशील",
    default: "अपनी मिट्टी का प्रकार बताएं (लाल, रेतीली, चिकनी) ताकि सटीक फसल सुझाव दे सकूं।",
  },
};

function getFallbackResponse(prompt, lang) {
  const p = prompt.toLowerCase();

  // --- Greeting detection (high priority, checked first) ---
  if (/\b(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(p) ||
      p.includes('வணக்கம்') || p.includes('നമസ്കാരം') || p.includes('नमस्ते') || p.includes('नमस्कार')) {
    const greetings = {
      en: "Hello! I'm **Karshaka AI**, your smart farming assistant 🌾\n\nI can help you with:\n- 🌿 **Crop disease** identification & treatment\n- 💧 **Fertilizer schedules** for Kerala's major crops\n- 🌦️ **Monsoon preparation** tips\n- 📈 **Market advice** & best selling times\n- 🏞️ **Soil-crop matching** recommendations\n\n*Ask me anything about farming!*\n\n> ⚠️ *Running in offline mode — responses are from our knowledge base. For AI-powered answers, ensure the Gemini API key is configured.*",
      ml: "നമസ്കാരം! ഞാൻ **Karshaka AI**, നിങ്ങളുടെ എഐ കൃഷി സഹായി 🌾\n\nഞാൻ സഹായിക്കാൻ കഴിയുന്ന കാര്യങ്ങൾ:\n- 🌿 **വിള രോഗ** തിരിച്ചറിയൽ & ചികിത്സ\n- 💧 കേരളത്തിലെ പ്രധാന വിളകൾക്കുള്ള **വളപ്രയോഗ ഷെഡ്യൂൾ**\n- 🌦️ **മൺസൂൺ തയ്യാറെടുപ്പ്** നുറുങ്ങുകൾ\n- 📈 **വിപണി ഉപദേശം**\n- 🏞️ **മണ്ണ്-വിള പൊരുത്തം** ശുപാർശകൾ\n\n*കൃഷിയെക്കുറിച്ച് എന്തും ചോദിക്കൂ!*",
      ta: "வணக்கம்! நான் **Karshaka AI**, உங்கள் AI விவசாய உதவியாளர் 🌾\n\nநான் உதவக்கூடிய விஷயங்கள்:\n- 🌿 **பயிர் நோய்** அடையாளம் & சிகிச்சை\n- 💧 **உர அட்டவணை**\n- 🌦️ **பருவமழை தயாரிப்பு**\n- 📈 **சந்தை ஆலோசனை**\n\n*விவசாயம் பற்றி எதையும் கேளுங்கள்!*",
      hi: "नमस्ते! मैं **Karshaka AI**, आपका AI कृषि सहायक 🌾\n\nमैं इनमें मदद कर सकता हूँ:\n- 🌿 **फसल रोग** पहचान & उपचार\n- 💧 **उर्वरक अनुसूची**\n- 🌦️ **मानसून तैयारी**\n- 📈 **बाज़ार सलाह**\n\n*खेती के बारे में कुछ भी पूछें!*",
    };
    return (greetings[lang] || greetings.en);
  }

  // --- Detect crop mentioned in the query ---
  const cropPatterns = {
    coconut:  /\b(coconut|copra|narial|thenga|thengu|തെങ്ങ്|നാളികേരം|தென்னை|नारियल)\b/i,
    sugarcane:/\b(sugarcane|sugar\s*cane|ganna|karumbu|கரும்பு|கரும்பு|गन्ना)\b/i,
    rubber:   /\b(rubber|hevea|റബ്ബർ|ரப்பர்|रबर|रबड़)\b/i,
    banana:   /\b(banana|plantain|vazha|വാഴ|வாழை|केला)\b/i,
    pepper:   /\b(pepper|kurumulaku|കുരുമുളക്|மிளகு|काली\s*मिर्च)\b/i,
    cardamom: /\b(cardamom|elaichi|ഏലം|ஏலக்காய்|इलायची)\b/i,
    rice:     /\b(rice|paddy|nel|നെല്ല്|நெல்|चावल|धान)\b/i,
  };

  let detectedCrop = null;
  for (const [crop, regex] of Object.entries(cropPatterns)) {
    if (regex.test(p)) { detectedCrop = crop; break; }
  }

  // --- Detect topic (category) ---
  const topicPatterns = {
    soil:       /\b(soil|dirt|land|loam|laterite|clay|sandy|alluvial|which.*(crop|suitable|grow)|suitable.*(crop|for)|what.*(grow|plant|crop))\b/i,
    fertilizer: /\b(fertiliz|fertilis|urea|npk|compost|manure|nutrient|dap|potash|phosphate|fym|schedule)\b/i,
    disease:    /\b(disease|yellow|leaf|leaves|sick|wilt|blight|rot|fungus|fungal|virus|infect|symptom)\b/i,
    pest:       /\b(pest|insect|bug|worm|beetle|aphid|mite|caterpillar|borer)\b/i,
    harvest:    /\b(harvest|yield|cut|picking|pluck|when\s+to\s+(harvest|pick|cut))\b/i,
    water:      /\b(water|irrigat|irrigation|drip|flood|moisture|rain\s*water)\b/i,
    weather:    /\b(weather|rain|storm|climate|monsoon|season|flood|drought)\b/i,
    price:      /\b(price|market|cost|sell|buy|profit|rate|mandi|trade)\b/i,
  };

  // Also check for non-English topic keywords
  const topicNonEn = {
    soil:       [/மண்/, /മണ്ണ്/, /मिट्टी/, /ചുവന്ന/, /ലാറ്ററൈറ്റ്/],
    fertilizer: [/உரம்/, /വളം/, /खाद/, /யூரியா/, /യൂറിയ/],
    disease:    [/நோய்/, /ഇല/, /रोग/, /पत्त/, /രോഗം/],
    pest:       [/பூச்சி/, /കീടം/, /कीट/],
    harvest:    [/அறுவடை/, /വിളവെടുപ്പ്/, /कटाई/],
    water:      [/தண்ணீர்/, /ജലം/, /पानी/, /ജലസേചനം/],
    weather:    [/மழை/, /മഴ/, /बारिश/, /मौसम/, /മൺസൂൺ/],
    price:      [/விலை/, /വില/, /कीमत/, /बाज़ार/],
  };

  let detectedTopic = null;
  for (const [topic, regex] of Object.entries(topicPatterns)) {
    if (regex.test(p)) { detectedTopic = topic; break; }
  }
  if (!detectedTopic) {
    for (const [topic, regexes] of Object.entries(topicNonEn)) {
      if (regexes.some(r => r.test(p))) { detectedTopic = topic; break; }
    }
  }

  // --- Detect soil type for soil-crop matching ---
  const soilTypePatterns = {
    red:      /\b(red|laterite|ചുവന്ന|ലാറ്ററൈറ്റ്|சிவப்பு|लाल)\b/i,
    laterite: /\b(laterite|ലാറ്ററൈറ്റ്)\b/i,
    sandy:    /\b(sandy|sand|coastal|മണൽ|மணல்|रेतीली|बालू)\b/i,
    clay:     /\b(clay|heavy|കളിമണ്ണ്|களிமண்|चिकनी)\b/i,
    black:    /\b(black|regur|cotton\s*soil|கருப்பு|കറുത്ത|काली)\b/i,
  };

  let detectedSoilType = null;
  for (const [st, regex] of Object.entries(soilTypePatterns)) {
    if (regex.test(p)) { detectedSoilType = st; break; }
  }

  // --- Build response with priority: crop+topic > soil-type > topic > crop > default ---

  // 1. Crop + topic combination (most specific)
  if (detectedCrop && detectedTopic && CROP_KB[detectedCrop]) {
    const cropData = CROP_KB[detectedCrop];
    if (cropData[detectedTopic]) return cropData[detectedTopic];
    if (cropData.default) return cropData.default;
  }

  // 2. Soil type question ("which crop for red soil")
  if (detectedSoilType && (detectedTopic === 'soil' || /\b(crop|suitable|grow|plant|which|what)\b/i.test(p))) {
    const soilLang = SOIL_CROP_KB[lang] || SOIL_CROP_KB.en;
    return soilLang[detectedSoilType] || soilLang.default || SOIL_CROP_KB.en[detectedSoilType] || SOIL_CROP_KB.en.red;
  }

  // 3. Crop mentioned but no specific topic
  if (detectedCrop && CROP_KB[detectedCrop]) {
    return CROP_KB[detectedCrop].default || `I can help with **${detectedCrop}** farming! Ask me about soil, fertilizer, diseases, or harvesting for detailed advice.`;
  }

  // 4. Topic only (generic responses per language)
  if (detectedTopic) {
    const genericResponses = {
      en: {
        soil: "**Soil Health Guide:**\n\n| Soil Type | pH Range | Best Crops |\n|-----------|----------|------------|\n| Red/Laterite | 5.5–6.5 | Coconut, Rubber, Cashew, Pepper |\n| Sandy Loam | 6.0–7.0 | Groundnut, Vegetables, Banana |\n| Clay/Alluvial | 5.5–7.0 | Rice, Sugarcane, Jute |\n| Black/Regur | 6.5–8.0 | Cotton, Soybean, Sunflower |\n\n**Tips:**\n- Test soil every 2 years at your nearest **Soil Testing Lab**\n- Add **organic compost** (10–15 tonnes/ha) annually\n- **Mulching** conserves 30–40% soil moisture\n\n*Tell me your soil type or crop name for specific advice!*",
        fertilizer: "**General Fertilizer Guide for Kerala:**\n\n- Always **soil-test first** to know exact nutrient needs\n- Apply fertilizers in **splits** (2–3 times), not all at once\n- Use **organic manure** (FYM, compost) as base + chemical top-dress\n- NPK ratio varies by crop — tell me which crop for a detailed schedule\n\n**Popular Kerala crop schedules available:**\n🌴 Coconut | 🌿 Rubber | 🍌 Banana | 🌶️ Pepper | 🌾 Rice\n\n*Ask: \"fertilizer for coconut\" for the complete schedule!*",
        disease: "**Crop Disease Identification Tips:**\n\n1. **Yellowing leaves** → Nitrogen deficiency or fungal infection\n2. **Brown/black spots** → Bacterial/fungal leaf spot\n3. **Wilting** → Root rot, Fusarium, or water stress\n4. **Curling leaves** → Viral infection or pest damage\n5. **White powdery coating** → Powdery mildew\n\n**Action Steps:**\n- Take clear photos of affected parts\n- Check if it's spreading to neighbouring plants\n- Consult your nearest **Krishi Vigyan Kendra (KVK)**\n\n*Tell me the crop name for disease-specific advice!*",
        pest: "**Integrated Pest Management (IPM) Steps:**\n\n1. **Prevention:** Crop rotation, resistant varieties, clean cultivation\n2. **Biological:** Neem oil (5ml/L), Trichoderma, Pseudomonas\n3. **Mechanical:** Pheromone traps, sticky traps, hand-picking\n4. **Chemical (last resort):** Use approved pesticides at correct dosage\n\n**Kerala-specific pests:**\n- Coconut: Rhinoceros beetle, Red palm weevil\n- Banana: Pseudostem weevil, Nematodes\n- Pepper: Pollu beetle, Quick wilt\n\n*Tell me the crop for specific pest control advice!*",
        harvest: "**Harvesting Best Practices:**\n\n- Harvest at **optimal moisture content** for your crop\n- Early morning harvesting reduces grain shattering\n- Use sharp, clean tools to minimize crop damage\n- Dry produce to safe moisture levels before storage\n\n**Kerala crop harvest seasons:**\n- 🌴 Coconut: Every 45–60 days year-round\n- 🌶️ Pepper: Dec–Feb\n- 🌾 Rice: Varies by season (Virippu/Mundakan/Puncha)\n- 🍌 Banana: 10–14 months after planting",
        water: "**Smart Irrigation Guide:**\n\n| Method | Water Saving | Best For |\n|--------|-------------|----------|\n| Drip | 40–60% | Coconut, Banana, Vegetables |\n| Sprinkler | 30–40% | Field crops, Nurseries |\n| Basin | 20–30% | Tree crops |\n| Flood | Baseline | Rice (paddy) |\n\n**Tips:**\n- Irrigate **early morning or evening** to reduce evaporation\n- Use **mulching** to retain soil moisture\n- Install **rain water harvesting** for summer irrigation\n\n**Kerala Tip:** Apply for **PM-KUSUM** scheme for solar-powered irrigation pumps.",
        weather: "**Monsoon Preparation Checklist (Kerala):**\n\n- ✅ Clean all **drainage channels** before June\n- ✅ Apply **Bordeaux mixture** on vulnerable crops\n- ✅ Stake/support tall plants (banana, pepper vines)\n- ✅ Harvest mature crops **before heavy rains**\n- ✅ Store seeds and fertilizer in **dry, elevated areas**\n- ✅ Check bund strength in paddy fields\n\n**Kerala Monsoon:** SW Monsoon (Jun–Sep), NE Monsoon (Oct–Nov)\n\n**Flood-prone areas:** Prepare **raised beds** and ensure pump-out arrangements.",
        price: "**Market Tips for Kerala Farmers:**\n\n- Check daily prices on **Agmarknet** (agmarknet.gov.in)\n- Use **e-NAM** platform for competitive bidding\n- **Rubber:** Currently ₹170–185/kg (sheet rubber)\n- **Coconut:** ₹25–35 per nut | Copra: ₹10,000–12,000/quintal\n- **Pepper:** ₹400–550/kg\n- **Banana (Nendran):** ₹30–50/kg\n\n**Tips:**\n- Join a **Farmer Producer Organisation (FPO)** for better prices\n- Value-add: Virgin coconut oil, dried pepper, banana chips increase margins 2–3x\n\n*Prices are indicative. Check local mandi rates for current prices.*",
      },
      ml: {
        soil: "**മണ്ണിന്റെ ആരോഗ്യ ഗൈഡ്:**\n\n- pH 6.0–7.5 ആണ് മിക്ക വിളകൾക്കും ഉത്തമം\n- 2 വർഷത്തിലൊരിക്കൽ **മണ്ണ് പരിശോധന** നടത്തുക\n- **ജൈവ കമ്പോസ്റ്റ്** (10–15 ടൺ/ഹെക്ടർ) ചേർക്കുക\n- **മൾച്ചിംഗ്** 30–40% ഈർപ്പം സംരക്ഷിക്കും\n\n*നിങ്ങളുടെ മണ്ണിന്റെ തരം അല്ലെങ്കിൽ വിള പറയൂ, കൃത്യമായ ഉപദേശം തരാം!*",
        fertilizer: "**വളപ്രയോഗ പൊതു ഗൈഡ്:**\n\n- ആദ്യം **മണ്ണ് പരിശോധന** നടത്തുക\n- വളം **2–3 ഘട്ടങ്ങളായി** ചേർക്കുക\n- **ജൈവ വളം** (FYM, കമ്പോസ്റ്റ്) അടിസ്ഥാനമായി ഉപയോഗിക്കുക\n\n**ലഭ്യമായ ഷെഡ്യൂളുകൾ:**\n🌴 തെങ്ങ് | 🌿 റബ്ബർ | 🍌 വാഴ | 🌶️ കുരുമുളക് | 🌾 നെല്ല്\n\n*\"തെങ്ങിന് വളം\" എന്ന് ചോദിക്കൂ!*",
        disease: "**വിള രോഗ തിരിച്ചറിയൽ:**\n\n1. **ഇല മഞ്ഞളിക്കൽ** → നൈട്രജൻ കുറവ് / ഫംഗസ്\n2. **തവിട്ട്/കറുത്ത പൊട്ടുകൾ** → ബാക്ടീരിയൽ/ഫംഗൽ\n3. **വാട്ടം** → വേര് ചീയൽ, ഫ്യൂസേറിയം\n4. **ഇല ചുരുളൽ** → വൈറസ് / കീടം\n\n*വിളയുടെ പേര് പറയൂ, കൃത്യമായ ഉപദേശം തരാം!*",
        pest: "**കീടനിയന്ത്രണം (IPM):**\n\n1. **പ്രതിരോധം:** വിള ഭ്രമണം, പ്രതിരോധ ഇനങ്ങൾ\n2. **ജൈവ:** വേപ്പ് എണ്ണ (5ml/L), ട്രൈക്കോഡെർമ\n3. **യാന്ത്രിക:** ഫെറോമോൺ കെണി\n4. **രാസ (അവസാന മാർഗ്ഗം):** അംഗീകൃത കീടനാശിനി\n\n*വിളയുടെ പേര് പറയൂ!*",
        water: "**ജലസേചന ഗൈഡ്:**\n\n- **ഡ്രിപ്പ്** ജലസേചനം 40–60% ജലം ലാഭിക്കും\n- രാവിലെ അല്ലെങ്കിൽ വൈകിട്ട് നനയ്ക്കൂ\n- **മൾച്ചിംഗ്** ഉപയോഗിക്കൂ\n- **മഴവെള്ള സംഭരണം** വേനൽക്കാല ജലസേചനത്തിന്",
        weather: "**മൺസൂൺ തയ്യാറെടുപ്പ് (കേരളം):**\n\n- ✅ എല്ലാ **നീർത്തടങ്ങളും** വൃത്തിയാക്കുക\n- ✅ ദുർബല വിളകളിൽ **ബോർഡോ മിശ്രിതം** പ്രയോഗിക്കുക\n- ✅ ഉയരമുള്ള ചെടികൾ **താങ്ങ് നൽകുക**\n- ✅ പക്വമായ വിളകൾ **മഴയ്ക്ക് മുമ്പ് വിളവെടുക്കുക**",
        harvest: "**വിളവെടുപ്പ് ഗൈഡ്:**\n\n- ശരിയായ **ഈർപ്പ നിലയിൽ** വിളവെടുക്കുക\n- രാവിലെ വിളവെടുക്കുന്നത് നഷ്ടം കുറയ്ക്കും\n- കൃത്യമായ **ഉണക്കലും സംഭരണവും** പ്രധാനം",
        price: "**വിപണി ഉപദേശം:**\n\n- **Agmarknet** വെബ്സൈറ്റിൽ ദൈനംദിന വില പരിശോധിക്കുക\n- **e-NAM** പ്ലാറ്റ്ഫോം ഉപയോഗിക്കൂ\n- **FPO**-യിൽ ചേരുക, മെച്ചമായ വില ലഭിക്കും",
      },
      ta: {
        soil: "**மண் ஆரோக்கிய வழிகாட்டி:**\n\n- pH 6.0–7.5 பெரும்பாலான பயிர்களுக்கு சிறந்தது\n- 2 ஆண்டுகளுக்கு ஒருமுறை **மண் பரிசோதனை** செய்யவும்\n- **கரிம உரம்** (10–15 டன்/ஹெக்டர்) சேர்க்கவும்\n\n*உங்கள் மண் வகை அல்லது பயிர் பெயரைக் கூறினால் துல்லியமான ஆலோசனை தர இயலும்!*",
        fertilizer: "**உர பொது வழிகாட்டி:**\n\n- முதலில் **மண் பரிசோதனை** செய்யவும்\n- உரத்தை **2–3 தவணைகளாக** இடவும்\n- **கரிம உரம்** அடிப்படையாக பயன்படுத்தவும்\n\n*\"தேங்காய்க்கு உரம்\" என்று கேளுங்கள்!*",
        default: "விவசாயம் பற்றிய உங்கள் கேள்விக்கு பதில்:\n\nஉங்கள் பயிர் வகை மற்றும் இடம் பற்றி கூறினால் மேலும் துல்லியமான ஆலோசனை தர இயலும்.",
      },
      hi: {
        soil: "**मिट्टी स्वास्थ्य गाइड:**\n\n- pH 6.0–7.5 अधिकांश फसलों के लिए आदर्श\n- हर 2 साल में **मिट्टी परीक्षण** करें\n- **जैविक खाद** (10–15 टन/हेक्टर) मिलाएं\n\n*अपनी मिट्टी का प्रकार या फसल का नाम बताएं!*",
        fertilizer: "**उर्वरक सामान्य गाइड:**\n\n- पहले **मिट्टी परीक्षण** करें\n- खाद **2–3 किस्तों** में दें\n- **जैविक खाद** आधार के रूप में उपयोग करें\n\n*\"नारियल के लिए खाद\" पूछें!*",
        default: "खेती संबंधी आपके प्रश्न के लिए:\n\nअपनी फसल और क्षेत्र के बारे में अधिक जानकारी दें ताकि मैं सटीक सलाह दे सकूं।",
      },
    };

    const langResponses = genericResponses[lang] || genericResponses.en;
    return langResponses[detectedTopic] || langResponses.default || genericResponses.en[detectedTopic] || genericResponses.en.soil;
  }

  // 5. Default fallback
  const defaults = {
    en: "I'm here to help with all your farming questions! 🌾\n\nTry asking about:\n- **\"Which crop is suitable for red soil?\"**\n- **\"Fertilizer schedule for coconut\"**\n- **\"Banana leaf disease treatment\"**\n- **\"Best time to sell pepper\"**\n- **\"How to prepare for monsoon?\"**\n\n*Tip: Mention a specific crop name (coconut, banana, rubber, pepper, rice, sugarcane) for detailed advice!*\n\n> ⚠️ *Running in offline mode. For AI-powered answers, a valid Gemini API key is needed.*",
    ml: "കൃഷി സംബന്ധമായ എല്ലാ ചോദ്യങ്ങൾക്കും ഞാൻ ഇവിടെയുണ്ട്! 🌾\n\nഇങ്ങനെ ചോദിച്ചു നോക്കൂ:\n- **\"ചുവന്ന മണ്ണിന് ഏത് വിള?\"**\n- **\"തെങ്ങിന് വളം\"**\n- **\"വാഴ ഇല രോഗം\"**\n- **\"കുരുമുളക് വിൽക്കാൻ നല്ല സമയം\"**\n\n*ഒരു നിശ്ചിത വിളയുടെ പേര് പറയൂ (തെങ്ങ്, വാഴ, റബ്ബർ, കുരുമുളക്, നെല്ല്) വിശദമായ ഉപദേശത്തിന്!*",
    ta: "விவசாய கேள்விகளுக்கு நான் இங்கே இருக்கிறேன்! 🌾\n\nஇவற்றைக் கேளுங்கள்:\n- **\"சிவப்பு மண்ணுக்கு ஏற்ற பயிர்?\"**\n- **\"தேங்காய்க்கு உரம்\"**\n- **\"வாழை இலை நோய்\"**\n\n*ஒரு குறிப்பிட்ட பயிர் பெயரைக் கூறுங்கள்!*",
    hi: "खेती के सवालों में मदद के लिए मैं यहाँ हूँ! 🌾\n\nये पूछ कर देखें:\n- **\"लाल मिट्टी के लिए कौन सी फसल?\"**\n- **\"नारियल के लिए खाद\"**\n- **\"केला पत्ती रोग\"**\n\n*एक विशिष्ट फसल का नाम बताएं (नारियल, केला, रबर, काली मिर्च, धान)!*",
  };

  return defaults[lang] || defaults.en;
}

export default AIAssistant;
