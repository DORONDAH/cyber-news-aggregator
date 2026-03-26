import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, RefreshCw, Trash2, History, LayoutDashboard, Radio, Search, Download, Zap, List, Grid, WifiOff, AlertTriangle, Info } from 'lucide-react';
import NewsCard from './components/NewsCard';

const API_BASE = ''; // Relative paths for local serving

function App() {
  // State
  const [news, setNews] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initializing local intel feed...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Persistence (Safety wrapped)
  const [readArticles, setReadArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('readArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [bookmarkedArticles, setBookmarkedArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmarkedArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('readArticles', JSON.stringify(readArticles));
    } catch (e) {}
  }, [readArticles]);

  useEffect(() => {
    try {
      localStorage.setItem('bookmarkedArticles', JSON.stringify(bookmarkedArticles));
    } catch (e) {}
  }, [bookmarkedArticles]);

  // Initial Data Fetch
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/news`);
      if (!res.ok) throw new Error('Failed to fetch news feed');
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);

      const histRes = await fetch(`${API_BASE}/api/history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(Array.isArray(histData) ? histData : []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE Real-time Updates
    const eventSource = new EventSource(`${API_BASE}/api/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status_update) {
          setStatusMessage(data.status_update);
          return;
        }

        // It's a news article update
        setNews(prev => {
          const index = prev.findIndex(a => a.id === data.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data };
            return updated;
          }
          return [data, ...prev];
        });
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    eventSource.onerror = (e) => {
      console.warn("SSE Connection lost. Retrying...");
      eventSource.close();
      // Re-establish after 5s
      setTimeout(() => {
        if (view === 'dashboard') fetchData();
      }, 5000);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      eventSource.close();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actions
  const handleRefresh = async () => {
    setStatusMessage('Manual sync requested...');
    await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
  };

  const handleAISummarize = async () => {
    setStatusMessage('Requesting AI Batch processing...');
    await fetch(`${API_BASE}/api/summarize-batch`, { method: 'POST' });
  };

  const toggleRead = (url) => {
    setReadArticles(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  const toggleBookmark = (article) => {
    setBookmarkedArticles(prev => {
      const isBookmarked = prev.some(a => a.id === article.id);
      if (isBookmarked) return prev.filter(a => a.id !== article.id);
      return [...prev, article];
    });
  };

  // Filter Logic
  const filteredNews = useMemo(() => {
    let result = view === 'dashboard' ? news : history;

    if (selectedCategory !== 'All') {
      result = result.filter(a => a.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [news, history, view, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase">CyberIntel <span className="text-blue-500">Local</span></h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {statusMessage}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search intel..."
                className="w-full bg-slate-800 border-slate-700 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={handleRefresh} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-blue-400" title="Manual Refresh">
              <RefreshCw size={20} />
            </button>
            <button onClick={handleAISummarize} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-amber-400" title="AI Process Next 5">
              <Zap size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Navigation & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <History size={16} /> Archive
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {['Ransomware', 'Vulnerability', 'Data Breach', 'Malware', 'Policy/Legal', 'General'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content States */}
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw size={48} className="animate-spin mb-4 text-blue-500/50" />
            <p className="animate-pulse">Analyzing cyber landscape...</p>
          </div>
        ) : error && news.length === 0 ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button onClick={fetchData} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition-colors">Retry Connection</button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-20 text-center">
            <WifiOff size={48} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-xl font-bold text-slate-400 mb-2">No Intelligence Found</h2>
            <p className="text-slate-500">Try adjusting your filters or requesting a manual refresh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredNews.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                isRead={readArticles.includes(article.url)}
                onToggleRead={toggleRead}
                isBookmarked={bookmarkedArticles.some(a => a.id === article.id)}
                onToggleBookmark={toggleBookmark}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </main>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-xs font-bold uppercase tracking-widest z-[100]">
          Offline Mode - Displaying Cached Intelligence
        </div>
      )}
    </div>
  );
}

export default App;
