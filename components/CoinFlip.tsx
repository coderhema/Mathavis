import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CoinFlipProps {
  onComplete: () => void;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const totalFrames = 60;
    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 40;
      
      // Calculate 3D rotation (flip)
      // We'll simulate 3D by scaling the width based on a cosine wave
      const progress = frame / totalFrames;
      const angle = progress * Math.PI * 4; // 2 full flips
      const scaleX = Math.cos(angle);
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scaleX, 1);
      
      // Draw coin body
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.fill();
      ctx.strokeStyle = '#DAA520'; // Goldenrod
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Draw coin detail (a simple "₦" or "G")
      ctx.fillStyle = '#DAA520';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₦', 0, 0);
      
      ctx.restore();

      if (frame < totalFrames) {
        frame++;
        animationId = requestAnimationFrame(draw);
      } else {
        setTimeout(onComplete, 500);
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1.5, opacity: 1, y: -100 }}
      exit={{ scale: 0, opacity: 0, y: -200 }}
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
    >
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={200} 
        className="drop-shadow-2xl"
      />
    </motion.div>
  );
};

export default CoinFlip;
