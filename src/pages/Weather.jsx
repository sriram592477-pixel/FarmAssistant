import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, MapPin, Navigation, Wind, Droplets, Thermometer,
  RefreshCw, AlertCircle, Sun, Cloud, CloudRain, CloudSnow,
  CloudLightning, CloudDrizzle, Eye, Gauge, ArrowUp, ArrowDown, Loader2
} from 'lucide-react';

// ── WMO weather code helpers ──────────────────────────────────────────────────
const WMO = {
  0: { label: 'Clear Sky', icon: 'sun', bg: 'from-amber-400 via-orange-400 to-rose-400' },
  1: { label: 'Mainly Clear', icon: 'sun', bg: 'from-yellow-400 via-amber-400 to-orange-400' },
  2: { label: 'Partly Cloudy', icon: 'partly', bg: 'from-blue-400 via-sky-400 to-cyan-400' },
  3: { label: 'Overcast', icon: 'cloud', bg: 'from-slate-400 via-gray-400 to-slate-500' },
  45: { label: 'Foggy', icon: 'cloud', bg: 'from-gray-400 via-slate-400 to-gray-500' },
  48: { label: 'Icy Fog', icon: 'cloud', bg: 'from-slate-400 via-blue-300 to-slate-400' },
  51: { label: 'Light Drizzle', icon: 'drizzle', bg: 'from-blue-500 via-sky-500 to-blue-600' },
  53: { label: 'Drizzle', icon: 'drizzle', bg: 'from-blue-500 via-sky-500 to-blue-600' },
  55: { label: 'Heavy Drizzle', icon: 'drizzle', bg: 'from-blue-600 via-sky-600 to-blue-700' },
  61: { label: 'Light Rain', icon: 'rain', bg: 'from-blue-600 via-indigo-500 to-blue-700' },
  63: { label: 'Rain', icon: 'rain', bg: 'from-blue-700 via-indigo-600 to-blue-800' },
  65: { label: 'Heavy Rain', icon: 'rain', bg: 'from-blue-800 via-indigo-700 to-blue-900' },
  71: { label: 'Light Snow', icon: 'snow', bg: 'from-sky-200 via-blue-200 to-indigo-200' },
  73: { label: 'Snow', icon: 'snow', bg: 'from-sky-300 via-blue-300 to-indigo-300' },
  75: { label: 'Heavy Snow', icon: 'snow', bg: 'from-sky-400 via-blue-400 to-indigo-400' },
  80: { label: 'Rain Showers', icon: 'rain', bg: 'from-blue-600 via-sky-600 to-blue-700' },
  81: { label: 'Rain Showers', icon: 'rain', bg: 'from-blue-700 via-sky-600 to-blue-800' },
  82: { label: 'Heavy Showers', icon: 'rain', bg: 'from-blue-800 via-indigo-700 to-blue-900' },
  95: { label: 'Thunderstorm', icon: 'thunder', bg: 'from-gray-700 via-slate-700 to-gray-900' },
  96: { label: 'Thunderstorm', icon: 'thunder', bg: 'from-gray-700 via-slate-700 to-gray-900' },
  99: { label: 'Heavy Thunderstorm', icon: 'thunder', bg: 'from-gray-800 via-slate-800 to-gray-900' },
};

const getWMO = (code) => WMO[code] || { label: 'Unknown', icon: 'cloud', bg: 'from-slate-400 to-slate-600' };

