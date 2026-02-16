import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Volume2, VolumeX, Maximize2, Youtube, ExternalLink } from 'lucide-react';
import { openExternal } from '@/lib/openExternal';

type VideoPlayerProps = {
  videoId: string;
  title: string;
  tags: React.ReactNode;
  tagColors: string;
};

export function VideoPlayer({ videoId, title, tags }: VideoPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEmbedLoaded, setIsEmbedLoaded] = useState(false);
  const [hasEmbedTimeout, setHasEmbedTimeout] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // When expanded, start playing
  useEffect(() => {
    if (isExpanded) {
      setIsPlaying(true);
      setIsEmbedLoaded(false);
      setHasEmbedTimeout(false);
    } else {
      setIsPlaying(false);
      setIsMuted(true);
      setIsEmbedLoaded(false);
      setHasEmbedTimeout(false);
    }
  }, [isExpanded]);

  // If the iframe doesn't load quickly, assume it's blocked in preview and show a friendly fallback.
  useEffect(() => {
    if (!isExpanded || !isPlaying) return;
    if (isEmbedLoaded) return;

    const id = window.setTimeout(() => {
      setHasEmbedTimeout(true);
    }, 2500);

    return () => window.clearTimeout(id);
  }, [isExpanded, isPlaying, isEmbedLoaded]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    if (isExpanded) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleCardClick = () => {
    setIsExpanded(true);
  };

  return (
    <>
      {/* Card Thumbnail */}
      <motion.div
        onClick={handleCardClick}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group bg-card rounded-2xl overflow-hidden shadow-lg border border-border hover:border-red-500/50 hover:shadow-red-500/10 hover:shadow-xl transition-all cursor-pointer"
      >
        {/* YouTube Thumbnail */}
        <div className="aspect-video relative overflow-hidden">
          <img
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-white ml-1" fill="white" />
            </div>
          </div>
          {/* Expand hint */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
            Clique para expandir
          </div>
          {/* YouTube badge */}
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
            <Youtube className="h-3 w-3" />
            YouTube
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">{title}</h3>
          {tags}
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsExpanded(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* YouTube Embed */}
              {isPlaying && (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  onLoad={() => setIsEmbedLoaded(true)}
                />
              )}

              {/* Fallback when blocked in preview */}
              {isPlaying && hasEmbedTimeout && !isEmbedLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                  <div className="max-w-md w-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-center">
                    <h4 className="text-white font-semibold">Vídeo indisponível aqui</h4>
                    <p className="text-white/70 text-sm mt-2">
                      Alguns ambientes bloqueiam o player do YouTube. Abra o vídeo diretamente no YouTube.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExternal(youtubeWatchUrl, 'Se estiver bloqueado, use "Copiar link".');
                        }}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold inline-flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir no YouTube
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                {/* Open on YouTube */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openExternal(youtubeWatchUrl, 'Se estiver bloqueado, use "Copiar link".');
                  }}
                  className="px-3 py-2 bg-black/70 hover:bg-black/90 rounded-full transition-colors group inline-flex items-center gap-2"
                  title="Abrir no YouTube"
                >
                  <ExternalLink className="h-4 w-4 text-white group-hover:text-red-400" />
                  <span className="text-xs font-semibold text-white hidden sm:inline">Abrir no YouTube</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Mute/Unmute button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="p-3 bg-black/70 hover:bg-black/90 rounded-full transition-colors group"
                    title={isMuted ? 'Ativar som' : 'Desativar som'}
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5 text-white group-hover:text-red-400" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white group-hover:text-green-400" />
                    )}
                  </button>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="p-3 bg-black/70 hover:bg-red-600 rounded-full transition-colors"
                    title="Fechar"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Title bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg truncate">{title}</h3>
                <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                  <Youtube className="h-4 w-4 text-red-500" />
                  youtube.com/@elpgreen/videos
                  {isMuted && (
                    <span className="ml-2 text-yellow-400 text-xs flex items-center gap-1">
                      <VolumeX className="h-3 w-3" />
                      Clique no ícone de som para ativar o áudio
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
