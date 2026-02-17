import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Trash2, History, LayoutDashboard, Radio } from 'lucide-react';
import NewsCard from './components/NewsCard';

function App() {
  const [news, setNews] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'history'
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchNews();

    const eventSource = new EventSource(`${API_BASE}/api/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const newArticle = JSON.parse(event.data);
      setNews(prev => [newArticle, ...prev].slice(0, 20));
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/news`);
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error('Failed to fetch news', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;
    try {
      await fetch(`${API_BASE}/api/settings/clear`, { method: 'POST' });
      setNews([]);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const refreshNews = async () => {
    try {
      await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger refresh', err);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
  }, [view]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={32} />
            <h1 className="text-2xl font-bold tracking-tight">CyberNews <span className="text-blue-500">Aggregator</span></h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              <Radio size={14} className={isConnected ? 'animate-pulse' : ''} />
              {isConnected ? 'Live' : 'Disconnected'}
            </div>

            <nav className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setView('history')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors ${view === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <History size={18} />
                <span className="hidden sm:inline">History</span>
              </button>
            </nav>

            <button
              onClick={refreshNews}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Trigger Manual Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={clearHistory}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Clear All History"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {view === 'dashboard' ? 'Latest Security Summaries' : '7-Day History'}
            {loading && <RefreshCw size={18} className="animate-spin text-slate-500" />}
          </h2>
          {view === 'dashboard' && (
            <span className="text-sm text-slate-500">
              Showing {news.length} recent items
            </span>
          )}
        </div>

        {loading && news.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-800 rounded-lg border border-slate-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(view === 'dashboard' ? news : history).map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}

            {(view === 'dashboard' ? news : history).length === 0 && !loading && (
              <div className="col-span-full py-20 text-center">
                <div className="text-slate-500 mb-2">No articles found.</div>
                <div className="text-sm text-slate-600">The scraper runs every 30 minutes.</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 p-8 text-center text-slate-600 text-sm">
        <p>© 2026 Cyber News Aggregator. Powered by FastAPI, React & AI.</p>
      </footer>
    </div>
  );
}

export default App;
