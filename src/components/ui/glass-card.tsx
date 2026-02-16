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
    primary: 'hover:shadow-[0_0_25px_hsl(42_60%_50%/0.12),0_0_50px_hsl(220_30%_35%/0.08)]',
    secondary: 'hover:shadow-[0_0_25px_hsl(215_30%_45%/0.15),0_0_40px_hsl(42_55%_50%/0.06)]',
    accent: 'hover:shadow-[0_0_25px_hsl(42_65%_55%/0.15),0_0_40px_hsl(42_60%_50%/0.08)]',
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
        "border border-gold/8 dark:border-gold/10",
        "shadow-xl",
        hoverEffect && glowColors[glowColor as keyof typeof glowColors],
        "transition-shadow duration-500",
        className
      )}
    >
      {/* Gold accent gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/10 via-transparent to-gold/5 opacity-40 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
