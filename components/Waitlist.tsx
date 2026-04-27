import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';

type Role = 'Parent' | 'Student' | 'Organization';
type AgeGroup = 'Under 13' | '13-17' | '18-24' | '25-34' | '35-44' | '45+';
type SubscriptionWillingness = 'Yes' | 'Maybe' | 'No';

interface FormData {
  name: string;
  ageGroup: AgeGroup | '';
  role: Role | '';
  email: string;
  willingness: SubscriptionWillingness | '';
}

type StepType = 'text' | 'email' | 'choice';

interface Step {
  id: keyof FormData;
  question: string;
  subtitle: string;
  type: StepType;
  options?: string[];
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    id: 'name',
    question: "What's your name?",
    subtitle: "We'd love to know who you are.",
    type: 'text',
    placeholder: 'Your full name',
  },
  {
    id: 'ageGroup',
    question: 'How old are you?',
    subtitle: 'Select the age group that fits you best.',
    type: 'choice',
    options: ['Under 13', '13-17', '18-24', '25-34', '35-44', '45+'],
  },
  {
    id: 'role',
    question: 'What best describes you?',
    subtitle: 'This helps us personalise your experience.',
    type: 'choice',
    options: ['Student', 'Parent', 'Organization'],
  },
  {
    id: 'email',
    question: "What's your email address?",
    subtitle: "We'll send you early access details when it's ready.",
    type: 'email',
    placeholder: 'you@example.com',
  },
  {
    id: 'willingness',
    question: 'Would you pay a small monthly fee?',
    subtitle: 'Be honest — it helps us plan.',
    type: 'choice',
    options: ['Yes, definitely', 'Maybe', 'Not right now'],
  },
];

const WILLINGNESS_MAP: Record<string, SubscriptionWillingness> = {
  'Yes, definitely': 'Yes',
  'Maybe': 'Maybe',
  'Not right now': 'No',
};

