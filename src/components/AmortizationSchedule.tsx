import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Table2 } from 'lucide-react';
import type { AmortizationRow } from '../lib/loan';
import { formatCurrency, formatDate } from '../lib/loan';
import { Card, CardHeader, Button } from './ui';

const PAGE_SIZE = 12;

export function AmortizationSchedule({ rows }: { rows: AmortizationRow[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  const pageRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page]
  );

  return (
    <Card>
      <CardHeader
        title="Amortization Schedule"
        subtitle={`${rows.length} payments over the life of the loan`}
        icon={<Table2 className="w-5 h-5" />}
      />

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-800">
              <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400">#</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Principal</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Interest</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.paymentNumber}
                className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-mono">{row.paymentNumber}</td>
                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{formatDate(row.paymentDate)}</td>
                <td className="px-3 py-2.5 text-right stat-value text-primary-600 dark:text-primary-400">{formatCurrency(row.principalPaid)}</td>
                <td className="px-3 py-2.5 text-right stat-value text-accent-600 dark:text-accent-400">{formatCurrency(row.interestPaid)}</td>
                <td className="px-3 py-2.5 text-right stat-value text-slate-700 dark:text-slate-300">{formatCurrency(row.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
