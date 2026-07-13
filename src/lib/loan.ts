export type LoanInputs = {
  loanAmount: number;
  annualInterestRate: number;
  loanTermMonths: number;
  startDate?: Date;
};

export type AmortizationRow = {
  paymentNumber: number;
  paymentDate: Date;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
};

export type LoanResults = {
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  payoffDate: Date;
  amortization: AmortizationRow[];
};

export type FinancialInputs = {
  monthlyIncome: number | null;
  existingMonthlyDebt: number | null;
};

export type FinancialSummary = {
  dtiRatio: number | null;
  remainingIncome: number | null;
  dtiWithNewLoan: number | null;
};

export function calculateLoan(inputs: LoanInputs): LoanResults {
  const { loanAmount, annualInterestRate, loanTermMonths } = inputs;
  const startDate = inputs.startDate ?? new Date();
  const monthlyRate = annualInterestRate / 100 / 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / loanTermMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, loanTermMonths);
    monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  monthlyPayment = Math.round(monthlyPayment * 100) / 100;

  const amortization: AmortizationRow[] = [];
  let remainingBalance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let i = 1; i <= loanTermMonths; i++) {
    const interestPayment = monthlyRate === 0 ? 0 : remainingBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    if (i === loanTermMonths) {
      principalPayment = remainingBalance;
    }

    principalPayment = Math.min(principalPayment, remainingBalance);
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i - 1);

    amortization.push({
      paymentNumber: i,
      paymentDate,
      principalPaid: round2(principalPayment),
      interestPaid: round2(interestPayment),
      remainingBalance: round2(remainingBalance),
      cumulativePrincipal: round2(cumulativePrincipal),
      cumulativeInterest: round2(cumulativeInterest),
    });
  }

  const totalRepayment = round2(monthlyPayment * loanTermMonths);
  const totalInterest = round2(totalRepayment - loanAmount);
  const payoffDate = new Date(startDate);
  payoffDate.setMonth(payoffDate.getMonth() + loanTermMonths - 1);

  return {
    monthlyPayment,
    totalRepayment,
    totalInterest,
    payoffDate,
    amortization,
  };
}

export function calculateFinancialSummary(
  results: LoanResults,
  financial: FinancialInputs
): FinancialSummary {
  const { monthlyIncome, existingMonthlyDebt } = financial;

  if (monthlyIncome == null || monthlyIncome <= 0) {
    return { dtiRatio: null, remainingIncome: null, dtiWithNewLoan: null };
  }

  const existingDebt = existingMonthlyDebt ?? 0;
  const dtiRatio = (existingDebt / monthlyIncome) * 100;
  const dtiWithNewLoan = ((existingDebt + results.monthlyPayment) / monthlyIncome) * 100;
  const remainingIncome = monthlyIncome - existingDebt - results.monthlyPayment;

  return {
    dtiRatio: round2(dtiRatio),
    remainingIncome: round2(remainingIncome),
    dtiWithNewLoan: round2(dtiWithNewLoan),
  };
}

export function formatCurrency(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type ValidationError = { field: string; message: string };

export function validateLoanInputs(inputs: {
  loanAmount: string;
  annualInterestRate: string;
  loanTermMonths: string;
  termUnit: 'months' | 'years';
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const amount = parseFloat(inputs.loanAmount);
  if (!inputs.loanAmount || isNaN(amount)) {
    errors.push({ field: 'loanAmount', message: 'Loan amount is required.' });
  } else if (amount <= 0) {
    errors.push({ field: 'loanAmount', message: 'Loan amount must be greater than zero.' });
  } else if (amount > 1_000_000_000) {
    errors.push({ field: 'loanAmount', message: 'Loan amount seems unreasonably large.' });
  }

  const rate = parseFloat(inputs.annualInterestRate);
  if (!inputs.annualInterestRate || isNaN(rate)) {
    errors.push({ field: 'annualInterestRate', message: 'Interest rate is required.' });
  } else if (rate < 0) {
    errors.push({ field: 'annualInterestRate', message: 'Interest rate cannot be negative.' });
  } else if (rate > 100) {
    errors.push({ field: 'annualInterestRate', message: 'Interest rate cannot exceed 100%.' });
  }

  const term = parseInt(inputs.loanTermMonths, 10);
  if (!inputs.loanTermMonths || isNaN(term)) {
    errors.push({ field: 'loanTermMonths', message: 'Loan term is required.' });
  } else if (term <= 0) {
    errors.push({ field: 'loanTermMonths', message: 'Loan term must be greater than zero.' });
  } else {
    const termInMonths = inputs.termUnit === 'years' ? term * 12 : term;
    if (termInMonths > 600) {
      errors.push({ field: 'loanTermMonths', message: 'Loan term cannot exceed 50 years (600 months).' });
    }
  }

  return errors;
}
