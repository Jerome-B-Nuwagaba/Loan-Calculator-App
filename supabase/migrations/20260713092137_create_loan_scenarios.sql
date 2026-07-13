/*
# Create loan_scenarios table (multi-user, owner-scoped)

1. New Tables
- `loan_scenarios`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, FK to auth.users with cascade delete)
  - `name` (text, not null) — user-given label for the scenario
  - `loan_amount` (numeric, not null) — principal in dollars
  - `annual_interest_rate` (numeric, not null) — percentage, e.g. 5.25
  - `loan_term_months` (integer, not null) — term length in months
  - `monthly_income` (numeric, nullable) — optional income for DTI
  - `existing_monthly_debt` (numeric, nullable) — optional existing debt for DTI
  - `monthly_payment` (numeric, not null) — calculated monthly payment
  - `total_repayment` (numeric, not null) — calculated total paid
  - `total_interest` (numeric, not null) — calculated total interest
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `loan_scenarios`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- `user_id` defaults to `auth.uid()` so inserts that omit it still satisfy the WITH CHECK.

3. Indexes
- Index on `user_id` for fast per-user queries.
- Index on `created_at` desc for recent-activity queries.

4. Important Notes
- This is a multi-user app with a sign-in screen, so policies are scoped `TO authenticated`.
- The anon-key client cannot read or write this table without an authenticated session — by design.
- `updated_at` is maintained by the application; no trigger is added to keep it simple.
*/

CREATE TABLE IF NOT EXISTS loan_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  loan_amount numeric NOT NULL CHECK (loan_amount > 0),
  annual_interest_rate numeric NOT NULL CHECK (annual_interest_rate >= 0),
  loan_term_months integer NOT NULL CHECK (loan_term_months > 0),
  monthly_income numeric CHECK (monthly_income IS NULL OR monthly_income >= 0),
  existing_monthly_debt numeric CHECK (existing_monthly_debt IS NULL OR existing_monthly_debt >= 0),
  monthly_payment numeric NOT NULL CHECK (monthly_payment >= 0),
  total_repayment numeric NOT NULL CHECK (total_repayment >= 0),
  total_interest numeric NOT NULL CHECK (total_interest >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loan_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_loan_scenarios" ON loan_scenarios;
CREATE POLICY "select_own_loan_scenarios" ON loan_scenarios FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_loan_scenarios" ON loan_scenarios;
CREATE POLICY "insert_own_loan_scenarios" ON loan_scenarios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_loan_scenarios" ON loan_scenarios;
CREATE POLICY "update_own_loan_scenarios" ON loan_scenarios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_loan_scenarios" ON loan_scenarios;
CREATE POLICY "delete_own_loan_scenarios" ON loan_scenarios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_loan_scenarios_user_id ON loan_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_scenarios_created_at ON loan_scenarios(created_at DESC);