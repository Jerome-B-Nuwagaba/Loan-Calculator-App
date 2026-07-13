import { useEffect, useMemo, useState } from 'react';
import {
  Calculator, DollarSign, Percent, Calendar, Wallet, TrendingDown,
  Save, Plus, Trash2, Printer, FileDown, Copy, Check, BarChart3, PieChart, LineChart, Scale,
} from 'lucide-react';
import {
  calculateLoan, calculateFinancialSummary, validateLoanInputs,
  formatCurrency, formatDateLong, formatPercent,
  type LoanInputs, type LoanResults, type FinancialSummary, type ValidationError,
} from '../lib/loan';
import { supabase, type LoanScenario } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { copyToClipboard, generateShareableSummary, printReport, exportPDF } from '../lib/share';
import { Card, CardHeader, StatCard, Field, Button, Badge } from '../components/ui';
import { BalanceChart, PrincipalInterestChart, BreakdownDonut } from '../components/Charts';
import { AmortizationSchedule } from '../components/AmortizationSchedule';

type Scenario = {
  id: string;
  name: string;
  inputs: LoanInputs;
  results: LoanResults;
  financial: FinancialSummary;
  saved?: boolean;
  scenarioId?: string;
};

export function CalculatorPage({ initialScenario, onSaved }: {
  initialScenario?: LoanScenario | null;
  onSaved?: () => void;
}) {
  const { user } = useAuth();

  // Form state
  const [name, setName] = useState('My Loan Scenario');
  const [loanAmount, setLoanAmount] = useState('250000');
  const [annualInterestRate, setAnnualInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [termUnit, setTermUnit] = useState<'months' | 'years'>('years');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState('');

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [comparisons, setComparisons] = useState<Scenario[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load initial scenario for editing
  useEffect(() => {
    if (initialScenario) {
      setName(initialScenario.name);
      setLoanAmount(String(initialScenario.loan_amount));
      setAnnualInterestRate(String(initialScenario.annual_interest_rate));
      const years = initialScenario.loan_term_months / 12;
      if (Number.isInteger(years)) {
        setLoanTerm(String(years));
        setTermUnit('years');
      } else {
        setLoanTerm(String(initialScenario.loan_term_months));
        setTermUnit('months');
      }
      setMonthlyIncome(initialScenario.monthly_income ? String(initialScenario.monthly_income) : '');
      setExistingMonthlyDebt(initialScenario.existing_monthly_debt ? String(initialScenario.existing_monthly_debt) : '');
      setEditingId(initialScenario.id);
    }
  }, [initialScenario]);

  const loanTermMonths = useMemo(() => {
    const t = parseInt(loanTerm, 10);
    return termUnit === 'years' ? t * 12 : t;
  }, [loanTerm, termUnit]);

  const results: LoanResults | null = useMemo(() => {
    const validationErrors = validateLoanInputs({ loanAmount, annualInterestRate, loanTermMonths: loanTerm, termUnit });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return null;
    }
    setErrors([]);
    return calculateLoan({
      loanAmount: parseFloat(loanAmount),
      annualInterestRate: parseFloat(annualInterestRate),
      loanTermMonths,
    });
  }, [loanAmount, annualInterestRate, loanTerm, termUnit, loanTermMonths]);

  const financial: FinancialSummary = useMemo(() => {
    if (!results) return { dtiRatio: null, remainingIncome: null, dtiWithNewLoan: null };
    return calculateFinancialSummary(results, {
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      existingMonthlyDebt: existingMonthlyDebt ? parseFloat(existingMonthlyDebt) : null,
    });
  }, [results, monthlyIncome, existingMonthlyDebt]);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const currentScenario: Scenario | null = useMemo(() => {
    if (!results) return null;
    return {
      id: 'current',
      name,
      inputs: { loanAmount: parseFloat(loanAmount), annualInterestRate: parseFloat(annualInterestRate), loanTermMonths },
      results,
      financial,
    };
  }, [results, name, loanAmount, annualInterestRate, loanTermMonths, financial]);

  const handleSave = async () => {
    if (!results || !user) return;
    setSaveStatus('saving');
    setSaveError(null);

    const payload = {
      name,
      loan_amount: parseFloat(loanAmount),
      annual_interest_rate: parseFloat(annualInterestRate),
      loan_term_months: loanTermMonths,
      monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
      existing_monthly_debt: existingMonthlyDebt ? parseFloat(existingMonthlyDebt) : null,
      monthly_payment: results.monthlyPayment,
      total_repayment: results.totalRepayment,
      total_interest: results.totalInterest,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('loan_scenarios').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loan_scenarios').insert(payload);
        if (error) throw error;
      }
      setSaveStatus('saved');
      setEditingId(null);
      onSaved?.();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save scenario.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddToComparison = () => {
    if (!currentScenario || !results) return;
    const newScenario: Scenario = {
      ...currentScenario,
      id: `cmp-${Date.now()}`,
    };
    setComparisons((prev) => [...prev, newScenario]);
  };

  const handleRemoveComparison = (id: string) => {
    setComparisons((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCopy = async () => {
    if (!currentScenario) return;
    const summary = generateShareableSummary(currentScenario);
    const success = await copyToClipboard(summary);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <Card>
        <CardHeader
          title="Loan Calculator"
          subtitle="Enter your loan details to calculate repayment"
          icon={<Calculator className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Scenario name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g. Home Loan Option A"
              />
            </Field>
          </div>

          <Field label="Loan amount" error={getError('loanAmount')}>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className={`input pl-11 ${getError('loanAmount') ? 'input-error' : ''}`}
                placeholder="250000"
                min="0"
                step="1000"
              />
            </div>
          </Field>

          <Field label="Annual interest rate (%)" error={getError('annualInterestRate')}>
            <div className="relative">
              <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={annualInterestRate}
                onChange={(e) => setAnnualInterestRate(e.target.value)}
                className={`input pl-11 ${getError('annualInterestRate') ? 'input-error' : ''}`}
                placeholder="6.5"
                min="0"
                step="0.01"
              />
            </div>
          </Field>

          <Field label="Loan term" error={getError('loanTermMonths')}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                  className={`input pl-11 ${getError('loanTermMonths') ? 'input-error' : ''}`}
                  placeholder="30"
                  min="0"
                />
              </div>
              <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTermUnit('years')}
                  className={`px-4 text-sm font-medium transition-colors ${
                    termUnit === 'years'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Years
                </button>
                <button
                  type="button"
                  onClick={() => setTermUnit('months')}
                  className={`px-4 text-sm font-medium transition-colors ${
                    termUnit === 'months'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>
          </Field>
        </div>

        {/* Financial info (optional) */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Financial Information (optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Monthly income" hint="Used to calculate your debt-to-income ratio">
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="input pl-11"
                  placeholder="5000"
                  min="0"
                  step="100"
                />
              </div>
            </Field>

            <Field label="Existing monthly debt payments">
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={existingMonthlyDebt}
                  onChange={(e) => setExistingMonthlyDebt(e.target.value)}
                  className="input pl-11"
                  placeholder="500"
                  min="0"
                  step="50"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2 no-print">
          <Button onClick={handleSave} disabled={!results || saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Scenario</>}
          </Button>
          <Button variant="secondary" onClick={handleAddToComparison} disabled={!results}>
            <Plus className="w-4 h-4" /> Add to Comparison
          </Button>
          <Button variant="ghost" onClick={handleCopy} disabled={!results}>
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Summary</>}
          </Button>
          <Button variant="ghost" onClick={printReport} disabled={!results}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="ghost" onClick={exportPDF} disabled={!results}>
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>

        {saveStatus === 'error' && saveError && (
          <div className="mt-3 text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/30 rounded-xl p-3 animate-fade-in">
            {saveError}
          </div>
        )}
      </Card>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatCard label="Monthly Payment" value={formatCurrency(results.monthlyPayment)} icon={<DollarSign className="w-4 h-4" />} accent="primary" />
          <StatCard label="Total Repayment" value={formatCurrency(results.totalRepayment)} icon={<TrendingDown className="w-4 h-4" />} accent="accent" />
          <StatCard label="Total Interest" value={formatCurrency(results.totalInterest)} icon={<Percent className="w-4 h-4" />} accent="warning"
            hint={`${((results.totalInterest / parseFloat(loanAmount)) * 100).toFixed(1)}% of loan amount`} />
          <StatCard label="Payoff Date" value={formatDateLong(results.payoffDate)} icon={<Calendar className="w-4 h-4" />} accent="success" />
        </div>
      )}

      {/* Financial Summary */}
      {results && (monthlyIncome || existingMonthlyDebt) && (
        <Card className="animate-fade-in">
          <CardHeader title="Financial Summary" subtitle="Debt-to-income analysis" icon={<Wallet className="w-5 h-5" />} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current DTI Ratio</div>
              <div className="stat-value text-xl text-slate-900 dark:text-slate-100">
                {financial.dtiRatio != null ? formatPercent(financial.dtiRatio) : '—'}
              </div>
              <div className="mt-2">
                {financial.dtiRatio != null && (
                  <Badge variant={financial.dtiRatio < 36 ? 'success' : financial.dtiRatio < 43 ? 'warning' : 'error'}>
                    {financial.dtiRatio < 36 ? 'Healthy' : financial.dtiRatio < 43 ? 'Borderline' : 'High'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">DTI with this loan</div>
              <div className="stat-value text-xl text-slate-900 dark:text-slate-100">
                {financial.dtiWithNewLoan != null ? formatPercent(financial.dtiWithNewLoan) : '—'}
              </div>
              <div className="mt-2">
                {financial.dtiWithNewLoan != null && (
                  <Badge variant={financial.dtiWithNewLoan < 36 ? 'success' : financial.dtiWithNewLoan < 43 ? 'warning' : 'error'}>
                    {financial.dtiWithNewLoan < 36 ? 'Healthy' : financial.dtiWithNewLoan < 43 ? 'Borderline' : 'High'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Remaining income/mo</div>
              <div className={`stat-value text-xl ${financial.remainingIncome != null && financial.remainingIncome < 0 ? 'text-error-600 dark:text-error-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {financial.remainingIncome != null ? formatCurrency(financial.remainingIncome) : '—'}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">After loan payment & existing debt</div>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <Card>
            <CardHeader title="Remaining Balance Over Time" icon={<LineChart className="w-5 h-5" />} />
            <BalanceChart results={results} />
          </Card>
          <Card>
            <CardHeader title="Principal vs Interest" subtitle="Per payment over the loan term" icon={<BarChart3 className="w-5 h-5" />} />
            <PrincipalInterestChart results={results} />
            <div className="flex items-center gap-6 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary-500" />
                <span className="text-slate-600 dark:text-slate-400">Principal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-accent-500" />
                <span className="text-slate-600 dark:text-slate-400">Interest</span>
              </div>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Repayment Breakdown" subtitle="How your total repayment is split" icon={<PieChart className="w-5 h-5" />} />
            <BreakdownDonut results={results} />
          </Card>
        </div>
      )}

      {/* Amortization */}
      {results && <AmortizationSchedule rows={results.amortization} />}

      {/* Comparison */}
      {comparisons.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader
            title="Loan Comparison"
            subtitle={`${comparisons.length} scenario${comparisons.length > 1 ? 's' : ''} side by side`}
            icon={<Scale className="w-5 h-5" />}
          />

          {(() => {
            const minInterest = Math.min(...comparisons.map((s) => s.results.totalInterest));
            const minTotal = Math.min(...comparisons.map((s) => s.results.totalRepayment));
            const minMonthly = Math.min(...comparisons.map((s) => s.results.monthlyPayment));

            return (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400">Scenario</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Loan Amount</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Rate</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Term</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Monthly</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Total Repay</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Interest</th>
                      <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Savings</th>
                      <th className="px-3 py-2.5 no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((s) => {
                      const maxInterest = Math.max(...comparisons.map((c) => c.results.totalInterest));
                      const savings = s.results.totalInterest === minInterest
                        ? 0
                        : maxInterest - s.results.totalInterest;
                      return (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{s.name}</td>
                          <td className="px-3 py-3 text-right stat-value text-slate-700 dark:text-slate-300">{formatCurrency(s.inputs.loanAmount)}</td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">{s.inputs.annualInterestRate}%</td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">{s.inputs.loanTermMonths}mo</td>
                          <td className="px-3 py-3 text-right stat-value text-slate-700 dark:text-slate-300">
                            {formatCurrency(s.results.monthlyPayment)}
                            {s.results.monthlyPayment === minMonthly && <Badge variant="success">Best</Badge>}
                          </td>
                          <td className="px-3 py-3 text-right stat-value text-slate-700 dark:text-slate-300">
                            {formatCurrency(s.results.totalRepayment)}
                            {s.results.totalRepayment === minTotal && <Badge variant="success">Best</Badge>}
                          </td>
                          <td className="px-3 py-3 text-right stat-value text-slate-700 dark:text-slate-300">
                            {formatCurrency(s.results.totalInterest)}
                            {s.results.totalInterest === minInterest && <Badge variant="success">Best</Badge>}
                          </td>
                          <td className="px-3 py-3 text-right stat-value">
                            {savings > 0 ? (
                              <span className="text-success-600 dark:text-success-400">+{formatCurrency(savings)}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right no-print">
                            <button
                              onClick={() => handleRemoveComparison(s.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                              aria-label="Remove from comparison"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
}
