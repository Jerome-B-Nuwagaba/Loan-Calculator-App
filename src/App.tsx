import { useState } from 'react';
import { Calculator, LayoutDashboard, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider, useTheme } from './lib/theme';
import { AuthPage } from './pages/AuthPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { DashboardPage } from './pages/DashboardPage';
import type { LoanScenario } from './lib/supabase';

type View = 'dashboard' | 'calculator';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('dashboard');
  const [editScenario, setEditScenario] = useState<LoanScenario | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Loading LoanWise…</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
  ];

  const handleNewCalculation = () => {
    setEditScenario(null);
    setView('calculator');
    setMobileNavOpen(false);
  };

  const handleEdit = (s: LoanScenario) => {
    setEditScenario(s);
    setView('calculator');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-600 text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 hidden sm:block">LoanWise</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    view === item.id
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                onClick={signOut}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-error-50 dark:hover:bg-error-950/30 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileNavOpen((o) => !o)}
                className="md:hidden p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileNavOpen && (
            <nav className="md:hidden pb-3 flex flex-col gap-1 animate-slide-up">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMobileNavOpen(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === item.id
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {view === 'dashboard' && <DashboardPage onEdit={handleEdit} onNew={handleNewCalculation} />}
        {view === 'calculator' && (
          <CalculatorPage
            initialScenario={editScenario}
            onSaved={() => { setEditScenario(null); setView('dashboard'); }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          LoanWise — Financial calculations for planning purposes only. Not financial advice.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
