import React from 'react';
import { Tag } from 'lucide-react';

const KeywordsCloud = ({ news, onSearch }) => {
  const keywords = React.useMemo(() => {
    const stopWords = new Set(['this', 'that', 'with', 'from', 'your', 'their', 'they', 'them', 'these', 'those', 'which', 'what', 'where', 'when', 'could', 'would', 'should', 'about', 'after', 'before', 'using', 'against', 'during', 'through', 'between', 'under', 'over', 'cyber', 'security', 'news', 'attack', 'data', 'breach', 'report', 'new', 'more', 'first', 'after', 'been', 'were', 'also', 'will', 'have', 'hackers', 'malware', 'ransomware', 'users', 'company', 'service', 'million', 'billion']);

    const wordCounts = {};
    news.forEach(art => {
      const words = art.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.has(w));

      words.forEach(w => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [news]);

  if (keywords.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-slate-800/20 border border-slate-700/30 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={14} className="text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trending Intel Keywords</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <button
            key={kw.text}
            onClick={() => onSearch(kw.text)}
            className="px-3 py-1 bg-slate-900/50 hover:bg-blue-900/30 border border-slate-700/50 hover:border-blue-500/50 rounded-full text-xs font-medium text-slate-400 hover:text-blue-400 transition-all flex items-center gap-2 group"
          >
            #{kw.text}
            <span className="text-[9px] bg-slate-800 px-1.5 rounded-full text-slate-500 group-hover:text-blue-500 transition-colors">{kw.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeywordsCloud;
