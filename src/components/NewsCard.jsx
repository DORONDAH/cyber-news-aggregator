import React, { useState } from 'react';
import { ExternalLink, Clock, Copy, Check, Eye, EyeOff, Share2, Shield, ChevronDown, ChevronUp, FileText, Bookmark, Activity } from 'lucide-react';

const NewsCard = ({ article, isRead, onToggleRead, isBookmarked, onToggleBookmark, isNew = false, isHyped = false, compact = false, onFilterSource, onFilterCategory, searchQuery = '' }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const highlightText = (text, query) => {
    if (!text) return text;

    // First, handle CVE detection and linking
    const cveRegex = /(CVE-\d{4}-\d{4,7})/g;
    const parts = text.split(cveRegex);

    const formattedParts = parts.map((part, i) => {
      if (cveRegex.test(part)) {
        return (
          <a
            key={`cve-${i}`}
            href={`https://nvd.nist.gov/vuln/detail/${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300 decoration-blue-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }

      // Then, handle search highlighting on non-CVE parts
      if (!query.trim()) return part;

      const searchParts = part.split(new RegExp(`(${query})`, 'gi'));
      return searchParts.map((sPart, j) =>
        sPart.toLowerCase() === query.toLowerCase() ? (
          <mark key={`mark-${i}-${j}`} className="bg-blue-500/40 text-white rounded px-0.5">{sPart}</mark>
        ) : (
          sPart
        )
      );
    });

    return <>{formattedParts}</>;
  };

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
    const severityPrefix = article.severity ? `[${article.severity.toUpperCase()} SEVERITY] ` : '';
    const categorySuffix = article.category ? `\nCategory: #${article.category.replace(/\s+/g, '')}` : '';

    const text = `🚨 CYBER INTEL BRIEF: ${severityPrefix}${article.title}\n\n${article.summary}\n\nSource: ${article.source}${categorySuffix}\nLink: ${article.url}\n\n🤖 Shared via CyberNews Aggregator`;

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
      // Using DuckDuckGo's favicon service as it's often more reliable/higher quality than Google's s2
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    } catch (e) {
      return null;
    }
  };

  const getSourceBadge = (source) => {
    const authoritative = ['CISA', 'SANS ISC'];
    const investigative = ['KrebsOnSecurity', 'The Record'];
    const vendor = ['Unit 42', 'Mandiant', 'ZeroFox'];

    if (authoritative.includes(source)) return { label: 'Authoritative', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
    if (investigative.includes(source)) return { label: 'Investigative', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
    if (vendor.includes(source)) return { label: 'Threat Intel', color: 'text-blue-400 bg-blue-950/40 border-blue-500/30' };
    return null;
  };

  if (compact) {
    return (
      <>
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
            <h3 className={`text-sm font-bold truncate ${isRead ? 'text-slate-400' : 'text-blue-400'}`}>
              {highlightText(article.title, searchQuery)}
            </h3>
            {getSourceBadge(article.source) && (
              <span className={`text-[8px] px-1 rounded border ml-2 ${getSourceBadge(article.source).color}`}>
                {getSourceBadge(article.source).label}
              </span>
            )}
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
          <button
            onClick={() => onToggleBookmark(article)}
            className={`p-1.5 transition-colors ${isBookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Intel"}
          >
            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
          <button onClick={() => onToggleRead(article.url)} className="p-1.5 text-slate-400 hover:text-blue-400" title="Mark Read"><Eye size={14} /></button>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`p-1.5 transition-colors ${isExpanded ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`} title="View Full Content"><FileText size={14} /></button>
          <button onClick={shareIntel} className="p-1.5 text-slate-400 hover:text-blue-400" title="Share"><Share2 size={14} /></button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-400" title="Source"><ExternalLink size={14} /></a>
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 text-[11px] text-slate-400 border-t border-slate-700/30 mt-2 bg-slate-900/30 rounded-b-md animate-fade-in">
          <div className="font-bold mb-1 flex items-center gap-1 text-slate-500 uppercase tracking-tighter">
            <Activity size={10} /> Full Scraped Content
          </div>
          <p className="line-clamp-6 italic">{article.content || 'No detailed content available.'}</p>
        </div>
      )}
      </>
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

      {isNew && !isHyped && (
        <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg z-20">
          NEW ARRIVAL
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
          <h3 className={`text-xl font-bold leading-tight ${isRead ? 'text-slate-400' : isHyped ? 'text-red-400' : 'text-blue-400'}`}>
            {highlightText(article.title, searchQuery)}
          </h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleBookmark(article)}
            className={`p-2 transition-all rounded-md ${isBookmarked ? 'bg-amber-900/40 text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-900/20'}`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Intel"}
          >
            <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
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
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 transition-all rounded-md ${isExpanded ? 'bg-blue-900/40 text-blue-400' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/20'}`}
            title="View Full Content"
          >
            <FileText size={16} />
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
          highlightText(article.summary, searchQuery)
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
            <p className="text-slate-500 italic mt-4 text-xs">Waiting for AI summary... Click "AI Next 5" to process.</p>
          </div>
        )}

        {isExpanded && article.content && (
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700/30 rounded-lg text-xs text-slate-400 animate-fade-in">
            <div className="font-bold mb-2 flex items-center gap-1 text-slate-500 uppercase tracking-tighter">
              <Activity size={12} /> Technical Raw Intelligence
            </div>
            <p className="italic leading-relaxed">
              {highlightText(article.content, searchQuery)}
            </p>
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
          {getSourceBadge(article.source) && (
            <span className={`text-[9px] px-2 py-0.5 rounded border mt-2 self-start font-bold uppercase tracking-tighter ${getSourceBadge(article.source).color}`}>
              {getSourceBadge(article.source).label}
            </span>
          )}
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
