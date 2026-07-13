import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Save, DollarSign, TrendingUp, ArrowRight, Trash2, Edit3, FolderOpen,
} from 'lucide-react';
import { supabase, type LoanScenario } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatCurrency, formatDate } from '../lib/loan';
import { Card, CardHeader, StatCard, Button, EmptyState, Badge } from '../components/ui';

export function DashboardPage({ onEdit, onNew }: { onEdit: (s: LoanScenario) => void; onNew: () => void }) {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<LoanScenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loan_scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setScenarios(data as LoanScenario[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchScenarios(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('loan_scenarios').delete().eq('id', id);
    if (!error) setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const avgLoanAmount = scenarios.length > 0
    ? scenarios.reduce((sum, s) => sum + Number(s.loan_amount), 0) / scenarios.length
    : 0;

  const recentScenarios = scenarios.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back{user?.email ? `, ${user.email}` : ''}.</p>
        </div>
        <Button onClick={onNew}>
          <DollarSign className="w-4 h-4" /> New Calculation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saved Scenarios" value={String(scenarios.length)} icon={<Save className="w-4 h-4" />} accent="primary" />
        <StatCard label="Average Loan" value={formatCurrency(avgLoanAmount)} icon={<DollarSign className="w-4 h-4" />} accent="accent" />
        <StatCard
          label="Total Loan Value"
          value={formatCurrency(scenarios.reduce((sum, s) => sum + Number(s.loan_amount), 0))}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="success"
        />
        <StatCard
          label="Avg Monthly Pay"
          value={scenarios.length > 0 ? formatCurrency(scenarios.reduce((sum, s) => sum + Number(s.monthly_payment), 0) / scenarios.length) : '—'}
          icon={<LayoutDashboard className="w-4 h-4" />}
          accent="warning"
        />
      </div>

      {/* Recent scenarios */}
      <Card>
        <CardHeader
          title="Recent Scenarios"
          subtitle="Your latest saved loan calculations"
          icon={<FolderOpen className="w-5 h-5" />}
        />

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading…</div>
        ) : recentScenarios.length === 0 ? (
          <EmptyState
            icon={<Save className="w-8 h-8" />}
            title="No saved scenarios yet"
            description="Calculate a loan and save it to see it here."
            action={<Button onClick={onNew}><DollarSign className="w-4 h-4" /> New Calculation</Button>}
          />
        ) : (
          <div className="space-y-2">
            {recentScenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</span>
                    <Badge variant="neutral">{formatDate(new Date(s.created_at))}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <span>Loan: <span className="stat-value">{formatCurrency(Number(s.loan_amount))}</span></span>
                    <span>Rate: <span className="stat-value">{s.annual_interest_rate}%</span></span>
                    <span>Term: <span className="stat-value">{s.loan_term_months}mo</span></span>
                    <span>Monthly: <span className="stat-value text-primary-600 dark:text-primary-400">{formatCurrency(Number(s.monthly_payment))}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(s)}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                    aria-label="Edit scenario"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                    aria-label="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All saved scenarios */}
      {scenarios.length > 5 && (
        <Card>
          <CardHeader title="All Saved Scenarios" subtitle={`${scenarios.length} total`} icon={<Save className="w-5 h-5" />} />
          <div className="space-y-2">
            {scenarios.slice(5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{s.name}</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span>Loan: <span className="stat-value">{formatCurrency(Number(s.loan_amount))}</span></span>
                    <span>Monthly: <span className="stat-value text-primary-600 dark:text-primary-400">{formatCurrency(Number(s.monthly_payment))}</span></span>
                    <span>Total Interest: <span className="stat-value">{formatCurrency(Number(s.total_interest))}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(s)}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                    aria-label="Edit"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
