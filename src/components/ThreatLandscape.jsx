import React from 'react';
import { PieChart, Activity, TrendingUp } from 'lucide-react';

const ThreatLandscape = ({ news, onFilterCategory }) => {
  const stats = React.useMemo(() => {
    const counts = {};
    news.forEach(art => {
      const cat = art.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    // Sort by count descending
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [news]);

  if (news.length === 0) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 mb-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-blue-400 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Today's Threat Landscape</h2>
          <span className="bg-slate-700 text-[10px] px-2 py-0.5 rounded text-slate-300 font-mono ml-2">Σ {news.length} ITEMS</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span>CRITICAL RISK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            <span>EXPLOITS</span>
          </div>
          <span>REAL-TIME ANALYTICS</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.name}
            onClick={() => onFilterCategory?.(stat.name)}
            className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
          >
            <span className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{stat.count}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter group-hover:text-slate-400 transition-colors">{stat.name}</span>
            <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  stat.name === 'Ransomware' ? 'bg-red-500' :
                  stat.name === 'Vulnerability' ? 'bg-orange-500' :
                  stat.name === 'Data Breach' ? 'bg-purple-500' :
                  stat.name === 'Malware' ? 'bg-yellow-500' :
                  stat.name === 'Policy/Legal' ? 'bg-blue-500' : 'bg-slate-500'
                }`}
                style={{ width: `${(stat.count / news.length) * 100}%` }}
              ></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThreatLandscape;
