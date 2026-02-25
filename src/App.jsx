import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, RefreshCw, Trash2, History, LayoutDashboard, Radio, Search, Download, Zap } from 'lucide-react';
import NewsCard from './components/NewsCard';

function App() {
  const [news, setNews] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'history'
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [readArticles, setReadArticles] = useState(() => {
    const saved = localStorage.getItem('readArticles');
    return saved ? JSON.parse(saved) : [];
  });
  const [hideRead, setHideRead] = useState(false);
  const searchInputRef = useRef(null);

  const categories = ['All', 'Ransomware', 'Vulnerability', 'Data Breach', 'Malware', 'Policy/Legal', 'General'];

  useEffect(() => {
    localStorage.setItem('readArticles', JSON.stringify(readArticles));
  }, [readArticles]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in the search bar
      if (document.activeElement.tagName === 'INPUT') return;

      if (e.key === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'r') {
        refreshNews();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const exportToCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = ['Title', 'Source', 'Category', 'URL', 'Summary', 'Published At'];
    const rows = filteredItems.map(art => [
      `"${art.title.replace(/"/g, '""')}"`,
      `"${art.source}"`,
      `"${art.category || 'General'}"`,
      `"${art.url}"`,
      `"${(art.summary || '').replace(/"/g, '""')}"`,
      `"${art.published_at}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cyber_news_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRead = (articleUrl) => {
    setReadArticles(prev =>
      prev.includes(articleUrl)
        ? prev.filter(url => url !== articleUrl)
        : [...prev, articleUrl]
    );
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchNews();

    const eventSource = new EventSource(`${API_BASE}/api/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status_update) {
        setStatusMessage(data.status_update);
        if (data.status_update === 'Done!') {
          setLoading(false);
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          setLoading(true);
        }
      } else {
        setNews(prev => {
          const index = prev.findIndex(art => art.url === data.url);
          if (index !== -1) {
            // Update existing article with new summary/category
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data };
            return updated;
          }
          // Add new article
          return [data, ...prev].slice(0, 50);
        });
        setHistory(prev => {
          const index = prev.findIndex(art => art.url === data.url);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data };
            return updated;
          }
          return prev;
        });
      }
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

      // If no news is found (e.g. after a DB reset), trigger a refresh automatically
      if (data.length === 0 && view === 'dashboard') {
        refreshNews();
      }
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
    setLoading(true);
    setStatusMessage('Requesting refresh...');
    try {
      await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger refresh', err);
      setStatusMessage('Refresh request failed');
      setLoading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const summarizeMore = async () => {
    setLoading(true);
    setStatusMessage('Requesting 5 more summaries...');
    try {
      await fetch(`${API_BASE}/api/summarize-more`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to summarize more', err);
      setStatusMessage('Request failed');
      setLoading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
  }, [view]);

  const filteredItems = useMemo(() => {
    let items = view === 'dashboard' ? news : history;

    // Filter by Source
    if (selectedSource !== 'All') {
      items = items.filter(item => item.source === selectedSource);
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by Read Status
    if (hideRead) {
      items = items.filter(item => !readArticles.includes(item.url));
    }

    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  }, [news, history, view, searchQuery, selectedSource, selectedCategory]);

  const sources = useMemo(() => {
    const allItems = [...news, ...history];
    const uniqueSources = ['All', ...new Set(allItems.map(item => item.source))];
    return uniqueSources;
  }, [news, history]);

  const hasPendingSummaries = useMemo(() => {
    return (view === 'dashboard' ? news : history).some(art => !art.summary);
  }, [news, history, view]);

  // Logic to identify stories covered by multiple sources
  const topStories = useMemo(() => {
    if (view !== 'dashboard' || news.length === 0) return [];

    const groups = [];
    const processed = new Set();

    // Simple word-overlap similarity check
    const areSimilar = (t1, t2) => {
      const words1 = new Set(t1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
      const words2 = new Set(t2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
      if (words1.size === 0 || words2.size === 0) return false;

      let overlap = 0;
      words1.forEach(w => { if (words2.has(w)) overlap++; });

      const similarity = overlap / Math.min(words1.size, words2.size);
      return similarity > 0.4; // 40% significant word overlap
    };

    news.forEach((art, i) => {
      if (processed.has(i)) return;

      const group = [art];
      processed.add(i);

      news.forEach((other, j) => {
        if (processed.has(j)) return;
        if (areSimilar(art.title, other.title)) {
          group.push(other);
          processed.add(j);
        }
      });

      // It's a "Top Story" if covered by 2+ DIFFERENT sources
      const sourcesInGroup = new Set(group.map(g => g.source));
      if (sourcesInGroup.size >= 2) {
        // Pick the most complete article (one with summary) to represent the group
        const representative = group.find(g => g.summary) || group[0];
        groups.push({
          ...representative,
          allSources: Array.from(sourcesInGroup),
          groupCount: group.length
        });
      }
    });

    return groups;
  }, [news, view]);

  // Filter regular news to not duplicate what's in Top Stories (optional, but cleaner)
  const finalFilteredItems = useMemo(() => {
    const topStoryUrls = new Set(topStories.map(s => s.url));
    return filteredItems.filter(item => !topStoryUrls.has(item.url));
  }, [filteredItems, topStories]);

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
            {statusMessage && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-900/20 border border-blue-500/30 rounded-lg text-[10px] sm:text-xs text-blue-400 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                <span className="max-w-[100px] sm:max-w-none truncate">{statusMessage}</span>
              </div>
            )}

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
              title="Scrape All Sources (Shortcut: R)"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={exportToCSV}
              className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download size={20} />
            </button>

            {hasPendingSummaries && (
              <button
                onClick={summarizeMore}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                AI Next 5
              </button>
            )}

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {view === 'dashboard' ? 'Latest Security Summaries' : '7-Day History'}
              {loading && <RefreshCw size={18} className="animate-spin text-slate-500" />}
            </h2>
            {view === 'dashboard' && (
              <span className="text-sm text-slate-500">
                {filteredItems.length} items
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-slate-300"
              title="Filter by Source"
            >
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-slate-300"
              title="Filter by Category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={hideRead}
                onChange={(e) => setHideRead(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
              />
              <span className="text-sm text-slate-300 whitespace-nowrap">Hide Read</span>
            </label>
          </div>
        </div>

        {/* Hyped Cyber Attacks / Trending Section */}
        {view === 'dashboard' && topStories.length > 0 && !searchQuery && selectedSource === 'All' && selectedCategory === 'All' && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 text-red-500">
              <div className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse uppercase tracking-tighter">Breaking</div>
              <Zap size={20} fill="currentColor" className="animate-bounce" />
              <h2 className="text-xl font-black tracking-tighter uppercase italic">Hyped Cyber Attacks</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-900/30 border border-red-500/30 rounded-full ml-2 text-red-400">
                HIGH SIGNAL / MULTI-SOURCE
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {topStories.map((story) => (
                <div key={story.id} className="relative group">
                  {/* Aggressive Highlight Border Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-xl blur-md opacity-25 group-hover:opacity-60 transition duration-500 group-hover:duration-200 animate-gradient-x"></div>
                  <div className="relative">
                    <NewsCard
                      article={story}
                      isRead={readArticles.includes(story.url)}
                      onToggleRead={toggleRead}
                      isHyped={true}
                    />
                  </div>
                  {/* Multi-source indicator badges */}
                  <div className="absolute -top-3 -left-2 flex gap-1 z-10">
                    {story.allSources.map(src => (
                      <span key={src} className="text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded shadow-xl border border-red-400/50">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 border-b border-slate-800/50"></div>
          </div>
        )}

        {/* Regular News Grid */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-lg font-bold text-slate-300 uppercase tracking-tighter">
            {view === 'dashboard' ? "Today's Live Intel" : 'Historical Archive'}
          </h2>
        </div>

        {loading && finalFilteredItems.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-800 rounded-lg border border-slate-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalFilteredItems.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isRead={readArticles.includes(article.url)}
                onToggleRead={toggleRead}
              />
            ))}

            {finalFilteredItems.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center">
                <div className="text-slate-500 mb-2">
                  {searchQuery ? `No results found for "${searchQuery}"` : 'No articles found.'}
                </div>
                <div className="text-sm text-slate-600">
                  {searchQuery ? 'Try a different search term.' : 'The scraper runs daily. Trigger a manual refresh to see latest news.'}
                </div>
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
