import React, { useState } from 'react';
import { Heart, Zap, Snowflake, Wheat, Coins } from 'lucide-react';
import { soundService } from '../services/soundService';
import CoinFlip from './CoinFlip';
import { AnimatePresence } from 'motion/react';

const Shop: React.FC = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [gems, setGems] = useState(12500);

  const handleBuy = (item: any) => {
    if (gems >= item.price) {
      soundService.playSuccess();
      setGems(prev => prev - item.price);
      setShowAnimation(true);
    } else {
      soundService.playError();
      alert("Not enough gems! Keep learning to earn more.");
    }
  };

  const items = [
    { icon: Heart,     name: "Refill Hearts",  desc: "Get full health to keep learning",                 price: 1500, accent: '#FF4B4B' },
    { icon: Snowflake, name: "Streak Freeze",   desc: "Miss a day without losing your streak",            price: 2500, accent: '#1CB0F6' },
    { icon: Zap,       name: "Double XP",       desc: "Earn double XP for the next 30 minutes",           price: 3000, accent: '#FFC800' },
    { icon: Wheat,     name: "AI Seeds",        desc: "Power Prof. Cluck's generative visualisations",    price: 5000, accent: '#58CC02' },
  ];

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dark-transition scrollbar-hide"
      style={{ background: 'var(--bg2)', padding: '2rem 1rem' }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-center md:text-left">
            <span className="mono-label mb-1 block">Coop Store</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black" style={{ color: 'var(--text)' }}>Power-Ups</h2>
            <p className="mono-hint mt-1">Spend your hard-earned gems</p>
          </div>

          {/* Balance chip */}
          <div
            className="ds-card flex items-center gap-3 px-6 py-3 rounded-[20px] w-full md:w-auto justify-center"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.15)' }}
            >
              <Coins size={22} style={{ color: 'var(--accent)' }} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="mono-label">Your Balance</span>
              <span className="text-xl font-black" style={{ color: 'var(--text)' }}>{gems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Item grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="ds-card flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 rounded-[28px] transition-all group hover:scale-[1.01]"
              style={{ '--hover-border': item.accent } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = item.accent}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 p-4 rounded-2xl relative overflow-hidden transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'var(--bg3)', color: item.accent }}
              >
                <item.icon size={36} fill="currentColor" className="opacity-10 absolute -top-1 -left-1 scale-150" />
                <item.icon size={36} className="relative z-10" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-black text-lg mb-1" style={{ color: 'var(--text)' }}>{item.name}</h3>
                <p className="mono-hint leading-relaxed">{item.desc}</p>
              </div>

              {/* Buy button */}
              <button
                onClick={() => handleBuy(item)}
                className="btn-ghost w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span style={{ color: 'var(--success)', fontWeight: 800 }}>₦</span>
                <span>{item.price.toLocaleString()}</span>
              </button>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div
          className="mt-12 p-8 rounded-[32px] text-center"
          style={{ background: 'var(--bg3)', border: '1.5px dashed var(--border2)' }}
        >
          <h4 className="text-lg font-black mb-2" style={{ color: 'var(--blue)' }}>Want more gems?</h4>
          <p className="mono-hint">Complete daily math challenges and maintain your streak!</p>
        </div>
      </div>

      <AnimatePresence>
        {showAnimation && (
          <CoinFlip onComplete={() => setShowAnimation(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
