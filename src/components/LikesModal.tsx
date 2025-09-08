import { useState } from 'react';
import { X, Download, Search, Heart } from 'lucide-react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';
import { useI18n } from '../hooks/useI18n';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useRef } from 'react';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LikesModal({ isOpen, onClose }: LikesModalProps) {
  const { t } = useI18n();
  const { likedArticles, toggleLike } = useLikedArticles();
  const [searchQuery, setSearchQuery] = useState("");

  useKeyboardNavigation({
    onEscape: onClose,
    enabled: isOpen,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, containerRef);

  if (!isOpen) return null;

  const filteredLikedArticles = likedArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.extract.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const simplifiedArticles = likedArticles.map((article) => ({
      title: article.title,
      url: article.url,
      extract: article.extract,
      thumbnail: article.thumbnail?.source || null,
    }));

    const dataStr = JSON.stringify(simplifiedArticles, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `wikitok-favorites-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" role="dialog" aria-modal="true">
      <div className="modern-card z-[41] p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col relative fade-in" role="document" ref={containerRef}>
        {/* Header area */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-glow">
                {t('likes.title')}
              </h2>
              <p className="text-sm text-slate-500">
                {likedArticles.length} {t('likes.articles')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {likedArticles.length > 0 && (
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm button-glass rounded-xl transition-all duration-300 hover:scale-105 text-slate-700 hover:text-slate-800"
                title={t('likes.export')}
              >
                <Download className="w-4 h-4" />
                {t('likes.export')}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full button-glass flex items-center justify-center transition-all duration-300 text-slate-500 hover:text-slate-700"
              aria-label={t('common.close')}
              // Avoid autoFocus for a11y; focus is handled by focus trap
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search area */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('likes.search')}
            className="w-full glass-effect text-slate-800 px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 placeholder-slate-500"
          />
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredLikedArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-slate-600 text-lg font-medium">
                {searchQuery ? t('likes.noMatches') : t('likes.noLikedArticles')}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {searchQuery ? t('likes.tryDifferentSearch') : t('likes.startLiking')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLikedArticles.map((article) => (
                <div
                  key={article.pageid}
                  className="group p-4 rounded-xl glass-effect hover:bg-white/60 transition-all duration-300 border border-white/20"
                >
                  <div className="flex gap-4 items-start">
                    {article.thumbnail ? (
                      <img
                        src={article.thumbnail.source}
                        alt={article.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                         <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1"
                           onKeyDown={(e) => { if (e.key === 'Enter') { window.open(article.url, '_blank', 'noopener,noreferrer'); } }}
                        >
                          {article.title}
                        </a>
                        <button
                          onClick={() => toggleLike(article)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50"
                          aria-label={t('likes.remove')}
                          title={t('likes.remove')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {article.extract}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div
        className="w-full h-full z-[40] fixed inset-0"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}
        aria-label={t('common.close')}
        role="button"
        tabIndex={0}
        aria-pressed="false"
      ></div>
    </div>
  );
}