const ANIMATION_STYLES = `
  @keyframes wl-slide-in {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes wl-slide-out {
    from { opacity: 1; transform: translateY(0);    }
    to   { opacity: 0; transform: translateY(-22px); }
  }
  .wl-enter { animation: wl-slide-in  0.38s cubic-bezier(0.34, 1.45, 0.64, 1) forwards; }
  .wl-exit  { animation: wl-slide-out 0.24s ease forwards; }
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = 'form' | 'submitting' | 'complete' | 'error';

const Waitlist: React.FC = () => {
  const [displayStep, setDisplayStep] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [animClass, setAnimClass] = useState('wl-enter');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ageGroup: '',
    role: '',
    email: '',
    willingness: '',
  });
  const [phase, setPhase] = useState<Phase>('form');
  const [fieldError, setFieldError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRetry = () => {
    setPhase('form');
    setDisplayStep(0);
    setStepsDone(0);
    setAnimClass('wl-enter');
  };
  const step = STEPS[displayStep];
  const progress = (stepsDone / STEPS.length) * 100;

  useEffect(() => {
    if (step && (step.type === 'text' || step.type === 'email') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [displayStep, step]);

  const advance = (updatedData: FormData, nextIndex: number) => {
    setAnimClass('wl-exit');
    setTimeout(() => {
      setStepsDone(nextIndex);
      if (nextIndex >= STEPS.length) {
        setPhase('submitting');
        submitForm(updatedData);
      } else {
        setDisplayStep(nextIndex);
        setAnimClass('wl-enter');
      }
    }, 260);
  };

  const submitForm = async (data: FormData) => {
    if (!waitlistEndpoint) {
      setPhase('complete');
      return;
    }

    const willingnessValue =
      WILLINGNESS_MAP[data.willingness as string] ?? (data.willingness as SubscriptionWillingness);

    const payload = {
      name: data.name.trim(),
      ageGroup: data.ageGroup,
      role: data.role,
      email: data.email.trim(),
      willingness: willingnessValue,
      source: 'waitlist',
      submittedAt: new Date().toISOString(),
    };

    try {
      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => fd.append(key, String(value)));
      await fetch(waitlistEndpoint, { method: 'POST', mode: 'no-cors', body: fd });
      setPhase('complete');
    } catch {
      setPhase('error');
    }
  };

  const handleTextContinue = () => {
    const value = (formData[step.id] as string).trim();
    if (!value) {
      setFieldError('This field is required.');
      return;
    }
    if (step.type === 'email' && !EMAIL_REGEX.test(value)) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    soundService.playBoop();
    setFieldError('');
    advance(formData, stepsDone + 1);
  };

  const handleChoiceSelect = (option: string) => {
    soundService.playBoop();
    let value: string = option;
    if (step.id === 'willingness') value = WILLINGNESS_MAP[option] ?? option;
    const updated = { ...formData, [step.id]: value };
    setFormData(updated);
    setFieldError('');
    advance(updated, stepsDone + 1);
  };

  if (phase === 'submitting') {
    return (
      <>
        <style>{ANIMATION_STYLES}</style>
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 wl-enter">
            <Loader2 size={40} className="animate-spin text-brand-blue" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Saving your spot…
            </p>
          </div>
        </div>
      </>
    );
  }

  if (phase === 'complete') {
    return (
      <>
        <style>{ANIMATION_STYLES}</style>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-8 h-56 w-56 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl" />
        </div>
        <div className="relative min-h-dvh bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-md wl-enter">
            <div className="mx-auto w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-brand-green" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">You're on the list!</h2>
              <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                We'll reach out to{' '}
                <span className="font-bold text-brand-blue">{formData.email}</span> when early access opens.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue/20 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand-blue dark:border-brand-blue/30 dark:bg-slate-900/80">
              <Sparkles size={12} />
              Mathavis Early Access
            </div>
          </div>
        </div>
      </>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <style>{ANIMATION_STYLES}</style>
        <div className="relative min-h-dvh bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-md wl-enter">
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">Something went wrong.</p>
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">
              Please refresh the page and try again.
            </p>
            <button
              onClick={handleRetry}
              className="rounded-2xl bg-brand-blue px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_4px_0_#1a5fb4] hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{ANIMATION_STYLES}</style>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-8 h-56 w-56 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
      </div>

      <div className="relative min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-brand-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue/20 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand-blue shadow-sm backdrop-blur dark:border-brand-blue/30 dark:bg-slate-900/80">
            <Sparkles size={12} />
            Mathavis Waitlist
          </div>
          <span className="flex items-center gap-0.5 text-xs font-black tabular-nums text-slate-400 dark:text-slate-500">
            <span>{stepsDone + 1}</span>
            <span className="mx-0.5">/</span>
            <span>{STEPS.length}</span>
          </span>
        </div>

        {/* Centred question area */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-xl">
            <div key={displayStep} className={`space-y-8 ${animClass}`}>
              {/* Question text */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-blue">
                  Question {displayStep + 1}
                </p>
                <h2 className="text-3xl font-black leading-tight text-slate-800 dark:text-slate-100 sm:text-4xl">
                  {step.question}
                </h2>
                <p className="text-base font-medium text-slate-500 dark:text-slate-400">{step.subtitle}</p>
              </div>

              {/* Text / email input */}
              {(step.type === 'text' || step.type === 'email') && (
                <div className="space-y-5">
                  <input
                    ref={inputRef}
                    type={step.type}
                    value={formData[step.id] as string}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, [step.id]: e.target.value }));
                      setFieldError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextContinue()}
                    placeholder={step.placeholder}
                    className="w-full border-b-2 border-slate-300 dark:border-slate-600 bg-transparent px-0 py-3 text-xl font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-brand-blue transition-colors duration-200"
                  />
                  {fieldError && (
                    <p className="text-sm font-bold text-red-500">{fieldError}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleTextContinue}
                      className="flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_4px_0_#1a5fb4] transition-all hover:translate-y-0.5 hover:shadow-none"
                    >
                      <ArrowRight size={16} />
                      {displayStep === STEPS.length - 1 ? 'Submit' : 'Continue'}
                    </button>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-600">
                      or press{' '}
                      <kbd className="rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 font-bold text-slate-500 dark:text-slate-400">
                        Enter ↵
                      </kbd>
                    </span>
                  </div>
                </div>
              )}

              {/* Choice cards */}
              {step.type === 'choice' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {step.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleChoiceSelect(option)}
                      className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-left font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:border-brand-blue hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    >
                      <span className="text-base">{option}</span>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-brand-blue transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-6 py-5 text-center sm:px-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Mathavis · Early Access
          </p>
        </div>
      </div>
    </>
  );
};

export default Waitlist;
