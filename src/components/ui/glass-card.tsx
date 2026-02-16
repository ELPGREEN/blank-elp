import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({ 
  children, 
  className, 
  hoverEffect = true,
  glowColor = 'primary',
  onClick
}, ref) => {
  const glowColors = {
    primary: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]',
    secondary: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]',
    accent: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]',
  };

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      whileHover={hoverEffect ? { scale: 1.02, y: -5 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/5 dark:bg-white/5 backdrop-blur-xl",
        "border border-white/10 dark:border-white/10",
        "shadow-xl",
        hoverEffect && glowColors[glowColor as keyof typeof glowColors],
        "transition-shadow duration-500",
        className
      )}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
