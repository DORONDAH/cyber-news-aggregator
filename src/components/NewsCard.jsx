import React, { useState } from 'react';
import { ExternalLink, Clock, Copy, Check, Eye, EyeOff } from 'lucide-react';

const NewsCard = ({ article, isRead, onToggleRead }) => {
  const [copied, setCopied] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${article.title}\n\n${article.summary}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (cat) => {
    const colors = {
      'Ransomware': 'bg-red-900/40 text-red-400 border-red-500/30',
      'Vulnerability': 'bg-orange-900/40 text-orange-400 border-orange-500/30',
      'Data Breach': 'bg-purple-900/40 text-purple-400 border-purple-500/30',
      'Malware': 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30',
      'Policy/Legal': 'bg-blue-900/40 text-blue-400 border-blue-500/30',
      'General': 'bg-slate-700/50 text-slate-400 border-slate-600/30'
    };
    return colors[cat] || colors['General'];
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-6 shadow-lg border transition-all flex flex-col relative group ${isRead ? 'opacity-40 border-slate-700 grayscale-[0.5]' : 'border-slate-700 hover:border-blue-500'}`}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className={`text-xl font-bold leading-tight ${isRead ? 'text-slate-400' : 'text-blue-400'}`}>{article.title}</h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleRead(article.url)}
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-md transition-all"
            title={isRead ? "Mark as Unread" : "Mark as Read"}
          >
            {isRead ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={copyToClipboard}
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-md transition-all"
            title="Copy Summary"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getCategoryColor(article.category)}`}>
          {article.category || 'General'}
        </span>
      </div>

      <div className="text-slate-300 mb-6 whitespace-pre-line text-sm flex-grow">
        {article.summary ? (
          article.summary
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
            <p className="text-slate-500 italic mt-4 text-xs">Waiting for AI summary... Click "AI Next 5" to process.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 mt-auto border-t border-slate-700/50 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono bg-slate-700/50 self-start px-2 py-0.5 rounded text-slate-400 mb-1">
            {article.source}
          </span>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          <span>View Original</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {copied && (
        <div className="absolute top-2 right-12 bg-green-900/80 text-green-400 px-2 py-1 rounded text-[10px] animate-fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default NewsCard;
