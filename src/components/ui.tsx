import { type ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'primary',
  hint,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400',
    success: 'bg-success-50 dark:bg-success-950/50 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-950/50 text-warning-600 dark:text-warning-400',
    error: 'bg-error-50 dark:bg-error-950/50 text-error-600 dark:text-error-400',
  };

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <div className={`p-2 rounded-lg ${accentClasses[accent]}`}>{icon}</div>}
      </div>
      <div className="stat-value text-2xl text-slate-900 dark:text-slate-100">{value}</div>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-error-600 dark:text-error-400 mt-1.5 animate-fade-in">{error}</p>}
    </div>
  );
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'primary';
}) {
  const variants: Record<string, string> = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    success: 'bg-success-100 dark:bg-success-950/50 text-success-700 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-950/50 text-warning-700 dark:text-warning-400',
    error: 'bg-error-100 dark:bg-error-950/50 text-error-700 dark:text-error-400',
    primary: 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      {icon && <div className="mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">{icon}</div>}
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
