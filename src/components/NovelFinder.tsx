import React, { useState, useEffect } from 'react';
import { Search, Menu, Image as ImageIcon, User, ChevronDown, List, BookOpen, ChevronUp, Filter, Sparkles, Flame, Settings, Bookmark, History, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import NovelDetails from './NovelDetails';
import ChapterView from './ChapterView';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NovelFinder() {
  const [activeTab, setActiveTab] = useState<'discover' | 'library' | 'profile'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('Addition Date');
  const [order, setOrder] = useState('Descending');
  const [status, setStatus] = useState('All');
  const [releaseStatus, setReleaseStatus] = useState('All');
  const [minChapters, setMinChapters] = useState('Any');
  
  const [genres, setGenres] = useState<string[]>([]);

  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  useEffect(() => {
    handleSearch(false);
  }, []);

  const handleSearch = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
      setSearchId(null);
      setNovels([]);
    }
    
    setError(null);
    setIsMockData(false);
    
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        orderBy,
        order,
        status,
        releaseStatus,
        minChapters,
        genres: genres.join(','),
        page: isLoadMore ? currentPage.toString() : '1'
      });
      
      if (isLoadMore && searchId) {
        params.append('searchid', searchId);
      }
      
      const res = await fetch(`/api/novels/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch novels');
      const data = await res.json();
      
      if (data.novels && data.novels.length > 0) {
        setNovels(prev => isLoadMore ? [...prev, ...data.novels] : data.novels);
        setIsMockData(data.isMock || false);
        setCurrentPage(data.page);
        if (data.searchid) setSearchId(data.searchid);
        setHasMore(data.novels.length >= 15); // Assume there might be more if we got a full page
      } else {
        if (!isLoadMore) setNovels([]);
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
      if (!isLoadMore) setNovels([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const allGenres = [
    'Action', 'Adult', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Erciyuan', 'Fan-Fiction',
    'Fantasy', 'Game', 'Gender-Bender', 'Harem', 'Historical', 'Horror', 'Josei', 'Martial-Arts',
    'Mature', 'Mecha', 'Military', 'Mystery', 'Psychological', 'Romance', 'School-Life', 'Sci-Fi',
    'Seinen', 'Shoujo', 'Shoujo-Ai', 'Shounen', 'Shounen-Ai', 'Slice-Of-Life', 'Smut', 'Sports',
    'Supernatural', 'Tragedy', 'Urban-Life', 'Wuxia', 'Xianxia', 'Xuanhuan', 'Yaoi', 'Yuri'
  ];

  const toggleGenre = (genre: string) => {
    setGenres(prev => 
      prev.includes(genre) ? [] : [genre]
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-300 font-sans pb-20 selection:bg-indigo-500/30">
      {/* Premium Header */}
      <header className="bg-[#16181d]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSelectedNovelId(null); setSelectedChapterId(null); setActiveTab('discover');}}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                <span className="text-lg">W</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">WuxiaSpot</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 relative">
              <ImageIcon className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            </button>
            <button onClick={() => setActiveTab('profile')} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {selectedChapterId && selectedNovelId ? (
        <ChapterView 
          novelId={selectedNovelId} 
          chapterId={selectedChapterId} 
          onBack={() => setSelectedChapterId(null)} 
          onChapterSelect={setSelectedChapterId}
        />
      ) : selectedNovelId ? (
        <NovelDetails 
          novelId={selectedNovelId} 
          onBack={() => setSelectedNovelId(null)} 
          onChapterSelect={setSelectedChapterId}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'discover' && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters (Desktop) / Toggleable (Mobile) */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                  <div className="flex items-center justify-between lg:hidden mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Search className="w-5 h-5 text-indigo-400" /> Discover
                    </h2>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-medium border border-indigo-500/20"
                    >
                      <Filter className="w-4 h-4" /> Filters
                    </button>
                  </div>

                  <div className={cn("space-y-6 lg:block", showFilters ? "block" : "hidden")}>
                    {/* Search Box */}
                    <div className="bg-[#16181d] rounded-2xl p-5 border border-white/5 shadow-xl">
                      <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Search</h3>
                      <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                        <input 
                          type="text" 
                          placeholder="Novel name..." 
                          className="w-full bg-[#0f1115] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
                        />
                      </div>
                      <button 
                        onClick={() => handleSearch(false)}
                        disabled={loading}
                        className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" /> Explore</>}
                      </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="bg-[#16181d] rounded-2xl p-5 border border-white/5 shadow-xl space-y-5">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Filters</h3>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Sort By</label>
                        <div className="relative">
                          <select className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-indigo-500 text-white transition-colors" value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                            <option>Addition Date</option>
                            <option>Name</option>
                            <option>View</option>
                            <option>Reader</option>
                            <option>Chapter</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Order</label>
                        <div className="flex rounded-xl bg-[#0f1115] p-1 border border-white/5">
                          <button className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", order === 'Descending' ? 'bg-[#16181d] text-white shadow' : 'text-gray-500 hover:text-gray-300')} onClick={() => setOrder('Descending')}>Desc</button>
                          <button className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", order === 'Ascending' ? 'bg-[#16181d] text-white shadow' : 'text-gray-500 hover:text-gray-300')} onClick={() => setOrder('Ascending')}>Asc</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Status</label>
                        <div className="flex flex-wrap gap-2">
                          {['All', 'Ongoing', 'Completed', 'Hiatus'].map((s) => (
                            <button key={s} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all border", status === s ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-[#0f1115] border-white/5 text-gray-400 hover:border-white/20')} onClick={() => setStatus(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Minimum Chapters</label>
                        <div className="relative">
                          <select className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-indigo-500 text-white transition-colors" value={minChapters} onChange={(e) => setMinChapters(e.target.value)}>
                            <option value="Any">Any</option>
                            <option value="50">50+ Chapters</option>
                            <option value="100">100+ Chapters</option>
                            <option value="200">200+ Chapters</option>
                            <option value="500">500+ Chapters</option>
                            <option value="1000">1000+ Chapters</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="bg-[#16181d] rounded-2xl p-5 border border-white/5 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Genres</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {allGenres.map(genre => (
                          <button
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all border",
                              genres.includes(genre) 
                                ? "bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]" 
                                : "bg-[#0f1115] border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300"
                            )}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-500" /> Trending Novels
                  </h1>
                  <div className="text-sm text-gray-500">{novels.length} results found</div>
                </div>

                {isMockData && !loading && (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-amber-500/10 border border-amber-500/20 text-amber-200/80 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                    <p>Live scraping is currently limited by Cloudflare protection. Displaying fallback mock data to demonstrate UI functionality.</p>
                  </motion.div>
                )}

                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-[#16181d] rounded-2xl border border-white/5 overflow-hidden animate-pulse">
                        <div className="aspect-[2/3] bg-white/5" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-white/10 rounded w-3/4" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
                    <p className="text-gray-400 max-w-md">{error}</p>
                  </div>
                ) : novels.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  >
                    {novels.map((novel, index) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={`${novel.id}-${index}`} 
                        onClick={() => setSelectedNovelId(novel.id)}
                        className="group bg-[#16181d] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 flex flex-col"
                      >
                        <div className="aspect-[2/3] relative overflow-hidden bg-[#0f1115]">
                          <img 
                            src={novel.image} 
                            alt={novel.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-transparent to-transparent opacity-80" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", novel.status === 'Completed' ? 'bg-emerald-400' : novel.status === 'Ongoing' ? 'bg-blue-400' : 'bg-amber-400')} />
                            <span className="text-[10px] font-medium text-white uppercase tracking-wider">{novel.status}</span>
                          </div>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-indigo-400 transition-colors leading-snug">{novel.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-3">{novel.rawTitle}</p>
                          
                          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{novel.chapters.replace('Chapters', '').trim()} Chs</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                              <span>{novel.views || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-[#16181d]/50">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No novels found</h3>
                    <p className="text-gray-400 max-w-md">Try adjusting your filters or search query to find what you're looking for.</p>
                    <button onClick={() => {setSearchQuery(''); setGenres([]); setStatus('All'); setMinChapters('Any'); handleSearch(false);}} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium">Clear Filters</button>
                  </div>
                )}

                {novels.length > 0 && hasMore && !loading && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => handleSearch(true)}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-[#16181d] hover:bg-white/5 border border-white/10 text-white rounded-xl transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading...</>
                      ) : (
                        <>Load More</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="py-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Bookmark className="w-8 h-8 text-indigo-500" /> My Library
                </h1>
              </div>
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-[#16181d]/50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Your library is empty</h3>
                <p className="text-gray-400 max-w-md">Save novels you want to read later by clicking the Bookmark icon on their details page.</p>
                <button onClick={() => setActiveTab('discover')} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20">Discover Novels</button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="py-8 max-w-2xl mx-auto">
              <div className="bg-[#16181d] rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                  <div className="absolute -bottom-12 left-8 w-24 h-24 bg-[#0f1115] rounded-full p-1.5">
                    <div className="w-full h-full bg-gradient-to-tr from-gray-700 to-gray-600 rounded-full flex items-center justify-center border border-white/10">
                      <User className="w-10 h-10 text-gray-300" />
                    </div>
                  </div>
                </div>
                <div className="pt-16 px-8 pb-8">
                  <h2 className="text-2xl font-bold text-white mb-1">Guest User</h2>
                  <p className="text-gray-400 text-sm mb-8">Sign in to sync your library across devices.</p>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3 text-gray-300">
                        <History className="w-5 h-5 text-indigo-400" /> Reading History
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Settings className="w-5 h-5 text-gray-400" /> App Settings
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10">
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#16181d]/90 backdrop-blur-xl border-t border-white/5 flex justify-around p-3 md:hidden z-50 pb-safe">
        <button onClick={() => setActiveTab('discover')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'discover' ? "text-indigo-400" : "text-gray-500 hover:text-gray-300")}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Discover</span>
        </button>
        <button onClick={() => setActiveTab('library')} className={cn("p-2 flex flex-col items-center gap-1 relative transition-colors", activeTab === 'library' ? "text-indigo-400" : "text-gray-500 hover:text-gray-300")}>
          <BookOpen className="w-5 h-5" />
          {activeTab !== 'library' && <span className="absolute top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>}
          <span className="text-[10px] font-medium">Library</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'profile' ? "text-indigo-400" : "text-gray-500 hover:text-gray-300")}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}} />
    </div>
  );
}
