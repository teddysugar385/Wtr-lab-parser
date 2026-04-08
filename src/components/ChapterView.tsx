import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Type, Moon, Sun, Monitor, AlignLeft, AlignJustify } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './NovelFinder';

export default function ChapterView({ novelId, chapterId, onBack, onChapterSelect }: { novelId: string, chapterId: string, onBack: () => void, onChapterSelect: (chapterId: string) => void }) {
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Reader Settings
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [alignment, setAlignment] = useState<'left' | 'justify'>('left');

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`);
        if (!res.ok) throw new Error('Failed to fetch chapter');
        const data = await res.json();
        setChapter(data);
        window.scrollTo(0, 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [novelId, chapterId]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const themeClasses = {
    dark: 'bg-[#0f1115] text-gray-300',
    light: 'bg-[#fcfcfc] text-gray-800',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]'
  };

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  };

  if (loading) return (
    <div className={`min-h-screen ${themeClasses[theme]} transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse">
        <div className="h-8 bg-current opacity-10 rounded w-3/4 mx-auto mb-12" />
        <div className="space-y-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-current opacity-5 rounded w-full" />
              <div className="h-4 bg-current opacity-5 rounded w-full" />
              <div className="h-4 bg-current opacity-5 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className={`min-h-screen ${themeClasses[theme]} flex flex-col items-center justify-center p-4`}>
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load chapter</h3>
      <p className="opacity-60 max-w-md text-center mb-6">{error}</p>
      <button onClick={onBack} className="px-6 py-2 bg-indigo-500 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20">Go Back</button>
    </div>
  );
  
  if (!chapter) return null;

  return (
    <div className={cn("min-h-screen transition-colors duration-500", themeClasses[theme])}>
      {/* Reader Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b",
        isScrolled 
          ? theme === 'dark' ? 'bg-[#16181d]/90 backdrop-blur-md border-white/5 shadow-lg' : theme === 'light' ? 'bg-white/90 backdrop-blur-md border-gray-200 shadow-sm' : 'bg-[#f4ecd8]/90 backdrop-blur-md border-[#e4dcc8] shadow-sm'
          : 'bg-transparent border-transparent'
      )}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-70 transition-opacity group">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", theme === 'dark' ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10')}>
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium hidden sm:block">Back</span>
          </button>
          
          <div className={cn("text-sm font-medium truncate px-4 transition-opacity duration-300", isScrolled ? 'opacity-100' : 'opacity-0')}>
            {chapter.title}
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", showSettings ? (theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white') : (theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'))}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "fixed top-20 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 rounded-2xl shadow-2xl border p-5",
              theme === 'dark' ? 'bg-[#1c1e26] border-white/10 shadow-black/50' : theme === 'light' ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-[#fdf6e3] border-[#e4dcc8] shadow-[#d4ccb8]/50'
            )}
          >
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setTheme('light')} className={cn("py-2 rounded-lg border flex justify-center items-center transition-all", theme === 'light' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300')}><Sun className="w-4 h-4" /></button>
                  <button onClick={() => setTheme('sepia')} className={cn("py-2 rounded-lg border flex justify-center items-center transition-all", theme === 'sepia' ? 'border-amber-600 bg-amber-600/10 text-amber-700' : 'border-[#e4dcc8] bg-[#f4ecd8] text-[#5b4636] hover:border-[#d4ccb8]')}><Monitor className="w-4 h-4" /></button>
                  <button onClick={() => setTheme('dark')} className={cn("py-2 rounded-lg border flex justify-center items-center transition-all", theme === 'dark' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-white/10 bg-[#0f1115] text-gray-300 hover:border-white/20')}><Moon className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3 block flex justify-between">
                  <span>Font Size</span>
                  <span>{fontSize}px</span>
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className={cn("w-8 h-8 rounded-full flex items-center justify-center border transition-colors", theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}><Type className="w-3 h-3" /></button>
                  <input type="range" min="12" max="32" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-indigo-500" />
                  <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className={cn("w-8 h-8 rounded-full flex items-center justify-center border transition-colors", theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}><Type className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3 block">Font Family</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setFontFamily('sans')} className={cn("py-1.5 rounded-lg border text-sm font-sans transition-all", fontFamily === 'sans' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}>Sans</button>
                  <button onClick={() => setFontFamily('serif')} className={cn("py-1.5 rounded-lg border text-sm font-serif transition-all", fontFamily === 'serif' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}>Serif</button>
                  <button onClick={() => setFontFamily('mono')} className={cn("py-1.5 rounded-lg border text-sm font-mono transition-all", fontFamily === 'mono' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}>Mono</button>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3 block">Alignment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setAlignment('left')} className={cn("py-2 rounded-lg border flex justify-center items-center transition-all", alignment === 'left' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}><AlignLeft className="w-4 h-4" /></button>
                  <button onClick={() => setAlignment('justify')} className={cn("py-2 rounded-lg border flex justify-center items-center transition-all", alignment === 'justify' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')}><AlignJustify className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={cn(
          "max-w-3xl mx-auto px-4 sm:px-8 pt-24 pb-32 transition-all duration-300",
          fontClasses[fontFamily],
          alignment === 'justify' ? 'text-justify' : 'text-left'
        )}
        style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
      >
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-12 text-center leading-tight"
          style={{ fontFamily: 'var(--font-sans)' }} // Keep title sans-serif usually
        >
          {chapter.title}
        </motion.h1>
        
        <div className="flex justify-between mb-12 opacity-60 text-sm font-sans">
          <button
            onClick={() => chapter.prevId && onChapterSelect(chapter.prevId)}
            disabled={!chapter.prevId}
            className="flex items-center gap-1 hover:text-indigo-500 transition-colors disabled:opacity-30 disabled:hover:text-inherit"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={() => chapter.nextId && onChapterSelect(chapter.nextId)}
            disabled={!chapter.nextId}
            className="flex items-center gap-1 hover:text-indigo-500 transition-colors disabled:opacity-30 disabled:hover:text-inherit"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          ref={contentRef}
          className="chapter-content prose-p:mb-6 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.contentHtml }}
        />

        {/* Bottom Navigation */}
        <div className={cn("flex justify-between mt-16 pt-8 border-t", theme === 'dark' ? 'border-white/10' : 'border-black/10')}>
          <button
            onClick={() => chapter.prevId && onChapterSelect(chapter.prevId)}
            disabled={!chapter.prevId}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed",
              theme === 'dark' ? 'bg-[#16181d] hover:bg-white/5 border border-white/5' : 'bg-black/5 hover:bg-black/10 border border-black/5'
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Previous Chapter
          </button>
          <button
            onClick={() => chapter.nextId && onChapterSelect(chapter.nextId)}
            disabled={!chapter.nextId}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed",
              theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
            )}
          >
            Next Chapter <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .chapter-content p {
          margin-bottom: 1.5em;
        }
        .chapter-content br {
          display: block;
          content: "";
          margin-top: 1em;
        }
      `}} />
    </div>
  );
}
