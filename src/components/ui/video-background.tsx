import { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  src: string;
  className?: string;
  overlayClassName?: string;
}

export function VideoBackground({ 
  src, 
  className = '', 
  overlayClassName = 'bg-gradient-to-br from-primary/80 via-primary/70 to-secondary/80'
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, likely due to browser policy
      });
    }
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        src={src}
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </>
  );
}
