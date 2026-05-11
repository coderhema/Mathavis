import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import VoxelChicken from './VoxelChicken';
import { ThemeToggle } from './ThemeToggle';
import { soundService } from '../services/soundService';

interface SubscriptionPageProps {
  onBackToAuth?: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: (nextDark: boolean) => void;
}

const TIERS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/month',
    description: 'Great for trying Mathavis',
    features: ['1 learner profile', 'Core practice modes', 'Basic visualizations'],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$9',
    cadence: '/month',
    description: 'Best for families and independent learners',
    features: ['Up to 5 learner profiles', 'All practice modes', 'Advanced visualizations', 'Priority AI responses'],
    cta: 'Choose Pro',
    featured: true,
  },
  {
    name: 'Classroom',
    price: '$29',
    cadence: '/month',
    description: 'Designed for schools and educators',
    features: ['Unlimited learners', 'Progress dashboard', 'Teacher insights', 'Class assignment tools'],
    cta: 'Contact Sales',
    featured: false,
  },
];

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onBackToAuth, isDarkMode, toggleDarkMode }) => {
  const goAuth = () => {
    soundService.playBoop();
    onBackToAuth?.();
  };

  const handleTierAction = (tierName: string) => {
    if (tierName === 'Classroom') {
      window.location.href = 'mailto:hello@mathavis.com?subject=Mathavis%20Classroom%20Plan';
      return;
    }
    goAuth();
  };

  return (
    <div className="relative min-h-dvh p-6 sm:p-8 dark-transition overflow-hidden" style={{ background: 'var(--bg2)' }}>
      <div className="absolute top-5 right-5">
        <ThemeToggle
          className="theme-toggle"
          iconSize={16}
          isDarkMode={isDarkMode || false}
          onToggle={toggleDarkMode || (() => {})}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <button onClick={goAuth} className="btn-ghost mb-8" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[24px] mb-4" style={{ background: 'var(--bg)' }}>
            <VoxelChicken size={72} emotion="happy" isAnimated={true} />
          </div>
          <p className="mono-label mb-2">Subscription</p>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: 'var(--text)' }}>
            Choose your Mathavis tier
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>
            Flexible plans for learners, families, and classrooms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="ds-card p-6 flex flex-col"
              style={tier.featured ? { border: '1px solid var(--blue)', boxShadow: '0 10px 28px var(--blue-glow)' } : undefined}
            >
              <div className="mb-4">
                <p className="mono-label mb-2">{tier.featured ? 'Most Popular' : 'Tier'}</p>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{tier.name}</h2>
                <p style={{ color: 'var(--text2)', marginTop: 6 }}>{tier.description}</p>
              </div>

              <div className="mb-5">
                <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--blue)', fontFamily: "'Space Grotesk', sans-serif" }}>{tier.price}</span>
                <span style={{ color: 'var(--text2)' }}>{tier.cadence}</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2" style={{ color: 'var(--text2)' }}>
                    <Check size={16} style={{ color: 'var(--success)', marginTop: 2 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => handleTierAction(tier.name)} className={tier.featured ? 'btn-cta w-full' : 'btn-ghost w-full'}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
