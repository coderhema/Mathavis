import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  showText?: boolean;
  onToggle: (nextDark: boolean) => void;
  isDarkMode: boolean; // We need this prop to know the current React state
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = "", 
  style, 
  iconSize = 16,
  showText = false,
  onToggle,
  isDarkMode
}) => {
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundService.playBoop();

    const nextDark = !isDarkMode;
    const x = e.clientX;
    const y = e.clientY;
    
    // Fallback for unsupported browsers
    // @ts-ignore
    if (!document.startViewTransition) {
      onToggle(nextDark);
      return;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      // 1. IMMEDIATELY update the DOM so the browser captures the "new" look
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // 2. Update React state to sync icons and other components
      onToggle(nextDark);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          // If going to dark, expand the new view. 
          // If going to light, collapse the old view (dark).
          clipPath: nextDark ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: nextDark 
            ? '::view-transition-new(root)' 
            : '::view-transition-old(root)',
        }
      );
    });
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      {showText && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
};
