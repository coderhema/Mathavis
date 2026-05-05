import React from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  showText?: boolean;
  onToggle: (nextDark: boolean) => void;
  isDarkMode: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = "", 
  style, 
  iconSize = 16,
  showText = false,
  onToggle,
  isDarkMode
}) => {
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    soundService.playBoop();

    const nextDark = !isDarkMode;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onToggle(nextDark);
      return;
    }

    // For dark→light, inject z-index swap so new (light) layer is on top
    let swapStyle: HTMLStyleElement | null = null;
    if (!nextDark) {
      swapStyle = document.createElement('style');
      swapStyle.textContent = `
        ::view-transition-old(root) { z-index: 1; }
        ::view-transition-new(root) { z-index: 2; }
      `;
      document.head.appendChild(swapStyle);
    }

    // @ts-ignore
    await document.startViewTransition(() => {
      flushSync(() => {
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        onToggle(nextDark);
      });
    }).ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 800,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );

    // Clean up the z-index swap style after animation completes
    setTimeout(() => {
      if (swapStyle && swapStyle.parentNode) {
        document.head.removeChild(swapStyle);
      }
    }, 850);
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
