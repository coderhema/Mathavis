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
    { icon: Heart, name: "Refill Hearts", desc: "Get full health to keep learning", price: 1500, color: "text-brand-red" },
    { icon: Snowflake, name: "Streak Freeze", desc: "Miss a day without losing your streak", price: 2500, color: "text-brand-blue" },
    { icon: Zap, name: "Double XP", desc: "Earn double XP for the next 30 minutes", price: 3000, color: "text-brand-yellow" },
    { icon: Wheat, name: "AI Seeds", desc: "Power Prof. Cluck's generative visualisations", price: 5000, color: "text-brand-green" },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
         <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-700 dark:text-slate-200">The Coop Store</h2>
                <p className="text-slate-400 dark:text-slate-500 font-bold">Spend your hard-earned gems on power-ups</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 px-6 py-3 rounded-3xl shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-yellow/20 rounded-xl flex items-center justify-center text-brand-yellow">
                    <Coins size={24} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Balance</span>
                    <span className="text-xl font-black text-slate-700 dark:text-slate-200">{gems.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm hover:shadow-md hover:border-brand-blue transition-all group">
                    <div className={`${item.color} p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:mr-6 mb-4 sm:mb-0 relative overflow-hidden transition-colors group-hover:scale-110 duration-300`}>
                        <item.icon size={40} fill="currentColor" className="opacity-10 absolute -top-1 -left-1 transform scale-150" />
                        <item.icon size={40} className="relative z-10" />
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0">
                        <h3 className="font-extrabold text-slate-700 dark:text-slate-200 text-xl mb-1">{item.name}</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-medium leading-tight text-sm">{item.desc}</p>
                    </div>

                    <button 
                        onClick={() => handleBuy(item)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-extrabold text-slate-600 dark:text-slate-300 shadow-[0_4px_0_#e2e8f0] dark:shadow-[0_4px_0_#1e293b] active:shadow-none active:translate-y-1 active:border-slate-300 dark:active:border-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        <span className="text-brand-green">₦</span>
                        <span>{item.price.toLocaleString()}</span>
                    </button>
                </div>
            ))}
        </div>

        <div className="mt-12 p-8 bg-brand-blue/5 dark:bg-brand-blue/10 rounded-[40px] border-2 border-dashed border-brand-blue/30 text-center">
            <h4 className="text-lg font-extrabold text-brand-blue mb-2">Want more gems?</h4>
            <p className="text-slate-500 dark:text-slate-400 font-bold">Complete daily math challenges and maintain your streak!</p>
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
