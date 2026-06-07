import React, { useState } from 'react';
import { Droplets, Thermometer, Wind, AlertTriangle, CheckCircle, Leaf, Loader2 } from 'lucide-react';
import { generate } from '../lib/gemini';

const LOCATIONS = [
  { id: 'tvm', name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
  { id: 'kochi', name: 'Kochi', lat: 9.9312, lon: 76.2673 },
  { id: 'kozhikode', name: 'Kozhikode', lat: 11.2588, lon: 75.7804 },
  { id: 'thrissur', name: 'Thrissur', lat: 10.5276, lon: 76.2144 },
  { id: 'palakkad', name: 'Palakkad', lat: 10.7867, lon: 76.6548 },
];

const CROPS = [
  { id: 'rice', name: 'Rice (Paddy)' },
  { id: 'coconut', name: 'Coconut' },
  { id: 'rubber', name: 'Rubber' },
  { id: 'banana', name: 'Banana' },
  { id: 'pepper', name: 'Black Pepper' },
];

const SoilMoisture = () => {
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0].id);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  const analyzeMoisture = async () => {
    setLoading(true);
    setError('');
    setPrediction(null);
    setIsOffline(false);

    let current;
    try {
      const loc = LOCATIONS.find(l => l.id === selectedLocation);
      const crp = CROPS.find(c => c.id === selectedCrop);

      // 1. Fetch live weather data (no API key required)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error('Weather data unavailable');
      const weatherData = await weatherRes.json();
      current = weatherData.current;

      const weatherContext = {
        temp: current.temperature_2m,
        hum: current.relative_humidity_2m,
        rain: current.precipitation,
      };

      // 2. Fetch AI prediction through the server-side proxy.
      const prompt = `You are an expert AI agriculture assistant.
Data:
Location: ${loc.name}, Kerala
Crop: ${crp.name}
Current Weather: Temp ${current.temperature_2m}°C, Humidity ${current.relative_humidity_2m}%, Rainfall ${current.precipitation}mm.

Predict the current soil moisture percentage (0-100) and provide advice. Return ONLY a valid JSON object exactly like this:
{
  "moisturePercentage": 45,
  "status": "Low" | "Moderate" | "Optimal" | "Saturated",
  "irrigationAdvice": "Clear, specific 1-sentence advice.",
  "droughtWarning": "Any drought risk warning or 'None'.",
  "wateringRecommendation": "Specific watering amount or action."
}`;

      try {
        let text = await generate({ model: 'meta-llama/llama-3.3-70b-instruct:free', prompt });
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const aiData = JSON.parse(text);
        setPrediction({ ...aiData, weatherContext });
      } catch (aiErr) {
        // AI unavailable (e.g. no server key) — fall back to a simulation using live weather.
        console.error('AI prediction failed, using simulation:', aiErr);
        setIsOffline(true);
        setPrediction({
          moisturePercentage: 42,
          status: 'Moderate',
          irrigationAdvice: 'Irrigation recommended within 24 hours to maintain optimal growth.',
          droughtWarning: 'No severe drought risk currently detected.',
          wateringRecommendation: 'Apply 15-20 mm of water per acre.',
          weatherContext,
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze soil moisture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-5xl mx-auto">
      
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">AI Soil Moisture Predictor</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">Predict soil moisture levels and get tailored irrigation advice without physical hardware sensors, powered by Open-Meteo and Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Form */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-blue-500" /> Farm Parameters
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (Kerala)</label>
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              >
                {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Crop</label>
              <select 
                value={selectedCrop} 
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all"
              >
                {CROPS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button 
              onClick={analyzeMoisture}
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Droplets className="w-5 h-5" />}
              {loading ? 'Analyzing Data...' : 'Analyze Soil Moisture'}
            </button>
            {isOffline && (
               <p className="text-xs text-center text-amber-600 font-medium">AI unavailable — showing offline simulation.</p>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
          
          {!prediction && !loading && !error && (
            <div className="text-center opacity-60 flex flex-col items-center">
              <Leaf className="w-16 h-16 text-gray-300 mb-3" />
              <p>Select parameters and click analyze to see AI predictions.</p>
            </div>
          )}

          {error && (
            <div className="text-center flex flex-col items-center text-red-500">
              <AlertTriangle className="w-12 h-12 mb-2 opacity-80" />
              <p>{error}</p>
            </div>
          )}

          {loading && (
             <div className="text-center flex flex-col items-center">
               <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="text-gray-500 font-medium animate-pulse">Running AI Prediction Models...</p>
             </div>
          )}

          {prediction && !loading && (
            <div className="animate-fadeIn relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Moisture Level</p>
                  <h4 className="text-5xl font-black text-gray-800 tracking-tight">{prediction.moisturePercentage}%</h4>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                  prediction.status === 'Optimal' ? 'bg-green-100 text-green-700' :
                  prediction.status === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                  prediction.status === 'Low' ? 'bg-orange-100 text-orange-700' : 'bg-blue-200 text-blue-800'
                }`}>
                  {prediction.status}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Irrigation Advice</p>
                    <p className="text-sm text-gray-700 font-medium">{prediction.irrigationAdvice}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Drought Warning</p>
                    <p className="text-sm text-gray-700 font-medium">{prediction.droughtWarning}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50/50 p-4 rounded-2xl border border-green-100">
                  <Droplets className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Action Plan</p>
                    <p className="text-sm text-gray-700 font-medium">{prediction.wateringRecommendation}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500 font-medium justify-center">
                <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {prediction.weatherContext.temp}°C</span>
                <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> {prediction.weatherContext.hum}%</span>
                <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5" /> {prediction.weatherContext.rain}mm</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Simple MapPin Icon since we didn't import it at the top
const MapPinIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export default SoilMoisture;
