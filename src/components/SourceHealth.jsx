import React from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const SourceHealth = ({ sources, currentStatus }) => {
  // Parse the currentStatus message to see if we're currently scraping a specific source
  const activeSource = currentStatus?.includes('Collecting from')
    ? currentStatus.replace('Collecting from ', '').replace('...', '')
    : currentStatus?.includes('Scraping')
      ? currentStatus.replace('Scraping ', '').replace('...', '')
      : null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Intelligence Source Network</h2>
        </div>
        <div className="text-[9px] font-mono text-slate-500 uppercase">
          {sources.length} active nodes
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {sources.map((source) => {
          const isActive = activeSource === source;
          return (
            <div
              key={source}
              className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-900/20 border-blue-500/50 animate-pulse'
                  : 'bg-slate-900/30 border-slate-800'
              }`}
            >
              {isActive ? (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
              ) : (
                <div className="w-2 h-2 bg-emerald-500/50 rounded-full"></div>
              )}
              <span className={`text-[10px] font-bold truncate ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                {source}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SourceHealth;
