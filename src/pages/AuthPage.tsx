import { useState, type FormEvent } from 'react';
import { Calculator, Lock, Mail, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Field } from '../components/ui';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error: authError } = await fn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError);
    } else if (mode === 'signup') {
      setError(null);
      setMode('login');
      setError('Account created. Please sign in.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 dark:from-primary-900 dark:via-slate-900 dark:to-black p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl translate-y-1/3" />

        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur">
            <Calculator className="w-7 h-7" />
          </div>
          <span className="text-xl font-semibold">LoanWise</span>
        </div>

        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Smart loan calculations,<br />clear financial decisions.
          </h1>
          <p className="text-primary-100 text-lg max-w-md">
            Calculate repayments, compare scenarios, and visualize your path to being debt-free — all in one professional tool.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Interactive amortization schedules',
              'Side-by-side loan comparison',
              'Debt-to-income analysis',
              'Export and share reports',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-primary-100">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-primary-200/60 text-sm">
          © {new Date().getFullYear()} LoanWise. Financial calculations for planning purposes only.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary-600 text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">LoanWise</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">
            {mode === 'login'
              ? 'Sign in to access your saved loan scenarios.'
              : 'Start calculating and saving your loan scenarios.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email address">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-11"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input pl-11 pr-11"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className={`text-sm rounded-xl p-3 animate-fade-in ${
                error.includes('Account created')
                  ? 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400'
                  : 'bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-400'
              }`}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <TrendingUp className="w-4 h-4" />
            <span>Secure authentication powered by Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
