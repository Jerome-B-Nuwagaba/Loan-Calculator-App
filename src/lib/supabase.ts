import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type LoanScenario = {
  id: string;
  user_id: string;
  name: string;
  loan_amount: number;
  annual_interest_rate: number;
  loan_term_months: number;
  monthly_income: number | null;
  existing_monthly_debt: number | null;
  monthly_payment: number;
  total_repayment: number;
  total_interest: number;
  created_at: string;
  updated_at: string;
};

export type LoanScenarioInput = {
  name: string;
  loan_amount: number;
  annual_interest_rate: number;
  loan_term_months: number;
  monthly_income: number | null;
  existing_monthly_debt: number | null;
  monthly_payment: number;
  total_repayment: number;
  total_interest: number;
};
