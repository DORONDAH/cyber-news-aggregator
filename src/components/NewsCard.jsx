import React, { useState } from 'react';
import { ExternalLink, Clock, Copy, Check, Eye, EyeOff, Share2, Shield } from 'lucide-react';

const NewsCard = ({ article, isRead, onToggleRead, isHyped = false, compact = false, onFilterSource, onFilterCategory }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const getSeverityColor = (sev) => {
    const colors = {
      'Critical': 'bg-red-600 text-white border-red-700',
      'High': 'bg-orange-600 text-white border-orange-700',
      'Medium': 'bg-yellow-600 text-black border-yellow-700',
      'Low': 'bg-blue-600 text-white border-blue-700'
    };
    return colors[sev] || 'bg-slate-600 text-white border-slate-700';
  };

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

  const shareIntel = async () => {
    const text = `🚨 CYBER INTEL BRIEF: ${article.title}\n\n${article.summary}\n\nSource: ${article.source}\nLink: ${article.url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: text,
          url: article.url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
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

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return null;
    }
  };

  if (compact) {
    return (
      <div className={`bg-slate-800/50 rounded-md p-3 border border-slate-700 hover:border-blue-500 transition-all flex items-center gap-4 group ${isRead ? 'opacity-40' : ''}`}>
        <div className="flex-shrink-0 w-6 flex justify-center">
          {article.severity && (
            <div className={`w-2 h-2 rounded-full ${article.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : article.severity === 'High' ? 'bg-orange-500' : article.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} title={`Severity: ${article.severity}`}></div>
          )}
          {!article.severity && (
            getFavicon(article.url) ? (
              <img src={getFavicon(article.url)} alt="" className="w-4 h-4 rounded-sm" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <Shield size={14} className="text-slate-600" />
            )
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFilterCategory?.(article.category || 'General')}
              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border flex-shrink-0 transition-colors hover:brightness-125 ${getCategoryColor(article.category)}`}
            >
              {article.category || 'General'}
            </button>
            <h3 className={`text-sm font-bold truncate ${isRead ? 'text-slate-400' : 'text-blue-400'}`}>{article.title}</h3>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <button
            onClick={() => onFilterSource?.(article.source)}
            className="hidden md:inline bg-slate-700/50 px-2 py-0.5 rounded hover:bg-slate-600 transition-colors"
          >
            {article.source}
          </button>
          <span className="w-16 text-right">{formatDate(article.published_at)}</span>
        </div>

        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggleRead(article.url)} className="p-1.5 text-slate-400 hover:text-blue-400" title="Mark Read"><Eye size={14} /></button>
          <button onClick={shareIntel} className="p-1.5 text-slate-400 hover:text-blue-400" title="Share"><Share2 size={14} /></button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-400" title="Source"><ExternalLink size={14} /></a>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-6 shadow-lg border transition-all flex flex-col relative group
      ${isRead ? 'opacity-40 border-slate-700 grayscale-[0.5]' :
        isHyped ? 'border-red-500/50 shadow-red-900/20 ring-1 ring-red-500/20' : 'border-slate-700 hover:border-blue-500'}`}>

      {isHyped && (
        <div className="absolute -top-3 right-4 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg z-20 animate-pulse">
          URGENT INTEL
        </div>
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-start gap-3">
          {getFavicon(article.url) && (
            <img
              src={getFavicon(article.url)}
              alt=""
              className="w-5 h-5 mt-1 rounded-sm flex-shrink-0"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <h3 className={`text-xl font-bold leading-tight ${isRead ? 'text-slate-400' : isHyped ? 'text-red-400' : 'text-blue-400'}`}>{article.title}</h3>
        </div>
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
          <button
            onClick={shareIntel}
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-md transition-all"
            title="Share Intel"
          >
            {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => onFilterCategory?.(article.category || 'General')}
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border transition-colors hover:brightness-125 ${getCategoryColor(article.category)}`}
        >
          {article.category || 'General'}
        </button>
        {article.severity && (
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border shadow-sm ${getSeverityColor(article.severity)}`}>
            {article.severity}
          </span>
        )}
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
          <button
            onClick={() => onFilterSource?.(article.source)}
            className="text-[10px] font-mono bg-slate-700/50 self-start px-2 py-0.5 rounded text-slate-400 mb-1 hover:bg-slate-600 transition-colors"
          >
            {article.source}
          </button>
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
        <div className="absolute top-2 right-12 bg-green-900/80 text-green-400 px-2 py-1 rounded text-[10px] animate-fade-in z-30">
          Copied Brief!
        </div>
      )}
      {shared && !copied && (
        <div className="absolute top-2 right-12 bg-green-900/80 text-green-400 px-2 py-1 rounded text-[10px] animate-fade-in z-30">
          Intel Shared!
        </div>
      )}
    </div>
  );
};

export default NewsCard;
