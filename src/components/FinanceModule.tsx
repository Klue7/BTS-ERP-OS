import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  TrendingUp,
  Truck,
  X,
  BarChart3,
} from 'lucide-react';
import { useFinanceData } from '../finance/useFinanceData';
import type { FinanceRecord, FinanceStudioSnapshot } from '../finance/contracts';
import { formatFinanceCompactCurrency, formatFinanceCurrency, formatFinanceTrend } from '../finance/contracts';
import { usePdfPreview } from './PdfPreviewContext';

type FinanceSubModule = 'Overview' | 'Receivables' | 'Payables' | 'Margin' | 'Exceptions';

function financeSubModuleForRecord(record: FinanceRecord): FinanceSubModule {
  if ((record.exceptions?.length ?? 0) > 0) {
    return 'Exceptions';
  }

  if (record.margin && record.margin.status !== 'Healthy') {
    return 'Margin';
  }

  return record.type === 'Payable' ? 'Payables' : 'Receivables';
}

const EMPTY_FINANCE_SNAPSHOT: FinanceStudioSnapshot = {
  currency: 'ZAR',
  currencySymbol: 'R',
  anchorDate: new Date().toISOString(),
  anchorMonthLabel: 'Current Month',
  lastUpdatedAt: new Date().toISOString(),
  overview: {
    totalInvoiced: { value: 0, trendPct: 0 },
    cashCollected: { value: 0, trendPct: 0 },
    outstandingReceivables: { value: 0, trendPct: 0 },
    committedPayables: { value: 0, trendPct: 0 },
    projectedGrossMarginPct: { value: 0, trendPct: 0 },
    negativeMarginRiskCount: { value: 0, trendPct: 0 },
    overdueInvoiceCount: { value: 0, trendPct: 0 },
    unbookedCosts: { value: 0, trendPct: 0 },
  },
  cashFlowProjection: [],
  criticalActions: [],
  receivables: [],
  payables: [],
  marginRecords: [],
  exceptionRecords: [],
};

function financeStatusBadgeClasses(status: string) {
  if (status === 'Paid' || status === 'Delivered' || status === 'Received') {
    return 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10';
  }
  if (status === 'Overdue' || status === 'Expired' || status === 'Flagged') {
    return 'bg-red-500/5 text-red-400 border-red-500/10';
  }
  if (status === 'Partial' || status === 'Committed' || status === 'Pending' || status === 'Confirmed') {
    return 'bg-amber-500/5 text-amber-400 border-amber-500/10';
  }
  return 'bg-white/5 text-white/40 border-white/10';
}

function financeTrendClass(value: number | null, inverse = false) {
  if (value === null) return 'text-blue-400';
  if (value === 0) return 'text-white/20';
  if (inverse) return value > 0 ? 'text-red-400' : 'text-[#00ff88]';
  return value > 0 ? 'text-[#00ff88]' : 'text-red-400';
}

function financeRecordMatchesQuery(record: FinanceRecord, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    record.id,
    record.orderId,
    record.customerName,
    record.category,
    record.status,
    record.productName ?? '',
    record.productSku ?? '',
    ...(record.exceptions ?? []),
  ].some((value) => value.toLowerCase().includes(normalized));
}

function formatFinancePercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatFinanceDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function exportFinanceLedger(snapshot: FinanceStudioSnapshot) {
  const rows = [...snapshot.receivables, ...snapshot.payables].map((record) => ({
    id: record.id,
    orderId: record.orderId,
    entity: record.customerName,
    type: record.type,
    category: record.category,
    status: record.status,
    amount: record.amount,
    balance: record.balance,
    currency: record.currency,
    dueDate: record.dueDate,
    issueDate: record.issueDate,
    sourceDocumentKey: record.sourceDocumentKey ?? '',
  }));

  const header = Object.keys(rows[0] ?? {
    id: '',
    orderId: '',
    entity: '',
    type: '',
    category: '',
    status: '',
    amount: '',
    balance: '',
    currency: '',
    dueDate: '',
    issueDate: '',
    sourceDocumentKey: '',
  });
  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((key) => JSON.stringify(String(row[key as keyof typeof row] ?? ''))).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `finance-ledger-${snapshot.anchorMonthLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function FinanceOverviewPanel({
  snapshot,
  onSelectRecord,
  onOpenSubModule,
  onCreateEntry,
}: {
  snapshot: FinanceStudioSnapshot;
  onSelectRecord: (record: FinanceRecord) => void;
  onOpenSubModule: (subModule: FinanceSubModule) => void;
  onCreateEntry: () => void;
}) {
  const primaryStats = [
    {
      label: 'Total Invoiced',
      value: formatFinanceCurrency(snapshot.overview.totalInvoiced.value),
      trend: formatFinanceTrend(snapshot.overview.totalInvoiced.trendPct),
      trendPct: snapshot.overview.totalInvoiced.trendPct,
      icon: FileText,
      color: 'text-blue-400',
      description: `Total value of customer invoices in ${snapshot.anchorMonthLabel}.`,
      target: 'Receivables' as const,
      inverseTrend: false,
    },
    {
      label: 'Cash Collected',
      value: formatFinanceCurrency(snapshot.overview.cashCollected.value),
      trend: formatFinanceTrend(snapshot.overview.cashCollected.trendPct),
      trendPct: snapshot.overview.cashCollected.trendPct,
      icon: CheckCircle2,
      color: 'text-[#00ff88]',
      description: 'Realized revenue already matched against customer invoices.',
      target: 'Receivables' as const,
      inverseTrend: false,
    },
    {
      label: 'Outstanding Receivables',
      value: formatFinanceCurrency(snapshot.overview.outstandingReceivables.value),
      trend: formatFinanceTrend(snapshot.overview.outstandingReceivables.trendPct),
      trendPct: snapshot.overview.outstandingReceivables.trendPct,
      icon: Clock,
      color: 'text-amber-400',
      description: 'Open customer invoice balances still waiting to clear.',
      target: 'Receivables' as const,
      inverseTrend: true,
    },
    {
      label: 'Committed Payables',
      value: formatFinanceCurrency(snapshot.overview.committedPayables.value),
      trend: formatFinanceTrend(snapshot.overview.committedPayables.trendPct),
      trendPct: snapshot.overview.committedPayables.trendPct,
      icon: CreditCard,
      color: 'text-purple-400',
      description: 'Supplier POs, invoices, and logistics obligations in the ledger.',
      target: 'Payables' as const,
      inverseTrend: true,
    },
  ];

  const secondaryStats = [
    {
      label: 'Projected Gross Margin',
      value: formatFinancePercent(snapshot.overview.projectedGrossMarginPct.value),
      trend: formatFinanceTrend(snapshot.overview.projectedGrossMarginPct.trendPct),
      trendPct: snapshot.overview.projectedGrossMarginPct.trendPct,
      icon: TrendingUp,
      color: 'text-[#00ff88]',
      status: snapshot.overview.projectedGrossMarginPct.value < 0 ? 'Critical' : 'Healthy',
      target: 'Margin' as const,
      inverseTrend: false,
    },
    {
      label: 'Negative-Margin Risk',
      value: `${snapshot.overview.negativeMarginRiskCount.value} Orders`,
      trend: formatFinanceTrend(snapshot.overview.negativeMarginRiskCount.trendPct),
      trendPct: snapshot.overview.negativeMarginRiskCount.trendPct,
      icon: ShieldAlert,
      color: 'text-red-400',
      status: snapshot.overview.negativeMarginRiskCount.value > 0 ? 'Critical' : 'Healthy',
      target: 'Margin' as const,
      inverseTrend: true,
    },
    {
      label: 'Overdue Invoices',
      value: String(snapshot.overview.overdueInvoiceCount.value),
      trend: formatFinanceTrend(snapshot.overview.overdueInvoiceCount.trendPct),
      trendPct: snapshot.overview.overdueInvoiceCount.trendPct,
      icon: AlertCircle,
      color: 'text-red-400',
      status: snapshot.overview.overdueInvoiceCount.value > 0 ? 'Action Required' : 'Healthy',
      target: 'Exceptions' as const,
      inverseTrend: true,
    },
    {
      label: 'Unbooked Costs',
      value: formatFinanceCurrency(snapshot.overview.unbookedCosts.value),
      trend: formatFinanceTrend(snapshot.overview.unbookedCosts.trendPct),
      trendPct: snapshot.overview.unbookedCosts.trendPct,
      icon: Layers,
      color: 'text-blue-400',
      status: snapshot.overview.unbookedCosts.value > 0 ? 'Pending' : 'Healthy',
      target: 'Payables' as const,
      inverseTrend: true,
    },
  ];

  const recordMap = useMemo(() => new Map([...snapshot.receivables, ...snapshot.payables].map((record) => [record.id, record])), [snapshot.payables, snapshot.receivables]);
  const maxProjectionValue = Math.max(1, ...snapshot.cashFlowProjection.flatMap((point) => [point.inflow, point.outflow]));
  const projection = snapshot.cashFlowProjection.length > 0 ? snapshot.cashFlowProjection : [
    { label: 'WK 1', inflow: 0, outflow: 0 },
    { label: 'WK 2', inflow: 0, outflow: 0 },
    { label: 'WK 3', inflow: 0, outflow: 0 },
    { label: 'WK 4', inflow: 0, outflow: 0 },
  ];

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Finance Command Center</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Real-time fiscal health, margin monitoring, and operational liquidity.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => exportFinanceLedger(snapshot)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <Download size={14} /> Export Ledger
          </button>
          <button
            onClick={onCreateEntry}
            className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]"
          >
            <Plus size={14} /> New Entry
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryStats.map((stat, index) => (
          <motion.button
            key={stat.label}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onOpenSubModule(stat.target)}
            className="text-left bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} className={stat.color} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-mono uppercase tracking-widest ${financeTrendClass(stat.trendPct, stat.inverseTrend)}`}>{stat.trend}</span>
                <span className="text-[8px] text-white/10 uppercase tracking-[0.2em] mt-1">vs Last Month</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-white tracking-tighter mb-2">{stat.value}</p>
              <p className="text-[9px] text-white/20 font-serif italic leading-relaxed">{stat.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {secondaryStats.map((stat, index) => (
          <motion.button
            key={stat.label}
            type="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + (index * 0.1) }}
            onClick={() => onOpenSubModule(stat.target)}
            className="text-left bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/[0.04] transition-all cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              stat.color.replace('text-', 'bg-').replace('400', '500/10')
            } ${stat.color.replace('text-', 'border-').replace('400', '500/20')} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</span>
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  stat.status === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  stat.status === 'Healthy' ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' :
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>{stat.status}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className={`text-[10px] font-mono ${financeTrendClass(stat.trendPct, stat.inverseTrend)}`}>{stat.trend}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none">
            <Activity size={240} className="text-[#00ff88]" />
          </div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-1">Cash Flow Projection</h3>
              <p className="text-[10px] text-white/20 font-serif italic">30-day liquidity forecast based on committed orders and invoice due dates.</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" /><span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Inflow</span></div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /><span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Outflow</span></div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-3 relative z-10">
            {projection.map((point, index) => {
              const inflowHeight = Math.max(4, (point.inflow / maxProjectionValue) * 100);
              const outflowHeight = Math.max(4, (point.outflow / maxProjectionValue) * 100);
              return (
                <div key={point.label} className="flex-1 flex flex-col gap-1.5 items-center group">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${inflowHeight}%` }} transition={{ delay: 0.6 + (index * 0.05), type: 'spring', damping: 20, stiffness: 100 }} className="w-full bg-gradient-to-t from-[#00ff88]/5 to-[#00ff88]/20 rounded-t-sm group-hover:to-[#00ff88]/40 transition-all cursor-pointer" title={`${point.label} inflow ${formatFinanceCurrency(point.inflow)}`} />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${outflowHeight}%` }} transition={{ delay: 0.8 + (index * 0.05), type: 'spring', damping: 20, stiffness: 100 }} className="w-full bg-gradient-to-t from-purple-500/5 to-purple-500/20 rounded-t-sm group-hover:to-purple-500/40 transition-all cursor-pointer" title={`${point.label} outflow ${formatFinanceCurrency(point.outflow)}`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            {projection.map((point) => (
              <span key={point.label} className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{point.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Critical Actions</h3>
            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest rounded-md">{snapshot.criticalActions.length} Priority</span>
          </div>
          <div className="space-y-3 flex-1">
            {snapshot.criticalActions.length === 0 && (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center text-white/40 text-[10px] font-mono uppercase tracking-widest">All clear. No critical finance actions are open.</div>
            )}
            {snapshot.criticalActions.map((action) => {
              const record = recordMap.get(action.recordId);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => record && onSelectRecord(record)}
                  className="w-full text-left p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white group-hover:text-[#00ff88] transition-colors">{action.label}</span>
                    <ArrowUpRight size={12} className="text-white/20 group-hover:text-[#00ff88] transition-all" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{action.ref} • {action.type}</span>
                    <span className={`text-[10px] font-mono font-bold ${action.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>{formatFinanceCurrency(action.amount)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => onOpenSubModule('Exceptions')} className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]">Enter Exception Workspace</button>
        </div>
      </div>
    </div>
  );
}

function FinanceQueuePanel({
  records,
  kind,
  onSelectRecord,
}: {
  records: FinanceRecord[];
  kind: 'Receivables' | 'Payables';
  onSelectRecord: (record: FinanceRecord) => void;
}) {
  const isReceivable = kind === 'Receivables';
  const [filter, setFilter] = useState(isReceivable ? 'All' : 'All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return records.filter((record) => {
      if (isReceivable) {
        if (filter === 'Overdue' && record.status !== 'Overdue') return false;
        if (filter === 'Paid' && record.status !== 'Paid') return false;
        if (filter === 'Pending' && ['Paid', 'Overdue'].includes(record.status)) return false;
      } else {
        if (filter === 'Supplier' && record.category === 'Logistics') return false;
        if (filter === 'Logistics' && record.category !== 'Logistics') return false;
        if (filter === 'Overdue' && record.status !== 'Overdue') return false;
      }
      return financeRecordMatchesQuery(record, searchQuery);
    });
  }, [filter, isReceivable, records, searchQuery]);

  const filters = isReceivable
    ? (['All', 'Overdue', 'Pending', 'Paid'] as const)
    : (['All', 'Supplier', 'Logistics', 'Overdue'] as const);

  const counts = {
    All: records.length,
    Overdue: records.filter((record) => record.status === 'Overdue').length,
    Pending: records.filter((record) => !['Paid', 'Overdue'].includes(record.status)).length,
    Paid: records.filter((record) => record.status === 'Paid').length,
    Supplier: records.filter((record) => record.category !== 'Logistics').length,
    Logistics: records.filter((record) => record.category === 'Logistics').length,
  } as Record<string, number>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">{kind} Queue</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">
            {isReceivable
              ? 'Customer quotes, orders, and invoices flowing into the finance ledger.'
              : 'Supplier commitments, procurement obligations, and logistics costs flowing into payables.'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isReceivable ? 'group-focus-within:text-[#00ff88]/40' : 'group-focus-within:text-purple-400/40'} text-white/20 transition-colors`} size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${kind.toLowerCase()}...`}
              className={`bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none ${isReceivable ? 'focus:border-[#00ff88]/20' : 'focus:border-purple-500/30'} transition-all w-64 font-mono uppercase tracking-widest`}
            />
          </div>
        </div>
      </header>

      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
        {filters.map((entry) => (
          <button
            key={entry}
            onClick={() => setFilter(entry)}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === entry
                ? isReceivable
                  ? 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                  : 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {entry} ({counts[entry] ?? 0})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-8 text-center text-[10px] font-mono uppercase tracking-widest text-white/30">
            No {kind.toLowerCase()} match the current filter.
          </div>
        )}
        {filtered.map((record, index) => (
          <motion.div
            key={record.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectRecord(record)}
            className="group flex items-center gap-6 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            {isReceivable ? (
              <div className={`w-1 h-10 rounded-full ${record.status === 'Paid' ? 'bg-[#00ff88]' : record.status === 'Overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${record.category === 'Logistics' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' : 'bg-purple-500/5 border-purple-500/10 text-purple-400'}`}>
                {record.category === 'Logistics' ? <Truck size={20} /> : <Building2 size={20} />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-sm font-bold text-white ${isReceivable ? 'group-hover:text-[#00ff88]' : 'group-hover:text-purple-400'} transition-colors truncate`}>{record.customerName}</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-mono text-white/40 uppercase tracking-widest">{record.orderId}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${financeStatusBadgeClasses(record.status)}`}>{record.category}</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{record.id} • Issued {record.issueDate}</div>
            </div>

            <div className="w-40 text-right">
              <div className="text-sm font-mono font-bold text-white">{formatFinanceCurrency(record.amount)}</div>
              {record.balance > 0 && <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest mt-1">Bal: {formatFinanceCurrency(record.balance)}</div>}
            </div>

            <div className="w-48 flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className={record.status === 'Overdue' ? 'text-red-400' : 'text-white/20'} />
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${record.status === 'Overdue' ? 'text-red-400' : 'text-white/60'}`}>
                  {record.status === 'Overdue' ? 'Overdue' : 'Due'} {record.dueDate}
                </span>
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-[0.2em]">{record.status}</div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={16} className="text-white" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FinanceMarginPanel({
  snapshot,
  onSelectRecord,
}: {
  snapshot: FinanceStudioSnapshot;
  onSelectRecord: (record: FinanceRecord) => void;
}) {
  const records = snapshot.marginRecords;
  const stats = [
    { label: 'Avg. Margin', value: formatFinancePercent(snapshot.overview.projectedGrossMarginPct.value), icon: TrendingUp, color: 'text-[#00ff88]' },
    { label: 'Negative Risk', value: `${snapshot.overview.negativeMarginRiskCount.value} Orders`, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Total Value', value: formatFinanceCompactCurrency(records.reduce((total, record) => total + (record.margin?.sellingValue ?? 0), 0)), icon: DollarSign, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Margin Analysis</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Granular order-by-order profitability and cost stack monitoring.</p>
        </div>
        <div className="flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.label}</span>
              <div className="flex items-center gap-2">
                <stat.icon size={14} className={stat.color} />
                <span className="text-xl font-mono text-white font-bold">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {records.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/5 bg-white/[0.02] px-8 py-16 text-center text-[10px] font-mono uppercase tracking-widest text-white/30">
            No margin-bearing finance records are available yet.
          </div>
        )}
        {records.map((record, index) => {
          const margin = record.margin!;
          const marginPercent = margin.sellingValue === 0 ? 0 : (margin.projectedMargin / margin.sellingValue) * 100;
          return (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectRecord(record)}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-5 transition-opacity group-hover:opacity-10 ${margin.status === 'Healthy' ? 'bg-[#00ff88]' : margin.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#00ff88] transition-colors tracking-tight">{record.orderId}</h3>
                    <span className={`text-[8px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded border ${margin.status === 'Healthy' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : margin.status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{margin.status === 'At Risk' ? 'Watch' : margin.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{record.customerName}</p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Margin</div>
                  <div className={`text-2xl font-mono font-bold tracking-tighter ${margin.status === 'Healthy' ? 'text-[#00ff88]' : margin.status === 'At Risk' ? 'text-amber-400' : 'text-red-400'}`}>{marginPercent.toFixed(1)}%</div>
                </div>
              </div>
              <div className="space-y-6 relative z-10 flex-1">
                <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(margin.productCost / margin.sellingValue) * 100}%` }} className="bg-purple-500/40" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(margin.logisticsCost / margin.sellingValue) * 100}%` }} className="bg-blue-500/40" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(margin.otherCosts / margin.sellingValue) * 100}%` }} className="bg-white/10" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, (margin.projectedMargin / margin.sellingValue) * 100)}%` }} className={margin.status === 'Negative' ? 'bg-red-500/40' : 'bg-[#00ff88]/20'} />
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Product Cost</span><span className="text-xs font-mono text-white font-bold">{formatFinanceCurrency(margin.productCost)}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Logistics</span><span className="text-xs font-mono text-white font-bold">{formatFinanceCurrency(margin.logisticsCost)}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Selling Value</span><span className="text-xs font-mono text-white font-bold">{formatFinanceCurrency(margin.sellingValue)}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Net Margin</span><span className={`text-xs font-mono font-bold ${margin.status === 'Healthy' ? 'text-[#00ff88]' : margin.status === 'At Risk' ? 'text-amber-400' : 'text-red-400'}`}>{formatFinanceCurrency(margin.projectedMargin)}</span></div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${margin.status === 'Healthy' ? 'bg-[#00ff88]' : margin.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Realized: {formatFinanceCurrency(margin.realizedMargin)}</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectRecord(record);
                  }}
                  className="text-[9px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Audit Details
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceExceptionsPanel({
  records,
  onSelectRecord,
}: {
  records: FinanceRecord[];
  onSelectRecord: (record: FinanceRecord) => void;
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (activeFilter === 'Critical') {
      filtered = filtered.filter((record) => record.margin?.status === 'Negative' || ['Flagged', 'Overdue'].includes(record.status));
    } else if (activeFilter === 'Payment') {
      filtered = filtered.filter((record) => record.status === 'Overdue' || record.exceptions?.some((exception) => /invoice|payment/i.test(exception)));
    } else if (activeFilter === 'Documentation') {
      filtered = filtered.filter((record) => record.exceptions?.some((exception) => /quote|supplier|document|unbooked/i.test(exception.toLowerCase())));
    }
    return filtered.filter((record) => financeRecordMatchesQuery(record, searchQuery));
  }, [activeFilter, records, searchQuery]);

  const filters = [
    { name: 'All', count: records.length },
    { name: 'Critical', count: records.filter((record) => record.margin?.status === 'Negative' || ['Flagged', 'Overdue'].includes(record.status)).length },
    { name: 'Payment', count: records.filter((record) => record.status === 'Overdue' || record.exceptions?.some((exception) => /invoice|payment/i.test(exception))).length },
    { name: 'Documentation', count: records.filter((record) => record.exceptions?.some((exception) => /quote|supplier|document|unbooked/i.test(exception.toLowerCase()))).length },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Exceptions Queue</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">High-priority financial issues requiring immediate operator intervention.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88] transition-colors" size={14} />
          <input type="text" placeholder="Search exceptions..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/40 focus:bg-white/[0.07] transition-all w-64" />
        </div>
      </header>

      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setActiveFilter(filter.name)}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeFilter === filter.name ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.2)]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}`}
          >
            {filter.name} <span className="ml-2 opacity-40 font-mono">{filter.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredRecords.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-8 text-center text-[10px] font-mono uppercase tracking-widest text-white/30">No finance exceptions match the current filter.</div>
        )}
        {filteredRecords.map((record, index) => (
          <motion.div
            key={record.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectRecord(record)}
            className="group flex items-center gap-6 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${record.margin?.status === 'Negative' || record.status === 'Flagged' ? 'bg-red-500' : record.status === 'Overdue' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <div className="flex-1 grid grid-cols-12 gap-6 items-center">
              <div className="col-span-4">
                <div className="flex items-center gap-3 mb-1">
                  <AlertCircle size={14} className={record.margin?.status === 'Negative' || record.status === 'Flagged' ? 'text-red-400' : record.status === 'Overdue' ? 'text-amber-400' : 'text-blue-400'} />
                  <span className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors truncate">{record.exceptions?.[0] || `${record.category} requires attention`}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  <span>{record.orderId}</span><span className="opacity-20">•</span><span>{record.customerName}</span>
                </div>
              </div>
              <div className="col-span-3">
                <div className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Reference</div>
                <div className="text-xs font-mono text-white">{record.id}</div>
              </div>
              <div className="col-span-3">
                <div className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Impact</div>
                <div className={`text-xs font-mono font-bold ${record.margin?.status === 'Negative' ? 'text-red-400' : 'text-white'}`}>{formatFinanceCurrency(record.balance > 0 ? record.balance : record.amount)}</div>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectRecord(record);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] transition-all"
                >
                  Resolve
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FinanceDetailDrawer({
  record,
  isOpen,
  onClose,
  onOpenProduct,
  onOpenCustomer,
  onOpenSupplier,
  onOpenWorkflow,
}: {
  record: FinanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProduct: (record: FinanceRecord) => void;
  onOpenCustomer: (record: FinanceRecord) => void;
  onOpenSupplier: (record: FinanceRecord) => void;
  onOpenWorkflow: (record: FinanceRecord) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'supplier' | 'logistics' | 'margin' | 'adjustments' | 'history'>('overview');
  const { openPdfPreview } = usePdfPreview();

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, record?.id]);

  if (!record) return null;

  const openFinancePdf = (targetRecord: FinanceRecord | null) => {
    if (!targetRecord?.pdfUrl) return;
    openPdfPreview({
      url: targetRecord.pdfUrl,
      title: targetRecord.sourceDocumentKey ?? targetRecord.id,
      subtitle: `${targetRecord.category} / ${targetRecord.status} / ${targetRecord.customerName}`,
      fileName: `${targetRecord.sourceDocumentKey ?? targetRecord.id}.pdf`,
    });
  };

  const openLinkedFinanceDocument = () => {
    const linked = record.linkedDocuments[0];
    if (!linked) {
      toast.message('No linked downstream document is attached to this finance record yet.');
      return;
    }
    openPdfPreview({
      url: linked.pdfUrl,
      title: linked.key,
      subtitle: `${linked.type} / ${linked.status}`,
      fileName: `${linked.key}.pdf`,
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'billing', label: 'Customer Billing', icon: FileText },
    { id: 'supplier', label: 'Supplier Costs', icon: Building2 },
    { id: 'logistics', label: 'Logistics Costs', icon: Truck },
    { id: 'margin', label: 'Margin Stack', icon: TrendingUp },
    { id: 'adjustments', label: 'Adjustments', icon: Edit },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#050505] border-l border-white/10 z-[70] shadow-2xl flex flex-col">
            <header className="p-8 border-b border-white/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest px-2 py-0.5 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded">{record.type}</span>
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{record.id}</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight">{record.orderId}</h2>
                <p className="text-sm text-white/40 mt-1 font-serif italic">{record.customerName}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"><X size={24} /></button>
            </header>

            <div className="flex border-b border-white/5 bg-white/[0.02] overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-[#00ff88]' : 'text-white/30 hover:text-white/60'}`}>
                  <tab.icon size={12} />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="activeFinanceDrawerTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff88]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
	              {activeTab === 'overview' && (
	                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6"><div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Amount</div><div className="text-2xl font-mono font-bold text-white">{formatFinanceCurrency(record.amount)}</div></div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6"><div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Outstanding Balance</div><div className={`text-2xl font-mono font-bold ${record.balance > 0 ? 'text-red-400' : 'text-[#00ff88]'}`}>{formatFinanceCurrency(record.balance)}</div></div>
                    </div>
                  </section>

	                  <section>
	                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Status Details</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Category', value: record.category },
                        { label: 'Current Status', value: record.status },
                        { label: 'Due Date', value: formatFinanceDate(record.dueDate) },
                        { label: 'Issue Date', value: formatFinanceDate(record.issueDate) },
                        { label: 'Source Document', value: record.sourceDocumentKey ?? record.id },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-xs text-white/40 uppercase tracking-widest">{item.label}</span>
                          <span className="text-sm text-white font-medium">{item.value}</span>
                        </div>
	                      ))}
	                    </div>
	                  </section>

	                  <section>
	                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Source Context</h3>
		                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
		                      <button
		                        type="button"
		                        disabled={!record.customerKey}
	                        onClick={() => onOpenCustomer(record)}
	                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
	                      >
	                        Open Customer
		                      </button>
		                      <button
		                        type="button"
		                        disabled={!record.supplierKey}
		                        onClick={() => onOpenSupplier(record)}
		                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
		                      >
		                        Open Supplier
		                      </button>
		                      <button
		                        type="button"
		                        disabled={!record.productId}
	                        onClick={() => onOpenProduct(record)}
	                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
	                      >
	                        Open Product
	                      </button>
	                      <button
	                        type="button"
	                        disabled={!record.workflowNode}
	                        onClick={() => onOpenWorkflow(record)}
	                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
	                      >
	                        Open Workflow
	                      </button>
	                    </div>
	                  </section>

	                  {record.summary && <section className="bg-white/5 border border-white/5 rounded-xl p-6"><h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-3">Snapshot Summary</h3><p className="text-sm text-white/60 leading-relaxed">{record.summary}</p></section>}
	                  {(record.exceptions?.length ?? 0) > 0 && <section className="bg-red-500/5 border border-red-500/10 rounded-xl p-6"><div className="flex items-center gap-3 mb-4"><AlertCircle size={16} className="text-red-400" /><h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Exceptions</h3></div><div className="space-y-2">{record.exceptions?.map((exception) => <div key={exception} className="text-sm text-white/60 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" />{exception}</div>)}</div></section>}
	                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Invoices & Payments</h3>
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">{record.id}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">Issued: {formatFinanceDate(record.issueDate)}</div>
                          </div>
                          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border rounded ${financeStatusBadgeClasses(record.status)}`}>{record.status}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="text-xl font-mono font-bold text-white">{formatFinanceCurrency(record.amount)}</div>
                          {record.pdfUrl ? <button onClick={() => openFinancePdf(record)} className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View PDF</button> : <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No PDF</span>}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Settlement Progress</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">Matched Collection</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-widest">{record.status} • Source {record.sourceDocumentKey ?? record.id}</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-[#00ff88]">{formatFinanceCurrency(Math.max(0, record.amount - record.balance))}</div>
                      </div>
                      {record.linkedDocuments.map((linkedDocument) => (
                        <div key={linkedDocument.key} className="flex justify-between items-center py-4 border-b border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">{linkedDocument.type}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">{linkedDocument.key} • {linkedDocument.status}</div>
                          </div>
                          <button
                            onClick={() => openPdfPreview({
                              url: linkedDocument.pdfUrl,
                              title: linkedDocument.key,
                              subtitle: `${linkedDocument.type} / ${linkedDocument.status}`,
                              fileName: `${linkedDocument.key}.pdf`,
                            })}
                            className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'supplier' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Supplier Obligations</h3>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">{record.supplierName ?? record.customerName}</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-widest">{record.id} • {record.category}</div>
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border rounded ${financeStatusBadgeClasses(record.status)}`}>{record.status}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-xl font-mono font-bold text-white">{formatFinanceCurrency(record.margin?.productCost ?? record.amount)}</div>
                        {record.pdfUrl ? <button onClick={() => openFinancePdf(record)} className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View Source</button> : <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Workflow Derived</span>}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Logistics Costs</h3>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">{record.supplierName ?? 'Linked Logistics Flow'}</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-widest">{record.id} • {record.category}</div>
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border rounded ${financeStatusBadgeClasses(record.status)}`}>{record.status}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-xl font-mono font-bold text-white">{formatFinanceCurrency(record.margin?.logisticsCost ?? record.amount)}</div>
                        <span className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest">Workflow Linked</span>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'margin' && (
                <div className="space-y-10">
                  {!record.margin ? (
                    <section className="bg-white/5 border border-white/5 rounded-xl p-12 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4"><TrendingUp size={20} className="text-white/20" /></div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No Margin Stack</h4>
                      <p className="text-xs text-white/30 max-w-[240px]">This finance record does not currently carry a product margin stack.</p>
                    </section>
                  ) : (
                    <section>
                      <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Margin Stack Breakdown</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Gross Selling Value', value: record.margin.sellingValue, color: 'text-white' },
                          { label: 'Product Cost (EXW)', value: -record.margin.productCost, color: 'text-red-400' },
                          { label: 'Logistics & Duty', value: -record.margin.logisticsCost, color: 'text-red-400' },
                          { label: 'Operational Overheads', value: -record.margin.otherCosts, color: 'text-red-400' },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-xs text-white/40 uppercase tracking-widest">{item.label}</span>
                            <span className={`text-sm font-mono font-bold ${item.color}`}>{item.value > 0 ? '+' : ''}{formatFinanceCurrency(Math.abs(item.value))}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-6 border-t border-white/10 mt-4">
                          <span className="text-sm font-bold text-white uppercase tracking-widest">Net Profit Margin</span>
                          <div className="text-right">
                            <div className={`text-2xl font-mono font-bold ${record.margin.status === 'Healthy' ? 'text-[#00ff88]' : 'text-red-400'}`}>{formatFinanceCurrency(record.margin.projectedMargin)}</div>
                            <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest">{((record.margin.projectedMargin / record.margin.sellingValue) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'adjustments' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Adjustments & Credit Notes</h3>
                    {(record.category === 'Credit' || record.exceptions?.some((exception) => /credit|adjustment/i.test(exception))) ? (
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="text-xs font-bold text-white uppercase tracking-widest mb-2">{record.id}</div>
                        <p className="text-sm text-white/60">{record.summary ?? 'Adjustment-linked record awaiting finance review.'}</p>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/5 rounded-xl p-12 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4"><Edit size={20} className="text-white/20" /></div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No Adjustments Found</h4>
                        <p className="text-xs text-white/30 max-w-[240px]">There are no active adjustments or credit notes attached to this finance record.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-8">
                  <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Financial Audit Trail</h3>
                  <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    {record.history.map((event, index) => (
                      <div key={`${event.date}-${index}`} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-[#050505] border-2 border-white/10" />
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest mb-1">{new Date(event.date).toLocaleString('en-ZA', { timeZone: 'UTC' })} • {event.user}</div>
                        <div className="text-sm text-white/70">{event.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
              <button onClick={() => openFinancePdf(record)} disabled={!record.pdfUrl} className="flex-1 py-4 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#00cc6e] transition-all shadow-[0_0_20px_rgba(0,255,136,0.1)] disabled:opacity-40 disabled:cursor-not-allowed">Open Source PDF</button>
              <button onClick={openLinkedFinanceDocument} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Open Linked Record</button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function FinanceModule({
  onCreateEntry,
  preferredSubModule,
  preferredRecordId,
  onOpenProduct,
  onOpenCustomer,
  onOpenSupplier,
  onOpenWorkflow,
}: {
  onCreateEntry: () => void;
  preferredSubModule?: FinanceSubModule;
  preferredRecordId?: string | null;
  onOpenProduct: (record: FinanceRecord) => void;
  onOpenCustomer: (record: FinanceRecord) => void;
  onOpenSupplier: (record: FinanceRecord) => void;
  onOpenWorkflow: (record: FinanceRecord) => void;
}) {
  const finance = useFinanceData();
  const snapshot = finance.studio ?? EMPTY_FINANCE_SNAPSHOT;
  const [activeSubModule, setActiveSubModule] = useState<FinanceSubModule>('Overview');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const recordsById = useMemo(() => new Map([...snapshot.receivables, ...snapshot.payables].map((record) => [record.id, record])), [snapshot.payables, snapshot.receivables]);
  const selectedRecord = selectedRecordId ? recordsById.get(selectedRecordId) ?? null : null;

  useEffect(() => {
    if (selectedRecordId && !recordsById.has(selectedRecordId)) {
      setSelectedRecordId(null);
    }
  }, [recordsById, selectedRecordId]);

  useEffect(() => {
    if (!preferredSubModule) {
      return;
    }

    setActiveSubModule(preferredSubModule);
  }, [preferredSubModule]);

  useEffect(() => {
    if (!preferredRecordId) {
      return;
    }

    const preferredRecord = recordsById.get(preferredRecordId);
    if (!preferredRecord) {
      return;
    }

    setSelectedRecordId(preferredRecord.id);
    setActiveSubModule(preferredSubModule ?? financeSubModuleForRecord(preferredRecord));
  }, [preferredRecordId, preferredSubModule, recordsById]);

  const content = (
    <div className="p-12 max-w-7xl mx-auto">
      {finance.isLoading && !finance.studio ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-10 py-20 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88]">Finance Live Sync</p>
          <h3 className="mt-3 text-3xl font-serif font-bold text-white uppercase">Loading finance cockpit</h3>
          <p className="mt-4 text-sm text-white/30 font-serif italic">Pulling quotes, invoices, sales orders, purchase orders, and payment state from the workflow.</p>
        </div>
      ) : finance.error ? (
        <div className="rounded-3xl border border-red-500/10 bg-red-500/5 px-10 py-20 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-400">Finance Sync Error</p>
          <h3 className="mt-3 text-3xl font-serif font-bold text-white uppercase">Finance data could not refresh</h3>
          <p className="mt-4 text-sm text-white/30 font-serif italic">{finance.error}</p>
        </div>
      ) : activeSubModule === 'Overview' ? (
        <FinanceOverviewPanel
          snapshot={snapshot}
          onSelectRecord={(record) => setSelectedRecordId(record.id)}
          onOpenSubModule={setActiveSubModule}
          onCreateEntry={onCreateEntry}
        />
      ) : activeSubModule === 'Receivables' ? (
        <FinanceQueuePanel kind="Receivables" records={snapshot.receivables} onSelectRecord={(record) => setSelectedRecordId(record.id)} />
      ) : activeSubModule === 'Payables' ? (
        <FinanceQueuePanel kind="Payables" records={snapshot.payables} onSelectRecord={(record) => setSelectedRecordId(record.id)} />
      ) : activeSubModule === 'Margin' ? (
        <FinanceMarginPanel snapshot={snapshot} onSelectRecord={(record) => setSelectedRecordId(record.id)} />
      ) : (
        <FinanceExceptionsPanel records={snapshot.exceptionRecords} onSelectRecord={(record) => setSelectedRecordId(record.id)} />
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
          {[
            { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'Receivables', label: 'Receivables', icon: DollarSign },
            { id: 'Payables', label: 'Payables', icon: CreditCard },
            { id: 'Margin', label: 'Margin Analysis', icon: BarChart3 },
            { id: 'Exceptions', label: 'Exceptions', icon: AlertTriangle },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSubModule(item.id as FinanceSubModule)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubModule === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/40 border border-transparent'}`}>
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex w-64 border-r border-white/5 bg-black/20 flex flex-col">
          <div className="p-8 border-b border-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-1">Finance</h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Retail OS Cockpit</p>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[
              { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'Receivables', icon: DollarSign, label: 'Receivables' },
              { id: 'Payables', icon: CreditCard, label: 'Payables' },
              { id: 'Margin', icon: BarChart3, label: 'Margin Analysis' },
              { id: 'Exceptions', icon: AlertTriangle, label: 'Exceptions' },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveSubModule(item.id as FinanceSubModule)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeSubModule === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <item.icon size={18} className={activeSubModule === item.id ? 'text-[#00ff88]' : 'text-white/20 group-hover:text-white/60'} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-white/5">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-2">System Health</p>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${finance.error ? 'bg-red-400' : 'bg-[#00ff88]'} ${finance.isLoading ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{finance.error ? 'Attention Required' : 'Deterministic'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
          {content}
        </div>
      </div>

      <FinanceDetailDrawer
        record={selectedRecord}
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecordId(null)}
        onOpenProduct={onOpenProduct}
        onOpenCustomer={onOpenCustomer}
        onOpenSupplier={onOpenSupplier}
        onOpenWorkflow={onOpenWorkflow}
      />
    </>
  );
}
