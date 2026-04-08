import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Star, Clock, User, Share2, BookmarkPlus, ChevronRight, List, Ticket, Check, MessageSquare, ThumbsUp, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NovelDetails({ novelId, onBack, onChapterSelect }: { novelId: string, onBack: () => void, onChapterSelect: (chapterId: string) => void }) {
  const [novel, setNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'about' | 'toc' | 'reviews' | 'recommendations'>('about');
  
  // EPUB Download State
  const [showEpubModal, setShowEpubModal] = useState(false);
  const [epubStart, setEpubStart] = useState(1);
  const [epubEnd, setEpubEnd] = useState(50);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [epubError, setEpubError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/novels/${novelId}`);
        if (!res.ok) throw new Error('Failed to fetch novel details');
        const data = await res.json();
        setNovel(data);
        
        // Set default epub end to max 50 or total chapters
        if (data.chapters && data.chapters.length > 0) {
          setEpubEnd(Math.min(50, data.chapters.length));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [novelId]);

  const handleDownloadEpub = async () => {
    if (!novel || !novel.chapters) return;
    
    const startIdx = Math.max(0, epubStart - 1);
    const endIdx = Math.min(novel.chapters.length, epubEnd);
    
    if (endIdx - startIdx > 100) {
      setEpubError("You can only download up to 100 chapters at a time.");
      return;
    }
    if (startIdx >= endIdx) {
      setEpubError("Invalid chapter range.");
      return;
    }

    const chapterIds = novel.chapters.slice(startIdx, endIdx).map((c: any) => c.id);
    
    try {
      setIsGeneratingEpub(true);
      setEpubError(null);
      
      const res = await fetch(`/api/novels/${novelId}/epub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chapterIds })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate EPUB');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${epubStart}-${epubEnd}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowEpubModal(false);
    } catch (err: any) {
      setEpubError(err.message);
    } finally {
      setIsGeneratingEpub(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-24 bg-white/10 rounded mb-8" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 h-96 bg-white/5 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-white/10 rounded w-3/4" />
          <div className="h-6 bg-white/5 rounded w-1/4" />
          <div className="flex gap-2 mt-6">
            <div className="h-8 bg-white/5 rounded w-20" />
            <div className="h-8 bg-white/5 rounded w-20" />
          </div>
          <div className="space-y-2 mt-8">
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Failed to load novel</h3>
      <p className="text-gray-400 max-w-md mb-6">{error}</p>
      <button onClick={onBack} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium">Go Back</button>
    </div>
  );
  
  if (!novel) return null;

  const totalChapters = novel.chapters?.length || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group w-fit">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="font-medium">Back to Discover</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-8">
        {/* Cover Image & Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full md:w-72 flex-shrink-0"
        >
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 group">
            <img src={novel.image} alt={novel.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-60" />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={() => novel.chapters && novel.chapters.length > 0 && onChapterSelect(novel.chapters[0].id)}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4" /> Read
            </button>
            <button 
              onClick={() => setShowEpubModal(true)}
              className="flex items-center justify-center gap-2 py-3 bg-[#16181d] hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" /> EPUB
            </button>
          </div>
        </motion.div>

        {/* Info & Tabs */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-bold uppercase tracking-wider">Novel</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> 4.8
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">{novel.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300 font-medium">{novel.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <span>{totalChapters} Chapters</span>
            </div>
          </div>

          {/* Unlock Progress */}
          <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 mb-8 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-orange-500 font-bold tracking-wide text-sm">
                <Ticket className="w-5 h-5" /> AI-UNLOCK PROGRESS
              </div>
              <div className="text-orange-500 font-bold text-sm">
                {totalChapters} <span className="text-gray-500 font-normal">/ {totalChapters}</span>
              </div>
            </div>
            <div className="h-2 bg-[#0f1115] rounded-full overflow-hidden mb-3 border border-white/5">
              <div className="h-full bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="text-emerald-500 text-xs font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> All chapters unlocked
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto custom-scrollbar border-b border-white/10 mb-6">
            {[
              { id: 'about', label: 'About' },
              { id: 'toc', label: 'Table of Contents' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'recommendations', label: 'Recommendations' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailsTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  detailsTab === tab.id 
                    ? 'border-indigo-500 text-indigo-400' 
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {detailsTab === 'about' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                  <h3 className="text-lg font-semibold text-white mb-3">Synopsis</h3>
                  <div 
                    className={`prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed ${!showFullDesc && 'line-clamp-4'}`}
                    dangerouslySetInnerHTML={{ __html: novel.description }}
                  />
                  <button 
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    {showFullDesc ? 'Show Less' : 'Read More'} <ChevronRight className={`w-4 h-4 transition-transform ${showFullDesc ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-400" /> Genre & Tags
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">GENRE</h4>
                      <div className="flex flex-wrap gap-2">
                        {novel.genres.map((g: string, index: number) => (
                          <span key={`${g}-${index}`} className="px-3 py-1.5 bg-[#16181d] border border-white/5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors cursor-pointer">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {detailsTab === 'toc' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <List className="w-5 h-5 text-indigo-500" /> Chapters
                  </h2>
                  <span className="text-sm text-gray-500 bg-[#16181d] px-3 py-1 rounded-full border border-white/5">{totalChapters} Total</span>
                </div>
                
                <div className="bg-[#16181d] rounded-2xl border border-white/5 overflow-hidden">
                  {novel.chapters && novel.chapters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:gap-px bg-white/5">
                      {novel.chapters.map((chapter: any, index: number) => (
                        <button
                          key={`${chapter.id}-${index}`}
                          onClick={() => onChapterSelect(chapter.id)}
                          className="w-full text-left px-5 py-4 bg-[#16181d] hover:bg-white/5 transition-colors flex items-center justify-between group"
                        >
                          <span className="text-gray-300 group-hover:text-indigo-400 transition-colors line-clamp-1 pr-4 text-sm font-medium">{chapter.title}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No chapters found for this novel.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {detailsTab === 'reviews' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-3xl bg-[#16181d]/50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
                <p className="text-gray-400 max-w-md">Be the first to review this novel and share your thoughts with the community.</p>
                <button className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20">Write a Review</button>
              </motion.div>
            )}

            {detailsTab === 'recommendations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-3xl bg-[#16181d]/50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ThumbsUp className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Similar Novels</h3>
                <p className="text-gray-400 max-w-md">We're still analyzing this novel to find the best recommendations for you.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* EPUB Download Modal */}
      <AnimatePresence>
        {showEpubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isGeneratingEpub && setShowEpubModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#16181d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-400" /> Download EPUB
                </h3>
                <button 
                  onClick={() => !isGeneratingEpub && setShowEpubModal(false)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  disabled={isGeneratingEpub}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-gray-400">
                  Select the range of chapters to download. You can download up to 100 chapters at a time to prevent server timeouts.
                </p>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Start Chapter</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={totalChapters}
                      value={epubStart}
                      onChange={(e) => setEpubStart(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      disabled={isGeneratingEpub}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">End Chapter</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={totalChapters}
                      value={epubEnd}
                      onChange={(e) => setEpubEnd(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      disabled={isGeneratingEpub}
                    />
                  </div>
                </div>

                {epubError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {epubError}
                  </div>
                )}
              </div>

              <button 
                onClick={handleDownloadEpub}
                disabled={isGeneratingEpub}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingEpub ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating EPUB...</>
                ) : (
                  <>Generate & Download</>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
