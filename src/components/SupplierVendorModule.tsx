import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  Filter,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  TrendingUp,
  Upload,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import {
  uploadInventoryFile,
  uploadSupplierDocument,
} from '../inventory/api';
import type {
  BusinessDocumentSummary,
  CreateSupplierContactInput,
  CreateSupplierDocumentInput,
  CreateSupplierInput,
  InventoryProductDetail,
  LinkSupplierProductsInput,
  SupplierContactSummary,
  SupplierDocumentSummary,
  SupplierSummary,
  UpdateSupplierInput,
  VendorDocumentType,
} from '../inventory/contracts';
import { usePdfPreview } from './PdfPreviewContext';

const vendorDocumentTypes: VendorDocumentType[] = [
  'Agreement',
  'Test Result',
  'Plan',
  'Certification',
  'Purchase Order',
  'Delivery Note',
  'Invoice',
  'Other',
];

const leadTimeOptions = [
  '1-2 Working Days',
  '3-5 Working Days',
  '5-7 Working Days',
  '7-10 Working Days',
  '10-15 Working Days',
  '15-20 Working Days',
] as const;

const paymentTermOptions = ['Cash', '30 Days Account', '60 Days Account', '90 Days Account'] as const;

const defaultContactDepartments: Array<{
  department: string;
  roleTitle: string;
  preferredChannel: CreateSupplierContactInput['preferredChannel'];
  notes: string;
}> = [
  {
    department: 'Sales',
    roleTitle: 'Account Manager',
    preferredChannel: 'Email',
    notes: 'Commercial contact for quotes, sales orders, and catalogue updates.',
  },
  {
    department: 'Purchases',
    roleTitle: 'Procurement Desk',
    preferredChannel: 'Email',
    notes: 'Receives purchase orders and procurement confirmations.',
  },
  {
    department: 'Dispatch',
    roleTitle: 'Warehouse / Logistics',
    preferredChannel: 'Phone',
    notes: 'Handles collection windows, dispatch readiness, and delivery scheduling.',
  },
  {
    department: 'Accounts',
    roleTitle: 'Finance',
    preferredChannel: 'Email',
    notes: 'Invoicing, statements, remittances, and credit control.',
  },
  {
    department: 'POD / Claims',
    roleTitle: 'Claims & Service',
    preferredChannel: 'Portal',
    notes: 'Delivery notes, POD requests, claims, and quality escalations.',
  },
];

type VendorSubModule = 'Overview' | 'Directory' | 'Insights';
export type SupplierDetailTab = 'Overview' | 'Contacts' | 'Products' | 'Terms' | 'Orders' | 'Performance' | 'History';

interface SupplierVendorModuleProps {
  activeSubModule: VendorSubModule;
  onSubModuleChange: (subModule: VendorSubModule) => void;
  vendors: SupplierSummary[];
  products: InventoryProductDetail[];
  isSaving: boolean;
  onCreateVendor: (input: CreateSupplierInput) => Promise<SupplierSummary>;
  onUpdateVendor: (id: string, input: UpdateSupplierInput) => Promise<SupplierSummary>;
  onDeleteVendor: (id: string) => Promise<{ ok: true; id: string; disposition: 'deleted' | 'archived'; supplier?: SupplierSummary }>;
  onAddSupplierContact: (id: string, input: CreateSupplierContactInput) => Promise<SupplierSummary>;
  onAddSupplierDocument: (id: string, input: CreateSupplierDocumentInput) => Promise<SupplierSummary>;
  onLinkSupplierProducts: (id: string, input: LinkSupplierProductsInput) => Promise<SupplierSummary>;
  focusedVendorId?: string | null;
  focusedVendorTab?: SupplierDetailTab;
}

interface VendorEditFormState {
  name: string;
  registeredName: string;
  tradingName: string;
  type: SupplierSummary['type'];
  status: SupplierSummary['status'];
  leadTime: string;
  vendorRoles: SupplierSummary['vendorRoles'];
  capabilities: string;
  notes: string;
  vatRegistered: boolean;
  vatNumber: string;
  providesProducts: boolean;
  providesTransport: boolean;
  locationLabel: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  paymentTerms: string;
  deliveryTerms: string;
  moq: string;
  incoterms: string;
  creditLimitZar: string;
  currentCreditBalanceZar: string;
  minimumOrderValueZar: string;
  standardDiscountPct: string;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function supplierStatusTone(status: SupplierSummary['status']) {
  switch (status) {
    case 'Active':
      return 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10';
    case 'Onboarding':
      return 'bg-blue-500/5 text-blue-400 border-blue-500/10';
    case 'Delayed':
      return 'bg-red-500/5 text-red-400 border-red-500/10';
    case 'Restocking':
      return 'bg-amber-500/5 text-amber-400 border-amber-500/10';
    default:
      return 'bg-white/5 text-white/40 border-white/10';
  }
}

function getPrimaryLocation(vendor: SupplierSummary) {
  return vendor.locations[0] ?? null;
}

function getVendorDisplayName(vendor: SupplierSummary) {
  return vendor.tradingName?.trim() || vendor.name?.trim() || vendor.registeredName?.trim() || 'Unnamed Vendor';
}

function getVendorRegisteredNameLabel(vendor: SupplierSummary) {
  if (!vendor.registeredName?.trim()) {
    return null;
  }

  const displayName = getVendorDisplayName(vendor);
  return vendor.registeredName.trim() !== displayName ? vendor.registeredName.trim() : null;
}

function buildVendorEditForm(vendor: SupplierSummary): VendorEditFormState {
  const location = getPrimaryLocation(vendor);
  return {
    name: vendor.name,
    registeredName: vendor.registeredName ?? '',
    tradingName: vendor.tradingName ?? '',
    type: vendor.type,
    status: vendor.status,
    leadTime: vendor.leadTime,
    vendorRoles: vendor.vendorRoles,
    capabilities: vendor.capabilities.join(', '),
    notes: vendor.notes ?? '',
    vatRegistered: vendor.vatRegistered,
    vatNumber: vendor.vatNumber ?? '',
    providesProducts: vendor.providesProducts,
    providesTransport: vendor.providesTransport,
    locationLabel: location?.label ?? '',
    streetAddress: location?.streetAddress ?? '',
    postalCode: location?.postalCode ?? '',
    city: location?.city ?? '',
    region: location?.region ?? '',
    country: location?.country ?? 'South Africa',
    paymentTerms: vendor.commercialAccount.paymentTerms ?? vendor.terms.payment ?? '',
    deliveryTerms: vendor.commercialAccount.deliveryTerms ?? vendor.terms.delivery ?? '',
    moq: vendor.commercialAccount.moq ?? vendor.terms.moq ?? '',
    incoterms: vendor.commercialAccount.incoterms ?? vendor.terms.incoterms ?? '',
    creditLimitZar: vendor.commercialAccount.creditLimitZar?.toString() ?? '',
    currentCreditBalanceZar: vendor.commercialAccount.currentCreditBalanceZar.toString(),
    minimumOrderValueZar: vendor.commercialAccount.minimumOrderValueZar?.toString() ?? '',
    standardDiscountPct: vendor.commercialAccount.standardDiscountPct?.toString() ?? '',
  };
}

function linkedProductsForVendor(products: InventoryProductDetail[], vendorId: string) {
  return products.filter((product) => product.suppliers.some((supplier) => supplier.id === vendorId));
}

function workflowCompletion(vendor: SupplierSummary) {
  const milestones = Object.values(vendor.workflowMilestones);
  const complete = milestones.filter(Boolean).length;
  return Math.round((complete / milestones.length) * 100);
}

function parseLeadTimeDays(leadTime: string) {
  const matches = leadTime.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return 0;
  }

  const values = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(value);
  }
}

function getSupplierPortalEntryPath() {
  if (typeof window === 'undefined') {
    return '/portal';
  }
  return `${window.location.origin}/portal`;
}

function getCapabilityPreview(vendor: SupplierSummary) {
  if (vendor.capabilities.length) return vendor.capabilities;
  const derived: string[] = [];
  if (vendor.providesProducts) derived.push('Product Supply');
  if (vendor.providesTransport) derived.push('Transport');
  return derived.length ? derived : ['Unassigned'];
}

type VendorInsightSnapshot = {
  vendor: SupplierSummary;
  linkedProducts: InventoryProductDetail[];
  workflowPct: number;
  leadTimeDays: number;
  openOrders: number;
  deliveredOrders: number;
  docCoveragePct: number;
  currentExposureZar: number;
  leverageScore: number;
  performanceScore: number;
  reasons: string[];
};

function buildVendorInsightSnapshot(vendor: SupplierSummary, products: InventoryProductDetail[]): VendorInsightSnapshot {
  const linkedProducts = linkedProductsForVendor(products, vendor.id);
  const workflowPct = workflowCompletion(vendor);
  const leadTimeDays = parseLeadTimeDays(vendor.leadTime);
  const openOrders = vendor.orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length;
  const deliveredOrders = vendor.orders.filter((order) => order.status === 'Delivered').length;
  const requiredDocumentTypes: VendorDocumentType[] = ['Agreement', 'Test Result', 'Certification', 'Invoice'];
  const presentDocumentTypes = new Set(vendor.documents.map((document) => document.type));
  const docCoveragePct = Math.round(
    (requiredDocumentTypes.filter((documentType) => presentDocumentTypes.has(documentType)).length / requiredDocumentTypes.length) * 100,
  );
  const currentExposureZar = vendor.commercialAccount.currentCreditBalanceZar + vendor.orders.reduce((sum, order) => sum + order.amount, 0);
  const leadTimePenalty = Math.min(100, leadTimeDays * 6);
  const openOrderPenalty = Math.min(100, openOrders * 16);
  const documentationPenalty = 100 - docCoveragePct;
  const statusPenalty =
    vendor.status === 'Delayed'
      ? 30
      : vendor.status === 'Restocking'
        ? 18
        : vendor.status === 'Onboarding'
          ? 12
          : 0;

  const leverageScore = Math.round(
    (statusPenalty * 1.2) +
      (documentationPenalty * 0.55) +
      (leadTimePenalty * 0.35) +
      (openOrderPenalty * 0.4) +
      Math.min(60, currentExposureZar / 5000),
  );

  const closureRatio = vendor.orders.length > 0 ? (deliveredOrders / vendor.orders.length) * 100 : 100;
  const performanceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((workflowPct * 0.35) + (docCoveragePct * 0.2) + ((100 - leadTimePenalty) * 0.2) + (closureRatio * 0.25)),
    ),
  );

  const reasons: string[] = [];
  if (vendor.status === 'Delayed' || vendor.status === 'Restocking') {
    reasons.push('Supply timing pressure');
  }
  if (docCoveragePct < 100) {
    reasons.push('Compliance pack incomplete');
  }
  if (leadTimeDays >= 7) {
    reasons.push('Longer working-day lead time');
  }
  if (currentExposureZar > 0) {
    reasons.push('Open BTS exposure');
  }
  if (openOrders > 0) {
    reasons.push('Live order commitments');
  }

  return {
    vendor,
    linkedProducts,
    workflowPct,
    leadTimeDays,
    openOrders,
    deliveredOrders,
    docCoveragePct,
    currentExposureZar,
    leverageScore,
    performanceScore,
    reasons,
  };
}

