
import React from 'react';
import { soundService } from '../services/soundService';

interface VoxelChickenProps {
  size?: number;
  className?: string;
  emotion?: 'happy' | 'neutral' | 'thinking';
  isAnimated?: boolean;
  isSpeaking?: boolean;
}

const VoxelChicken: React.FC<VoxelChickenProps> = ({ 
  size = 40, 
  className = "", 
  emotion = 'neutral', 
  isAnimated = true,
  isSpeaking = false
}) => {
  // Enhanced animation styles for more fluid, organic movement
  const animationStyles = `
    @keyframes chicken-bob-idle {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }
    @keyframes chicken-bob-thinking {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(2px); }
    }
    @keyframes chicken-eyes-thinking {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.1); }
    }
    @keyframes chicken-bob-happy {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes chicken-blink {
      0%, 48%, 52%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.1); }
    }
    @keyframes chicken-wing-idle {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg); }
    }
    @keyframes chicken-wing-flap {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-35deg) translateY(-2px); }
      50% { transform: rotate(0deg); }
      75% { transform: rotate(25deg) translateY(-1px); }
    }
    @keyframes chicken-beak-talk {
      0%, 100% { transform: scaleY(1) translateY(0); }
      50% { transform: scaleY(1.5) translateY(1px); }
    }
    @keyframes chicken-wattle-jiggle {
      0%, 100% { transform: rotate(0deg) translateX(0); }
      25% { transform: rotate(5deg) translateX(1px); }
      75% { transform: rotate(-5deg) translateX(-1px); }
    }

    .chicken-group { 
      transform-origin: bottom center;
      animation: ${
        emotion === 'happy' ? 'chicken-bob-happy 0.6s' : 
        emotion === 'thinking' ? 'chicken-bob-thinking 3s' : 
        'chicken-bob-idle 2s'
      } cubic-bezier(0.45, 0, 0.55, 1) infinite; 
    }
    .chicken-eyes { 
      transform-box: fill-box; 
      transform-origin: center; 
      animation: ${emotion === 'thinking' ? 'chicken-eyes-thinking 3s infinite' : 'chicken-blink 4s infinite'}; 
    }
    .chicken-wing-l { 
      transform-box: fill-box; 
      transform-origin: 18px 55px; 
      animation: ${isSpeaking ? 'chicken-wing-flap 0.4s' : 'chicken-wing-idle 2s'} ease-in-out infinite; 
    }
    .chicken-wing-r { 
      transform-box: fill-box; 
      transform-origin: 82px 55px; 
      animation: ${isSpeaking ? 'chicken-wing-flap 0.4s' : 'chicken-wing-idle 2s'} ease-in-out infinite reverse; 
    }
    .chicken-beak {
      transform-box: fill-box;
      transform-origin: top center;
      ${isSpeaking ? 'animation: chicken-beak-talk 0.15s ease-in-out infinite;' : ''}
    }
    .chicken-wattle {
      transform-box: fill-box;
      transform-origin: top center;
      animation: chicken-wattle-jiggle 1.5s ease-in-out infinite;
    }
  `;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-sm cursor-pointer active:scale-95 transition-transform`}
      onClick={() => soundService.playCluck()}
    >
      <style>{animationStyles}</style>

      <g className={(isAnimated || isSpeaking) ? "chicken-group" : ""}>
        {/* Legs */}
        <rect x="35" y="80" width="10" height="15" fill="#fbbf24" />
        <rect x="55" y="80" width="10" height="15" fill="#fbbf24" />
        
        {/* Body Shadow */}
        <rect x="20" y="30" width="60" height="60" rx="12" fill="#cbd5e1" />
        
        {/* Body Main */}
        <rect x="20" y="25" width="60" height="58" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        
        {/* Face details */}
        <g className={(isAnimated || isSpeaking) ? "chicken-eyes" : ""}>
            <rect x="30" y="45" width="8" height="8" rx="2" fill="#1e293b" />
            <rect x="62" y="45" width="8" height="8" rx="2" fill="#1e293b" />
            <rect x="32" y="46" width="3" height="3" fill="white" />
            <rect x="64" y="46" width="3" height="3" fill="white" />
        </g>

        {/* Comb (Red top) */}
        <rect x="40" y="5" width="10" height="20" rx="2" fill="#ef4444" />
        <rect x="50" y="10" width="10" height="15" rx="2" fill="#ef4444" />
        <rect x="30" y="15" width="10" height="10" rx="2" fill="#ef4444" />

        {/* Beak */}
        <rect className="chicken-beak" x="45" y="55" width="10" height="10" rx="2" fill="#f59e0b" />
        
        {/* Wattle */}
        <rect className="chicken-wattle" x="47" y="65" width="6" height="8" rx="3" fill="#ef4444" />
        
        {/* Wing (Left) */}
        <rect className={(isAnimated || isSpeaking) ? "chicken-wing-l" : ""} x="12" y="50" width="12" height="20" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        
        {/* Wing (Right) */}
        <rect className={(isAnimated || isSpeaking) ? "chicken-wing-r" : ""} x="76" y="50" width="12" height="20" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      </g>

    </svg>
  );
};

export default VoxelChicken;
