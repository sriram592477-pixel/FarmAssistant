import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generate } from '../lib/gemini';

// Register ChartJS plugins if needed (assuming they are registered globally in App.jsx usually,
// but we rely on react-chartjs-2 which handles it if auto-registered in main.jsx)
// Live market prices are fetched through the server-side /api/gemini proxy.

const Market = () => {
  const { t } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marketData, setMarketData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    setError('');
    setIsOffline(false);

    // Default fallback simulation data for Kerala crops
    const fallbackData = [
      { id: 1, cropKey: 'rice', price: '₹3,200/Qtl', change: '+1.5%', trend: 'up', history: [3100, 3150, 3120, 3180, 3190, 3200] },
      { id: 2, cropKey: 'coconut', price: '₹4,500/Qtl', change: '-2.0%', trend: 'down', history: [4600, 4650, 4580, 4550, 4520, 4500] },
      { id: 3, cropKey: 'banana', price: '₹3,800/Qtl', change: '+0.5%', trend: 'up', history: [3750, 3720, 3780, 3790, 3795, 3800] },
      { id: 4, cropKey: 'pepper', price: '₹52,000/Qtl', change: '+4.2%', trend: 'up', history: [49000, 49500, 50200, 51000, 51500, 52000] },
      { id: 5, cropKey: 'rubber', price: '₹18,500/Qtl', change: '-1.1%', trend: 'down', history: [18800, 18750, 18600, 18650, 18550, 18500] },
    ];

    try {
      const prompt = `Return a JSON array containing realistic current market prices in Kerala, India (in INR per Quintal) for: rice, coconut, banana, pepper, rubber.
Format exactly like this JSON structure, do not include markdown, comments, or other text:
[
  { "id": 1, "cropKey": "rice", "price": "₹3,200/Qtl", "change": "+1.5%", "trend": "up", "history": [3100, 3150, 3120, 3180, 3190, 3200] }
]
The history array must contain exactly 6 numbers representing the past 6 months. Ensure the JSON is strictly valid.`;

      let text = await generate({ model: 'meta-llama/llama-3.3-70b-instruct:free', prompt });
      // clean json
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const data = JSON.parse(text);
      applyData(data);
    } catch (err) {
      console.error("Failed to fetch from Gemini:", err);
      setError('Live data unavailable. Showing offline simulation.');
      setIsOffline(true);
      applyData(fallbackData);
    }
  };

  const applyData = (data) => {
    setMarketData(data);
    
    // Build chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    // We display top 2 crops on the chart
    const crop1 = data[0];
    const crop2 = data[1];

    setChartData({
      labels: months,
      datasets: [
        {
          label: `${t(crop1.cropKey)} (₹/Qtl)`,
          data: crop1.history,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: `${t(crop2.cropKey)} (₹/Qtl)`,
          data: crop2.history,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderWidth: 2,
        }
      ],
    });
    setLoading(false);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
    },
    scales: {
      y: { grid: { borderDash: [5, 5], color: '#f3f4f6' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('commodityTrends')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('commodityTrendsSub')}</p>
        </div>
        <button
          onClick={fetchMarketData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="bg-gray-100 rounded-3xl h-[400px] animate-pulse"></div>
          <div className="bg-gray-100 rounded-2xl h-[300px] animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Glassmorphic Chart Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/40 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full mix-blend-multiply opacity-50 blur-3xl translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-110"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Kerala Crop Forecast (6 Months)</h3>
                <p className="text-sm text-gray-500">AI-generated market estimations</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            
            <div className="h-[350px] relative z-10">
              {chartData && <Line data={chartData} options={chartOptions} />}
            </div>
          </div>

          {/* Market Data Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/40 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">{t('currentMarketPrices')}</h3>
              {isOffline && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                  Offline Mode
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-white">
                    <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">{t('cropName')}</th>
                    <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">{t('currentPrice')}</th>
                    <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">{t('change24h')}</th>
                    <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {marketData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-5 px-6 font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {t(item.cropKey).charAt(0)}
                        </div>
                        {t(item.cropKey)}
                      </td>
                      <td className="py-5 px-6 font-bold text-gray-700">{item.price}</td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1 font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {item.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {item.change}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${item.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {item.trend === 'up' ? t('favorable') : t('declining')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
    </div>
  );
};

export default Market;
