import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface ProtectedVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export function ProtectedVideoPlayer({
  src,
  poster,
  title = 'Video',
  watermarkText = 'ELPGREEN',
  watermarkOpacity = 0.12,
  className = '',
  autoPlay = false,
  loop = true,
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
      clearTimeout(timeout);
    };
  }, []);

  // Prevent context menu and download
  const preventDownload = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-black select-none ${className}`}
      onContextMenu={preventDownload}
    >
      {/* Video Element - with download prevention */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover pointer-events-none"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={preventDownload}
      />

      {/* Watermark Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: watermarkOpacity }}
      >
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-12 -rotate-30 scale-150">
          {Array.from({ length: 20 }).map((_, i) => (
            <span 
              key={i}
              className="text-white font-bold text-xl md:text-2xl whitespace-nowrap tracking-widest"
              style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                userSelect: 'none'
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      </div>

      {/* Invisible overlay to prevent interaction with video */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={preventDownload}
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay Button */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-4"
      >
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" fill="white" />
              )}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Title */}
            {title && (
              <span className="text-white text-sm font-medium ml-2 hidden sm:block">
                {title}
              </span>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5 text-white" />
            ) : (
              <Maximize2 className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Anti-download CSS overlay */}
      <style>{`
        video::-webkit-media-controls-enclosure {
          display: none !important;
        }
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
