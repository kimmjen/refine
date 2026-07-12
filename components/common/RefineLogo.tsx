import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface RefineLogoProps {
  size?: number;
  className?: string;
  showIcon?: boolean;
}

export default function RefineLogo({ size = 24, className = "", showIcon = true }: RefineLogoProps) {
  const iconBoxSize = size * 1.2;
  const iconSize = size * 0.6;
  const fontSize = size * 0.65;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <div
          className="rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
          style={{ width: iconBoxSize, height: iconBoxSize }}
        >
          <Sparkles
            size={iconSize}
            className="text-primary-foreground"
          />
        </div>
      )}
      <span
        style={{ fontSize: `${fontSize}px` }}
        className="font-semibold tracking-tight text-foreground"
      >
        refine
      </span>
    </div>
  );
}
