import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  // Simple in-memory user store (seeded with a demo account)
  const [users, setUsers] = useState([{ name: 'Demo Farmer', email: 'demo@karshaka.ai', username: 'demo', password: 'demo123' }]);

  const translations = {
    en: {
      greeting: 'Welcome to Karshaka AI', welcomeBack: 'Welcome back', login: 'Login', selectLanguage: 'Select Language',
      dashboard: 'Dashboard', weather: 'Weather', market: 'Market', logistics: 'Logistics', soilmoisture: 'Soil Moisture', ai: 'AI Assistant', logout: 'Logout',
      farmerAccount: 'Farmer Account', cropGrowth: 'Crop Growth', cropGrowthSubtitle: 'Ready for harvest in 5 days',
      soilMoisture: 'Soil Moisture', soilMoistureSubtitle: 'Optimal level maintained', temperature: 'Temperature', temperatureSubtitle: 'Partly cloudy today',
      cropGrowthProjection: 'Crop Growth Projection', currentMarketPrices: 'Current Market Prices', partlyCloudy: 'Partly Cloudy', location: 'Erode, Tamil Nadu',
      wind: 'Wind', humidity: 'Humidity', rainChance: 'Rain Chance', uvIndex: 'UV Index', moderate: 'Moderate', next24Hours: 'Next 24 Hours',
      farmingTip: 'Farming Tip for Today', farmingTipDesc: "The forecast suggests possible light rain tonight. It's a great time to skip manual irrigation for your deep-rooted crops, but ensure excellent drainage systems are clear if you've recently seeded.",
      sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain',
      commodityTrends: 'Commodity Trends', commodityTrendsSub: 'Real-time market price overview', cropName: 'Crop Name', currentPrice: 'Current Price', change24h: '24h Change', status: 'Status',
      favorable: 'Favorable', declining: 'Declining', wheat: 'Wheat', rice: 'Rice', tomato: 'Tomato', soybean: 'Soybean', corn: 'Corn',
      coconut: 'Coconut', banana: 'Banana', pepper: 'Pepper', rubber: 'Rubber',
      transportLogistics: 'Transport & Logistics', transportLogisticsSub: 'Track your outgoing harvest and inbound supplies.', newShipment: 'New Shipment', trackingId: 'TRACKING ID', farm: 'Farm', est: 'Est.', logisticsPartner: 'Logistics Partner', viewDetails: 'View Details', inTransit: 'In Transit', delivered: 'Delivered',
      wheatHarvest: 'Wheat Harvest', organicTomatoes: 'Organic Tomatoes', fertilizerSupply: 'Fertilizer Supply', cityMarketWarehouse: 'City Market Warehouse', freshMartHub: 'Fresh Mart Hub', farmStorage2: 'Farm Storage 2',
      aiTitle: 'Karshaka AI', poweredBy: 'Powered by Smart Agriculture Models', askAnything: 'Ask me anything about your farm...', aiWarning: 'AI can make mistakes. Consider verifying critical farming decisions.', typing: 'Karshaka is typing...', aiWelcomeMsg: 'Hello! I am Karshaka AI, your smart farming assistant. How can I help you today? You can ask me about crop diseases, market forecasts, or optimal harvesting times.',
    },
    ta: {
      greeting: 'Karshaka AI-க்கு வரவேற்கிறோம்', welcomeBack: 'மீண்டும் வருக', login: 'உள்நுழைய', selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
      dashboard: 'கட்டுப்பாட்டு அறை', weather: 'வானிலை', market: 'சந்தை', logistics: 'தளவாடங்கள்', soilmoisture: 'மண் ஈரப்பதம்', ai: 'செயற்கை அறிவு உதவியாளர்', logout: 'வெளியேறு',
      farmerAccount: 'விவசாயி கணக்கு', cropGrowth: 'பயிர் வளர்ச்சி', cropGrowthSubtitle: '5 நாட்களில் அறுவடைக்கு தயார்',
      soilMoisture: 'மண் ஈரப்பதம்', soilMoistureSubtitle: 'உகந்த நிலை பராமரிக்கப்படுகிறது', temperature: 'வெப்பநிலை', temperatureSubtitle: 'இன்று ஓரளவு மேகமூட்டம்',
      cropGrowthProjection: 'பயிர் வளர்ச்சி கணிப்பு', currentMarketPrices: 'தற்போதைய சந்தை விலைகள்', partlyCloudy: 'ஓரளவு மேகமூட்டம்', location: 'ஈரோடு, தமிழ்நாடு',
      wind: 'காற்று', humidity: 'ஈரப்பதம்', rainChance: 'மழை வாய்ப்பு', uvIndex: 'புற ஊதா குறியீடு', moderate: 'மிதமானது', next24Hours: 'அடுத்த 24 மணிநேரம்',
      farmingTip: 'இன்றைய விவசாய குறிப்பு', farmingTipDesc: "இன்றிரவு லேசான மழைக்கு வாய்ப்புள்ளது. உங்கள் பயிர்களுக்கு கைகளால் நீர்ப்பாசனத்தைத் தவிர்க்க இது ஒரு சிறந்த நேரம், ஆனால் வடிகால் அமைப்புகள் தெளிவாக இருப்பதை உறுதி செய்யவும்.",
      sunny: 'வெயில்', cloudy: 'மேகமூட்டம்', rain: 'மழை',
      commodityTrends: 'பண்டங்களின் போக்குகள்', commodityTrendsSub: 'சந்தை விலை கண்ணோட்டம்', cropName: 'பயிரின் பெயர்', currentPrice: 'தற்போதைய விலை', change24h: '24 மணி நேர மாற்றம்', status: 'நிலை',
      favorable: 'சாதகமானது', declining: 'சரிகிறது', wheat: 'கோதுமை', rice: 'அரிசி', tomato: 'தக்காளி', soybean: 'சோயாபீன்', corn: 'சோளம்',
      coconut: 'தேங்காய்', banana: 'வாழைப்பழம்', pepper: 'மிளகு', rubber: 'ரப்பர்',
      transportLogistics: 'போக்குவரத்து & தளவாடங்கள்', transportLogisticsSub: 'உங்கள் ஏற்றுமதி மற்றும் உள்வரும் பொருட்களைக் கண்காணிக்கவும்.', newShipment: 'புதிய ஏற்றுமதி', trackingId: 'தடமறிதல் எண்', farm: 'பண்ணை', est: 'கணிப்பு', logisticsPartner: 'தளவாட பங்குதாரர்', viewDetails: 'விவரங்களை காண்க', inTransit: 'பயணத்தில்', delivered: 'டெலிவரி செய்யப்பட்டது',
      wheatHarvest: 'கோதுமை அறுவடை', organicTomatoes: 'ஆர்கானிக் தக்காளி', fertilizerSupply: 'உர விநியோகம்', cityMarketWarehouse: 'நகர சந்தை கிடங்கு', freshMartHub: 'பிரெஷ் மார்ட் மையம்', farmStorage2: 'பண்ணை கிடங்கு 2',
      aiTitle: 'Karshaka AI', poweredBy: 'ஸ்மார்ட் விவசாய மாதிரிகளால் இயக்கப்படுகிறது', askAnything: 'உங்கள் பண்ணையைப் பற்றி எதை வேண்டுமானாலும் கேளுங்கள்...', aiWarning: 'AI தவறுகளைச் செய்யலாம். முக்கியமான விவசாய முடிவுகளை சரிபார்க்கவும்.', typing: 'Karshaka தட்டச்சு செய்கிறது...', aiWelcomeMsg: 'வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர் Karshaka AI. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? பயிர் நோய்கள், சந்தை நிலவரம் ஆகியவற்றை பற்றி நீங்கள் கேட்கலாம்.'
    },
    hi: {
      greeting: 'Karshaka AI में आपका स्वागत है', welcomeBack: 'वापसी पर स्वागत है', login: 'लॉग इन करें', selectLanguage: 'भाषा चुनें',
      dashboard: 'डैशबोर्ड', weather: 'मौसम', market: 'बाज़ार', logistics: 'रसद', soilmoisture: 'मिट्टी की नमी', ai: 'एआई सहायक', logout: 'लॉग आउट',
      farmerAccount: 'किसान खाता', cropGrowth: 'फसल वृद्धि', cropGrowthSubtitle: '5 दिनों में कटाई के लिए तैयार',
      soilMoisture: 'मिट्टी की नमी', soilMoistureSubtitle: 'अनुकूल स्तर बनाए रखा गया', temperature: 'तापमान', temperatureSubtitle: 'आज आंशिक रूप से बादल छाए रहेंगे',
      cropGrowthProjection: 'फसल वृद्धि अनुमान', currentMarketPrices: 'वर्तमान बाजार मूल्य', partlyCloudy: 'आंशिक रूप से बादल छाये रहेंगे', location: 'ईरोड, तमिलनाडु',
      wind: 'हवा', humidity: 'नमी', rainChance: 'बारिश की संभावना', uvIndex: 'यूवी इंडेक्स', moderate: 'मध्यम', next24Hours: 'अगले 24 घंटे',
      farmingTip: 'आज के लिए खेती की सलाह', farmingTipDesc: "आज रात हल्की बारिश की संभावना है। इसलिए सिंचाई से बचना बेहतर है, लेकिन यदि आपने हाल ही में बीज बोए हैं, तो जल निकासी व्यवस्था साफ़ रखें।",
      sunny: 'धूप', cloudy: 'बादल', rain: 'बारिश',
      commodityTrends: 'कमोडिटी रुझान', commodityTrendsSub: 'वास्तविक समय बाजार मूल्य अवलोकन', cropName: 'फसल का नाम', currentPrice: 'वर्तमान मूल्य', change24h: '24 घंटे में बदलाव', status: 'स्थिति',
      favorable: 'अनुकूल', declining: 'गिर रहा है', wheat: 'गेहूं', rice: 'चावल', tomato: 'टमाटर', soybean: 'सोयाबीन', corn: 'मक्का',
      coconut: 'नारियल', banana: 'केला', pepper: 'काली मिर्च', rubber: 'रबर',
      transportLogistics: 'परिवहन और रसद', transportLogisticsSub: 'निकासी और आपूर्ति को ट्रैक करें।', newShipment: 'नया शिपमेंट', trackingId: 'ट्रैकिंग आईडी', farm: 'खेत', est: 'अनुमानित', logisticsPartner: 'रसद भागीदार', viewDetails: 'विवरण देखें', inTransit: 'रास्ते में', delivered: 'वितरित',
      wheatHarvest: 'गेहूं की फसल', organicTomatoes: 'जैविक टमाटर', fertilizerSupply: 'उर्वरक आपूर्ति', cityMarketWarehouse: 'सिटी मार्केट वेयरहाउस', freshMartHub: 'फ्रेश मार्ट हब', farmStorage2: 'फार्म स्टोरेज 2',
      aiTitle: 'Karshaka AI', poweredBy: 'स्मार्ट कृषि मॉडल द्वारा संचालित', askAnything: 'अपने खेत के बारे में कुछ भी पूछें...', aiWarning: 'एआई गलतियाँ कर सकता है। कृपया महत्वपूर्ण खेती निर्णयों की पुष्टि करें।', typing: 'Karshaka टाइप कर रहा है...', aiWelcomeMsg: 'नमस्ते! मैं Karshaka AI हूँ, आपका एआई कृषि सहायक। मैं आज आपकी कैसे मदद कर सकता हूँ? आप फसल की बीमारियों, बाजार आदि के बारे में पूछ सकते हैं।'
    },
    ml: {
      greeting: 'Karshaka AI-ലേക്ക് സ്വാഗതം', welcomeBack: 'തിരികെ സ്വാഗതം', login: 'ലോഗിൻ ചെയ്യുക', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
      dashboard: 'ഡാഷ്‌ബോർഡ്', weather: 'കാലാവസ്ഥ', market: 'വിപണി', logistics: 'ലോജിസ്റ്റിക്സ്', soilmoisture: 'മണ്ണിലെ ഈർപ്പം', ai: 'എഐ അസിസ്റ്റൻ്റ്', logout: 'പുറത്തുകടക്കുക',
      farmerAccount: 'കർഷക അക്കൗണ്ട്', cropGrowth: 'വിളവളർച്ച', cropGrowthSubtitle: '5 ദിവസത്തിനുള്ളിൽ വിളവെടുപ്പിന് തയ്യാറാണ്',
      soilMoisture: 'മണ്ണിലെ ഈർപ്പം', soilMoistureSubtitle: 'അനുയോജ്യമായ നില', temperature: 'താപനില', temperatureSubtitle: 'ഭാഗികമായി മേഘാവൃതം',
      cropGrowthProjection: 'വിള വളർച്ചാ പ്രവചനം', currentMarketPrices: 'നിലവിലെ വിപണി വില', partlyCloudy: 'ഭാഗികമായി മേഘാവൃതം', location: 'ഈറോഡ്, തമിഴ്നാട്',
      wind: 'കാറ്റ്', humidity: 'ഈർപ്പം', rainChance: 'മഴയ്ക്കുള്ള സാധ്യത', uvIndex: 'യുവി ഇൻഡക്സ്', moderate: 'മിതമായ', next24Hours: 'അടുത്ത 24 മണിക്കൂർ',
      farmingTip: 'ഇന്നത്തെ കൃഷി സൂചന', farmingTipDesc: "ഇന്ന് രാത്രി നേരിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്. പൈപ്പിലൂടെയുള്ള നനയ്ക്കൽ ഒഴിവാക്കാൻ ഇത് നല്ല സമയമാണ്, വെളളം ഒഴുകിപ്പോകാൻ സൗകര്യം ഉണ്ടെന്ന് ഉറപ്പാക്കുക.",
      sunny: 'തെളിഞ്ഞ', cloudy: 'മേഘാവൃതം', rain: 'മഴ',
      commodityTrends: 'ചരക്ക് വില മാറ്റങ്ങൾ', commodityTrendsSub: 'തത്സമയ വിപണി വില', cropName: 'വിളയുടെ പേര്', currentPrice: 'വില', change24h: '24 മണിക്കൂർ മാറ്റം', status: 'അവസ്ഥ',
      favorable: 'അനുകൂലമായ', declining: 'കുറയുന്നു', wheat: 'ഗോതമ്പ്', rice: 'അരി', tomato: 'തക്കാളി', soybean: 'സോയാബീൻ', corn: 'ചോളം',
      coconut: 'തേങ്ങ', banana: 'വാഴപ്പഴം', pepper: 'കുരുമുളക്', rubber: 'റബ്ബർ',
      transportLogistics: 'ഗതാഗതം', transportLogisticsSub: 'നിങ്ങളുടെ സാധനങ്ങൾ ട്രാക്കുചെയ്യുക.', newShipment: 'പുതിയ കയറ്റുമതി', trackingId: 'ട്രാക്കിംഗ് ഐഡി', farm: 'ഫാം', est: 'സമയം', logisticsPartner: 'ലോജിസ്റ്റിക് പങ്കാളി', viewDetails: 'വിശദാംശങ്ങൾ', inTransit: 'യാത്രയിലാണ്', delivered: 'എത്തിച്ചു',
      wheatHarvest: 'ഗോതമ്പ് വിളവെടുപ്പ്', organicTomatoes: 'ഓർഗാനിക് തക്കാളി', fertilizerSupply: 'വളം സപ്ലൈ', cityMarketWarehouse: 'സിറ്റി മാർക്കറ്റ് ഗോഡൗൺ', freshMartHub: 'ഫ്രഷ് മാർട്ട് ഹബ്', farmStorage2: 'ഫാം സ്റ്റോറേജ് 2',
      aiTitle: 'Karshaka AI', poweredBy: 'സ്മാർട്ട് അഗ്രികൾച്ചർ മോഡലുകൾ', askAnything: 'നിങ്ങളുടെ ഫാമിലെ എന്തിനെക്കുറിച്ചും ചോദിക്കുക...', aiWarning: 'എഐ തെറ്റ് വരുത്താം. പ്രധാന തീരുമാനങ്ങൾ പരിശോധിക്കുക.', typing: 'Karshaka ടൈപ്പുചെയ്യുന്നു...', aiWelcomeMsg: 'നമസ്കാരം! ഞാൻ Karshaka AI, നിങ്ങളുടെ എഐ കൃഷി സഹായി. ഇന്ന് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും? നിങ്ങൾക്ക് വിള രോഗങ്ങളെക്കുറിച്ചോ കാലാവസ്ഥയെക്കുറിച്ചോ ചോദിക്കാം.'
    }
  };

  const login = (username, password) => {
    if (!username || !password) return { success: false, message: 'Please enter both username and password.' };
    if (password.length < 4) return { success: false, message: 'Password must be at least 4 characters.' };
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      setIsAuthenticated(true);
      setUser({ username: found.username, name: found.name, email: found.email });
      return { success: true };
    }
    // Allow demo login: any username + password >= 4 chars if not registered
    const anyUser = users.find(u => u.username === username);
    if (anyUser) return { success: false, message: 'Incorrect password.' };
    // Accept unregistered user as guest
    setIsAuthenticated(true);
    setUser({ username, name: username, email: '' });
    return { success: true };
  };

  const signup = ({ name, email, username, password }) => {
    if (users.find(u => u.username === username)) return { success: false, message: 'Username already taken.' };
    if (users.find(u => u.email === email)) return { success: false, message: 'Email already registered.' };
    setUsers(prev => [...prev, { name, email, username, password }]);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const t = (key) => translations[language][key] || key;

  return (
    <AppContext.Provider value={{ isAuthenticated, user, login, signup, logout, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
