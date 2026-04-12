import React from 'react';
import { Shield, Trophy, Medal } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const users = [
    { name: "EulerFan", xp: 2450, rank: 1, color: "bg-brand-yellow" },
    { name: "GaussBoss", xp: 2100, rank: 2, color: "bg-slate-300" },
    { name: "MathWiz", xp: 1850, rank: 3, color: "bg-orange-300" },
    { name: "You", xp: 1240, rank: 4, color: "bg-brand-green", isMe: true },
    { name: "RiemannSum", xp: 900, rank: 5, color: "bg-brand-purple" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-700 dark:text-slate-200">Diamond League</h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold">Top learners this week</p>
        </div>

        <div className="space-y-4">
            {users.map((user) => (
                <div 
                    key={user.rank}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] ${user.isMe ? 'bg-white dark:bg-slate-900 border-brand-green shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                >
                    <div className="w-12 text-center font-black text-slate-400 dark:text-slate-600 text-lg">
                        {user.rank}
                    </div>
                    
                    <div className={`w-12 h-12 rounded-full ${user.color} border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center mr-4`}>
                        <span className="font-bold text-white uppercase">{user.name[0]}</span>
                    </div>

                    <div className="flex-1">
                        <h3 className={`font-bold ${user.isMe ? 'text-brand-green' : 'text-slate-700 dark:text-slate-200'}`}>
                            {user.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">
                            {Math.floor(user.xp / 100)} hours learned
                        </p>
                    </div>

                    <div className="font-extrabold text-slate-600 dark:text-slate-300">
                        {user.xp} XP
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;