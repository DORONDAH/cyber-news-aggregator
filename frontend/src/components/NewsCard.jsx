import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';

const NewsCard = ({ article }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-blue-400 leading-tight">{article.title}</h3>
        <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-400">
          {article.source}
        </span>
      </div>

      <div className="text-slate-300 mb-6 whitespace-pre-line text-sm">
        {article.summary}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 mt-auto">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatDate(article.published_at)}</span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>View Original</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
