import React, { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Calendar, ExternalLink, FileText, Filter, MapPin, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { NavigationBar } from './NavigationBar';
import { useVisualLab } from './VisualLabContext';
import { customerAccountCategoryOptions, hasMemberCustomerAccess } from '../customers/accountCategories';
import { useTenderMemberAccess } from '../tenders/useTenderMemberAccess';
import type { TenderMemberOpportunitySummary, TenderMemberRole } from '../tenders/contracts';

const fallbackRoles: TenderMemberRole[] = ['Architect', 'Interior Designer', 'Quantity Surveyor', 'Contractor'];

function formatCurrency(value: number | null) {
  if (value === null) return 'Value TBC';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value).replace('ZAR', 'R').trim();
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date pending';
  const days = Math.ceil((parsed.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function MemberResponseModal({
  tender,
  roles,
  isSaving,
  onClose,
  onSubmit,
}: {
  tender: TenderMemberOpportunitySummary;
  roles: TenderMemberRole[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: {
    memberName: string;
    memberRole: TenderMemberRole;
    companyName: string;
    email: string;
    phone: string;
    scopeNote: string;
  }) => Promise<void>;
}) {
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<TenderMemberRole>(tender.memberAccess.requiredRoles[0] ?? roles[0] ?? 'Architect');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [scopeNote, setScopeNote] = useState('');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#080808] shadow-[0_50px_140px_rgba(0,0,0,0.9)]">
        <div className="flex items-start justify-between gap-6 border-b border-white/10 bg-white/[0.03] p-8">
          <div>
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.42em] text-[#22c55e]">Member Quote Access</div>
            <h3 className="font-serif text-3xl text-white">{tender.title}</h3>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/35">{tender.client} · {tender.location}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-3 text-white/45 transition-all hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form
          className="space-y-5 p-8"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit({ memberName, memberRole, companyName, email, phone, scopeNote });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Name</span>
              <input value={memberName} onChange={(event) => setMemberName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60" placeholder="Your name" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Role</span>
              <select value={memberRole} onChange={(event) => setMemberRole(event.target.value as TenderMemberRole)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60">
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Company</span>
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60" placeholder="Practice / company" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60" placeholder="name@company.co.za" />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Phone / WhatsApp</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60" placeholder="+27..." />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">What can you quote or review?</span>
            <textarea value={scopeNote} onChange={(event) => setScopeNote(event.target.value)} rows={4} className="custom-scrollbar w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/60" placeholder="Example: We can price capping, cladding installation, drawing takeoff, or full QS review." />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-white/45 transition-all hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e] px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-black transition-all hover:bg-[#7dffc1] disabled:cursor-not-allowed disabled:opacity-50">
              <Send size={14} /> Request Pack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberTenderAccessGate({ compact, onSignIn }: { compact: boolean; onSignIn: () => void }) {
  const allowedCategories = customerAccountCategoryOptions.filter((category) => category.memberAccess);

  return (
    <section className={`${compact ? 'mt-20' : 'min-h-screen px-6 pb-24 pt-32 md:px-12'} text-white`}>
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[44px] border border-white/10 bg-[#080808]/90 p-8 shadow-[0_40px_130px_rgba(0,0,0,0.75)] md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#22c55e]/10 blur-[150px]" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <div className="h-px w-12 bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#22c55e]">Tender Access Exchange</span>
              </div>
              <h2 className="font-serif text-4xl leading-tight text-white md:text-6xl">Member access required</h2>
              <p className="mt-5 max-w-2xl text-xs font-bold uppercase leading-[2.2] tracking-[0.28em] text-white/35">
                Tender quote packs are exposed to member customer accounts that can review drawings, price BOQs, or quote installation and project scopes. Retail customers and guests keep the standard e-commerce, quote, order, and community viewing journey.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#22c55e]/30 bg-[#22c55e] px-7 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-black transition-all hover:bg-[#7dffc1]"
              >
                Sign In / Become A Member
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="rounded-[34px] border border-white/10 bg-black/40 p-5">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.32em] text-white/35">Member Categories</div>
              <div className="grid gap-3">
                {allowedCategories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-white">{category.label}</div>
                    <div className="mt-2 text-[10px] leading-relaxed text-white/35">{category.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MemberTenderAccessBoard({ compact = false }: { compact?: boolean }) {
  const {
    isLoggedIn,
    userRole,
    customerAccountCategory,
    setIsLoginPageOpen,
    setPostLoginRedirect,
  } = useVisualLab();
  const hasAccess = isLoggedIn && userRole === 'customer' && hasMemberCustomerAccess(customerAccountCategory);

  if (!hasAccess) {
    return (
      <MemberTenderAccessGate
        compact={compact}
        onSignIn={() => {
          const currentPath = `${window.location.pathname}${window.location.search}`;
          setPostLoginRedirect(currentPath === '/' ? '/members/tenders' : currentPath);
          setIsLoginPageOpen(true);
        }}
      />
    );
  }

  return <MemberTenderAccessBoardInner compact={compact} />;
}

function MemberTenderAccessBoardInner({ compact = false }: { compact?: boolean }) {
  const {
    filters,
    setFilters,
    snapshot,
    isLoading,
    isSaving,
    error,
    createResponse,
  } = useTenderMemberAccess();
  const [selectedTender, setSelectedTender] = useState<TenderMemberOpportunitySummary | null>(null);
  const roles = snapshot?.filters.roles.length ? snapshot.filters.roles : fallbackRoles;
  const topMaterials = useMemo(() => snapshot?.filters.materials.slice(0, 8) ?? [], [snapshot?.filters.materials]);

  return (
    <section className={`${compact ? 'mt-20' : 'min-h-screen px-6 pb-24 pt-32 md:px-12'} text-white`}>
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[44px] border border-white/10 bg-[#080808]/90 p-8 shadow-[0_40px_130px_rgba(0,0,0,0.75)] md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#22c55e]/10 blur-[150px]" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-4">
                <div className="h-px w-12 bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#22c55e]">Tender Access Exchange</span>
              </div>
              <h2 className="font-serif text-4xl leading-tight text-white md:text-6xl">Member quote board</h2>
              <p className="mt-5 max-w-2xl text-xs font-bold uppercase leading-[2.2] tracking-[0.28em] text-white/35">
                Sourced tenders, BOQ gaps, drawing reviews, and product scopes exposed to verified architects, designers, QS partners, and contractors.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-white/10 bg-black/40 p-3">
              {[
                ['Open', snapshot?.metrics.openTenders ?? 0],
                ['Gap Lines', snapshot?.metrics.gapLines ?? 0],
                ['Requests', snapshot?.metrics.quotePackRequests ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/[0.03] px-5 py-4 text-center">
                  <div className="font-mono text-2xl text-white">{value}</div>
                  <div className="mt-1 text-[8px] font-black uppercase tracking-[0.28em] text-white/30">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <Search size={16} className="text-white/25" />
              <input value={filters.query ?? ''} onChange={(event) => setFilters({ query: event.target.value })} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" placeholder="Search by tender, authority, material, scope, or location..." />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                <Filter size={14} /> Role
              </div>
              <select value={filters.role ?? 'All'} onChange={(event) => setFilters({ role: event.target.value as TenderMemberRole | 'All' })} className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-bold text-white outline-none">
                <option value="All">All Members</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>

          {topMaterials.length > 0 ? (
            <div className="relative z-10 mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilters({ material: '' })} className={`rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] transition-all ${filters.material ? 'border-white/10 bg-white/5 text-white/40 hover:text-white' : 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#7dffc1]'}`}>
                All Materials
              </button>
              {topMaterials.map((material) => (
                <button key={material} type="button" onClick={() => setFilters({ material })} className={`rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] transition-all ${filters.material === material ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#7dffc1]' : 'border-white/10 bg-white/5 text-white/40 hover:text-white'}`}>
                  {material}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {isLoading ? (
            <div className="col-span-full rounded-[36px] border border-white/10 bg-white/[0.03] p-12 text-center text-xs font-black uppercase tracking-[0.35em] text-white/30">
              Loading tender access board...
            </div>
          ) : snapshot?.opportunities.length ? snapshot.opportunities.map((tender) => (
            <article key={tender.id} className="group overflow-hidden rounded-[34px] border border-white/10 bg-[#0b0b0b] p-7 transition-all hover:-translate-y-1 hover:border-[#22c55e]/30 hover:bg-[#101510]">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-[#7dffc1]">{tender.memberAccess.accessLabel}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-white/35">{tender.source}</span>
                  </div>
                  <h3 className="font-serif text-2xl leading-tight text-white">{tender.title}</h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-white/35">{tender.client}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right">
                  <div className="text-lg font-mono text-white">{formatCurrency(tender.valueZar)}</div>
                  <div className="mt-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/25">Estimated value</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 md:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3"><MapPin size={13} className="text-[#22c55e]" /> {tender.location}</div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3"><Calendar size={13} className="text-[#22c55e]" /> {formatDate(tender.closeDate)}</div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3"><BriefcaseBusiness size={13} className="text-[#22c55e]" /> {daysUntil(tender.closeDate)}</div>
              </div>

              {tender.description ? (
                <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-white/50">{tender.description}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {tender.memberAccess.requiredRoles.map((role) => (
                  <span key={role} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-blue-200">{role}</span>
                ))}
                {tender.memberAccess.materialTags.slice(0, 5).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/40">{tag}</span>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                    <Sparkles size={14} className="text-[#22c55e]" /> Quoteable Scope Gaps
                  </div>
                  <span className="font-mono text-xs text-white/30">{tender.memberAccess.gapLines.length} items</span>
                </div>
                <div className="space-y-3">
                  {tender.memberAccess.gapLines.slice(0, 3).map((line) => (
                    <div key={line.id} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-white">{line.description}</span>
                        <span className="shrink-0 text-[10px] font-mono text-[#7dffc1]">{line.quantityLabel}</span>
                      </div>
                      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{line.reference} · {line.status}</div>
                    </div>
                  ))}
                  {tender.memberAccess.gapLines.length === 0 ? (
                    <div className="rounded-2xl bg-white/[0.03] px-4 py-3 text-xs text-white/35">No open product gaps were detected, but the source pack is available for member review.</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {tender.memberAccess.documents[0] ? (
                  <button type="button" onClick={() => window.open(tender.memberAccess.documents[0].url, '_blank', 'noopener,noreferrer')} className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/50 transition-all hover:bg-white/10 hover:text-white">
                    <FileText size={14} /> Open Pack
                  </button>
                ) : tender.sourceUrl ? (
                  <button type="button" onClick={() => window.open(tender.sourceUrl ?? '', '_blank', 'noopener,noreferrer')} className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/50 transition-all hover:bg-white/10 hover:text-white">
                    <ExternalLink size={14} /> Open Source
                  </button>
                ) : null}
                <button type="button" onClick={() => setSelectedTender(tender)} className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-5 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#7dffc1] transition-all hover:bg-[#22c55e] hover:text-black">
                  <Users size={14} /> Request Quote Pack <ArrowRight size={14} />
                </button>
              </div>
            </article>
          )) : (
            <div className="col-span-full rounded-[36px] border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/25">
                <Search size={24} />
              </div>
              <h3 className="font-serif text-2xl text-white">No matching tenders</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/35">Adjust the role, material, or search filter to view opportunities sourced from the tender back end.</p>
            </div>
          )}
        </div>
      </div>

      {selectedTender ? (
        <MemberResponseModal
          tender={selectedTender}
          roles={roles}
          isSaving={isSaving}
          onClose={() => setSelectedTender(null)}
          onSubmit={async (input) => {
            try {
              await createResponse(selectedTender.id, input);
              toast.success(`Quote pack request logged for ${selectedTender.title}.`);
              setSelectedTender(null);
            } catch (submitError) {
              toast.error(submitError instanceof Error ? submitError.message : 'Failed to log member response.');
            }
          }}
        />
      ) : null}
    </section>
  );
}

export function MemberTenderAccessPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />
      <MemberTenderAccessBoard />
    </div>
  );
}
