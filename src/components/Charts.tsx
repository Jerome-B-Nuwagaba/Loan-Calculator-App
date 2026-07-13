import { useId, useMemo, useState } from 'react';
import type { LoanResults } from '../lib/loan';
import { formatCurrency, formatDate } from '../lib/loan';
import { useTheme } from '../lib/theme';

const PADDING = { top: 20, right: 20, bottom: 32, left: 56 };

export function BalanceChart({ results }: { results: LoanResults }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 280;
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const data = results.amortization;
  const maxBalance = data.length > 0 ? data[0].remainingBalance + data[0].principalPaid : 0;
  const gradId = useId();

  const points = useMemo(() => {
    return data.map((row, i) => {
      const x = PADDING.left + (i / Math.max(1, data.length - 1)) * innerW;
      const balance = row.remainingBalance + row.principalPaid;
      const y = PADDING.top + innerH - (balance / maxBalance) * innerH;
      return { x, y, balance, row };
    });
  }, [data, innerW, innerH, maxBalance]);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${PADDING.left + innerW} ${PADDING.top + innerH} L ${PADDING.left} ${PADDING.top + innerH} Z`;

  const axisColor = theme === 'dark' ? '#475569' : '#cbd5e1';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxBalance / yTicks) * i);

  const xTickCount = Math.min(6, data.length);
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) => Math.floor((i / (xTickCount - 1)) * (data.length - 1)));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Remaining loan balance over time">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y axis labels */}
        {yTickValues.map((val, i) => {
          const y = PADDING.top + innerH - (val / maxBalance) * innerH;
          return (
            <g key={i}>
              <line x1={PADDING.left} y1={y} x2={PADDING.left + innerW} y2={y} stroke={gridColor} strokeWidth="1" />
              <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={textColor} fontFamily="monospace">
                {formatCurrency(val, { compact: true })}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {xTickIndices.map((idx, i) => {
          const p = points[idx];
          return (
            <text key={i} x={p.x} y={H - 10} textAnchor="middle" fontSize="11" fill={textColor}>
              {formatDate(p.row.paymentDate)}
            </text>
          );
        })}

        {/* Area + line */}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Axis lines */}
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + innerH} stroke={axisColor} strokeWidth="1" />
        <line x1={PADDING.left} y1={PADDING.top + innerH} x2={PADDING.left + innerW} y2={PADDING.top + innerH} stroke={axisColor} strokeWidth="1" />

        {/* Hover */}
        {hover !== null && points[hover] && (
          <g>
            <line x1={points[hover].x} y1={PADDING.top} x2={points[hover].x} y2={PADDING.top + innerH} stroke={axisColor} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={points[hover].x} cy={points[hover].y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
          </g>
        )}

        {/* Hover capture */}
        <rect
          x={PADDING.left} y={PADDING.top} width={innerW} height={innerH}
          fill="transparent"
          onMouseMove={(e) => {
            const rect = (e.target as SVGRectElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * innerW;
            const idx = Math.round((x / innerW) * (data.length - 1));
            setHover(Math.max(0, Math.min(data.length - 1, idx)));
          }}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {hover !== null && points[hover] && (
        <div className="absolute top-2 right-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none animate-fade-in">
          <div className="font-medium text-slate-700 dark:text-slate-200">{formatDate(points[hover].row.paymentDate)}</div>
          <div className="text-slate-500 dark:text-slate-400 mt-1">
            Balance: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(points[hover].balance)}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Payment #{points[hover].row.paymentNumber}
          </div>
        </div>
      )}
    </div>
  );
}

export function PrincipalInterestChart({ results }: { results: LoanResults }) {
  const { theme } = useTheme();
  const W = 560, H = 280;
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const data = results.amortization;
  const maxVal = data.length > 0 ? results.monthlyPayment : 0;
  const gradP = useId();
  const gradI = useId();

  const axisColor = theme === 'dark' ? '#475569' : '#cbd5e1';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

  const step = Math.max(1, Math.floor(data.length / 60));
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const barWidth = (innerW / sampled.length) * 0.7;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Principal vs interest over time">
      <defs>
        <linearGradient id={gradP} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={gradI} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {yTickValues.map((val, i) => {
        const y = PADDING.top + innerH - (val / maxVal) * innerH;
        return (
          <g key={i}>
            <line x1={PADDING.left} y1={y} x2={PADDING.left + innerW} y2={y} stroke={gridColor} strokeWidth="1" />
            <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={textColor} fontFamily="monospace">
              {formatCurrency(val, { compact: true })}
            </text>
          </g>
        );
      })}

      {sampled.map((row, i) => {
        const xCenter = PADDING.left + (i + 0.5) * (innerW / sampled.length);
        const principalH = (row.principalPaid / maxVal) * innerH;
        const interestH = (row.interestPaid / maxVal) * innerH;
        const x = xCenter - barWidth / 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={PADDING.top + innerH - principalH}
              width={barWidth}
              height={principalH}
              fill={`url(#${gradP})`}
              rx="1"
            >
              <title>Payment #{row.paymentNumber} — Principal: {formatCurrency(row.principalPaid)}</title>
            </rect>
            <rect
              x={x}
              y={PADDING.top + innerH - principalH - interestH}
              width={barWidth}
              height={interestH}
              fill={`url(#${gradI})`}
              rx="1"
              opacity="0.85"
            >
              <title>Payment #{row.paymentNumber} — Interest: {formatCurrency(row.interestPaid)}</title>
            </rect>
          </g>
        );
      })}

      <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + innerH} stroke={axisColor} strokeWidth="1" />
      <line x1={PADDING.left} y1={PADDING.top + innerH} x2={PADDING.left + innerW} y2={PADDING.top + innerH} stroke={axisColor} strokeWidth="1" />
    </svg>
  );
}

