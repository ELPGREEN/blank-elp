import { forwardRef, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
  onClick?: () => void;
  tilt?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  className,
  hoverEffect = true,
  glowColor = 'primary',
  onClick,
  tilt = true,
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [specularX, setSpecularX] = useState(50);
  const [specularY, setSpecularY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const glowColors: Record<string, string> = {
    primary: 'hover:shadow-[0_0_30px_hsl(42_60%_50%/0.12),0_0_60px_hsl(220_30%_35%/0.08)]',
    secondary: 'hover:shadow-[0_0_25px_hsl(215_30%_45%/0.15),0_0_40px_hsl(42_55%_50%/0.06)]',
    accent: 'hover:shadow-[0_0_25px_hsl(42_65%_55%/0.15),0_0_40px_hsl(42_60%_50%/0.08)]',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !hoverEffect || !cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Max ±7deg tilt
    const maxTilt = 7;
    const rX = (-dy / (rect.height / 2)) * maxTilt;
    const rY = (dx / (rect.width / 2)) * maxTilt;

    setRotateX(rX);
    setRotateY(rY);

    // Specular highlight moves opposite to tilt
    const sx = 50 - (dx / rect.width) * 60;
    const sy = 50 - (dy / rect.height) * 60;
    setSpecularX(sx);
    setSpecularY(sy);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setSpecularX(50);
    setSpecularY(50);
  };

  return (
    <motion.div
      ref={(node) => {
        // Merge refs
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered && tilt
          ? `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/5 backdrop-blur-xl",
        "border border-border/60",
        "shadow-xl",
        hoverEffect && glowColors[glowColor as keyof typeof glowColors],
        "transition-shadow duration-500",
        className
      )}
    >
      {/* Specular highlight — follows mouse like a metal reflection */}
      {isHovered && tilt && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl z-20"
          style={{
            background: `radial-gradient(ellipse 55% 40% at ${specularX}% ${specularY}%, hsl(42 70% 65% / 0.08), transparent 70%)`,
            transition: 'background 0.05s ease-out',
          }}
        />
      )}

      {/* Subtle metallic accent border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-border/10 via-transparent to-border/5 opacity-40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
