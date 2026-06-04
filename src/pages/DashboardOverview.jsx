import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Sprout, ThermometerSun, Settings, Calendar, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LOCATIONS = [
  { id: 'tvm', name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
  { id: 'kochi', name: 'Kochi', lat: 9.9312, lon: 76.2673 },
  { id: 'kozhikode', name: 'Kozhikode', lat: 11.2588, lon: 75.7804 },
  { id: 'thrissur', name: 'Thrissur', lat: 10.5276, lon: 76.2144 },
  { id: 'palakkad', name: 'Palakkad', lat: 10.7867, lon: 76.6548 },
];

const CROPS = [
  { id: 'rice', name: 'Rice (Paddy)', cycleDays: 120 },
  { id: 'banana', name: 'Banana', cycleDays: 300 },
  { id: 'pepper', name: 'Black Pepper', cycleDays: 1095 }, // ~3 years to first harvest
  { id: 'coconut', name: 'Coconut', cycleDays: 1825 }, // ~5 years to first harvest
  { id: 'rubber', name: 'Rubber', cycleDays: 2555 } // ~7 years to tap
];

const SummaryCard = ({ title, value, subtitle, icon: Icon, colorClass, gradientClass }) => (
  <div className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out ${gradientClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6 z-10" />
      </div>
    </div>
    <p className="text-sm font-medium text-gray-500 relative z-10">{subtitle}</p>
  </div>
);

const DashboardOverview = () => {
  const { t } = useAppContext();
  
  // State for farm setup
  const [setup, setSetup] = useState(() => {
    const saved = localStorage.getItem('yudista_farm_setup');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isEditingSetup, setIsEditingSetup] = useState(!setup);
  const [formData, setFormData] = useState({
    startDate: setup?.startDate || new Date().toISOString().split('T')[0],
    locationId: setup?.locationId || 'tvm',
    cropId: setup?.cropId || 'rice'
  });

  // State for dynamic data
  const [liveTemp, setLiveTemp] = useState(null);
  const [tempLoading, setTempLoading] = useState(false);
  const [growthMetrics, setGrowthMetrics] = useState({ percentage: 0, daysElapsed: 0, estimatedDate: '' });
  const [chartData, setChartData] = useState(null);

  // Fetch Live Weather when setup changes
  useEffect(() => {
    if (setup && !isEditingSetup) {
      fetchWeatherData(setup.locationId);
      calculateGrowth(setup.startDate, setup.cropId);
    }
  }, [setup, isEditingSetup]);

  const fetchWeatherData = async (locId) => {
    setTempLoading(true);
    try {
      const loc = LOCATIONS.find(l => l.id === locId);
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&timezone=auto`);
      const data = await res.json();
      setLiveTemp(data.current.temperature_2m);
    } catch (err) {
      console.error("Failed to fetch temp", err);
      setLiveTemp(null);
    } finally {
      setTempLoading(false);
    }
  };

  const calculateGrowth = (startDateStr, cropId) => {
    const start = new Date(startDateStr);
    const today = new Date();
    
    // Normalize time to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - start;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const selectedCrop = CROPS.find(c => c.id === cropId) || CROPS[0];
    const cycleDays = selectedCrop.cycleDays;

    let percentage = Math.floor((diffDays / cycleDays) * 100);
    if (percentage > 100) percentage = 100;

    const estHarvestDate = new Date(start);
    estHarvestDate.setDate(start.getDate() + cycleDays);

    setGrowthMetrics({
      percentage,
      daysElapsed: diffDays,
      estimatedDate: estHarvestDate.toLocaleDateString()
    });

    generateChartData(start, today, diffDays, cycleDays);
  };

  const generateChartData = (start, today, elapsedDays, cycleDays) => {
    // Generate weekly data points up to 6 weeks
    const labels = [];
    const dataPoints = [];
    
    let weeksPassed = Math.ceil(elapsedDays / 7);
    if (weeksPassed === 0) weeksPassed = 1; // Show at least Week 1
    
    // Show a maximum of 6 past weeks on the chart for readability
    const maxWeeksToShow = Math.min(weeksPassed, 6);
    const startWeek = Math.max(1, weeksPassed - 5);

    for (let w = startWeek; w <= weeksPassed; w++) {
      labels.push(`Week ${w}`);
      // Calculate what the percentage was at that week
      let p = Math.floor(((w * 7) / cycleDays) * 100);
      if (p > 100) p = 100;
      dataPoints.push(p);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: `Growth Progress (%)`,
          data: dataPoints,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2,
        },
      ],
    });
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}% Growth` } } },
    scales: { 
      y: { min: 0, max: 100, grid: { borderDash: [5, 5], color: '#f3f4f6' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    },
    animation: { duration: 1500, easing: 'easeOutQuart' }
  };

  const handleSaveSetup = (e) => {
    e.preventDefault();
    const newSetup = { startDate: formData.startDate, locationId: formData.locationId, cropId: formData.cropId };
    setSetup(newSetup);
    localStorage.setItem('yudista_farm_setup', JSON.stringify(newSetup));
    setIsEditingSetup(false);
  };

  if (isEditingSetup) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Cultivation Setup</h2>
          <p className="text-emerald-100 font-medium">Configure your farm details to get dynamic growth tracking and real-time insights.</p>
        </div>
        <form onSubmit={handleSaveSetup} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Cultivation Start Date
            </label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">Used to calculate your crop's growth progress based on its specific cycle.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-500" /> Target Crop
            </label>
            <select 
              value={formData.cropId}
              onChange={e => setFormData({...formData, cropId: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
            >
              {CROPS.map(c => <option key={c.id} value={c.id}>{c.name} (≈ {c.cycleDays} days to harvest)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Farm Location
            </label>
            <select 
              value={formData.locationId}
              onChange={e => setFormData({...formData, locationId: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
            >
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            {setup && (
              <button 
                type="button" 
                onClick={() => setIsEditingSetup(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-emerald-200 transition-transform active:scale-95"
            >
              <CheckCircle className="w-5 h-5" /> Save Setup
            </button>
          </div>
        </form>
      </div>
    );
  }

    const locName = LOCATIONS.find(l => l.id === setup.locationId)?.name || '';
    const cropInfo = CROPS.find(c => c.id === setup.cropId) || CROPS[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header section with Edit button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Farm Overview <span className="text-emerald-500">•</span> {locName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Planted <span className="font-semibold text-gray-700">{cropInfo.name}</span> on <span className="font-semibold text-gray-700">{new Date(setup.startDate).toLocaleDateString()}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsEditingSetup(true)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-colors"
        >
          <Settings className="w-4 h-4" /> Edit Setup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard 
          title="Current Crop Growth"
          value={`${growthMetrics.percentage}%`} 
          subtitle={`Day ${growthMetrics.daysElapsed} • Est. Harvest: ${growthMetrics.estimatedDate}`} 
          icon={Sprout} 
          colorClass="bg-emerald-50 text-emerald-600"
          gradientClass="bg-emerald-500"
        />
        <SummaryCard 
          title="Live Farm Temperature" 
          value={tempLoading ? <Loader2 className="w-8 h-8 animate-spin text-orange-500" /> : `${liveTemp || '--'}°C`} 
          subtitle={`Real-time sensor data for ${locName}`} 
          icon={ThermometerSun} 
          colorClass="bg-orange-50 text-orange-600"
          gradientClass="bg-orange-500"
        />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mix-blend-multiply opacity-50 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 mb-8">
          <h3 className="text-xl font-bold text-gray-800">Growth Trajectory</h3>
          <p className="text-gray-500 text-sm">Dynamic weekly progress tracked against {cropInfo.name}'s {cropInfo.cycleDays}-day cycle.</p>
        </div>
        <div className="h-[350px] relative z-10">
          {chartData && <Line data={chartData} options={lineChartOptions} />}
        </div>
      </div>

    </div>
  );
};

export default DashboardOverview;
