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
    <div className="relative min-h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-8 h-56 w-56 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue/20 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand-blue shadow-sm backdrop-blur dark:border-brand-blue/30 dark:bg-slate-900/80">
              <Sparkles size={14} />
              Waitlist
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl lg:text-6xl">
                Get early access to
                <span className="block text-brand-blue">Mathavis</span>
              </h1>
              <p className="max-w-lg text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
                Join the private launch list for parents, students, and organizations who want an interactive maths experience with the same playful Mathavis design.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, label: 'Built for families and classrooms' },
                { icon: ShieldCheck, label: 'Private signup endpoint via Vercel' },
                { icon: Mail, label: 'Get notified when the waitlist opens' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <Icon size={18} />
                  </div>
                  <p className="text-sm font-bold leading-tight text-slate-600 dark:text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="relative overflow-visible rounded-[36px] border-4 border-slate-200 bg-white p-6 pb-24 shadow-[0_18px_0_#e2e8f0] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_18px_0_#0f172a] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Join the list</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">Reserve a spot</h2>
                </div>
                <div className="rounded-2xl bg-brand-green/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-brand-green">
                  Limited launch
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Willingness to pay a small monthly sub fee</span>
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
                    className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold ${
                      status.type === 'success'
                        ? 'border-brand-green/20 bg-brand-green/10 text-brand-green'
                        : 'border-brand-red/20 bg-brand-red/10 text-brand-red'
                    }`}
                  >
                    {status.message}
                  </p>
                )}

                <p className="text-xs font-medium leading-relaxed text-slate-400 dark:text-slate-500">
                  Submissions are sent to the URL stored in GOOGLE_SHEET_LINK.
                </p>
              </form>

              <div className="absolute -bottom-10 left-1/2 z-20 -translate-x-1/2">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:h-28 sm:w-28">
                  <VoxelChicken size={84} emotion="happy" isAnimated={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
