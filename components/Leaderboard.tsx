import React from 'react';
import { Trophy, Medal } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC = () => {
  const users = [
    { name: 'EulerFan',   xp: 2450, rank: 1, color: '#FFC800' },
    { name: 'GaussBoss',  xp: 2100, rank: 2, color: '#94a3b8' },
    { name: 'MathWiz',    xp: 1850, rank: 3, color: '#f97316' },
    { name: 'You',        xp: 1240, rank: 4, color: '#58CC02', isMe: true },
    { name: 'RiemannSum', xp:  900, rank: 5, color: '#CE82FF' },
  ];

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dark-transition scrollbar-hide"
      style={{ background: 'var(--bg2)', padding: '2rem 1rem' }}
    >
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full"
            style={{ background: 'rgba(245,200,66,0.12)', color: 'var(--accent)', fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            <Trophy size={14} />
            Weekly standings
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black mb-1"
            style={{ color: 'var(--text)' }}
          >
            Diamond League
          </h2>
          <p className="mono-hint">Top learners this week</p>
        </div>

        {/* Podium (top 3) */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
          {[users[1], users[0], users[2]].map((u, i) => {
            const heights = ['h-24', 'h-32', 'h-20'];
            const order   = [1, 0, 2]; // silver · gold · bronze
            return (
              <div key={u.rank} className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
                <span className="text-2xl">{MEDALS[order[i]]}</span>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg shadow-lg"
                  style={{ background: u.color }}
                >
                  {u.name[0]}
                </div>
                <span className="font-black text-xs truncate w-full text-center" style={{ color: 'var(--text)' }}>{u.name}</span>
                <span className="mono-hint">{u.xp} XP</span>
                <div
                  className={`w-full ${heights[i]} rounded-t-2xl`}
                  style={{ background: 'var(--bg3)', border: '1.5px solid var(--border)' }}
                />
              </div>
            );
          })}
        </div>

        {/* Full ranking list */}
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.rank}
              className="ds-card flex w-full min-w-0 items-center gap-3 sm:gap-4 p-4 rounded-[20px] transition-all hover:scale-[1.01]"
              style={user.isMe ? { borderColor: 'var(--success)', boxShadow: '0 0 0 2px var(--success)' } : {}}
            >
              {/* Rank */}
              <div
                className="w-10 shrink-0 text-center font-black text-lg"
                style={{ color: user.rank <= 3 ? 'var(--accent)' : 'var(--text3)' }}
              >
                {user.rank <= 3 ? MEDALS[user.rank - 1] : user.rank}
              </div>

              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-sm"
                style={{ background: user.color }}
              >
                {user.name[0]}
              </div>

              {/* Name & hours */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate" style={{ color: user.isMe ? 'var(--success)' : 'var(--text)' }}>
                  {user.name}{user.isMe && <span className="mono-hint ml-2">(you)</span>}
                </h3>
                <p className="mono-hint">{Math.floor(user.xp / 100)} hrs learned</p>
              </div>

              {/* XP */}
              <div className="font-black shrink-0" style={{ color: 'var(--text2)' }}>
                {user.xp.toLocaleString()} <span className="mono-hint">XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