function buildOnboardingDefaults(products: InventoryProductDetail[]) {
  return {
    name: '',
    registeredName: '',
    tradingName: '',
    type: 'Manufacturer' as SupplierSummary['type'],
    vendorRoles: ['Product Supplier'] as SupplierSummary['vendorRoles'],
    leadTime: '3-5 Working Days',
    capabilities: '',
    logoUrl: '',
    region: '',
    vatRegistered: true,
    vatNumber: '',
    notes: '',
    providesProducts: true,
    providesTransport: false,
    locationLabel: 'Primary Factory',
    streetAddress: '',
    postalCode: '',
    city: '',
    regionLabel: '',
    country: 'South Africa',
    paymentTerms: '30 Days Account',
    deliveryTerms: 'Factory Collection',
    moq: '1 Pallet',
    incoterms: 'EXW',
    creditLimitZar: '',
    currentCreditBalanceZar: '0',
    minimumOrderValueZar: '',
    standardDiscountPct: '',
    contacts: defaultContactDepartments.map((contact, index) => ({
      department: contact.department,
      roleTitle: contact.roleTitle,
      name: '',
      email: '',
      phone: '',
      preferredChannel: contact.preferredChannel,
      notes: contact.notes,
      isPrimary: index === 0,
    })),
    documents: [] as Array<{
      name: string;
      type: VendorDocumentType;
      storagePath: string;
      storedFileName: string;
      mimeType?: string;
      uploadedBy?: string;
      fileSizeBytes?: number;
    }>,
    linkedProductIds: [],
    portalUserEmail: '',
    portalUserPassword: '',
    portalUserFullName: '',
  };
}