export function BreakdownDonut({ results }: { results: LoanResults }) {
  const { theme } = useTheme();
  const [hoverSlice, setHoverSlice] = useState<'principal' | 'interest' | null>(null);

  const total = results.totalRepayment;
  const principalPct = total > 0 ? (results.totalRepayment - results.totalInterest) / total : 0;
  const interestPct = 1 - principalPct;

  const R = 80, r = 50, cx = 100, cy = 100;
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const principalEnd = principalPct * Math.PI * 2;

  const arcPath = (start: number, end: number) => {
    const x1 = cx + R * Math.sin(start);
    const y1 = cy - R * Math.cos(start);
    const x2 = cx + R * Math.sin(end);
    const y2 = cy - R * Math.cos(end);
    const xi1 = cx + r * Math.sin(start);
    const yi1 = cy - r * Math.cos(start);
    const xi2 = cx + r * Math.sin(end);
    const yi2 = cy - r * Math.cos(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-44 h-44 shrink-0">
        <path
          d={arcPath(0, principalEnd)}
          fill="#3b82f6"
          opacity={hoverSlice === 'interest' ? 0.5 : 1}
          onMouseEnter={() => setHoverSlice('principal')}
          onMouseLeave={() => setHoverSlice(null)}
          style={{ transition: 'opacity 0.2s' }}
        >
          <title>Principal: {formatCurrency(total - results.totalInterest)} ({(principalPct * 100).toFixed(1)}%)</title>
        </path>
        <path
          d={arcPath(principalEnd, Math.PI * 2)}
          fill="#06b6d4"
          opacity={hoverSlice === 'principal' ? 0.5 : 1}
          onMouseEnter={() => setHoverSlice('interest')}
          onMouseLeave={() => setHoverSlice(null)}
          style={{ transition: 'opacity 0.2s' }}
        >
          <title>Interest: {formatCurrency(results.totalInterest)} ({(interestPct * 100).toFixed(1)}%)</title>
        </path>
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill={textColor}>Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="15" fontWeight="600" fill={theme === 'dark' ? '#e2e8f0' : '#1e293b'} fontFamily="monospace">
          {formatCurrency(total, { compact: true })}
        </text>
      </svg>

      <div className="space-y-3 w-full">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <div className="flex-1">
            <div className="text-sm text-slate-500 dark:text-slate-400">Principal</div>
            <div className="stat-value text-slate-900 dark:text-slate-100">{formatCurrency(total - results.totalInterest)}</div>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{(principalPct * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent-500" />
          <div className="flex-1">
            <div className="text-sm text-slate-500 dark:text-slate-400">Interest</div>
            <div className="stat-value text-slate-900 dark:text-slate-100">{formatCurrency(results.totalInterest)}</div>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{(interestPct * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
