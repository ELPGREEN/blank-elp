import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 border border-gold/10 hover:border-gold/25 shadow-md hover:shadow-lg",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-gold/20",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-gold/8",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      // ELP Premium variants - Navy blue, white & gold
      "elp-solid": "bg-primary text-white hover:bg-primary/90 shadow-md border border-gold/15 hover:border-gold/30 hover:shadow-[0_4px_15px_hsl(42_60%_50%/0.08)]",
      "elp-outline": "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:border-gold/30",
      "elp-white": "bg-white text-primary hover:bg-white/90 shadow-md border border-gold/10 hover:border-gold/25",
      "elp-white-outline": "border-2 border-white/80 text-white bg-transparent hover:bg-white/10 hover:border-gold/40",
      // Premium gold variants
      "elp-gold": "bg-gradient-to-r from-gold-dark via-gold to-gold-light text-primary-foreground shadow-md hover:shadow-[0_4px_20px_hsl(42_65%_50%/0.25)] border border-gold-light/20",
      "elp-gold-outline": "border-[1.5px] border-gold/50 text-gold hover:bg-gold/8 hover:border-gold/70 hover:shadow-[0_0_15px_hsl(42_60%_50%/0.1)]",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default"
  }
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("", buttonVariants({
    variant,
    size,
    className
  }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
export { Button, buttonVariants };