const WeatherIcon = ({ type, size = 'md' }) => {
  const sz = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-20 h-20', xl: 'w-28 h-28' }[size];
  const icons = {
    sun: <Sun className={`${sz} text-yellow-300 drop-shadow-lg`} />,
    partly: <div className="relative"><Cloud className={`${sz} text-white/80`} /><Sun className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300" /></div>,
    cloud: <Cloud className={`${sz} text-white/80`} />,
    drizzle: <CloudDrizzle className={`${sz} text-blue-200`} />,
    rain: <CloudRain className={`${sz} text-blue-200`} />,
    snow: <CloudSnow className={`${sz} text-sky-200`} />,
    thunder: <CloudLightning className={`${sz} text-yellow-300`} />,
  };
  return icons[type] || icons.cloud;
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Skeleton loader ───────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/20 rounded-xl ${className}`} />
);

// ── Main Component ────────────────────────────────────────────────────────────
const Weather = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null); // { name, lat, lon, country }
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const suggestRef = useRef(null);
  const debounceRef = useRef(null);

  const toF = (c) => Math.round(c * 9 / 5 + 32);
  const displayTemp = (c) => unit === 'C' ? `${Math.round(c)}°C` : `${toF(c)}°F`;

  // ── Fetch weather from Open-Meteo ──────────────────────────────────────────
  const fetchWeather = useCallback(async (lat, lon) => {
    setLoadingWeather(true);
    setError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,surface_pressure`
        + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max`
        + `&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather data unavailable');
      const data = await res.json();
      setWeather(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Failed to load weather data. Please check your connection.');
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  // ── Geocoding search ───────────────────────────────────────────────────────
  const searchCities = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCities(val), 400);
  };

  const selectCity = (city) => {
    const loc = { name: city.name, country: city.country_code, admin: city.admin1, lat: city.latitude, lon: city.longitude };
    setLocation(loc);
    setQuery(`${city.name}${city.admin1 ? ', ' + city.admin1 : ''}, ${city.country_code}`);
    setSuggestions([]);
    fetchWeather(city.latitude, city.longitude);
  };

  // ── GPS location ───────────────────────────────────────────────────────────
  const useGPS = () => {
    setLoadingGPS(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`);
          const data = await res.json();
          const r = data.results?.[0];
          setLocation({ name: r?.name || 'Your Location', country: r?.country_code || '', admin: r?.admin1 || '', lat, lon });
          setQuery(r ? `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country_code}` : 'Your Location');
        } catch {
          setLocation({ name: 'Your Location', country: '', admin: '', lat, lon });
          setQuery('Your Location');
        }
        fetchWeather(lat, lon);
        setLoadingGPS(false);
      },
      (err) => {
        setLoadingGPS(false);
        setError(err.code === 1 ? 'Location access denied. Please allow GPS or search manually.' : 'Unable to get your location.');
      },
      { timeout: 10000 }
    );
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => { if (suggestRef.current && !suggestRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!location) return;
    const id = setInterval(() => fetchWeather(location.lat, location.lon), 600000);
    return () => clearInterval(id);
  }, [location, fetchWeather]);

  const cur = weather?.current;
  const daily = weather?.daily;
  const wmo = cur ? getWMO(cur.weather_code) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🌤 Weather</h2>
          <p className="text-sm text-gray-500">Real-time weather powered by Open-Meteo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
            className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
          >
            °{unit === 'C' ? 'F' : 'C'} Switch
          </button>
          {location && (
            <button
              onClick={() => fetchWeather(location.lat, location.lon)}
              disabled={loadingWeather}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingWeather ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative" ref={suggestRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query.length >= 2 && searchCities(query)}
              placeholder="Search city, e.g. Chennai, Tokyo, London..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none shadow-sm transition-all"
            />
            {loadingSuggestions && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
          </div>
          <button
            onClick={useGPS}
            disabled={loadingGPS}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-200 disabled:opacity-60 whitespace-nowrap"
          >
            {loadingGPS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span className="hidden sm:inline">{loadingGPS ? 'Locating...' : 'Use GPS'}</span>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((city, i) => (
              <button
                key={i}
                onClick={() => selectCity(city)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{city.name}</p>
                  <p className="text-xs text-gray-500">{[city.admin1, city.country].filter(Boolean).join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Empty State ── */}
      {!location && !loadingWeather && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-sky-200 flex items-center justify-center mb-2">
            <Sun className="w-12 h-12 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700">Check the Weather</h3>
          <p className="text-gray-500 max-w-xs">Search for any city or tap <strong>Use GPS</strong> to get real-time weather for your current location.</p>
          <button
            onClick={useGPS}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Navigation className="w-4 h-4" /> Detect My Location
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loadingWeather && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-gradient-to-br from-blue-400 to-sky-500 rounded-3xl p-8 h-56" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-28" />)}
          </div>
          <div className="bg-gray-100 rounded-2xl h-48" />
        </div>
      )}

      {/* ── Weather Content ── */}
      {weather && !loadingWeather && wmo && (
        <div className="space-y-5 animate-fadeIn">

          {/* Main Card */}
          <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${wmo.bg} p-7 md:p-10 text-white shadow-2xl`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-4 right-4 opacity-10">
              <WeatherIcon type={wmo.icon} size="xl" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                {/* Left: Temp + condition */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 opacity-80" />
                    <span className="text-sm font-medium opacity-90">
                      {location?.name}{location?.admin ? `, ${location.admin}` : ''}{location?.country ? `, ${location.country}` : ''}
                    </span>
                  </div>
                  <div className="flex items-end gap-4 mt-3">
                    <WeatherIcon type={wmo.icon} size="lg" />
                    <div>
                      <p className="text-6xl md:text-7xl font-black tracking-tight leading-none">
                        {displayTemp(cur.temperature_2m)}
                      </p>
                      <p className="text-lg font-semibold opacity-90 mt-1">{wmo.label}</p>
                      <p className="text-sm opacity-70 mt-0.5">Feels like {displayTemp(cur.apparent_temperature)}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Stats grid */}
                <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[260px]">
                  {[
                    { icon: Droplets, label: 'Humidity', value: `${cur.relative_humidity_2m}%` },
                    { icon: CloudRain, label: 'Rainfall', value: `${cur.precipitation || 0} mm` },
                    { icon: Wind, label: 'Wind Speed', value: `${cur.wind_speed_10m} km/h` },
                    { icon: Gauge, label: 'Pressure', value: `${Math.round(cur.surface_pressure)} hPa` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                      <Icon className="w-5 h-5 mb-1.5 opacity-80" />
                      <p className="text-xs opacity-70">{label}</p>
                      <p className="font-bold text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {lastUpdated && (
                <p className="text-xs opacity-50 mt-4">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {/* 7-Day Forecast */}
          {daily && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  7-Day Forecast
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {daily.time.map((dateStr, i) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const isToday = i === 0;
                  const dayWMO = getWMO(daily.weather_code[i]);
                  return (
                    <div key={dateStr} className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors ${isToday ? 'bg-blue-50/60' : ''}`}>
                      <div className="w-16 flex-shrink-0">
                        <p className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {isToday ? 'Today' : days[d.getDay()]}
                        </p>
                        <p className="text-xs text-gray-400">{d.getDate()} {months[d.getMonth()]}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <WeatherIcon type={dayWMO.icon} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{dayWMO.label}</p>
                        {daily.precipitation_probability_max[i] > 0 && (
                          <p className="text-xs text-blue-400">🌧 {daily.precipitation_probability_max[i]}%</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold flex-shrink-0">
                        <span className="flex items-center gap-1 text-orange-500">
                          <ArrowUp className="w-3 h-3" />{displayTemp(daily.temperature_2m_max[i])}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <ArrowDown className="w-3 h-3" />{displayTemp(daily.temperature_2m_min[i])}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Farming Tip */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
            <h4 className="font-bold text-emerald-800 mb-1.5 flex items-center gap-2">🌱 Farming Advisory</h4>
            <p className="text-emerald-700 text-sm leading-relaxed">
              {cur.relative_humidity_2m > 70
                ? 'High humidity detected. Watch for fungal diseases on crops. Ensure good air circulation and avoid overhead irrigation.'
                : cur.wind_speed_10m > 30
                ? 'Strong winds today. Protect young seedlings and delay spraying operations.'
                : [61,63,65,80,81,82].includes(cur.weather_code)
                ? 'Rain expected. Skip irrigation today and ensure field drainage is clear.'
                : 'Good conditions for field work today. Optimal temperature for most crop activities.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Weather;