function SupplierOverviewPanel({
  vendors,
  products,
  onAddVendor,
  onVendorClick,
}: {
  vendors: SupplierSummary[];
  products: InventoryProductDetail[];
  onAddVendor: () => void;
  onVendorClick: (vendor: SupplierSummary, tab?: SupplierDetailTab) => void;
}) {
  const activeVendorCount = vendors.filter((vendor) => vendor.status !== 'Inactive').length;
  const delayedVendors = vendors
    .filter((vendor) => vendor.status === 'Delayed' || vendor.status === 'Restocking')
    .slice(0, 3);
  const onboardingQueue = vendors.filter(
    (vendor) => vendor.status === 'Onboarding' || !vendor.workflowMilestones.onboarded,
  );
  const poOrders = vendors.flatMap((vendor) => vendor.orders.filter((order) => order.type === 'PO'));
  const pendingPods = vendors.flatMap((vendor) => vendor.orders.filter((order) => order.type === 'POD' && order.status !== 'Delivered'));
  const readinessValues = vendors.length
    ? {
        onboarded: Math.round((vendors.filter((vendor) => vendor.workflowMilestones.onboarded).length / vendors.length) * 100),
        linked: Math.round((vendors.filter((vendor) => vendor.workflowMilestones.linkedToProducts).length / vendors.length) * 100),
        dispatch: Math.round((vendors.filter((vendor) => vendor.workflowMilestones.dispatchReady).length / vendors.length) * 100),
      }
    : { onboarded: 0, linked: 0, dispatch: 0 };
  const totalLinkedProducts = vendors.reduce((sum, vendor) => sum + linkedProductsForVendor(products, vendor.id).length, 0);
  const vendorsMissingLinkedProducts = vendors.filter((vendor) => linkedProductsForVendor(products, vendor.id).length === 0);
  const vendorsMissingDispatch = vendors.filter((vendor) => !vendor.workflowMilestones.dispatchReady);
  const firstVendorWithPo = vendors.find((vendor) => vendor.orders.some((order) => order.type === 'PO'));
  const firstVendorWithPendingPod = vendors.find((vendor) => vendor.orders.some((order) => order.type === 'POD' && order.status !== 'Delivered'));

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Vendor Overview</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Supplier health, onboarding queue, and operational alerts.</p>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">Active Vendors</span>
            <span className="text-2xl font-mono text-white font-bold">{activeVendorCount}</span>
          </div>
          <button
            onClick={onAddVendor}
            className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff88]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00ff88]/5"
          >
            <UserPlus size={14} /> Add Vendor
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle size={100} className="text-amber-400" />
          </div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="p-3 bg-amber-500/5 rounded-xl text-amber-400/60 border border-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Restocking Delayed</h3>
          </div>
          <div className="space-y-5 relative z-10">
            {delayedVendors.length ? delayedVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => onVendorClick(vendor, 'Overview')}
                className="w-full flex justify-between items-center p-5 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all text-left"
              >
                <div>
                  <div className="text-xs font-bold text-white/80">{vendor.name}</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">
                    {vendor.blocker ?? vendor.leadTime}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold ${vendor.status === 'Delayed' ? 'text-red-400/80' : 'text-amber-400/80'}`}>
                  {vendor.leadTime}
                </span>
              </button>
            )) : (
              <div className="p-5 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                No vendor blockers detected
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={100} className="text-[#00ff88]" />
          </div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="p-3 bg-[#00ff88]/5 rounded-xl text-[#00ff88]/60 border border-[#00ff88]/10 shadow-[0_0_15px_rgba(0,255,136,0.05)]">
              <Zap size={18} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Workflow Readiness</h3>
          </div>
          <div className="space-y-8 relative z-10">
            {[
              {
                label: 'Supplier Onboarded',
                val: readinessValues.onboarded,
                color: 'bg-[#00ff88]/60',
                targetVendor: onboardingQueue[0],
                targetTab: 'Overview' as SupplierDetailTab,
              },
              {
                label: 'Linked to Products',
                val: readinessValues.linked,
                color: 'bg-blue-400/60',
                targetVendor: vendorsMissingLinkedProducts[0],
                targetTab: 'Products' as SupplierDetailTab,
              },
              {
                label: 'Dispatch Ready',
                val: readinessValues.dispatch,
                color: 'bg-amber-400/60',
                targetVendor: vendorsMissingDispatch[0],
                targetTab: 'Orders' as SupplierDetailTab,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={!item.targetVendor}
                onClick={() => item.targetVendor && onVendorClick(item.targetVendor, item.targetTab)}
                className="w-full space-y-4 text-left disabled:cursor-default"
              >
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em]">
                  <span className="text-white/30 font-medium">{item.label}</span>
                  <span className="text-white/60 font-mono font-bold">{item.val}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full ${item.color} shadow-[0_0_10px_rgba(0,255,136,0.2)]`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag size={100} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="p-3 bg-purple-500/5 rounded-xl text-purple-400/80 border border-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
              <ShoppingBag size={18} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">PO Lifecycle</h3>
          </div>
          <div className="space-y-5 relative z-10">
            <button
              type="button"
              disabled={!firstVendorWithPo}
              onClick={() => firstVendorWithPo && onVendorClick(firstVendorWithPo, 'Orders')}
              className="w-full p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all text-left disabled:cursor-default"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight">POs Issued</span>
                <span className="text-base font-mono text-white">{poOrders.length}</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                {formatMoney(poOrders.reduce((sum, order) => sum + order.amount, 0))} Total Value
              </div>
            </button>
            <button
              type="button"
              disabled={!firstVendorWithPendingPod}
              onClick={() => firstVendorWithPendingPod && onVendorClick(firstVendorWithPendingPod, 'Orders')}
              className="w-full p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all text-left disabled:cursor-default"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight">Pending PODs</span>
                <span className="text-base font-mono text-amber-400/80">{pendingPods.length}</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                {totalLinkedProducts} linked SKUs being routed through live vendors
              </div>
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserPlus size={100} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="p-3 bg-blue-400/5 rounded-xl text-blue-400/80 border border-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.05)]">
              <UserPlus size={18} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Onboarding Queue</h3>
          </div>
          <div className="space-y-5 relative z-10">
            {onboardingQueue.length ? onboardingQueue.slice(0, 2).map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => onVendorClick(vendor, 'Overview')}
                className="w-full flex justify-between items-center p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all text-left"
              >
                <div>
                  <div className="text-sm font-bold text-white/80">{vendor.name}</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">
                    {vendor.blocker ?? 'Awaiting workflow completion'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-base font-mono font-bold text-blue-400/80">{workflowCompletion(vendor)}%</span>
                  <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400/40" style={{ width: `${workflowCompletion(vendor)}%` }} />
                  </div>
                </div>
              </button>
            )) : (
              <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                No vendors waiting for activation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierDirectoryPanel({
  vendors,
  products,
  onVendorClick,
  onAddVendor,
}: {
  vendors: SupplierSummary[];
  products: InventoryProductDetail[];
  onVendorClick: (vendor: SupplierSummary) => void;
  onAddVendor: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | SupplierSummary['status']>('All');

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesFilter = filter === 'All' || vendor.status === filter;
      const matchesQuery =
        !query ||
        vendor.name.toLowerCase().includes(query) ||
        (vendor.tradingName ?? '').toLowerCase().includes(query) ||
        vendor.type.toLowerCase().includes(query) ||
        vendor.capabilities.some((capability) => capability.toLowerCase().includes(query)) ||
        vendor.contacts.some((contact) => contact.name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query));

      return matchesFilter && matchesQuery;
    });
  }, [filter, search, vendors]);

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Vendor Directory</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Manage supplier relationships, terms, contacts, and performance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors..."
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/20 transition-all w-72 font-mono"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Delayed">Delayed</option>
              <option value="Restocking">Restocking</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>
          <button onClick={onAddVendor} className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff88]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00ff88]/5">
            <UserPlus size={14} /> Add Vendor
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVendors.map((vendor) => {
          const linkedProducts = linkedProductsForVendor(products, vendor.id);
          const capabilityPreview = getCapabilityPreview(vendor);
          const openOrders = vendor.orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length;
          const displayName = getVendorDisplayName(vendor);
          const registeredNameLabel = getVendorRegisteredNameLabel(vendor);

          return (
            <div
              key={vendor.id}
              onClick={() => onVendorClick(vendor)}
              className="group bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] p-3.5 flex items-center justify-center group-hover:border-white/10 transition-colors">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-[#00ff88] transition-colors tracking-tight leading-tight">{displayName}</h3>
                    {registeredNameLabel && (
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">
                        {registeredNameLabel}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.type}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400/60">
                        <Star size={10} className="fill-amber-400/60" /> {vendor.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`text-[8px] uppercase font-bold tracking-[0.2em] px-2.5 py-1 rounded-full border ${supplierStatusTone(vendor.status)}`}>
                  {vendor.status}
                </span>
              </div>

              <div className="space-y-6 flex-1 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {capabilityPreview.slice(0, 2).map((capability) => (
                      <span key={capability} className="px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/5 text-[9px] text-white/30 uppercase tracking-widest">
                        {capability}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {Object.entries(vendor.workflowMilestones).map(([key, value]) => (
                      <div
                        key={key}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${value ? 'bg-[#00ff88]/40' : 'bg-white/5'}`}
                        title={`${key}: ${value ? 'Ready' : 'Pending'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                  <div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2.5">Workflow Status</div>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${vendor.workflowMilestones.dispatchReady ? 'bg-[#00ff88]/60' : 'bg-amber-400/60'}`} />
                      <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">
                        {vendor.workflowMilestones.dispatchReady ? 'Dispatch Ready' : 'Logistics Pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2.5">Active Orders</div>
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag size={12} className={openOrders > 0 ? 'text-[#00ff88]/40' : 'text-white/10'} />
                      <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">{openOrders} Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-xl font-mono text-white group-hover:text-[#00ff88] transition-colors">{linkedProducts.length}</span>
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mt-1">Linked Products</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300 ease-out">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onVendorClick(vendor);
                    }}
                    className="px-6 py-3 bg-[#00ff88]/10 backdrop-blur-md hover:bg-[#00ff88] text-[#00ff88] hover:text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all border border-[#00ff88]/20 hover:border-transparent hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.1)] hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]"
                  >
                    Open Profile
                  </button>
                </div>
                <ChevronRight size={20} className="text-white/10 group-hover:opacity-0 transition-all duration-300" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SupplierInsightsPanel({
  vendors,
  products,
  onVendorClick,
}: {
  vendors: SupplierSummary[];
  products: InventoryProductDetail[];
  onVendorClick: (vendor: SupplierSummary, tab?: SupplierDetailTab) => void;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const heroCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const boardRowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sidePanelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const signalCardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const ringRefs = useRef<Array<HTMLDivElement | null>>([]);
  const metricBarRefs = useRef<Array<HTMLDivElement | null>>([]);

  const snapshots = useMemo(
    () => vendors.map((vendor) => buildVendorInsightSnapshot(vendor, products)),
    [products, vendors],
  );

  const leverageBoard = [...snapshots].sort((left, right) => right.leverageScore - left.leverageScore).slice(0, 5);
  const averageLeadTime = snapshots.length
    ? Math.round(snapshots.reduce((sum, snapshot) => sum + snapshot.leadTimeDays, 0) / snapshots.length)
    : 0;
  const averageCompliance = snapshots.length
    ? Math.round(snapshots.reduce((sum, snapshot) => sum + snapshot.docCoveragePct, 0) / snapshots.length)
    : 0;
  const totalExposureZar = snapshots.reduce((sum, snapshot) => sum + snapshot.currentExposureZar, 0);
  const dispatchReadyCount = vendors.filter((vendor) => vendor.workflowMilestones.dispatchReady).length;
  const averageWorkflow = snapshots.length
    ? Math.round(snapshots.reduce((sum, snapshot) => sum + snapshot.workflowPct, 0) / snapshots.length)
    : 0;
  const averagePerformance = snapshots.length
    ? Math.round(snapshots.reduce((sum, snapshot) => sum + snapshot.performanceScore, 0) / snapshots.length)
    : 0;
  const longLeadTimeVendors = leverageBoard.filter((snapshot) => snapshot.leadTimeDays >= 7);
  const complianceGaps = leverageBoard.filter((snapshot) => snapshot.docCoveragePct < 100);
  const liveCommitments = leverageBoard.filter((snapshot) => snapshot.openOrders > 0);
  const activeVendors = vendors.filter((vendor) => vendor.status === 'Active').length;
  const statusSegments = [
    { label: 'Active', count: vendors.filter((vendor) => vendor.status === 'Active').length, color: '#00ff88' },
    { label: 'Onboarding', count: vendors.filter((vendor) => vendor.status === 'Onboarding').length, color: '#3b82f6' },
    { label: 'Delayed', count: vendors.filter((vendor) => vendor.status === 'Delayed').length, color: '#f87171' },
    { label: 'Restocking', count: vendors.filter((vendor) => vendor.status === 'Restocking').length, color: '#f59e0b' },
    { label: 'Inactive', count: vendors.filter((vendor) => vendor.status === 'Inactive').length, color: '#6b7280' },
  ].filter((segment) => segment.count > 0);
  const statusMixGradient = (() => {
    if (vendors.length === 0) {
      return 'conic-gradient(#1f2937 0 100%)';
    }

    let cursor = 0;
    const stops = statusSegments.map((segment) => {
      const start = cursor;
      const sweep = (segment.count / vendors.length) * 100;
      cursor += sweep;
      return `${segment.color} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  })();
  const exposureAttribution = [...snapshots]
    .filter((snapshot) => snapshot.currentExposureZar > 0)
    .sort((left, right) => right.currentExposureZar - left.currentExposureZar)
    .slice(0, 4)
    .map((snapshot) => ({
      snapshot,
      sharePct: totalExposureZar > 0 ? Math.round((snapshot.currentExposureZar / totalExposureZar) * 100) : 0,
    }));
  const maxLeverage = Math.max(...leverageBoard.map((snapshot) => snapshot.leverageScore), 1);
  const maxPerformance = Math.max(...leverageBoard.map((snapshot) => snapshot.performanceScore), 1);
  const maxExposure = Math.max(...leverageBoard.map((snapshot) => snapshot.currentExposureZar), 1);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) {
      return;
    }

    const ctx = gsap.context(() => {
      const heroCards = heroCardRefs.current.filter(Boolean);
      const boardRows = boardRowRefs.current.filter(Boolean);
      const sidePanels = sidePanelRefs.current.filter(Boolean);
      const signalCards = signalCardRefs.current.filter(Boolean);
      const rings = ringRefs.current.filter(Boolean);
      const metricBars = metricBarRefs.current.filter(Boolean);

      gsap.set([...heroCards, ...boardRows, ...sidePanels, ...signalCards], {
        opacity: 0,
        y: 20,
      });
      gsap.set(metricBars, {
        scaleX: 0,
        transformOrigin: 'left center',
      });
      gsap.set(rings, {
        rotate: -100,
        opacity: 0,
        transformOrigin: 'center center',
      });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(heroCards, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 })
        .to(boardRows, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.35')
        .to(sidePanels, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, '-=0.45')
        .to(signalCards, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, '-=0.35')
        .to(metricBars, { scaleX: 1, duration: 0.9, stagger: 0.025, ease: 'power2.out' }, '-=0.55')
        .to(rings, { rotate: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '-=0.65');

      if (heroCards.length > 0) {
        gsap.to(heroCards[0], {
          boxShadow: '0 0 28px rgba(0,255,136,0.08)',
          repeat: -1,
          yoyo: true,
          duration: 2.4,
          ease: 'sine.inOut',
        });
      }
    }, root);

    return () => ctx.revert();
  }, [vendors.length, leverageBoard.length, exposureAttribution.length]);

  return (
    <div ref={sectionRef} className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Vendor Insights</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">
            Performance signals, negotiation leverage, and supplier pressure derived from live vendor workflow data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[#00ff88]/15 bg-[#00ff88]/5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">
            {vendors.length} live vendors indexed
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/45">
            R {Math.round(totalExposureZar).toLocaleString()} exposure mapped
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Live Vendors', value: activeVendors.toString(), accent: 'text-[#00ff88]', delta: `${vendors.length} indexed`, icon: Building2 },
          { label: 'Avg Lead Time', value: `${averageLeadTime} Days`, accent: 'text-white', delta: 'Working days', icon: Clock },
          { label: 'Compliance', value: `${averageCompliance}%`, accent: 'text-blue-400', delta: `${complianceGaps.length} gaps`, icon: FileCheck },
          { label: 'Open Exposure', value: `R ${Math.round(totalExposureZar).toLocaleString()}`, accent: 'text-amber-400', delta: `${liveCommitments.length} live commitments`, icon: CreditCard },
        ].map((card, index) => (
          <div
            key={card.label}
            ref={(node) => {
              heroCardRefs.current[index] = node;
            }}
            className="bg-[#0f0f10] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-[#00ff88]">
                <card.icon size={18} />
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">{card.delta}</div>
            </div>
            <div className={`text-3xl font-serif font-bold tracking-tight ${card.accent}`}>{card.value}</div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.85fr)] gap-8">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest">Supplier Pressure Board</h3>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
                Leverage, performance, and exposure mapped into one comparison view.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-white/35 uppercase tracking-widest">Leverage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                <span className="text-[10px] text-white/35 uppercase tracking-widest">Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-white/35 uppercase tracking-widest">Exposure</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {leverageBoard.map((snapshot, index) => (
              <button
                key={snapshot.vendor.id}
                onClick={() => onVendorClick(snapshot.vendor, 'Performance')}
                ref={(node) => {
                  boardRowRefs.current[index] = node;
                }}
                className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-left hover:border-white/10 transition-all"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm font-bold text-white">{getVendorDisplayName(snapshot.vendor)}</div>
                      <span className={`text-[8px] uppercase font-bold tracking-[0.2em] px-2.5 py-1 rounded-full border ${supplierStatusTone(snapshot.vendor.status)}`}>
                        {snapshot.vendor.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                      {snapshot.linkedProducts.length} linked · {snapshot.openOrders} live orders · {snapshot.leadTimeDays || 0} days
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-5 lg:min-w-[300px]">
                    <div>
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2">Leverage</div>
                      <div className="text-lg font-mono font-bold text-amber-400">{snapshot.leverageScore}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2">Perf.</div>
                      <div className="text-lg font-mono font-bold text-[#00ff88]">{snapshot.performanceScore}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2">Exposure</div>
                      <div className="text-lg font-mono font-bold text-blue-400">{Math.round(snapshot.currentExposureZar / 1000)}k</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4">
                  <div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        ref={(node) => {
                          metricBarRefs.current[(index * 3)] = node;
                        }}
                        className="h-full bg-amber-400"
                        style={{ width: `${(snapshot.leverageScore / maxLeverage) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        ref={(node) => {
                          metricBarRefs.current[(index * 3) + 1] = node;
                        }}
                        className="h-full bg-[#00ff88]"
                        style={{ width: `${(snapshot.performanceScore / maxPerformance) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        ref={(node) => {
                          metricBarRefs.current[(index * 3) + 2] = node;
                        }}
                        className="h-full bg-blue-400"
                        style={{ width: `${(snapshot.currentExposureZar / maxExposure) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div
            ref={(node) => {
              sidePanelRefs.current[0] = node;
            }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#00ff88]/15 rounded-lg text-[#00ff88]">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest">Vendor Mix</h3>
            </div>
            <div className="flex items-center gap-8">
              <div
                className="relative w-36 h-36 rounded-full border border-white/5 shrink-0"
                style={{ background: statusMixGradient }}
              >
                <div className="absolute inset-[18px] rounded-full bg-[#0a0a0a] border border-white/5 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{vendors.length}</div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Vendors</div>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                {statusSegments.map((segment) => (
                  <div key={segment.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <div className="flex items-center gap-2 text-white/45">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }} />
                        {segment.label}
                      </div>
                      <span className="text-white/70">{segment.count}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${vendors.length ? (segment.count / vendors.length) * 100 : 0}%`, backgroundColor: segment.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={(node) => {
              sidePanelRefs.current[1] = node;
            }}
            className="bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#00ff88]/15 rounded-lg text-[#00ff88]">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest">Readiness Index</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Workflow', value: averageWorkflow, color: '#00ff88' },
                { label: 'Compliance', value: averageCompliance, color: '#60a5fa' },
                { label: 'Performance', value: averagePerformance, color: '#f59e0b' },
              ].map((ring, index) => (
                <div key={ring.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex flex-col items-center">
                  <div
                    ref={(node) => {
                      ringRefs.current[index] = node;
                    }}
                    className="relative w-20 h-20 rounded-full"
                    style={{
                      background: `conic-gradient(${ring.color} 0 ${ring.value}%, rgba(255,255,255,0.06) ${ring.value}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-[10px] rounded-full bg-[#0f0f10] border border-white/5 flex items-center justify-center text-sm font-mono font-bold text-white">
                      {ring.value}%
                    </div>
                  </div>
                  <div className="mt-4 text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">{ring.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Dispatch Ready</div>
                <div className="text-2xl font-bold text-amber-400">{dispatchReadyCount}/{vendors.length || 0}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Avg Rating</div>
                <div className="text-2xl font-bold text-white">
                  {vendors.length ? (vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-8">
        <div
          ref={(node) => {
            sidePanelRefs.current[2] = node;
          }}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest">Exposure Attribution</h3>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Share of BTS payable and live order load</div>
          </div>
          <div className="space-y-5">
            {exposureAttribution.length > 0 ? exposureAttribution.map(({ snapshot, sharePct }, index) => (
              <button
                key={`${snapshot.vendor.id}-exposure`}
                onClick={() => onVendorClick(snapshot.vendor, 'Terms')}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white/20 font-mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-white/55">{getVendorDisplayName(snapshot.vendor)}</span>
                  </div>
                  <span className="text-white/60">{sharePct}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    ref={(node) => {
                      metricBarRefs.current[(leverageBoard.length * 3) + index] = node;
                    }}
                    className="h-full bg-blue-400"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </button>
            )) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                No live exposure is mapped yet.
              </div>
            )}
          </div>
        </div>

        <div
          ref={(node) => {
            sidePanelRefs.current[3] = node;
          }}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Actionable Signals</h3>
          <div className="space-y-4">
            <button
              onClick={() => complianceGaps[0] && onVendorClick(complianceGaps[0].vendor, 'Performance')}
              disabled={!complianceGaps[0]}
              ref={(node) => {
                signalCardRefs.current[0] = node;
              }}
              className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-left hover:border-white/10 transition-all disabled:cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-2">Compliance Gaps</div>
                  <div className="text-3xl font-bold text-white">{complianceGaps.length}</div>
                </div>
                <FileCheck size={18} className="text-blue-400/80" />
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/20">Open supplier docs and test packs</div>
            </button>

            <button
              onClick={() => longLeadTimeVendors[0] && onVendorClick(longLeadTimeVendors[0].vendor, 'Terms')}
              disabled={!longLeadTimeVendors[0]}
              ref={(node) => {
                signalCardRefs.current[1] = node;
              }}
              className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-left hover:border-white/10 transition-all disabled:cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-2">Long Lead Time</div>
                  <div className="text-3xl font-bold text-white">{longLeadTimeVendors.length}</div>
                </div>
                <Clock size={18} className="text-amber-400/80" />
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/20">Working-day terms carrying schedule pressure</div>
            </button>

            <button
              onClick={() => liveCommitments[0] && onVendorClick(liveCommitments[0].vendor, 'Orders')}
              disabled={!liveCommitments[0]}
              ref={(node) => {
                signalCardRefs.current[2] = node;
              }}
              className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-left hover:border-white/10 transition-all disabled:cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-2">Live Commitments</div>
                  <div className="text-3xl font-bold text-white">{liveCommitments.length}</div>
                </div>
                <Truck size={18} className="text-[#00ff88]/80" />
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/20">Open orders that still need dispatch or receipt closure</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierDetailDrawer({
  vendor,
  products,
  isOpen,
  isSaving,
  onClose,
  onUpdateVendor,
  onDeleteVendor,
  onAddSupplierContact,
  onAddSupplierDocument,
  onLinkSupplierProducts,
  initialTab,
}: {
  vendor: SupplierSummary | null;
  products: InventoryProductDetail[];
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onUpdateVendor: (id: string, input: UpdateSupplierInput) => Promise<SupplierSummary>;
  onDeleteVendor: (id: string) => Promise<{ ok: true; id: string; disposition: 'deleted' | 'archived'; supplier?: SupplierSummary }>;
  onAddSupplierContact: (id: string, input: CreateSupplierContactInput) => Promise<SupplierSummary>;
  onAddSupplierDocument: (id: string, input: CreateSupplierDocumentInput) => Promise<SupplierSummary>;
  onLinkSupplierProducts: (id: string, input: LinkSupplierProductsInput) => Promise<SupplierSummary>;
  initialTab: SupplierDetailTab;
}) {
  const { openPdfPreview } = usePdfPreview();
  const [activeTab, setActiveTab] = useState<SupplierDetailTab>('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<VendorEditFormState | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [contactDraft, setContactDraft] = useState<CreateSupplierContactInput>({
    department: 'Dispatch',
    roleTitle: '',
    name: '',
    email: '',
    phone: '',
    preferredChannel: 'Email',
    notes: '',
    isPrimary: false,
  });
  const [documentDraft, setDocumentDraft] = useState<{
    name: string;
    type: VendorDocumentType;
    storagePath: string;
    storedFileName: string;
    mimeType?: string;
    fileSizeBytes?: number;
  }>({
    name: '',
    type: 'Agreement',
    storagePath: '',
    storedFileName: '',
  });
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');

  useEffect(() => {
    if (!vendor) {
      setEditForm(null);
      setSelectedProductIds([]);
      return;
    }
    setEditForm(buildVendorEditForm(vendor));
    setSelectedProductIds(linkedProductsForVendor(products, vendor.id).map((product) => product.id));
    setIsEditing(false);
    setIsDeleteArmed(false);
    setActiveTab(initialTab);
  }, [initialTab, products, vendor]);

  if (!vendor || !editForm) return null;

  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Contacts', label: 'Contacts / Departments' },
    { id: 'Products', label: 'Products / Capabilities' },
    { id: 'Terms', label: 'Commercial Terms' },
    { id: 'Orders', label: 'Orders / POs / PODs' },
    { id: 'Performance', label: 'Performance' },
    { id: 'History', label: 'History' },
  ] as const;

  const primaryLocation = getPrimaryLocation(vendor);
  const linkedProducts = linkedProductsForVendor(products, vendor.id);
  const displayName = getVendorDisplayName(vendor);
  const registeredNameLabel = getVendorRegisteredNameLabel(vendor);
  const visibleProducts = isEditing ? products : linkedProducts;
  const filteredDocumentHistory = vendor.documentHistory.filter((document) => {
    const query = documentSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      document.key.toLowerCase().includes(query) ||
      document.title.toLowerCase().includes(query) ||
      document.type.toLowerCase().includes(query) ||
      (document.productName ?? '').toLowerCase().includes(query)
    );
  });

  const openSupplierHistoryPdf = (document: BusinessDocumentSummary) => {
    openPdfPreview({
      url: document.pdfUrl,
      title: document.key,
      subtitle: `${document.type} / ${document.status}`,
      fileName: `${document.key}.pdf`,
    });
  };

  const saveEdits = async () => {
    const updatePayload: UpdateSupplierInput = {
      name: editForm.name,
      registeredName: editForm.registeredName || undefined,
      tradingName: editForm.tradingName || undefined,
      type: editForm.type,
      status: editForm.status,
      vendorRoles: editForm.vendorRoles,
      capabilities: editForm.capabilities.split(',').map((value) => value.trim()).filter(Boolean),
      leadTime: editForm.leadTime,
      notes: editForm.notes || null,
      vatRegistered: editForm.vatRegistered,
      vatNumber: editForm.vatRegistered ? editForm.vatNumber || null : null,
      providesProducts: editForm.providesProducts,
      providesTransport: editForm.providesTransport,
      location: {
        label: editForm.locationLabel || 'Primary Origin',
        streetAddress: editForm.streetAddress || undefined,
        postalCode: editForm.postalCode || undefined,
        country: editForm.country,
        region: editForm.region,
        city: editForm.city,
      },
      commercialAccount: {
        paymentTerms: editForm.paymentTerms || undefined,
        deliveryTerms: editForm.deliveryTerms || undefined,
        moq: editForm.moq || undefined,
        currency: 'ZAR',
        incoterms: editForm.incoterms || undefined,
        creditLimitZar: editForm.creditLimitZar ? Number(editForm.creditLimitZar) : undefined,
        currentCreditBalanceZar: editForm.currentCreditBalanceZar ? Number(editForm.currentCreditBalanceZar) : 0,
        minimumOrderValueZar: editForm.minimumOrderValueZar ? Number(editForm.minimumOrderValueZar) : undefined,
        standardDiscountPct: editForm.standardDiscountPct ? Number(editForm.standardDiscountPct) : undefined,
        vatRegistered: editForm.vatRegistered,
        vatNumber: editForm.vatRegistered ? editForm.vatNumber || undefined : undefined,
      },
    };

    await onUpdateVendor(vendor.id, updatePayload);
    await onLinkSupplierProducts(vendor.id, { productIds: selectedProductIds, replace: true });
    setIsEditing(false);
  };

  const addContact = async () => {
    if (!contactDraft.name || !contactDraft.email || !contactDraft.department) return;
    await onAddSupplierContact(vendor.id, contactDraft);
    setContactDraft({
      department: 'Dispatch',
      roleTitle: '',
      name: '',
      email: '',
      phone: '',
      preferredChannel: 'Email',
      notes: '',
      isPrimary: false,
    });
  };

  const addDocument = async () => {
    if (!documentDraft.storagePath || !documentDraft.storedFileName || !documentDraft.name) return;
    await onAddSupplierDocument(vendor.id, {
      name: documentDraft.name,
      type: documentDraft.type,
      storagePath: documentDraft.storagePath,
      storedFileName: documentDraft.storedFileName,
      mimeType: documentDraft.mimeType,
      fileSizeBytes: documentDraft.fileSizeBytes,
    });
    setDocumentDraft({
      name: '',
      type: 'Agreement',
      storagePath: '',
      storedFileName: '',
    });
  };

  const uploadVendorDocumentFile = async (file: File) => {
    const uploaded = await uploadSupplierDocument(file);
    setDocumentDraft((current) => ({
      ...current,
      name: current.name || file.name,
      storagePath: uploaded.storagePath,
      storedFileName: uploaded.storedFileName,
      mimeType: uploaded.mimeType,
      fileSizeBytes: uploaded.size,
    }));
  };

  const uploadLogo = async (file: File) => {
    const uploaded = await uploadInventoryFile(file);
    setEditForm((current) => current ? { ...current } : current);
    await onUpdateVendor(vendor.id, { logoUrl: uploaded.url });
  };

  const handleDeleteVendor = async () => {
    await onDeleteVendor(vendor.id);
    setIsDeleteArmed(false);
    onClose();
  };

  const deleteMode = vendor.documentHistory.length || vendor.orders.length || linkedProducts.length || vendor.portalUsers.length
    ? 'archive'
    : 'delete';
  const supplierPortalEntryPath = getSupplierPortalEntryPath();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[900px] bg-[#050505] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-10 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] p-4 flex items-center justify-center shadow-inner relative">
                      <img src={vendor.logo} alt={vendor.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      {isEditing && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/70 text-white/70 text-[10px] font-bold uppercase tracking-widest cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void uploadLogo(file);
                              }
                              event.currentTarget.value = '';
                            }}
                          />
                          Replace Logo
                        </label>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-4xl font-serif font-bold text-white tracking-tight leading-none">{displayName}</h2>
                        <span className={`text-[9px] uppercase font-bold tracking-[0.25em] px-3 py-1 rounded-full border ${supplierStatusTone(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </div>
                      {registeredNameLabel && (
                        <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-3">
                          Registered: {registeredNameLabel}
                        </div>
                      )}
                      <div className="flex items-center gap-6 flex-wrap">
                        <span className="text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.id}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2 text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">
                          <MapPin size={12} className="text-white/10" /> {primaryLocation ? `${primaryLocation.city}, ${primaryLocation.region}` : vendor.region}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <button
                        onClick={() => void saveEdits()}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-[#00ff88]/10 active:scale-[0.98] disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </button>
                    ) : (
                      <>
                        {isDeleteArmed ? (
                          <>
                            <button
                              onClick={() => setIsDeleteArmed(false)}
                              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void handleDeleteVendor()}
                              disabled={isSaving}
                              className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-red-500/20 active:scale-[0.98] disabled:opacity-60"
                            >
                              {isSaving ? (deleteMode === 'archive' ? 'Archiving...' : 'Deleting...') : (deleteMode === 'archive' ? 'Confirm Archive' : 'Confirm Delete')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsDeleteArmed(true)}
                              className="px-5 py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-300 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-red-500/15 active:scale-[0.98]"
                            >
                              {deleteMode === 'archive' ? 'Archive Vendor' : 'Delete Vendor'}
                            </button>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                            >
                              Edit Profile
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button onClick={onClose} className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-[0.95]">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-10 overflow-x-auto no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors relative whitespace-nowrap ${
                        activeTab === tab.id ? 'text-[#00ff88]' : 'text-white/20 hover:text-white/60'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="vendorTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff88]/60" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-10">
                {activeTab === 'Overview' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Workflow Completion', value: `${workflowCompletion(vendor)}%`, sub: `${vendor.vendorRoles.join(' / ') || 'Unassigned'}` },
                        { label: 'Current Credit Balance', value: formatMoney(vendor.commercialAccount.currentCreditBalanceZar), sub: `Credit Limit ${formatMoney(vendor.commercialAccount.creditLimitZar ?? 0)}` },
                        { label: 'Linked Catalog', value: `${linkedProducts.length}`, sub: `${vendor.contacts.length} routing contacts` },
                      ].map((stat) => (
                        <div key={stat.label} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-5">{stat.label}</div>
                          <div className="text-3xl font-serif font-bold text-white tracking-tight">{stat.value}</div>
                          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-3">{stat.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 flex items-center gap-3">
                          <Building2 size={16} className="text-blue-400/40" /> Vendor Identity
                        </h3>
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Display Name</div>
                              <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Display name" />
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Trading Name</div>
                              <input value={editForm.tradingName} onChange={(event) => setEditForm({ ...editForm, tradingName: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Trading name" />
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Registered Name</div>
                              <input value={editForm.registeredName} onChange={(event) => setEditForm({ ...editForm, registeredName: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Registered name" />
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Vendor Type</div>
                              <select value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value as SupplierSummary['type'] })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                                <option value="Manufacturer">Manufacturer</option>
                                <option value="Distributor">Distributor</option>
                                <option value="Wholesaler">Wholesaler</option>
                                <option value="Transport Partner">Transport Partner</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Status</div>
                              <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as SupplierSummary['status'] })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                                <option value="Active">Active</option>
                                <option value="Onboarding">Onboarding</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Restocking">Restocking</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Lead Time</div>
                              <select value={editForm.leadTime} onChange={(event) => setEditForm({ ...editForm, leadTime: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                                {leadTimeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Internal Notes</div>
                              <textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-24 resize-none" placeholder="Operational notes" />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Trading Name</div>
                              <div className="text-sm text-white font-medium">{vendor.tradingName?.trim() || 'Not captured'}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Registered Name</div>
                              <div className="text-sm text-white font-medium">{vendor.registeredName?.trim() || 'Not captured'}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Lead Time</div>
                              <div className="text-sm text-white font-medium">{vendor.leadTime}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">VAT</div>
                              <div className="text-sm text-white font-medium">
                                {vendor.vatRegistered ? vendor.vatNumber || 'Registered' : 'Not VAT Registered'}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Internal Notes</div>
                              <div className="text-sm text-white/70 font-medium whitespace-pre-wrap">{vendor.notes?.trim() || 'No internal notes captured.'}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 flex items-center gap-3">
                          <MapPin size={16} className="text-blue-400/40" /> Origin & Route Access
                        </h3>
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-4">
                            <input value={editForm.locationLabel} onChange={(event) => setEditForm({ ...editForm, locationLabel: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Location label" />
                            <input value={editForm.streetAddress} onChange={(event) => setEditForm({ ...editForm, streetAddress: event.target.value })} className="col-span-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Street address" />
                            <input value={editForm.city} onChange={(event) => setEditForm({ ...editForm, city: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="City" />
                            <input value={editForm.region} onChange={(event) => setEditForm({ ...editForm, region: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Region" />
                            <input value={editForm.postalCode} onChange={(event) => setEditForm({ ...editForm, postalCode: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Postal code" />
                            <input value={editForm.country} onChange={(event) => setEditForm({ ...editForm, country: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Country" />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div className="text-xl font-serif font-bold text-white">{primaryLocation?.label ?? 'Origin pending'}</div>
                              <div className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
                                {[primaryLocation?.streetAddress, primaryLocation?.city, primaryLocation?.region, primaryLocation?.postalCode, primaryLocation?.country].filter(Boolean).join(', ')}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button onClick={() => copyText([primaryLocation?.streetAddress, primaryLocation?.city, primaryLocation?.region, primaryLocation?.postalCode, primaryLocation?.country].filter(Boolean).join(', '))} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                                <Copy size={12} /> Copy Address
                              </button>
                              {primaryLocation?.mapsUrl && (
                                <a href={primaryLocation.mapsUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                                  <ExternalLink size={12} /> Maps
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 flex items-center gap-3">
                          <ShieldCheck size={16} className="text-[#00ff88]/40" /> Operational Documents
                        </h3>
                        <div className="space-y-3">
                          {vendor.documents.length ? vendor.documents.slice(0, 4).map((document) => (
                            <a key={document.id} href={document.downloadUrl} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all">
                              <div>
                                <div className="text-sm text-white">{document.name}</div>
                                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">{document.type} • {formatDate(document.uploadedAt)}</div>
                              </div>
                              <Download size={16} className="text-white/20" />
                            </a>
                          )) : (
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                              No vendor documents uploaded yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-3">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 flex items-center gap-3">
                            <ShieldCheck size={16} className="text-blue-400/40" /> Supplier Portal Access
                          </h3>
                          <p className="text-sm text-white/55 max-w-2xl">
                            Internal staff can verify which supplier users exist, copy the supplier-facing portal entry path, and open the live access point without leaving this vendor drawer.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button
                            onClick={() => {
                              copyText(supplierPortalEntryPath);
                              toast.success('Supplier portal path copied.');
                            }}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                          >
                            <Copy size={12} /> Copy Path
                          </button>
                          <button
                            onClick={() => window.open('/portal', '_blank', 'noopener,noreferrer')}
                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/15 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-200 hover:text-white hover:bg-blue-500/15 transition-all flex items-center gap-2"
                          >
                            <ExternalLink size={12} /> Open Portal
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                        <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Supplier Entry Path</div>
                        <div className="text-sm text-white font-medium break-all">{supplierPortalEntryPath}</div>
                      </div>

                      {vendor.portalUsers.length ? (
                        <div className="grid grid-cols-2 gap-4">
                          {vendor.portalUsers.map((portalUser) => (
                            <div key={portalUser.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-medium text-white">{portalUser.fullName}</div>
                                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">{portalUser.roleLabel}</div>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] border ${
                                    portalUser.isActive
                                      ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                                      : 'bg-white/5 text-white/40 border-white/10'
                                  }`}
                                >
                                  {portalUser.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Portal Email</div>
                                  <div className="text-sm text-white/75 break-all">{portalUser.email}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Last Login</div>
                                  <div className="text-sm text-white/75">{formatDate(portalUser.lastLoginAt)}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button
                                  onClick={() => {
                                    copyText(portalUser.email);
                                    toast.success(`${portalUser.fullName}'s portal email copied.`);
                                  }}
                                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                  <Mail size={12} /> Copy Email
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-2">No Portal Users Assigned</div>
                          <div className="text-sm text-white/50">
                            This supplier has not been issued a portal login yet. Create or assign a supplier portal user in onboarding before expecting external order and document visibility.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Contacts' && (
                  <div className="space-y-6">
                    {vendor.contacts.map((contact) => (
                      <div key={contact.id} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-start justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-start gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 font-bold text-xl shrink-0">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-4 mb-2">
                              <div className="text-[10px] font-mono text-[#00ff88]/60 uppercase tracking-[0.25em]">{contact.department}</div>
                              {contact.preferredChannel && (
                                <span className="px-2 py-0.5 bg-white/[0.05] rounded text-[9px] text-white/20 uppercase tracking-widest font-bold border border-white/5">
                                  {contact.preferredChannel} Preferred
                                </span>
                              )}
                            </div>
                            <div className="text-xl font-serif font-bold text-white mb-3 tracking-tight">{contact.name}</div>
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6">
                              <div className="flex items-center gap-2.5 text-[11px] text-white/40 font-mono">
                                <Mail size={14} className="text-white/10" /> {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2.5 text-[11px] text-white/40 font-mono">
                                  <Phone size={14} className="text-white/10" /> {contact.phone}
                                </div>
                              )}
                            </div>
                            {(contact.roleTitle || contact.notes) && (
                              <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                                {contact.roleTitle && <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">{contact.roleTitle}</p>}
                                {contact.notes && <p className="text-[11px] text-white/30 italic leading-relaxed font-serif">{contact.notes}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <a href={`mailto:${contact.email}`} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all border border-white/5">
                            <Mail size={18} />
                          </a>
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all border border-white/5">
                              <Phone size={18} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="p-6 border border-dashed border-white/10 rounded-2xl space-y-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Add Department Contact</div>
                      <div className="grid grid-cols-2 gap-4">
                        <input value={contactDraft.department} onChange={(event) => setContactDraft({ ...contactDraft, department: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Department" />
                        <input value={contactDraft.roleTitle} onChange={(event) => setContactDraft({ ...contactDraft, roleTitle: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Role title" />
                        <input value={contactDraft.name} onChange={(event) => setContactDraft({ ...contactDraft, name: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Full name" />
                        <input value={contactDraft.email} onChange={(event) => setContactDraft({ ...contactDraft, email: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Email" />
                        <input value={contactDraft.phone} onChange={(event) => setContactDraft({ ...contactDraft, phone: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Phone" />
                        <select value={contactDraft.preferredChannel} onChange={(event) => setContactDraft({ ...contactDraft, preferredChannel: event.target.value as CreateSupplierContactInput['preferredChannel'] })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                          <option value="Email">Email</option>
                          <option value="Phone">Phone</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Portal">Portal</option>
                        </select>
                        <textarea value={contactDraft.notes} onChange={(event) => setContactDraft({ ...contactDraft, notes: event.target.value })} className="col-span-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-24 resize-none" placeholder="Routing notes" />
                      </div>
                      <button onClick={() => void addContact()} className="px-5 py-3 bg-[#00ff88]/10 text-[#00ff88] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff88] hover:text-black transition-all">
                        Add Contact
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'Products' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Linked Catalog</h3>
                        <div className="text-2xl font-mono text-white">{linkedProducts.length} Active SKUs</div>
                      </div>
                      {isEditing && (
                        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                          Select additional products to link to this vendor
                        </div>
                      )}
                    </div>

                    {visibleProducts.length === 0 && !isEditing ? (
                      <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                        No catalog products are linked to this vendor yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {visibleProducts.map((product) => {
                          const isLinked = selectedProductIds.includes(product.id);
                          return (
                            <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              if (!isEditing) return;
                              setSelectedProductIds((current) => isLinked ? current.filter((id) => id !== product.id) : [...current, product.id]);
                            }}
                            className={`p-4 bg-[#0a0a0a] border rounded-2xl flex gap-4 group transition-all text-left ${isLinked ? 'border-[#00ff88]/20 bg-[#00ff88]/5' : 'border-white/5 hover:border-white/20'} ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                              <img src={product.primaryImageUrl} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{product.publicSku}</div>
                              <div className="text-sm font-medium text-white truncate mb-2">{product.name}</div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/40 font-mono">{product.category} / {product.productType}</span>
                                {isLinked && <Check size={14} className="text-[#00ff88]" />}
                              </div>
                            </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Production Capabilities</h3>
                      {isEditing ? (
                        <textarea value={editForm.capabilities} onChange={(event) => setEditForm({ ...editForm, capabilities: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-sm text-white h-24 resize-none" placeholder="Comma-separated capabilities" />
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {getCapabilityPreview(vendor).map((capability) => (
                            <span key={capability} className="px-4 py-2 bg-white/[0.03] rounded-xl border border-white/5 text-[11px] text-white/60 font-medium">
                              {capability}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Terms' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Financial Terms</h3>
                        {isEditing ? (
                          <div className="space-y-4">
                            <input value={editForm.paymentTerms} onChange={(event) => setEditForm({ ...editForm, paymentTerms: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Payment terms" />
                            <input value={editForm.creditLimitZar} onChange={(event) => setEditForm({ ...editForm, creditLimitZar: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Credit limit (ZAR)" />
                            <input value={editForm.currentCreditBalanceZar} onChange={(event) => setEditForm({ ...editForm, currentCreditBalanceZar: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Current credit balance (ZAR)" />
                            <label className="flex items-center gap-3 text-xs text-white/60">
                              <input type="checkbox" checked={editForm.vatRegistered} onChange={(event) => setEditForm({ ...editForm, vatRegistered: event.target.checked })} />
                              VAT Registered
                            </label>
                            <input value={editForm.vatNumber} onChange={(event) => setEditForm({ ...editForm, vatNumber: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="VAT number" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Payment Method</div>
                              <div className="text-sm text-white font-medium">{vendor.commercialAccount.paymentTerms ?? vendor.terms.payment}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Trading Currency</div>
                              <div className="text-sm text-white font-mono">{vendor.commercialAccount.currency}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Credit Limit</div>
                              <div className="text-sm text-white font-mono">{formatMoney(vendor.commercialAccount.creditLimitZar ?? 0)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Current AP Balance</div>
                              <div className="text-sm text-white font-mono">{formatMoney(vendor.commercialAccount.currentCreditBalanceZar)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Logistics Terms</h3>
                        {isEditing ? (
                          <div className="space-y-4">
                            <input value={editForm.incoterms} onChange={(event) => setEditForm({ ...editForm, incoterms: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Incoterms" />
                            <input value={editForm.deliveryTerms} onChange={(event) => setEditForm({ ...editForm, deliveryTerms: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Delivery terms" />
                            <input value={editForm.moq} onChange={(event) => setEditForm({ ...editForm, moq: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Minimum order quantity" />
                            <input value={editForm.minimumOrderValueZar} onChange={(event) => setEditForm({ ...editForm, minimumOrderValueZar: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Minimum order value (ZAR)" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Primary Incoterms</div>
                              <div className="text-sm text-white font-mono">{vendor.commercialAccount.incoterms ?? vendor.terms.incoterms}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Delivery Location</div>
                              <div className="text-sm text-white font-medium">{vendor.commercialAccount.deliveryTerms ?? vendor.terms.delivery}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Minimum Order Quantity</div>
                              <div className="text-sm text-white font-medium">{vendor.commercialAccount.moq ?? vendor.terms.moq}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Standard VAT</div>
                              <div className="text-sm text-white font-medium">{vendor.commercialAccount.standardVatRatePct}%</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Orders' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Recent Transactions</h3>
                      <div className="flex items-center gap-3">
                        <input
                          value={documentSearch}
                          onChange={(event) => setDocumentSearch(event.target.value)}
                          className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#00ff88]/30"
                          placeholder="Search documents"
                        />
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{filteredDocumentHistory.length} tracked documents</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {filteredDocumentHistory.map((document) => (
                        <div key={document.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${document.type === 'Purchase Order' || document.type === 'Supplier Invoice' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {document.type === 'Purchase Order' || document.type === 'Supplier Invoice' ? <FileCheck size={18} /> : <Truck size={18} />}
                            </div>
                            <div>
                              <div className="text-sm font-mono text-white">{document.key}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{document.type} • {new Date(document.issuedAt).toLocaleDateString('en-ZA')}</div>
                              {document.productName ? (
                                <div className="mt-2 text-[10px] text-white/20 uppercase tracking-widest">{document.productName}</div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <div className="text-sm font-mono text-white">{formatMoney(document.totalAmount)}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{document.status}</div>
                            </div>
                            <button
                              onClick={() => openSupplierHistoryPdf(document)}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                            >
                              <Download size={14} />
                              PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Private Documents</h3>
                        <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2">
                          <Upload size={12} /> Upload File
                          <input
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void uploadVendorDocumentFile(file);
                              }
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-[1.4fr_1fr_auto] gap-4">
                        <input value={documentDraft.name} onChange={(event) => setDocumentDraft({ ...documentDraft, name: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Document name" />
                        <select value={documentDraft.type} onChange={(event) => setDocumentDraft({ ...documentDraft, type: event.target.value as VendorDocumentType })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                          {vendorDocumentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <button onClick={() => void addDocument()} className="px-5 py-3 bg-[#00ff88]/10 text-[#00ff88] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff88] hover:text-black transition-all">
                          Add
                        </button>
                      </div>
                      {documentDraft.storedFileName && (
                        <div className="text-[10px] font-mono text-[#00ff88]/70 uppercase tracking-widest">
                          Uploaded file staged and ready to attach
                        </div>
                      )}
                      <div className="space-y-3">
                        {vendor.documents.map((document) => (
                          <a key={document.id} href={document.downloadUrl} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all">
                            <div>
                              <div className="text-sm text-white">{document.name}</div>
                              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">{document.type}</div>
                            </div>
                            <Download size={16} className="text-white/20" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Performance' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Delivery Performance</h3>
                        <div className="flex items-end gap-2 h-32">
                          {[vendor.performance.onTimeDelivery - 8, vendor.performance.onTimeDelivery - 4, vendor.performance.onTimeDelivery].map((value, index) => (
                            <div key={`perf-bar-${index}`} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full bg-white/5 rounded-t-sm relative group h-28">
                                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(12, value)}%` }} className="absolute bottom-0 w-full bg-[#00ff88]/40 group-hover:bg-[#00ff88] transition-colors rounded-t-sm" />
                              </div>
                              <span className="text-[8px] font-mono text-white/20">Q{index + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Quality Score</h3>
                        <div className="flex items-center justify-center h-32">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path className="text-white/5" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <motion.path initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${vendor.performance.qualityScore}, 100` }} className="text-[#00ff88]" strokeWidth="3" stroke="currentColor" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-mono text-white">{vendor.performance.qualityScore}</span>
                              <span className="text-[8px] text-white/30 uppercase tracking-widest">Score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Return Rate', value: `${vendor.performance.returnRate}%` },
                        { label: 'Price Index', value: `${vendor.performance.priceCompetitiveness}/100` },
                        { label: 'On-Time Delivery', value: `${vendor.performance.onTimeDelivery}%` },
                      ].map((metric) => (
                        <div key={metric.label} className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">{metric.label}</div>
                          <div className="text-xl font-mono text-white">{metric.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'History' && (
                  <div className="space-y-8">
                    <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Document Trail</h3>
                          <p className="mt-2 text-xs text-white/35">Open any procurement or commercial document linked to this supplier.</p>
                        </div>
                        <input
                          value={documentSearch}
                          onChange={(event) => setDocumentSearch(event.target.value)}
                          className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#00ff88]/30"
                          placeholder="Search history"
                        />
                      </div>
                      <div className="mt-5 space-y-3">
                        {filteredDocumentHistory.map((document) => (
                          <div key={document.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm text-white">{document.title}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30">{document.type} • {document.status}</div>
                            </div>
                            <button onClick={() => openSupplierHistoryPdf(document)} className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">
                              Open PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                      {vendor.history.map((item) => (
                        <div key={`${item.date}-${item.action}`} className="relative">
                          <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-mono text-white/30">{item.date}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest">{item.user}</span>
                            </div>
                            <div className="text-sm font-medium text-white mb-1">{item.action}</div>
                            {item.details && <div className="text-xs text-white/40 leading-relaxed">{item.details}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
              <button className="flex-1 py-4 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#00cc6e] transition-all shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                Export Statement
              </button>
              <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                Add Internal Note
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SupplierOnboardingWizard({
  isOpen,
  isSaving,
  products,
  onClose,
  onCreateVendor,
  onCreatedVendor,
}: {
  isOpen: boolean;
  isSaving: boolean;
  products: InventoryProductDetail[];
  onClose: () => void;
  onCreateVendor: (input: CreateSupplierInput) => Promise<SupplierSummary>;
  onCreatedVendor: (vendor: SupplierSummary) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => buildOnboardingDefaults(products));
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadedLogoName, setUploadedLogoName] = useState('');
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setStep(1);
      setForm(buildOnboardingDefaults(products));
      setIsUploadingLogo(false);
      setUploadedLogoName('');
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, products]);

  if (!isOpen) return null;

  const totalSteps = 6;
  const steps = [
    { id: 1, title: 'Basics' },
    { id: 2, title: 'Legal / Tax / Addresses' },
    { id: 3, title: 'Departments & Contacts' },
    { id: 4, title: 'Capabilities & Products' },
    { id: 5, title: 'Commercial Terms' },
    { id: 6, title: 'Review & Activate' },
  ];

  const toggleRole = (role: 'Product Supplier' | 'Transport Partner') => {
    setForm((current) => {
      const exists = current.vendorRoles.includes(role);
      return {
        ...current,
        vendorRoles: exists ? current.vendorRoles.filter((value) => value !== role) : [...current.vendorRoles, role],
        providesProducts: role === 'Product Supplier' ? !exists || current.providesProducts : current.providesProducts,
        providesTransport: role === 'Transport Partner' ? !exists || current.providesTransport : current.providesTransport,
      };
    });
  };

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadInventoryFile(file);
      setForm((current) => ({ ...current, logoUrl: uploaded.url }));
      setUploadedLogoName(file.name);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const uploadDocumentFile = async (file: File, type: VendorDocumentType) => {
    const uploaded = await uploadSupplierDocument(file);
    setForm((current) => ({
      ...current,
      documents: [
        ...current.documents,
        {
          name: file.name,
          type,
          storagePath: uploaded.storagePath,
          storedFileName: uploaded.storedFileName,
          mimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.size,
          uploadedBy: 'Supplier Onboarding',
        },
      ],
    }));
  };

  const activateVendor = async () => {
    const supplierName = form.tradingName.trim() || form.registeredName.trim() || form.name.trim();
    const createdVendor = await onCreateVendor({
      name: supplierName,
      registeredName: form.registeredName || undefined,
      tradingName: form.tradingName || undefined,
      logoUrl: form.logoUrl || undefined,
      type: form.type,
      status: 'Onboarding',
      vendorRoles: form.vendorRoles,
      capabilities: form.capabilities.split(',').map((value) => value.trim()).filter(Boolean),
      region: form.regionLabel || form.region,
      leadTime: form.leadTime,
      currency: 'ZAR',
      vatRegistered: form.vatRegistered,
      vatNumber: form.vatRegistered ? form.vatNumber || undefined : undefined,
      providesProducts: form.providesProducts,
      providesTransport: form.providesTransport,
      notes: form.notes || undefined,
      location: {
        label: form.locationLabel,
        streetAddress: form.streetAddress || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country,
        region: form.regionLabel,
        city: form.city,
      },
      contacts: form.contacts.filter((contact) => contact.name && contact.email),
      documents: form.documents,
      commercialAccount: {
        paymentTerms: form.paymentTerms || undefined,
        deliveryTerms: form.deliveryTerms || undefined,
        moq: form.moq || undefined,
        currency: 'ZAR',
        incoterms: form.incoterms || undefined,
        creditLimitZar: form.creditLimitZar ? Number(form.creditLimitZar) : undefined,
        currentCreditBalanceZar: form.currentCreditBalanceZar ? Number(form.currentCreditBalanceZar) : 0,
        minimumOrderValueZar: form.minimumOrderValueZar ? Number(form.minimumOrderValueZar) : undefined,
        standardDiscountPct: form.standardDiscountPct ? Number(form.standardDiscountPct) : undefined,
        vatRegistered: form.vatRegistered,
        vatNumber: form.vatRegistered ? form.vatNumber || undefined : undefined,
      },
      linkedProductIds: form.linkedProductIds,
      portalUser: form.portalUserEmail && form.portalUserPassword
        ? {
            email: form.portalUserEmail,
            password: form.portalUserPassword,
            fullName: form.portalUserFullName || form.name,
            roleLabel: 'Vendor Admin',
          }
        : undefined,
    });
    onCreatedVendor(createdVendor);
    onClose();
    setStep(1);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8"
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">Supplier Onboarding</h2>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
                System Node: Procurement / Sourcing / Onboarding
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="px-10 py-6 bg-white/[0.01] border-b border-white/5 flex justify-between items-center">
            {steps.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[11px] font-bold transition-all duration-500 ${step === item.id ? 'bg-[#00ff88] text-black scale-110 shadow-lg shadow-[#00ff88]/20' : step > item.id ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-white/[0.03] text-white/10'}`}>
                  {step > item.id ? <Check size={14} /> : item.id}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${step === item.id ? 'text-white' : 'text-white/10'} hidden md:block`}>
                  {item.title}
                </span>
                {index < steps.length - 1 && <div className="w-10 h-[1px] bg-white/5 mx-3 hidden lg:block" />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
              {step === 1 && (
                <div className="space-y-10 max-w-3xl mx-auto">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight uppercase">Basics</h3>
                    <p className="text-sm text-white/30 italic font-serif">Identify the core identity and classification of the supplier.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Company Registered Name</label>
                        <input value={form.registeredName} onChange={(event) => setForm({ ...form, registeredName: event.target.value, name: form.name || event.target.value })} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Brick Tile Supplier (Pty) Ltd" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Trading Name</label>
                        <input value={form.tradingName} onChange={(event) => setForm({ ...form, tradingName: event.target.value, name: event.target.value || form.registeredName })} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Brick Tile Shop Supplier" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Supplier Type</label>
                        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as SupplierSummary['type'] })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white">
                          <option value="Manufacturer">Manufacturer</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Wholesaler">Wholesaler</option>
                          <option value="Transport Partner">Transport Partner</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Standard Lead Time</label>
                        <select value={form.leadTime} onChange={(event) => setForm({ ...form, leadTime: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white">
                          {leadTimeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Vendor Roles</label>
                      <div className="grid grid-cols-2 gap-4">
                        {(['Product Supplier', 'Transport Partner'] as const).map((role) => (
                          <button key={role} type="button" onClick={() => toggleRole(role)} className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${form.vendorRoles.includes(role) ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/20'}`}>
                            <span className="text-xs font-bold uppercase tracking-[0.18em]">{role}</span>
                            {form.vendorRoles.includes(role) && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Logo</label>
                      <label className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white cursor-pointer">
                        <span className="truncate">
                          {isUploadingLogo ? 'Uploading logo...' : form.logoUrl ? uploadedLogoName || 'Logo uploaded and stored' : 'Upload vendor logo'}
                        </span>
                        <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40"><Upload size={12} /> Select File</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadLogo(file);
                          event.currentTarget.value = '';
                        }} />
                      </label>
                      {form.logoUrl && (
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                            <img src={form.logoUrl} alt={uploadedLogoName || 'Uploaded vendor logo'} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-white font-medium truncate">{uploadedLogoName || 'Stored vendor logo'}</div>
                            <div className="text-[10px] font-mono text-[#00ff88]/70 uppercase tracking-widest mt-1">
                              Stored in BTS upload library and reusable across vendor views
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Capabilities</label>
                      <textarea value={form.capabilities} onChange={(event) => setForm({ ...form, capabilities: event.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none" placeholder="Clay bricks, cladding tiles, courier dispatch, crane offload..." />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Legal / Tax / Addresses</h3>
                    <p className="text-sm text-white/40 italic font-serif">Official registration, VAT, physical origin, and uploaded docs.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">VAT Registration</label>
                        <label className="flex items-center gap-3 text-sm text-white/60 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4">
                          <input type="checkbox" checked={form.vatRegistered} onChange={(event) => setForm({ ...form, vatRegistered: event.target.checked })} />
                          VAT Registered
                        </label>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">VAT Number</label>
                        <input value={form.vatNumber} onChange={(event) => setForm({ ...form, vatNumber: event.target.value })} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="VAT Number" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Street Address</label>
                      <input value={form.streetAddress} onChange={(event) => setForm({ ...form, streetAddress: event.target.value })} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Street address" />
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">City</label>
                          <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} type="text" className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="City" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Region / Province</label>
                          <input value={form.regionLabel} onChange={(event) => setForm({ ...form, regionLabel: event.target.value })} type="text" className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Region" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Postal Code</label>
                          <input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} type="text" className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Postal code" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Country</label>
                          <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} type="text" className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Country" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Origin Location Label</label>
                          <input value={form.locationLabel} onChange={(event) => setForm({ ...form, locationLabel: event.target.value })} type="text" className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Location label" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Upload Supplier Documents</div>
                      <div className="flex flex-wrap gap-3">
                        {(['Agreement', 'Test Result', 'Plan', 'Certification'] as VendorDocumentType[]).map((type) => (
                          <label key={type} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2">
                            <Upload size={12} /> {type}
                            <input type="file" className="hidden" onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void uploadDocumentFile(file, type);
                              event.currentTarget.value = '';
                            }} />
                          </label>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {form.documents.map((document) => (
                          <div key={`${document.storedFileName}-${document.type}`} className="flex items-center justify-between px-4 py-3 bg-black/30 rounded-xl border border-white/5">
                            <div>
                              <div className="text-sm text-white">{document.name}</div>
                              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{document.type}</div>
                            </div>
                            <CheckCircle2 size={16} className="text-[#00ff88]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Departments & Contacts</h3>
                    <p className="text-sm text-white/40 italic font-serif">Define operational routing for automated workflows.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {form.contacts.map((contact, index) => (
                      <div key={`${contact.department}-${index}`} className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{contact.department}</h4>
                            <p className="text-[11px] text-white/30 mt-1">{contact.notes}</p>
                          </div>
                          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
                            <input type="checkbox" checked={contact.isPrimary} onChange={(event) => setForm((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, isPrimary: event.target.checked } : item) }))} />
                            Primary
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <input value={contact.name} onChange={(event) => setForm((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white" placeholder="Full name" />
                          <input value={contact.email} onChange={(event) => setForm((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, email: event.target.value } : item) }))} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white" placeholder="email@supplier.com" />
                          <input value={contact.phone} onChange={(event) => setForm((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, phone: event.target.value } : item) }))} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white" placeholder="+27 ..." />
                          <select value={contact.preferredChannel} onChange={(event) => setForm((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, preferredChannel: event.target.value as CreateSupplierContactInput['preferredChannel'] } : item) }))} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white">
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Portal">Portal</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Capabilities & Products</h3>
                    <p className="text-sm text-white/40 italic font-serif">What the vendor provides and which catalogue products rely on them.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/60"><input type="checkbox" checked={form.providesProducts} onChange={(event) => setForm({ ...form, providesProducts: event.target.checked })} /> Provides Products</label>
                      <label className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/60"><input type="checkbox" checked={form.providesTransport} onChange={(event) => setForm({ ...form, providesTransport: event.target.checked })} /> Provides Transport</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {products.map((product) => {
                        const selected = form.linkedProductIds.includes(product.id);
                        return (
                          <button key={product.id} type="button" onClick={() => setForm((current) => ({ ...current, linkedProductIds: selected ? current.linkedProductIds.filter((id) => id !== product.id) : [...current.linkedProductIds, product.id] }))} className={`p-4 bg-[#0a0a0a] border rounded-2xl flex gap-4 text-left transition-all ${selected ? 'border-[#00ff88]/20 bg-[#00ff88]/5' : 'border-white/5 hover:border-white/20'}`}>
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                              <img src={product.primaryImageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{product.publicSku}</div>
                              <div className="text-sm font-medium text-white truncate mb-2">{product.name}</div>
                              <div className="text-[10px] text-white/40 font-mono">{product.category} / {product.productType}</div>
                            </div>
                            {selected && <CheckCircle2 size={16} className="text-[#00ff88] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-10 max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Commercial Terms</h3>
                    <p className="text-sm text-white/40 italic font-serif">ZAR defaults, South African VAT, credit, and supplier portal access.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Payment Terms</label>
                        <select value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white w-full">
                          {paymentTermOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Delivery Terms</label>
                        <input value={form.deliveryTerms} onChange={(event) => setForm({ ...form, deliveryTerms: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Delivery terms" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Minimum Order Quantity</label>
                        <input value={form.moq} onChange={(event) => setForm({ ...form, moq: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="MOQ" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Incoterms</label>
                        <input value={form.incoterms} onChange={(event) => setForm({ ...form, incoterms: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Incoterms" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Credit Limit (ZAR)</label>
                        <input value={form.creditLimitZar} onChange={(event) => setForm({ ...form, creditLimitZar: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Credit limit (ZAR)" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Current AP Balance (ZAR)</label>
                        <input value={form.currentCreditBalanceZar} onChange={(event) => setForm({ ...form, currentCreditBalanceZar: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="Current AP balance (ZAR)" />
                      </div>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Supplier Portal Access</div>
                      <div className="grid grid-cols-3 gap-4">
                        <input value={form.portalUserFullName} onChange={(event) => setForm({ ...form, portalUserFullName: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Portal user full name" />
                        <input value={form.portalUserEmail} onChange={(event) => setForm({ ...form, portalUserEmail: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="portal@supplier.com" />
                        <input value={form.portalUserPassword} onChange={(event) => setForm({ ...form, portalUserPassword: event.target.value })} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" placeholder="Temporary password" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-10 max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Review & Activate</h3>
                    <p className="text-sm text-white/40 italic font-serif">Final verification before operational handoff.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="p-8 bg-[#00ff88]/[0.03] border border-[#00ff88]/10 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5">
                        <ShieldCheck size={120} className="text-[#00ff88]" />
                      </div>
                      <h4 className="text-[10px] font-bold text-[#00ff88] uppercase tracking-[0.3em] mb-6 relative z-10">Workflow Readiness Summary</h4>
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        {[
                          { label: 'Supplier Identity', status: form.name ? 'Ready' : 'Pending' },
                          { label: 'Tax & Address', status: form.streetAddress && form.city ? 'Ready' : 'Pending' },
                          { label: 'Routing Contacts', status: form.contacts.some((contact) => contact.name && contact.email) ? 'Ready' : 'Pending' },
                          { label: 'Linked Products', status: form.linkedProductIds.length ? 'Ready' : 'Pending' },
                          { label: 'Commercial Terms', status: form.paymentTerms ? 'Ready' : 'Pending' },
                          { label: 'Documents Uploaded', status: form.documents.length ? 'Ready' : 'Pending' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-[10px] text-white/40 uppercase tracking-tight font-medium">{item.label}</span>
                            <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${item.status === 'Ready' ? 'text-[#00ff88]' : 'text-amber-400/80'}`}>
                              {item.status === 'Ready' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {item.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="text-sm font-serif font-bold text-white">{form.tradingName || form.registeredName || 'New Vendor'}</div>
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                        {form.vendorRoles.join(' / ')} • {form.country} • {form.paymentTerms || 'Terms pending'}
                      </div>
                      <div className="text-xs text-white/40 leading-relaxed">
                        {form.notes || 'No internal onboarding notes captured yet.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center">
            <button onClick={() => step > 1 ? setStep((current) => current - 1) : onClose()} className="px-6 py-3 bg-white/5 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors">
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <div className="flex gap-4">
              {step < totalSteps ? (
                <button onClick={() => setStep((current) => current + 1)} className="px-8 py-3 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#00cc6a] transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                  Continue
                </button>
              ) : (
                <button onClick={() => void activateVendor()} disabled={isSaving} className="px-8 py-3 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#00cc6a] transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-60">
                  {isSaving ? 'Activating...' : 'Activate Supplier'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function SupplierVendorModule({
  activeSubModule,
  onSubModuleChange,
  vendors,
  products,
  isSaving,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddSupplierContact,
  onAddSupplierDocument,
  onLinkSupplierProducts,
  focusedVendorId,
  focusedVendorTab = 'Overview',
}: SupplierVendorModuleProps) {
  const [selectedVendor, setSelectedVendor] = useState<SupplierSummary | null>(null);
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);
  const [isVendorOnboardingOpen, setIsVendorOnboardingOpen] = useState(false);
  const [selectedVendorTab, setSelectedVendorTab] = useState<SupplierDetailTab>('Overview');

  useEffect(() => {
    if (!selectedVendor) return;
    const refreshed = vendors.find((vendor) => vendor.id === selectedVendor.id) ?? null;
    if (refreshed) {
      setSelectedVendor(refreshed);
    }
  }, [selectedVendor, vendors]);

  useEffect(() => {
    if (!focusedVendorId) {
      return;
    }

    const focusedVendor = vendors.find((vendor) => vendor.id === focusedVendorId) ?? null;
    if (!focusedVendor) {
      return;
    }

    setSelectedVendor(focusedVendor);
    setSelectedVendorTab(focusedVendorTab);
    setIsVendorDetailOpen(true);
  }, [focusedVendorId, focusedVendorTab, vendors]);

  const openVendorProfile = (vendor: SupplierSummary, tab: SupplierDetailTab = 'Overview') => {
    setSelectedVendor(vendor);
    setSelectedVendorTab(tab);
    setIsVendorDetailOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Overview', label: 'Overview', icon: LayoutDashboardFallback },
          { id: 'Directory', label: 'Directory', icon: Building2 },
          { id: 'Insights', label: 'Insights', icon: TrendingUp },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSubModuleChange(item.id as VendorSubModule)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubModule === item.id ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 border border-transparent'}`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase tracking-tight">Vendor Portal</h2>
          <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-1">Supply Chain OS</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'Overview', label: 'Overview', icon: LayoutDashboardFallback },
            { id: 'Directory', label: 'Directory', icon: Building2 },
            { id: 'Insights', label: 'Insights', icon: TrendingUp },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSubModuleChange(item.id as VendorSubModule)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSubModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} className={activeSubModule === item.id ? 'text-[#00ff88]' : ''} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeSubModule === 'Overview' && (
              <SupplierOverviewPanel
                vendors={vendors}
                products={products}
                onAddVendor={() => setIsVendorOnboardingOpen(true)}
                onVendorClick={openVendorProfile}
              />
            )}
            {activeSubModule === 'Directory' && (
              <SupplierDirectoryPanel
                vendors={vendors}
                products={products}
                onVendorClick={(vendor) => {
                  openVendorProfile(vendor, 'Overview');
                }}
                onAddVendor={() => setIsVendorOnboardingOpen(true)}
              />
            )}
            {activeSubModule === 'Insights' && (
              <SupplierInsightsPanel
                vendors={vendors}
                products={products}
                onVendorClick={openVendorProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {isVendorDetailOpen && (
            <SupplierDetailDrawer
              vendor={selectedVendor}
              products={products}
              isOpen={isVendorDetailOpen}
              isSaving={isSaving}
              onClose={() => setIsVendorDetailOpen(false)}
              onUpdateVendor={onUpdateVendor}
              onDeleteVendor={onDeleteVendor}
              onAddSupplierContact={onAddSupplierContact}
              onAddSupplierDocument={onAddSupplierDocument}
              onLinkSupplierProducts={onLinkSupplierProducts}
              initialTab={selectedVendorTab}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isVendorOnboardingOpen && (
            <SupplierOnboardingWizard
              isOpen={isVendorOnboardingOpen}
              isSaving={isSaving}
              products={products}
              onClose={() => setIsVendorOnboardingOpen(false)}
              onCreateVendor={onCreateVendor}
              onCreatedVendor={(vendor) => {
                onSubModuleChange('Directory');
                openVendorProfile(vendor, 'Overview');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LayoutDashboardFallback({ size = 18 }: { size?: number }) {
  return <div className="flex items-center justify-center"><Zap size={size} /></div>;
}
