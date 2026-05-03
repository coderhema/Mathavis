
import React from 'react';
import { soundService } from '../services/soundService';

interface VoxelChickenProps {
  size?: number;
  className?: string;
  emotion?: 'happy' | 'neutral' | 'thinking';
  isAnimated?: boolean;
  isSpeaking?: boolean;
  isCelebrating?: boolean;
}

const VoxelChicken: React.FC<VoxelChickenProps> = ({
  size = 40,
  className = '',
  emotion = 'neutral',
  isAnimated = true,
  isSpeaking = false,
  isCelebrating = false,
}) => {
  const animated = isAnimated || isSpeaking || isCelebrating;

  // Bob animation variant
  const bobAnim =
    isCelebrating
      ? 'chk-celebrate 0.7s cubic-bezier(.36,.07,.19,.97) both'
      : emotion === 'happy'
      ? 'chk-happy-bob 0.6s cubic-bezier(0.45,0,0.55,1) infinite'
      : emotion === 'thinking'
      ? 'chk-thinking-bob 3s ease-in-out infinite'
      : 'chk-bob 2.2s ease-in-out infinite';

  // Eye animation variant
  const eyeAnim =
    emotion === 'thinking'
      ? 'chk-thinking-eyes 3s ease-in-out infinite'
      : 'chk-blink 5s ease-in-out infinite';

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
      <style>{`
        /* Bob — whole group */
        .chk-group {
          transform-origin: bottom center;
          ${animated ? `animation: ${bobAnim};` : ''}
        }
        /* Blink / eye squash */
        .chk-eyes {
          transform-box: fill-box;
          transform-origin: center;
          ${animated ? `animation: ${eyeAnim};` : ''}
        }
        /* Left wing wave (pivot from shoulder top-left) */
        .chk-wing-l {
          transform-box: fill-box;
          transform-origin: 12px 50px;
          ${
            animated
              ? isSpeaking
                ? 'animation: chk-wave 0.4s ease-in-out infinite;'
                : 'animation: chk-wave 2.4s ease-in-out infinite;'
              : ''
          }
        }
        /* Right wing idle sway (pivot from shoulder top-right) */
        .chk-wing-r {
          transform-box: fill-box;
          transform-origin: 88px 50px;
          ${
            animated
              ? isSpeaking
                ? 'animation: chk-wave 0.4s ease-in-out infinite reverse;'
                : 'animation: chk-sway 2.8s ease-in-out infinite;'
              : ''
          }
        }
        /* Beak talk */
        .chk-beak {
          transform-box: fill-box;
          transform-origin: top center;
          ${isSpeaking && animated ? 'animation: chk-beak-talk 0.15s ease-in-out infinite;' : ''}
        }
        /* Wattle jiggle */
        .chk-wattle {
          transform-box: fill-box;
          transform-origin: top center;
          ${animated ? 'animation: chk-wattle 1.6s ease-in-out infinite;' : ''}
        }
      `}</style>

      <g className="chk-group">
        {/* Legs */}
        <rect x="35" y="80" width="10" height="15" rx="3" fill="var(--chk-legs,#fbbf24)" />
        <rect x="55" y="80" width="10" height="15" rx="3" fill="var(--chk-legs,#fbbf24)" />

        {/* Body shadow */}
        <rect x="20" y="30" width="60" height="60" rx="12" fill="var(--chk-shadow,#cbd5e1)" />

        {/* Body */}
        <rect
          x="20" y="25" width="60" height="58" rx="12"
          fill="var(--chk-body,#ffffff)"
          stroke="var(--chk-border,#e2e8f0)"
          strokeWidth="2"
        />

        {/* Eyes */}
        <g className="chk-eyes">
          <rect x="30" y="45" width="8" height="8" rx="2" fill="var(--chk-eyes,#1e293b)" />
          <rect x="62" y="45" width="8" height="8" rx="2" fill="var(--chk-eyes,#1e293b)" />
          {/* Gleam */}
          <rect x="32" y="46" width="3" height="3" fill="white" />
          <rect x="64" y="46" width="3" height="3" fill="white" />
        </g>

        {/* Comb (red) */}
        <rect x="40" y="5"  width="10" height="20" rx="2" fill="var(--chk-comb,#ef4444)" />
        <rect x="50" y="10" width="10" height="15" rx="2" fill="var(--chk-comb,#ef4444)" />
        <rect x="30" y="15" width="10" height="10" rx="2" fill="var(--chk-comb,#ef4444)" />

        {/* Beak */}
        <rect className="chk-beak" x="45" y="55" width="10" height="10" rx="2" fill="var(--chk-beak,#f59e0b)" />

        {/* Wattle */}
        <rect className="chk-wattle" x="47" y="65" width="6" height="8" rx="3" fill="var(--chk-comb,#ef4444)" />

        {/* Left wing */}
        <rect
          className="chk-wing-l"
          x="12" y="50" width="12" height="20" rx="4"
          fill="var(--chk-body,#ffffff)"
          stroke="var(--chk-border,#e2e8f0)"
          strokeWidth="2"
        />

        {/* Right wing */}
        <rect
          className="chk-wing-r"
          x="76" y="50" width="12" height="20" rx="4"
          fill="var(--chk-body,#ffffff)"
          stroke="var(--chk-border,#e2e8f0)"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
};

export default VoxelChicken;
