import React, { useState } from 'react';
import { CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import VoxelChicken from './VoxelChicken';
import { soundService } from '../services/soundService';

type Role = 'Parent' | 'Student' | 'Organization';
type AgeGroup = 'Under 13' | '13-17' | '18-24' | '25-34' | '35-44' | '45+';
type SubscriptionWillingness = 'Yes' | 'Maybe' | 'No';

const AGE_GROUPS: AgeGroup[] = ['Under 13', '13-17', '18-24', '25-34', '35-44', '45+'];
const ROLES: Role[] = ['Parent', 'Student', 'Organization'];
const WILLINGNESS_OPTIONS: SubscriptionWillingness[] = ['Yes', 'Maybe', 'No'];

const Waitlist: React.FC = () => {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [role, setRole] = useState<Role | ''>('');
  const [email, setEmail] = useState('');
  const [willingness, setWillingness] = useState<SubscriptionWillingness | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const waitlistEndpoint = import.meta.env.GOOGLE_SHEET_LINK as string | undefined;

  const resetStatus = () => {
    if (status.type !== 'idle') {
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    soundService.playBoop();

    if (!waitlistEndpoint) {
      setStatus({
        type: 'error',
        message: 'Waitlist endpoint is not configured yet. Add GOOGLE_SHEET_LINK in Vercel to enable submissions.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const payload = {
      name: name.trim(),
      ageGroup,
      role,
      email: email.trim(),
      willingness,
      source: 'waitlist',
      submittedAt: new Date().toISOString(),
    };

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      await fetch(waitlistEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      setStatus({
        type: 'success',
        message: 'You are on the waitlist. We saved your details to the configured Google Sheet endpoint.',
      });
      setName('');
      setAgeGroup('');
      setRole('');
      setEmail('');
      setWillingness('');
    } catch {
      setStatus({
        type: 'error',
        message: 'Something went wrong while sending the waitlist entry. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-16 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-96 w-80 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand-yellow/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col lg:flex-row">
        {/* ── Left hero panel ──────────────────────────────────────────── */}
        <div className="flex flex-col justify-center gap-8 px-6 py-14 sm:px-10 lg:w-1/2 lg:py-20 xl:px-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand-blue dark:bg-brand-blue/20">
            <Sparkles size={14} />
            Early Access
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl xl:text-6xl">
              Get early access to
              <span className="block text-brand-blue">Mathavis</span>
            </h1>
            <p className="max-w-md text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
              Join the private launch list for parents, students, and organizations who want an interactive maths experience with the same playful Mathavis design.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {[
              { icon: Users, label: 'Built for families and classrooms' },
              { icon: ShieldCheck, label: 'Private & secure signup' },
              { icon: Mail, label: 'Notified at launch' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <Icon size={16} />
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</p>
              </div>
            ))}
          </div>

          {/* Mascot — visible only on large screens beside the hero text */}
          <div className="hidden lg:flex items-center gap-4 mt-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-white shadow-lg dark:bg-slate-900">
              <VoxelChicken size={68} emotion="happy" isAnimated={true} />
            </div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-[180px] leading-snug">
              Mathavis is rooting for you 🎉
            </p>
          </div>
        </div>

        {/* ── Right form panel ─────────────────────────────────────────── */}
        <div className="flex flex-col justify-center bg-white px-6 py-12 dark:bg-slate-900 sm:px-10 lg:w-1/2 xl:px-16">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Join the list</p>
                <h2 className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100 sm:text-3xl">Reserve a spot</h2>
              </div>
              <div className="shrink-0 rounded-xl bg-brand-green/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-brand-green">
                Limited launch
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Name</span>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      resetStatus();
                    }}
                    placeholder="Your full name"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Age Group</span>
                  <select
                    required
                    value={ageGroup}
                    onChange={(event) => {
                      setAgeGroup(event.target.value as AgeGroup);
                      resetStatus();
                    }}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition-all focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select age group</option>
                    {AGE_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Role</span>
                  <select
                    required
                    value={role}
                    onChange={(event) => {
                      setRole(event.target.value as Role);
                      resetStatus();
                    }}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition-all focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select role</option>
                    {ROLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetStatus();
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Willing to pay a small monthly fee?</span>
                <select
                  required
                  value={willingness}
                  onChange={(event) => {
                    setWillingness(event.target.value as SubscriptionWillingness);
                    resetStatus();
                  }}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition-all focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Choose an option</option>
                  {WILLINGNESS_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_4px_0_#1a5fb4] transition-all hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSubmitting ? 'Saving...' : 'Join waitlist'}
              </button>

              {status.message && (
                <p
                  className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                    status.type === 'success'
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'bg-brand-red/10 text-brand-red'
                  }`}
                >
                  {status.message}
                </p>
              )}

              <p className="text-xs font-medium leading-relaxed text-slate-400 dark:text-slate-500">
                Submissions are sent to the URL stored in GOOGLE_SHEET_LINK.
              </p>
            </form>

            {/* Mascot on mobile / small screens */}
            <div className="mt-8 flex items-center gap-4 lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-slate-100 dark:bg-slate-800">
                <VoxelChicken size={54} emotion="happy" isAnimated={true} />
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                Mathavis is rooting for you 🎉
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
