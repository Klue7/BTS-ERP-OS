import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import { fetchSupplierPortalMe, logoutSupplierPortal } from '../inventory/api';
import type { BusinessDocumentSummary, SupplierPortalSession } from '../inventory/contracts';
import { useVisualLab } from './VisualLabContext';
import { usePdfPreview } from './PdfPreviewContext';

type SupplierTab = 'overview' | 'orders' | 'documents' | 'payments' | 'profile';

type SupplierJourneyGroup = {
  groupKey: string;
  primaryDocument: BusinessDocumentSummary;
  latestDocument: BusinessDocumentSummary;
  documents: BusinessDocumentSummary[];
  productName: string | null;
  productSku: string | null;
  totalAmount: number;
  completedStages: number;
  stageCount: number;
};

const JOURNEY_DOCUMENT_TYPES = new Set<string>([
  'Purchase Order',
  'Delivery Note',
  'Proof of Delivery',
  'Goods Receipt',
  'Supplier Invoice',
]);

function isJourneyDocument(document: BusinessDocumentSummary) {
  return JOURNEY_DOCUMENT_TYPES.has(document.type);
}

function getJourneyGroupKey(document: BusinessDocumentSummary) {
  if (document.type === 'Purchase Order') {
    return document.key;
  }

  return document.purchaseOrderKey ?? document.parentDocumentKey ?? document.key;
}

function getStatusClasses(status: BusinessDocumentSummary['status']) {
  if (['Delivered', 'Paid', 'Received'].includes(status)) {
    return 'bg-[#22c55e]/12 text-[#22c55e] border-[#22c55e]/20';
  }

  if (['Flagged', 'Overdue', 'Cancelled'].includes(status)) {
    return 'bg-red-500/12 text-red-300 border-red-500/20';
  }

  if (['Confirmed', 'Sent', 'Issued'].includes(status)) {
    return 'bg-blue-500/12 text-blue-300 border-blue-500/20';
  }

  return 'bg-white/5 text-white/55 border-white/10';
}

function buildJourneyStages(group: SupplierJourneyGroup) {
  const documents = group.documents;
  const latestStatus = group.latestDocument.status;
  const hasPurchaseOrder = documents.some((document) => document.type === 'Purchase Order');
  const hasSupplierInvoice = documents.some((document) => document.type === 'Supplier Invoice');
  const hasDispatchDocument = documents.some((document) =>
    document.type === 'Delivery Note' || document.type === 'Proof of Delivery',
  );
  const hasReceipt = documents.some((document) => document.type === 'Goods Receipt');

  return [
    {
      label: 'PO Received',
      description: hasPurchaseOrder ? group.primaryDocument.key : 'Awaiting BTS purchase order',
      ready: hasPurchaseOrder,
    },
    {
      label: 'Supplier Confirmed',
      description:
        hasSupplierInvoice || ['Confirmed', 'Sent', 'Paid'].includes(latestStatus)
          ? 'Supplier commercial action logged'
          : 'Awaiting supplier acknowledgement',
      ready: hasSupplierInvoice || ['Confirmed', 'Sent', 'Paid'].includes(latestStatus),
    },
    {
      label: 'Dispatch / Collection',
      description: hasDispatchDocument ? 'Delivery or collection note linked' : 'Awaiting transport handover',
      ready: hasDispatchDocument,
    },
    {
      label: 'Receipt Closed',
      description: hasReceipt ? 'Goods receipt captured by BTS' : 'Awaiting BTS receipt confirmation',
      ready: hasReceipt || ['Delivered', 'Received'].includes(latestStatus),
    },
  ];
}

