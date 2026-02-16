import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface WatermarkImageProps {
  src: string;
  alt: string;
  className?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
}

export function WatermarkImage({ 
  src, 
  alt, 
  className,
  watermarkText = 'ELPGREEN',
  watermarkOpacity = 0.15
}: WatermarkImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Block all attempts to save/download the image
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventActions = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Block drag events
    container.addEventListener('dragstart', preventActions, true);
    container.addEventListener('drop', preventActions, true);
    
    // Block keyboard shortcuts for save
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('dragstart', preventActions, true);
      container.removeEventListener('drop', preventActions, true);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        // Prevent long-press save on mobile
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          e.preventDefault();
        }
      }}
    >
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full object-cover pointer-events-none", className)}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      />
      {/* Watermark overlay - more visible */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ opacity: watermarkOpacity }}
      >
        {/* Diagonal repeated watermarks - denser pattern */}
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 -rotate-45 scale-[2]">
          {Array.from({ length: 50 }).map((_, i) => (
            <span 
              key={i}
              className="text-white font-bold text-xl md:text-2xl whitespace-nowrap tracking-widest"
              style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      </div>
      {/* Center watermark logo - larger and more visible */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: watermarkOpacity * 1.5 }}
      >
        <div 
          className="text-white font-bold text-4xl md:text-6xl tracking-[0.3em] px-8 py-4 border-4 border-white/50 rounded-lg"
          style={{ 
            textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
            userSelect: 'none'
          }}
        >
          {watermarkText}
        </div>
      </div>
      {/* Invisible overlay to prevent interactions */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        style={{ 
          background: 'transparent',
          WebkitTouchCallout: 'none'
        }}
      />
    </div>
  );
}