function buildJourneyGroups(documents: BusinessDocumentSummary[]) {
  const map = new Map<string, BusinessDocumentSummary[]>();

  documents.filter(isJourneyDocument).forEach((document) => {
    const groupKey = getJourneyGroupKey(document);
    const existing = map.get(groupKey);
    if (existing) {
      existing.push(document);
      return;
    }

    map.set(groupKey, [document]);
  });

  return Array.from(map.entries())
    .map(([groupKey, groupDocuments]) => {
      const sortedDesc = [...groupDocuments].sort(
        (left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime(),
      );
      const primaryDocument =
        groupDocuments.find((document) => document.type === 'Purchase Order') ?? sortedDesc[0];
      const latestDocument = sortedDesc[0];
      const productDocument = sortedDesc.find((document) => document.productName || document.productSku) ?? primaryDocument;
      const group: SupplierJourneyGroup = {
        groupKey,
        primaryDocument,
        latestDocument,
        documents: sortedDesc,
        productName: productDocument.productName ?? null,
        productSku: productDocument.productSku ?? null,
        totalAmount: primaryDocument.totalAmount || latestDocument.totalAmount,
        completedStages: buildJourneyStages({
          groupKey,
          primaryDocument,
          latestDocument,
          documents: sortedDesc,
          productName: productDocument.productName ?? null,
          productSku: productDocument.productSku ?? null,
          totalAmount: primaryDocument.totalAmount || latestDocument.totalAmount,
          completedStages: 0,
          stageCount: 4,
        }).filter((stage) => stage.ready).length,
        stageCount: 4,
      };

      return group;
    })
    .sort((left, right) => new Date(right.latestDocument.issuedAt).getTime() - new Date(left.latestDocument.issuedAt).getTime());
}

export function SupplierPortal() {
  const { openPdfPreview } = usePdfPreview();

  const openSupplierPdf = (document: BusinessDocumentSummary) => {
    openPdfPreview({
      url: document.pdfUrl,
      title: document.key,
      subtitle: `${document.type} / ${document.status}`,
      fileName: `${document.key}.pdf`,
    });
  };

  const navigate = useNavigate();
  const { setIsLoggedIn, setUserRole } = useVisualLab();
  const [activeTab, setActiveTab] = useState<SupplierTab>('overview');
  const [session, setSession] = useState<SupplierPortalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentSearch, setDocumentSearch] = useState('');
  const [selectedJourneyKey, setSelectedJourneyKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await fetchSupplierPortalMe();
        if (!cancelled) {
          setSession(payload);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load supplier portal.';
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutSupplierPortal();
    } catch {
      // noop
    } finally {
      setIsLoggedIn(false);
      setUserRole(null);
      navigate('/');
    }
  };

  const vendor = session?.vendor;
  const user = session?.user;

  const filteredDocumentHistory = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    const documents = vendor?.documentHistory ?? [];

    if (!query) {
      return documents;
    }

    return documents.filter((document) => {
      const haystack = [
        document.key,
        document.title,
        document.type,
        document.status,
        document.productName ?? '',
        document.productSku ?? '',
        document.summary ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [documentSearch, vendor?.documentHistory]);

  const journeyGroups = useMemo(() => buildJourneyGroups(filteredDocumentHistory), [filteredDocumentHistory]);
  const selectedJourney = useMemo(
    () => journeyGroups.find((group) => group.groupKey === selectedJourneyKey) ?? journeyGroups[0] ?? null,
    [journeyGroups, selectedJourneyKey],
  );
  const selectedJourneyStages = useMemo(
    () => (selectedJourney ? buildJourneyStages(selectedJourney) : []),
    [selectedJourney],
  );

  useEffect(() => {
    if (!selectedJourneyKey && journeyGroups[0]) {
      setSelectedJourneyKey(journeyGroups[0].groupKey);
      return;
    }

    if (selectedJourneyKey && !journeyGroups.some((group) => group.groupKey === selectedJourneyKey)) {
      setSelectedJourneyKey(journeyGroups[0]?.groupKey ?? null);
    }
  }, [journeyGroups, selectedJourneyKey]);

  const recentJourneys = journeyGroups.slice(0, 3);

  const tabs: Array<{ id: SupplierTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Purchase Orders' },
    { id: 'documents', label: 'Documents' },
    { id: 'payments', label: 'Payments' },
    { id: 'profile', label: 'Profile' },
  ];

  const openJourney = (groupKey: string) => {
    setSelectedJourneyKey(groupKey);
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 px-6 md:px-16 selection:bg-[#22c55e] selection:text-black">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-serif font-bold text-white tracking-tighter mb-2 uppercase">SUPPLIER PORTAL</h1>
            <p className="text-white/40 text-xs uppercase tracking-[0.3em]">
              {vendor ? `${vendor.name} · ${user?.roleLabel ?? 'Vendor Access'}` : 'Vendor access and procurement visibility'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={14} />
              Back to Site
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-white/60 font-mono text-sm">Loading supplier portal...</div>
        ) : error || !vendor ? (
          <div className="p-10 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-300 flex items-start gap-4">
            <AlertCircle className="mt-0.5" size={18} />
            <div>
              <div className="font-semibold mb-1">Supplier portal unavailable</div>
              <div className="text-sm text-red-200/80">{error ?? 'No supplier session is available.'}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Linked Products', value: vendor.productCount.toString(), icon: Package },
                { label: 'Credit Balance', value: `R ${vendor.commercialAccount.currentCreditBalanceZar.toLocaleString()}`, icon: CreditCard },
                { label: 'Documents', value: vendor.documents.length.toString(), icon: FileText },
                { label: 'Contacts', value: vendor.contacts.length.toString(), icon: User },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                    <stat.icon size={22} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 text-[10px] font-bold uppercase tracking-[0.25em] border-b-2 transition-all ${
                    activeTab === tab.id ? 'text-[#22c55e] border-[#22c55e]' : 'text-white/30 border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-xl font-serif text-white font-bold uppercase tracking-tight mb-6">Vendor Readiness</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        ['Onboarded', vendor.workflowMilestones.onboarded],
                        ['Linked', vendor.workflowMilestones.linkedToProducts],
                        ['PO Ready', vendor.workflowMilestones.poIssued],
                        ['Dispatch', vendor.workflowMilestones.dispatchReady],
                        ['Claims', vendor.workflowMilestones.claimsVerified],
                      ].map(([label, ready]) => (
                        <div key={String(label)} className="bg-black/40 border border-white/10 rounded-2xl p-5 text-center">
                          <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center ${ready ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-white/5 text-white/20'}`}>
                            <ShieldCheck size={18} />
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-xl font-serif text-white font-bold uppercase tracking-tight mb-6">Route Origin</h2>
                    {vendor.locations[0] ? (
                      <div className="space-y-4">
                        <div className="text-sm text-white/80">{vendor.locations[0].label}</div>
                        <div className="text-xs text-white/50 leading-relaxed">
                          {[vendor.locations[0].streetAddress, vendor.locations[0].city, vendor.locations[0].region, vendor.locations[0].postalCode, vendor.locations[0].country].filter(Boolean).join(', ')}
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                          {vendor.locations[0].mapsUrl && (
                            <a href={vendor.locations[0].mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <MapPin size={14} />
                              Open Maps
                            </a>
                          )}
                          {vendor.contacts[0]?.phone && (
                            <a href={`tel:${vendor.contacts[0].phone}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <Phone size={14} />
                              Call
                            </a>
                          )}
                          {vendor.contacts[0]?.email && (
                            <a href={`mailto:${vendor.contacts[0].email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <Globe size={14} />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-white/40">No supplier origin is configured.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e] mb-2">Procurement Journey</div>
                      <h2 className="text-xl font-serif text-white font-bold uppercase tracking-tight">Latest BTS Order Handover</h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Open Full Order Journey
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {recentJourneys.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">
                      No purchase order journeys are linked yet. As BTS issues orders to this supplier, they will appear here and in the purchase order tab.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      {recentJourneys.map((group) => (
                        <button
                          key={group.groupKey}
                          onClick={() => openJourney(group.groupKey)}
                          className="text-left rounded-2xl border border-white/10 bg-black/30 p-5 hover:border-[#22c55e]/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-mono text-sm">{group.primaryDocument.key}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                                {new Date(group.latestDocument.issuedAt).toLocaleDateString('en-ZA')} · {group.productName ?? 'Supplier order'}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold ${getStatusClasses(group.latestDocument.status)}`}>
                              {group.latestDocument.status}
                            </span>
                          </div>
                          <div className="mt-5 flex items-end justify-between gap-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Journey Progress</div>
                              <div className="text-2xl font-bold text-white">{group.completedStages}/{group.stageCount}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Linked Docs</div>
                              <div className="text-lg font-semibold text-white">{group.documents.length}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">Purchase Order Journey</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] mt-1">
                      BTS purchase order, supplier confirmation, dispatch, and receipt history
                    </p>
                  </div>
                  <input
                    value={documentSearch}
                    onChange={(event) => setDocumentSearch(event.target.value)}
                    placeholder="Search order, product, or status"
                    className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#22c55e]/30"
                  />
                </div>

                {journeyGroups.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-white/40">
                    No purchase order journeys are available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)] gap-6 items-start">
                    <div className="space-y-4">
                      {journeyGroups.map((group) => (
                        <button
                          key={group.groupKey}
                          onClick={() => setSelectedJourneyKey(group.groupKey)}
                          className={`w-full text-left p-6 rounded-3xl border transition-all ${
                            selectedJourney?.groupKey === group.groupKey
                              ? 'bg-[#22c55e]/8 border-[#22c55e]/25 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="text-white font-mono text-sm">{group.primaryDocument.key}</div>
                                <span className={`px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold ${getStatusClasses(group.latestDocument.status)}`}>
                                  {group.latestDocument.status}
                                </span>
                              </div>
                              <div className="text-[10px] uppercase tracking-widest text-white/35">
                                {group.latestDocument.type} · {new Date(group.latestDocument.issuedAt).toLocaleDateString('en-ZA')}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Material</div>
                                  <div className="text-sm text-white/80">{group.productName ?? 'Linked supplier order'}</div>
                                  {group.productSku ? <div className="text-[10px] uppercase tracking-widest text-white/25 mt-1">{group.productSku}</div> : null}
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Order Value</div>
                                  <div className="text-sm font-semibold text-white">R {group.totalAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Linked Docs</div>
                                  <div className="text-sm text-white/80">{group.documents.length}</div>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-[160px]">
                              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">Journey Progress</div>
                              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-[#22c55e]"
                                  style={{ width: `${(group.completedStages / group.stageCount) * 100}%` }}
                                />
                              </div>
                              <div className="mt-2 text-[10px] uppercase tracking-widest text-white/35">
                                {group.completedStages} of {group.stageCount} stages complete
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedJourney ? (
                        <motion.div
                          key={selectedJourney.groupKey}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          className="xl:sticky xl:top-28 rounded-3xl border border-white/10 bg-white/5 p-8"
                        >
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Selected Journey</div>
                              <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">{selectedJourney.primaryDocument.key}</h3>
                              <div className="text-[10px] uppercase tracking-widest text-white/35 mt-2">
                                {selectedJourney.latestDocument.type} · {selectedJourney.latestDocument.status}
                              </div>
                            </div>
                            <button
                              onClick={() => openSupplierPdf(selectedJourney.primaryDocument)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[10px] font-bold uppercase tracking-widest text-[#22c55e] hover:bg-[#22c55e]/20 transition-all"
                            >
                              Open PDF
                              <ExternalLink size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Material</div>
                              <div className="text-sm text-white">{selectedJourney.productName ?? 'Supplier order'}</div>
                              {selectedJourney.productSku ? (
                                <div className="text-[10px] uppercase tracking-widest text-white/25 mt-2">{selectedJourney.productSku}</div>
                              ) : null}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Journey Value</div>
                              <div className="text-sm font-semibold text-white">R {selectedJourney.totalAmount.toLocaleString()}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/25 mt-2">{selectedJourney.documents.length} linked docs</div>
                            </div>
                          </div>

                          <div className="mb-8">
                            <div className="text-[10px] uppercase tracking-widest text-white/20 mb-4">Order Journey</div>
                            <div className="space-y-3">
                              {selectedJourneyStages.map((stage) => (
                                <div key={stage.label} className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start gap-4">
                                  <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center ${stage.ready ? 'bg-[#22c55e]/12 text-[#22c55e]' : 'bg-white/5 text-white/20'}`}>
                                    {stage.ready ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-white">{stage.label}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-white/35 mt-1">{stage.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/25 mb-3">
                                <MapPin size={14} />
                                Factory Origin
                              </div>
                              {vendor.locations[0] ? (
                                <>
                                  <div className="text-sm text-white">{vendor.locations[0].label}</div>
                                  <div className="text-xs text-white/45 mt-2 leading-relaxed">
                                    {[vendor.locations[0].streetAddress, vendor.locations[0].city, vendor.locations[0].region, vendor.locations[0].postalCode, vendor.locations[0].country].filter(Boolean).join(', ')}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-white/45">No route origin configured yet.</div>
                              )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/25 mb-3">
                                <Truck size={14} />
                                Handover Contact
                              </div>
                              {vendor.contacts[0] ? (
                                <>
                                  <div className="text-sm text-white">{vendor.contacts[0].name}</div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                                    {vendor.contacts[0].department}{vendor.contacts[0].roleTitle ? ` · ${vendor.contacts[0].roleTitle}` : ''}
                                  </div>
                                  <div className="mt-3 space-y-1 text-sm text-white/65">
                                    <div>{vendor.contacts[0].email}</div>
                                    {vendor.contacts[0].phone ? <div>{vendor.contacts[0].phone}</div> : null}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-white/45">No supplier routing contact configured yet.</div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/20 mb-4">Linked Documents</div>
                            <div className="space-y-3">
                              {selectedJourney.documents.map((document) => (
                                <button
                                  key={document.id}
                                  onClick={() => openSupplierPdf(document)}
                                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-white/20 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-sm text-white">{document.title}</div>
                                      <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                                        {document.key} · {document.type} · {new Date(document.issuedAt).toLocaleDateString('en-ZA')}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-white">R {document.totalAmount.toLocaleString()}</div>
                                      <div className="mt-2 text-[10px] uppercase tracking-widest text-[#22c55e]">Open PDF</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/40">
                          Select a purchase order journey to inspect the linked dispatch and document trail.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {vendor.documents.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-white/40">No supplier documents have been uploaded yet.</div>
                ) : vendor.documents.map((document) => (
                  <a key={document.id} href={document.downloadUrl} target="_blank" rel="noreferrer" className="block p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-white font-medium">{document.name}</div>
                        <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{document.type} · {new Date(document.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-[#22c55e] text-[10px] font-bold uppercase tracking-widest">Download</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Current Credit Balance</div>
                  <div className="text-3xl font-bold text-white">R {vendor.commercialAccount.currentCreditBalanceZar.toLocaleString()}</div>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Credit Limit</div>
                  <div className="text-3xl font-bold text-white">
                    {vendor.commercialAccount.creditLimitZar ? `R ${vendor.commercialAccount.creditLimitZar.toLocaleString()}` : 'TBD'}
                  </div>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">VAT</div>
                  <div className="text-lg font-semibold text-white">
                    {vendor.commercialAccount.vatRegistered ? vendor.commercialAccount.vatNumber || 'Registered' : 'Not VAT Registered'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h2 className="text-xl font-serif text-white font-bold uppercase tracking-tight mb-6">Company Profile</h2>
                  <div className="space-y-4 text-sm text-white/80">
                    <div><span className="text-white/40 uppercase text-[10px] tracking-widest">Registered</span><div>{vendor.registeredName || 'Not captured yet'}</div></div>
                    <div><span className="text-white/40 uppercase text-[10px] tracking-widest">Trading</span><div>{vendor.tradingName || vendor.name}</div></div>
                    <div><span className="text-white/40 uppercase text-[10px] tracking-widest">Type</span><div>{vendor.type}</div></div>
                    <div><span className="text-white/40 uppercase text-[10px] tracking-widest">Roles</span><div>{vendor.vendorRoles.join(', ')}</div></div>
                    <div><span className="text-white/40 uppercase text-[10px] tracking-widest">Capabilities</span><div>{vendor.capabilities.join(', ') || 'None configured'}</div></div>
                  </div>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h2 className="text-xl font-serif text-white font-bold uppercase tracking-tight mb-6">Contacts</h2>
                  <div className="space-y-4">
                    {vendor.contacts.map((contact) => (
                      <div key={contact.id} className="p-4 rounded-2xl bg-black/40 border border-white/10">
                        <div className="text-white font-medium">{contact.name}</div>
                        <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{contact.department}{contact.roleTitle ? ` · ${contact.roleTitle}` : ''}</div>
                        <div className="text-sm text-white/70 mt-2">{contact.email}</div>
                        {contact.phone && <div className="text-sm text-white/70">{contact.phone}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
