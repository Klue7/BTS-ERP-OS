import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
 ReactFlow, 
 addEdge, 
 Background, 
 Controls, 
 Connection, 
 Edge, 
 Node, 
 Panel, 
 useNodesState, 
 useEdgesState, 
 Handle, 
 Position,
 NodeProps,
 MarkerType,
 useReactFlow,
 ReactFlowProvider,
 BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  ShoppingBag, 
  FileText, 
  BookOpen,
  AlertCircle, 
  ArrowLeft,
  Share2,
  Phone,
  Globe,
  Mail,
  MessageSquare,
  CreditCard,
  DollarSign,
  Truck,
  CheckCircle2,
  Megaphone,
  Database,
  Terminal,
  Save,
  Trash2,
  Plus,
  Zap,
  LayoutDashboard,
  Box,
  Package,
  ShieldAlert,
  Briefcase,
  TrendingUp,
  Maximize2,
  X,
  Image,
  Wand2,
  Calendar,
  ListOrdered,
  Link,
  Eye,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Filter,
  Search,
  Download,
  MoreVertical,
  Layers,
  Palette,
  Type as TypeIcon,
  MousePointer2,
  Activity,
  Edit,
  Quote,
  Monitor,
  RefreshCw,
  Video,
  Lock,
  Share,
  Building2,
  ShieldCheck,
  Star,
  MapPin,
  AlertTriangle,
  FileCheck,
  History,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MoreHorizontal,
	  Inbox,
	  Bell,
	  User,
	  UserCheck,
	  Facebook,
  Music,
  Paperclip,
  Smile,
  Send,
  ListTodo,
  GitMerge,
  ClipboardList,
  Tag,
  Heart,
  MessageCircle,
  Bookmark,
  MousePointerClick,
  Instagram,
  Linkedin,
  Pin,
  PinOff,
  type LucideIcon
} from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { CRMProjectsTenders } from './CRMProjectsTenders';
import { MarketingCommunityFeed } from './MarketingCommunityFeed';
import { MarketingContentStudio } from './MarketingContentStudio';
import { SupplierVendorModule } from './SupplierVendorModule';
import type { SupplierDetailTab } from './SupplierVendorModule';
import { FinanceModule } from './FinanceModule';
import { usePdfPreview } from './PdfPreviewContext';
import {
  completeCustomerOrderWorkflow,
  createCustomerQuoteDocument,
  fetchInventoryCustomerDocuments,
  markCustomerQuotePaid,
  uploadInventoryFile,
} from '../inventory/api';
import { useInventoryPortalData } from '../inventory/useInventoryPortalData';
import { useMarketingStudioData } from '../marketing/useMarketingStudioData';
import { useCommsData } from '../comms/useCommsData';
import { useFinanceData } from '../finance/useFinanceData';
import { useWorkflowMapData } from '../workflows/useWorkflowMapData';
import { createMarketingAssetFromUpload } from '../marketing/assetUpload';
import type { CommsAttachmentSummary, CommsConversationSummary, CommsCustomerSummary, CommsProvider, CommsStudioSnapshot, CreateCommsCustomerInput } from '../comms/contracts';
import type { WorkflowEventSummary, WorkflowInstanceSummary } from '../workflows/contracts';
import {
  createDefaultBlueprintConfig,
  marketingTemplateDestinationOptions,
  summarizeBlueprintConfig,
} from '../marketing/contracts';
import type {
	MarketingAnalyticsSnapshot,
	MarketingAnalyticsSourceModule,
	MarketingBlueprintConfig,
	MarketingCalendarEntry,
	MarketingCalendarEntryType,
	MarketingChannel,
	MarketingCommunityChannelStats,
	MarketingCommunityPostSummary,
	CreateMarketingContentPostInput,
	CreateMarketingCalendarEntryInput,
	MarketingTemplateDestination,
	MarketingTemplateStatus,
	MarketingTemplateType,
} from '../marketing/contracts';
import {
  coverageOrientationOptions,
  inventoryCategoryOptions,
  inventoryFinishOptions,
  inventoryProductTestResultTypeOptions,
  inventoryProductTypeOptionsByCategory,
  pricingUnitOptions,
} from '../inventory/contracts';
import type { FinanceRecord } from '../finance/contracts';
import { buildStudioCreativePath, creativeModeToStudioRouteMode } from '../creative/routes';
import type {
  BusinessDocumentSummary,
  CoverageOrientation,
  CustomerDocumentHistory,
  CreateInventoryProductInput,
  CreatePriceListImportInput,
  InventoryDashboardSnapshot,
  InventoryAssetSource,
  InventoryCategory,
  InventoryFinish,
  InventoryPricingUnit,
  InventoryProductDetail,
  InventoryProductType,
  InventoryProductTestResultType,
  SupplierSummary,
  UpdateInventoryProductInput,
} from '../inventory/contracts';

// --- Types & Interfaces ---

type AssetStatus = 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
type AssetUsage = 'Hero' | 'Gallery' | 'Installation' | 'Detail' | 'Campaign' | '3D Ready' | 'Model' | 'Render' | 'Publishable Variant';
type AssetType = 'Image' | 'Video' | '2.5D Asset' | '3D Asset' | '3D Render' | 'Model';
type ProtectionLevel = 'Protected Original' | 'Managed Variant' | 'Publishable Variant';

// --- CRM & Comms Types ---
type CRMSubModule = 'Dashboard' | 'Queue' | 'Pipeline' | 'Directory' | 'ProjectsTenders' | 'Automations';
type CommsChannel = 'Email' | 'WhatsApp' | 'Meta' | 'TikTok' | 'Web';
type CustomerStage = 'Lead' | 'Qualified' | 'Quote Sent' | 'Awaiting Response' | 'Negotiation' | 'Won' | 'Lost' | 'Follow-up';
type FinanceSubModule = 'Overview' | 'Receivables' | 'Payables' | 'Margin' | 'Exceptions';

type OsMapWorkflowCandidate = WorkflowInstanceSummary;

type PortalSectionErrorBoundaryProps = {
  children: React.ReactNode;
  resetKey: string;
  title: string;
  onReset: () => void;
};

type PortalSectionErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

class PortalSectionErrorBoundary extends React.Component<
  PortalSectionErrorBoundaryProps,
  PortalSectionErrorBoundaryState
> {
  state: PortalSectionErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): PortalSectionErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'A portal section failed to render.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Portal section render failure:', error);
  }

  componentDidUpdate(prevProps: PortalSectionErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: null });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-8">
        <div className="w-full max-w-2xl rounded-[32px] border border-red-400/20 bg-[#0a0a0a] p-8 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-red-300">Runtime Guard</p>
              <h2 className="mt-3 text-2xl font-serif font-bold uppercase tracking-tight text-white">{this.props.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/55">
                This section hit a render error. The shell is still active, and you can reset back into the stable Marketing dashboard instead of losing the whole portal.
              </p>
              {this.state.message ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/65">
                  {this.state.message}
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={this.props.onReset}
                  className="rounded-2xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e]"
                >
                  Reset To Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

interface Customer {
  id: string;
  name: string;
  type: 'Trade' | 'Retail' | 'Architect' | string;
  email: string;
  phone: string;
  stage: CustomerStage | string;
  lastActivity: string;
  unreadCount?: number;
  conversationCount?: number;
  portalStatus?: string | null;
  firstTouchProvider?: CommsProvider | null;
  linkedQuotes: number;
  linkedOrders: number;
  readiness: {
    address: boolean;
    accessChecklist: boolean;
    vatDetails: boolean;
    contactChannel: boolean;
  };
  blockers: string[];
}

interface CommsThread {
  id: string;
  customerId?: string;
  customerName: string;
  channel: CommsChannel;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  status: 'Unresolved' | 'Resolved' | 'Flagged';
  assignedTo?: string;
  category?: 'Lead' | 'Support' | 'Quote' | 'Payment' | 'Delivery';
}

interface Message {
  id: string;
  threadId: string;
  sender: 'Customer' | 'Agent';
  text: string;
  timestamp: string;
  attachments?: string[];
}

interface Asset {
 id: string;
 name: string;
 type: AssetType;
 protectionLevel: ProtectionLevel;
 size: string;
 status: AssetStatus;
 usage: string[];
 img: string;
 parentId?: string;
 productId?: string;
 productName?: string;
 linkedProductIds?: string[];
 linkedCampaignIds?: string[];
 completeness?: number;
 is3DReady?: boolean;
 campaignId?: string;
 campaignName?: string;
 tags: string[];
 workflowNode?: string;
 pipeline?: {
 sourceUploaded: boolean;
 textureReady: boolean;
 previewAttached: boolean;
 modelReferenceAttached: boolean;
 conversionStatus: 'Pending' | 'Processing' | 'Complete' | 'Failed';
 };
 watermarkProfile?: string;
 backgroundTransparent?: boolean;
 storage?: {
 originalFilename?: string | null;
 storedFilename?: string | null;
 storagePath?: string | null;
 mimeType?: string | null;
 fileSizeBytes?: number | null;
 sha256?: string | null;
 };
}

interface MarketingTemplate {
 id: string;
 name: string;
 description: string;
 type: MarketingTemplateType;
 thumbnail: string;
 blueprint: string;
 status: MarketingTemplateStatus;
 destination: MarketingTemplateDestination;
 tags: string[];
 publicSurfaceEligible: boolean;
 allowedTargets: string[];
 blueprintConfig: MarketingBlueprintConfig;
}

type CampaignStatus = 'Active' | 'Draft' | 'Completed' | 'Scheduled';

interface Campaign {
 id: string;
 name: string;
 owner: string;
 description: string;
 status: CampaignStatus;
 startDate: string;
 endDate: string;
 channels: MarketingChannel[];
 linkedAssetIds: string[];
 productIds: string[];
 budget: string;
 workflowNode?: 'campaign.created';
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'CUST_001',
    name: 'John Doe',
    type: 'Retail',
    email: 'john@example.com',
    phone: '+44 7700 900001',
    stage: 'Lead',
    lastActivity: '2 mins ago',
    linkedQuotes: 1,
    linkedOrders: 0,
    readiness: {
      address: true,
      accessChecklist: false,
      vatDetails: true,
      contactChannel: true
    },
    blockers: ['Missing Access Checklist']
  },
  {
    id: 'CUST_002',
    name: 'Sarah Smith',
    type: 'Trade',
    email: 'sarah@designbuild.com',
    phone: '+44 7700 900002',
    stage: 'Quote Sent',
    lastActivity: '15 mins ago',
    linkedQuotes: 3,
    linkedOrders: 1,
    readiness: {
      address: true,
      accessChecklist: true,
      vatDetails: true,
      contactChannel: true
    },
    blockers: []
  },
  {
    id: 'CUST_003',
    name: 'Mike Ross',
    type: 'Architect',
    email: 'mike@pearsonhardman.com',
    phone: '+44 7700 900003',
    stage: 'Won',
    lastActivity: '1 hour ago',
    linkedQuotes: 5,
    linkedOrders: 4,
    readiness: {
      address: true,
      accessChecklist: true,
      vatDetails: true,
      contactChannel: true
    },
    blockers: []
  },
  {
    id: 'CUST_004',
    name: 'Rachel Zane',
    type: 'Retail',
    email: 'rachel@example.com',
    phone: '+44 7700 900004',
    stage: 'Lead',
    lastActivity: '3 hours ago',
    linkedQuotes: 0,
    linkedOrders: 0,
    readiness: {
      address: false,
      accessChecklist: false,
      vatDetails: false,
      contactChannel: true
    },
    blockers: ['Missing Address', 'Missing Access Checklist', 'Missing VAT Details']
  }
];

const MOCK_COMMS_THREADS: CommsThread[] = [
  {
    id: 'THR_001',
    customerId: 'CUST_001',
    customerName: 'John Doe',
    channel: 'WhatsApp',
    lastMessage: 'Can I get a sample of the Midnight Obsidian?',
    timestamp: '10:42',
    unread: true,
    status: 'Unresolved',
    category: 'Quote'
  },
  {
    id: 'THR_002',
    customerId: 'CUST_002',
    customerName: 'Sarah Smith',
    channel: 'Email',
    lastMessage: 'The quote looks good, but we need to adjust the delivery date.',
    timestamp: '09:15',
    unread: false,
    status: 'Unresolved',
    category: 'Delivery'
  },
  {
    id: 'THR_003',
    customerId: 'CUST_004',
    customerName: 'Rachel Zane',
    channel: 'Meta',
    lastMessage: 'Hi, I saw your ad on Instagram. Do you ship to London?',
    timestamp: 'Yesterday',
    unread: true,
    status: 'Unresolved',
    category: 'Lead'
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'MSG_001',
    threadId: 'THR_003',
    sender: 'Customer',
    text: 'Hi, I saw your ad on Instagram. Do you ship to London?',
    timestamp: 'Yesterday 14:20'
  },
  {
    id: 'MSG_002',
    threadId: 'THR_003',
    sender: 'Agent',
    text: 'Hi Rachel! Yes, we ship nationwide. Are you looking for a specific collection?',
    timestamp: 'Yesterday 14:25'
  },
  {
    id: 'MSG_003',
    threadId: 'THR_003',
    sender: 'Customer',
    text: 'Can I get a sample of the Midnight Obsidian?',
    timestamp: '10:42'
  }
];

const MOCK_CAMPAIGNS: Campaign[] = [
 {
 id: 'CMP_001',
 name: 'Spring Revival 2024',
 owner: 'Rikus Klue',
 description: 'Seasonal refresh focusing on outdoor slate and garden textures.',
 status: 'Active',
 startDate: '2024-03-01',
 endDate: '2024-05-31',
 channels: ['Instagram', 'Facebook', 'Pinterest'],
 linkedAssetIds: ['AST_001', 'AST_002'],
 productIds: ['PRD_882', 'PRD_443'],
 budget: '$5,000',
 workflowNode: 'campaign.created'
 },
 {
 id: 'CMP_002',
 name: 'Luxury Obsidian Launch',
 owner: 'Sarah Chen',
 description: 'High-end product launch for the Midnight Obsidian series.',
 status: 'Scheduled',
 startDate: '2024-04-15',
 endDate: '2024-06-15',
 channels: ['LinkedIn', 'Instagram', 'Email'],
 linkedAssetIds: ['AST_003'],
 productIds: ['PRD_501'],
 budget: '$12,500'
 },
 {
 id: 'CMP_003',
 name: 'Industrial Series Promo',
 owner: 'Marcus Thorne',
 description: 'B2B outreach for commercial tile applications.',
 status: 'Draft',
 startDate: '2024-05-01',
 endDate: '2024-07-01',
 channels: ['LinkedIn', 'Email'],
 linkedAssetIds: [],
 productIds: ['PRD_882'],
 budget: '$3,000'
 }
];

const MOCK_TEMPLATES: MarketingTemplate[] = [
 {
 id: 'TMP_001',
 name: 'Standard Product Card',
 description: 'Deterministic layout for single product showcase with price and CTA.',
 type: 'Product Card',
 thumbnail: 'https://picsum.photos/seed/tmp1/400/300',
 blueprint: '1:1 | Instagram Post | 5 slots | Gradient Lift',
 status: 'Active',
 destination: 'Instagram Post',
 tags: ['Core', 'Product'],
 publicSurfaceEligible: false,
 allowedTargets: ['Instagram Post', 'Campaign Landing Visual'],
 blueprintConfig: createDefaultBlueprintConfig('Product Card', 'Instagram Post'),
 },
 {
 id: 'TMP_002',
 name: 'Collection Highlight',
 description: 'Grid-based layout for showcasing multiple products in a series.',
 type: 'Collection Highlight',
 thumbnail: 'https://picsum.photos/seed/tmp2/400/300',
 blueprint: '1:1 | Campaign Landing Visual | 4 slots | Glass Panel',
 status: 'Active',
 destination: 'Campaign Landing Visual',
 tags: ['Collection', 'Launch'],
 publicSurfaceEligible: true,
 allowedTargets: ['Campaign Landing Visual', 'Public Site Hero'],
 blueprintConfig: createDefaultBlueprintConfig('Collection Highlight', 'Campaign Landing Visual'),
 },
 {
 id: 'TMP_003',
 name: 'Quote CTA',
 description: 'Minimalist layout focusing on customer testimonials and direct action.',
 type: 'Quote CTA',
 thumbnail: 'https://picsum.photos/seed/tmp3/400/300',
 blueprint: '1:1 | WhatsApp Share Card | 4 slots | Solid Wash',
 status: 'Active',
 destination: 'WhatsApp Share Card',
 tags: ['Quote', 'Conversion'],
 publicSurfaceEligible: false,
 allowedTargets: ['WhatsApp Share Card', 'Instagram Post'],
 blueprintConfig: createDefaultBlueprintConfig('Quote CTA', 'WhatsApp Share Card'),
 }
];

type MarketingTemplateDraft = {
  id?: string;
  name: string;
  description: string;
  type: MarketingTemplateType;
  status: MarketingTemplateStatus;
  destination: MarketingTemplateDestination;
  thumbnail: string;
  tags: string[];
  publicSurfaceEligible: boolean;
  allowedTargets: string[];
  blueprintConfig: MarketingBlueprintConfig;
};

function createTemplateDraft(template?: MarketingTemplate | null): MarketingTemplateDraft {
  if (template) {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      status: template.status,
      destination: template.destination,
      thumbnail: template.thumbnail,
      tags: [...template.tags],
      publicSurfaceEligible: template.publicSurfaceEligible,
      allowedTargets: [...template.allowedTargets],
      blueprintConfig: JSON.parse(JSON.stringify(template.blueprintConfig)) as MarketingBlueprintConfig,
    };
  }

  const type: MarketingTemplateType = 'Product Card';
  const destination: MarketingTemplateDestination = 'Instagram Post';
  return {
    name: '',
    description: '',
    type,
    status: 'Draft',
    destination,
    thumbnail: 'https://picsum.photos/seed/marketing-blueprint/400/300',
    tags: ['Blueprint'],
    publicSurfaceEligible: false,
    allowedTargets: [destination],
    blueprintConfig: createDefaultBlueprintConfig(type, destination),
  };
}

function getTemplateSlot(template: MarketingTemplate | null, kind: MarketingBlueprintConfig['slots'][number]['kind']) {
  return template?.blueprintConfig.slots.find((slot) => slot.kind === kind && slot.enabled) ?? null;
}

function startOfLocalDay(input: Date) {
  const next = new Date(input);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(input: Date, days: number) {
  const next = new Date(input);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(input: Date) {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, '0');
  const day = `${input.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(input: Date) {
  const next = startOfLocalDay(input);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function buildWeekDates(anchor: Date) {
  const weekStart = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dateStr: toIsoDate(date),
      weekdayLabel: date.toLocaleDateString('en-ZA', { weekday: 'short' }).toUpperCase(),
      dayLabel: `${date.getDate()}`,
      isToday: toIsoDate(date) === toIsoDate(new Date()),
    };
  });
}

function buildMonthCells(anchor: Date) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthGridStart = startOfWeekMonday(monthStart);
  return Array.from({ length: 35 }).map((_, index) => {
    const date = addDays(monthGridStart, index);
    return {
      date,
      dateStr: toIsoDate(date),
      dayLabel: `${date.getDate()}`,
      isCurrentMonth: date.getMonth() === anchor.getMonth(),
      isToday: toIsoDate(date) === toIsoDate(new Date()),
    };
  });
}

function buildQuickScheduleTimestamp(anchor: Date) {
  const now = new Date();
  const target = startOfLocalDay(anchor);
  const roundedHour = now.getMinutes() > 0 || now.getSeconds() > 0 || now.getMilliseconds() > 0 ? now.getHours() + 1 : now.getHours();
  target.setHours(Math.min(Math.max(roundedHour, 8), 18), 0, 0, 0);
  return target.toISOString();
}

type CalendarEntryDraft = {
 entryType: MarketingCalendarEntryType;
 title: string;
 description: string;
 channel: MarketingChannel;
 campaignId: string | null;
 assetId: string | null;
 scheduledFor: string;
};

function createCalendarEntryDraft(anchor: Date): CalendarEntryDraft {
 return {
  entryType: 'Reminder',
  title: '',
  description: '',
  channel: 'Instagram',
  campaignId: null,
  assetId: null,
  scheduledFor: buildQuickScheduleTimestamp(anchor).slice(0, 16),
 };
}

interface ScheduledPost {
 id: string;
 entryType: MarketingCalendarEntryType;
 title: string;
 description?: string;
 channel?: MarketingChannel;
 time: string;
 date: string;
 status: 'Scheduled' | 'Published' | 'Failed' | 'Draft';
 assetId?: string;
 campaignId?: string;
 workflowNode?: 'post.scheduled' | 'note.scheduled' | 'reminder.scheduled';
}

const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
 { id: 'POST_001', entryType: 'Post', title: 'Spring Hero IG', channel: 'Instagram', time: '14:00', date: '2026-03-27', status: 'Scheduled', assetId: 'AST_001', campaignId: 'CMP_001', workflowNode: 'post.scheduled' },
 { id: 'POST_002', entryType: 'Post', title: 'Slate Promo FB', channel: 'Facebook', time: '12:30', date: '2026-03-27', status: 'Scheduled', assetId: 'AST_002', campaignId: 'CMP_001', workflowNode: 'post.scheduled' },
 { id: 'POST_003', entryType: 'Post', title: 'Catalog Sync WA', channel: 'WhatsApp', time: '09:00', date: '2026-03-28', status: 'Published', campaignId: 'CMP_001' },
 { id: 'POST_004', entryType: 'Post', title: 'TikTok Trend #1', channel: 'TikTok', time: '10:00', date: '2026-03-30', status: 'Scheduled', campaignId: 'CMP_002' },
 { id: 'POST_005', entryType: 'Post', title: 'LinkedIn B2B', channel: 'LinkedIn', time: '11:00', date: '2026-03-31', status: 'Draft', campaignId: 'CMP_002' },
];

type PublishingStatus = 'Queued' | 'Publishing' | 'Published' | 'Failed' | 'Retrying';

interface PublishingJob {
 id: string;
 creativeName: string;
 channel: MarketingChannel;
 status: PublishingStatus;
 timestamp: string;
 progress?: number;
 error?: string;
 assetId?: string;
 campaignId?: string;
 postId?: string;
 workflowNode?: 'publish.queued' | 'publish.succeeded' | 'publish.failed';
}

const MOCK_PUBLISHING_JOBS: PublishingJob[] = [
 { id: 'PUB_001', creativeName: 'Spring Hero IG', channel: 'Instagram', status: 'Published', timestamp: '10:45:12', campaignId: 'CMP_001', postId: 'POST_001', workflowNode: 'publish.succeeded' },
 { id: 'PUB_002', creativeName: 'Catalog Sync WA', channel: 'WhatsApp', status: 'Publishing', timestamp: '10:46:05', progress: 65, campaignId: 'CMP_001', postId: 'POST_003' },
 { id: 'PUB_003', creativeName: 'Slate Promo FB', channel: 'Facebook', status: 'Failed', timestamp: '10:40:22', error: 'API_TIMEOUT', campaignId: 'CMP_001', postId: 'POST_002', workflowNode: 'publish.failed' },
 { id: 'PUB_004', creativeName: 'TikTok Trend #1', channel: 'TikTok', status: 'Queued', timestamp: '10:47:00', campaignId: 'CMP_002', postId: 'POST_004', workflowNode: 'publish.queued' },
 { id: 'PUB_005', creativeName: 'LinkedIn B2B', channel: 'LinkedIn', status: 'Retrying', timestamp: '10:42:15', progress: 20, campaignId: 'CMP_002', postId: 'POST_005' },
 { id: 'PUB_006', creativeName: 'Pinterest Board', channel: 'Pinterest', status: 'Queued', timestamp: '10:48:30', campaignId: 'CMP_001', workflowNode: 'publish.queued' },
];

interface ChannelHealth {
 name: MarketingChannel;
 status: 'Healthy' | 'Degraded' | 'Down';
 latency: string;
 uptime: string;
}

const MOCK_CHANNEL_HEALTH: ChannelHealth[] = [
 { name: 'Instagram', status: 'Healthy', latency: '124ms', uptime: '99.99%' },
 { name: 'Facebook', status: 'Healthy', latency: '142ms', uptime: '99.98%' },
 { name: 'TikTok', status: 'Healthy', latency: '186ms', uptime: '99.95%' },
 { name: 'WhatsApp', status: 'Degraded', latency: '450ms', uptime: '99.20%' },
 { name: 'LinkedIn', status: 'Healthy', latency: '110ms', uptime: '99.99%' },
];

interface CampaignPerformance {
 id: string;
 name: string;
 leads: number;
 quotes: number;
 conversion: string;
 spend: string;
 roas: string;
 workflowNode?: 'analytics.updated';
}

const MOCK_CAMPAIGN_PERFORMANCE: CampaignPerformance[] = [
 { id: 'CMP_001', name: 'Spring Revival 2024', leads: 452, quotes: 128, conversion: '28.3%', spend: '$5,000', roas: '4.2x', workflowNode: 'analytics.updated' },
 { id: 'CMP_002', name: 'Luxury Obsidian Launch', leads: 184, quotes: 56, conversion: '30.4%', spend: '$12,500', roas: '3.8x' },
 { id: 'CMP_003', name: 'Industrial Series Promo', leads: 92, quotes: 34, conversion: '36.9%', spend: '$3,000', roas: '5.1x' },
];

interface ProductMedia {
  id: string;
  role:
    | 'hero'
    | 'gallery'
    | 'face_texture'
    | 'detail_texture'
    | 'installation'
    | 'cutout'
    | 'quote_render'
    | 'marketing_variant'
    | '3d_texture_set'
    | 'model_reference'
    | 'primary_image'
    | 'gallery_image'
    | 'face_image'
    | 'hero_image'
    | 'asset_2_5d'
    | 'asset_3d'
    | 'project_image'
    | 'generated_image'
    | 'gallery_extra'
    | 'detail'
    | 'campaign';
  url: string;
  status: 'Ready' | 'Pending' | 'Missing';
  type: 'Image' | 'Video' | '2.5D Asset' | '3D Asset';
  source?: string;
}

type Vendor = SupplierSummary;

interface Product {
  id: string;
  recordId?: string;
  name: string;
  sku: string;
  category: string;
  productType?: string;
  finish?: string | null;
  collection?: string | null;
  status: 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
  publishStatus?: 'Not Ready' | 'Ready' | 'Published';
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  margin: string;
  suppliersCount: number;
  catalogHealth: number; // 0-100
  assetReadiness: number; // 0-100
  threedReadiness: number; // 0-100
  marketingReadiness: number; // 0-100
  publishReadiness: number; // 0-100
  blockers: string[];
  img: string;
  supplierName?: string;
  availabilityStatus?: 'Ready to Procure' | 'Supplier Delayed' | 'Supplier Onboarding' | 'Missing Supplier';
  leadTimeLabel?: string;
  procurementMode?: 'Dropship';
  procurementTrigger?: 'Quote Paid';
  description?: string;
  dimensions?: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    weightKg: number;
    coverageOrientation: string;
    faceAreaM2: number;
    unitsPerM2: number;
  };
  media: ProductMedia[];
  specs: Record<string, string>;
  history: { date: string; action: string; user: string; details?: string }[];
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'PRD_882',
    name: 'Slate Grey Tile',
    sku: 'BTS-SLT-882',
    category: 'Industrial',
    status: 'Active',
    stock: 1240,
    minStock: 500,
    price: 45.00,
    cost: 22.50,
    margin: '50%',
    suppliersCount: 3,
    catalogHealth: 95,
    assetReadiness: 100,
    threedReadiness: 85,
    marketingReadiness: 90,
    publishReadiness: 100,
    blockers: [],
    img: 'https://picsum.photos/seed/slate1/800/800',
    media: [
      { id: 'M_001', role: 'hero', url: 'https://picsum.photos/seed/slate1/800/800', status: 'Ready', type: 'Image' },
      { id: 'M_002', role: 'face_texture', url: 'https://picsum.photos/seed/slate_tex/800/800', status: 'Ready', type: 'Image' },
      { id: 'M_003', role: '3d_texture_set', url: 'https://picsum.photos/seed/slate_3d/800/800', status: 'Ready', type: '3D Asset' },
    ],
    specs: {
      Dimensions: '600x600x10mm',
      Material: 'Natural Slate',
      Finish: 'Matte / Honed',
      Weight: '8.5kg per tile'
    },
    history: [
      { date: '2024-03-20', action: 'Stock Updated (+500)', user: 'Warehouse Bot' },
      { date: '2024-03-15', action: 'Price Adjusted', user: 'Marcus Thorne' }
    ]
  },
  {
    id: 'PRD_112',
    name: 'Emerald Glaze Brick',
    sku: 'BTS-EMR-112',
    category: 'Premium',
    status: 'Active',
    stock: 4500,
    minStock: 1000,
    price: 12.50,
    cost: 4.20,
    margin: '66%',
    suppliersCount: 2,
    catalogHealth: 80,
    assetReadiness: 75,
    threedReadiness: 95,
    marketingReadiness: 60,
    publishReadiness: 80,
    blockers: ['Missing Installation Shots'],
    img: 'https://picsum.photos/seed/emerald3d/800/800',
    media: [
      { id: 'M_004', role: 'hero', url: 'https://picsum.photos/seed/emerald3d/800/800', status: 'Ready', type: 'Image' },
      { id: 'M_005', role: 'model_reference', url: 'https://picsum.photos/seed/emerald_ref/800/800', status: 'Ready', type: 'Image' },
    ],
    specs: {
      Dimensions: '215x65x15mm',
      Material: 'Glazed Clay',
      Finish: 'High Gloss',
      Weight: '0.8kg per brick'
    },
    history: [
      { date: '2024-03-22', action: '3D Model Approved', user: 'Sarah Chen' }
    ]
  },
  {
    id: 'PRD_443',
    name: 'Rustic Red Brick',
    sku: 'BTS-RST-443',
    category: 'Lifestyle',
    status: 'Active',
    stock: 120,
    minStock: 500,
    price: 8.90,
    cost: 3.10,
    margin: '65%',
    suppliersCount: 4,
    catalogHealth: 45,
    assetReadiness: 30,
    threedReadiness: 0,
    marketingReadiness: 20,
    publishReadiness: 40,
    blockers: ['Missing 3D Assets', 'Low Stock'],
    img: 'https://picsum.photos/seed/rustic_inst/800/800',
    media: [
      { id: 'M_006', role: 'installation', url: 'https://picsum.photos/seed/rustic_inst/800/800', status: 'Ready', type: 'Image' },
    ],
    specs: {
      Dimensions: '215x65x20mm',
      Material: 'Reclaimed Clay',
      Finish: 'Textured / Rough',
      Weight: '1.2kg per brick'
    },
    history: [
      { date: '2024-03-10', action: 'Low Stock Alert Triggered', user: 'System' }
    ]
  },
  {
    id: 'PRD_501',
    name: 'Midnight Obsidian Slab',
    sku: 'BTS-OBS-501',
    category: 'Luxury',
    status: 'Active',
    stock: 15,
    minStock: 10,
    price: 120.00,
    cost: 45.00,
    margin: '62.5%',
    suppliersCount: 1,
    catalogHealth: 90,
    assetReadiness: 85,
    threedReadiness: 80,
    marketingReadiness: 85,
    publishReadiness: 90,
    blockers: [],
    img: 'https://picsum.photos/seed/obsidian/800/800',
    media: [
      { id: 'M_007', role: 'hero', url: 'https://picsum.photos/seed/obsidian/800/800', status: 'Ready', type: 'Image' },
    ],
    specs: {
      Dimensions: '1200x600x20mm',
      Material: 'Volcanic Obsidian',
      Finish: 'Polished',
      Weight: '35kg per slab'
    },
    history: [
      { date: '2024-03-25', action: 'Luxury Campaign Linked', user: 'Sarah Chen' }
    ]
  }
];

// Legacy embedded vendor UI remains in this file but is no longer mounted.
// Keep the mock dataset inert so the active supplier-backed module is the only live path.
const MOCK_VENDORS: Vendor[] = [];

const MOCK_FINANCE_RECORDS: FinanceRecord[] = [];

const BTS_PRODUCTS = MOCK_PRODUCTS;

const MOCK_ASSETS: Asset[] = [
 {
 id: 'AST_001',
 name: 'Slate Grey Hero Original',
 type: 'Image',
 protectionLevel: 'Protected Original',
 size: '12.4MB',
 status: 'Approved',
 usage: ['Hero', 'Detail'],
 img: 'https://picsum.photos/seed/slate1/800/800',
 productId: 'PRD_882',
 productName: 'Slate Grey Tile',
 linkedProductIds: ['PRD_882', 'PRD_883'],
 linkedCampaignIds: ['CMP_001'],
 completeness: 100,
 is3DReady: false,
 tags: ['Premium', 'Industrial', 'High-Res'],
 workflowNode: 'asset.uploaded',
 },
 {
 id: 'AST_002',
 name: 'Slate Grey - Web Variant',
 type: 'Image',
 protectionLevel: 'Publishable Variant',
 size: '1.2MB',
 status: 'Approved',
 usage: ['Gallery', 'Publishable Variant'],
 img: 'https://picsum.photos/seed/slate1_v/800/800',
 parentId: 'AST_001',
 productId: 'PRD_882',
 productName: 'Slate Grey Tile',
 linkedProductIds: ['PRD_882'],
 linkedCampaignIds: ['CMP_001', 'CMP_003'],
 completeness: 100,
 is3DReady: false,
 tags: ['Optimized', 'Web'],
 watermarkProfile: 'Standard BTS',
 backgroundTransparent: false,
 workflowNode: 'variant.generated',
 },
 {
 id: 'AST_003',
 name: 'Emerald Glaze 3D Master',
 type: '3D Asset',
 protectionLevel: 'Protected Original',
 size: '45.8MB',
 status: 'Review',
 usage: ['Detail', '3D Ready', 'Model'],
 img: 'https://picsum.photos/seed/emerald3d/800/800',
 productId: 'PRD_112',
 productName: 'Emerald Glaze Brick',
 linkedProductIds: ['PRD_112'],
 linkedCampaignIds: [],
 completeness: 85,
 is3DReady: true,
 tags: ['3D', 'PBR', 'Master'],
 workflowNode: 'creative.approved',
 pipeline: {
 sourceUploaded: true,
 textureReady: true,
 previewAttached: true,
 modelReferenceAttached: true,
 conversionStatus: 'Processing',
 }
 },
 {
 id: 'AST_004',
 name: 'Spring Campaign Video',
 type: 'Video',
 protectionLevel: 'Managed Variant',
 size: '120MB',
 status: 'Draft',
 usage: ['Campaign'],
 img: 'https://picsum.photos/seed/springvid/800/800',
 campaignId: 'CMP_2026_01',
 campaignName: 'Spring Collection Launch',
 linkedProductIds: ['PRD_443', 'PRD_882', 'PRD_112'],
 linkedCampaignIds: ['CMP_2026_01'],
 completeness: 60,
 is3DReady: false,
 tags: ['Social', 'Motion'],
 },
 {
 id: 'AST_005',
 name: 'Rustic Installation Shot',
 type: 'Image',
 protectionLevel: 'Protected Original',
 size: '8.5MB',
 status: 'Restricted',
 usage: ['Installation', 'Render'],
 img: 'https://picsum.photos/seed/rustic_inst/800/800',
 productId: 'PRD_443',
 productName: 'Rustic Red Brick',
 linkedProductIds: ['PRD_443'],
 linkedCampaignIds: ['CMP_001'],
 completeness: 95,
 is3DReady: false,
 tags: ['Lifestyle', 'On-Site'],
 }
];

// --- Inventory Components ---

const InventoryCatalog = ({ 
  products,
  onProductClick, 
  onAddProduct, 
  onImportPriceList 
}: { 
  products: Product[],
  onProductClick: (product: Product) => void,
  onAddProduct: () => void,
  onImportPriceList: () => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...inventoryCategoryOptions];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-white tracking-tight">Product Catalog</h2>
          <p className="text-sm text-white/40 mt-1">Manage supplier-backed product data, calculator dimensions, and deterministic media slots.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onImportPriceList}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Import Price List
          </button>
          <button 
            onClick={onAddProduct}
            className="px-5 py-2.5 bg-[#00ff88] text-black rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-12 pr-4 py-3 text-sm text-white focus:ring-0 placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white/10 text-[#00ff88]' : 'text-white/40 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all">
          <Filter size={18} />
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <motion.div
            key={product.id}
            layoutId={`product-${product.id}`}
            onClick={() => onProductClick(product)}
            className="group bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#00ff88]/30 transition-all cursor-pointer flex flex-col"
          >
            <div className="aspect-square relative overflow-hidden bg-white/5">
              <img 
                src={product.img} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-bold text-white/80 uppercase tracking-widest">
                {product.category}
              </div>
              
              {/* Readiness Indicators */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${product.assetReadiness === 100 ? 'bg-[#00ff88]' : 'bg-amber-400'}`} title="Assets" />
                  <div className={`w-2 h-2 rounded-full ${product.threedReadiness === 100 ? 'bg-[#00ff88]' : 'bg-white/20'}`} title="3D" />
                  <div className={`w-2 h-2 rounded-full ${product.marketingReadiness === 100 ? 'bg-[#00ff88]' : 'bg-white/20'}`} title="Marketing" />
                </div>
                <div className="text-[10px] font-mono text-white/60">
                  {product.sku}
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-[#00ff88] transition-colors">{product.name}</h3>
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">
                  {product.productType}{product.finish ? ` · ${product.finish}` : ''}{product.collection ? ` · ${product.collection}` : ''}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${product.availabilityStatus === 'Ready to Procure' ? 'text-white/60' : 'text-amber-400'}`}>
                    {product.availabilityStatus} · {product.leadTimeLabel}
                  </span>
                  <span className="text-sm font-medium text-white">R {product.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff88]" style={{ width: `${product.catalogHealth}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{product.catalogHealth}% Health</span>
                </div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                  {product.supplierName ?? 'Unlinked'}
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-[#00ff88] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const InventoryDetailDrawer = ({ 
  product, 
  detail,
  assetLibrary,
  isOpen, 
  onClose,
  activeTab,
  onTabChange,
  onSaveEdits,
  onPublishToStore,
  onUploadAssetToLibrary,
  isPublishing,
}: { 
  product: Product | null, 
  detail: InventoryProductDetail | null,
  assetLibrary: Asset[],
  isOpen: boolean, 
  onClose: () => void,
  activeTab: string,
  onTabChange: (tab: string) => void,
  onSaveEdits: (input: UpdateInventoryProductInput) => Promise<void>,
  onPublishToStore: () => void,
  onUploadAssetToLibrary: (input: {
    file: File;
    productRecordId?: string;
  }) => Promise<Asset>,
  isPublishing?: boolean,
}) => {
  const { openPdfPreview } = usePdfPreview();
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ label: string; url: string } | null>(null);
  const [editData, setEditData] = useState<InventoryDrawerEditState | null>(detail ? createInventoryDrawerEditState(detail) : null);
  const [replacingMediaRole, setReplacingMediaRole] = useState<'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d' | null>(null);
  const [assetPickerTarget, setAssetPickerTarget] = useState<'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d' | null>(null);
  const [assetPickerSearch, setAssetPickerSearch] = useState('');
  const [isUploadingAssetToLibrary, setIsUploadingAssetToLibrary] = useState(false);
  const [isUploadingTestReport, setIsUploadingTestReport] = useState(false);
  const [inlineSaveError, setInlineSaveError] = useState<string | null>(null);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'specs', label: 'Specs', icon: Settings },
    { id: 'media', label: 'Media', icon: Image },
    { id: '3d', label: '3D / Materials', icon: Box },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'history', label: 'History', icon: Activity },
  ];

  const requiredMediaCards = [
    { role: 'primaryImage' as const, label: 'Primary Image', url: editData?.primaryImage?.url ?? detail?.requiredMedia.primaryImageUrl ?? product?.img ?? '', helper: 'Main catalog card, drawer thumbnail, and storefront default.' },
    { role: 'galleryImage' as const, label: 'Gallery Image', url: editData?.galleryImage?.url ?? detail?.requiredMedia.galleryImageUrl ?? product?.img ?? '', helper: 'Secondary catalog media and product gallery reference.' },
    { role: 'faceImage' as const, label: 'Face Image', url: editData?.faceImage?.url ?? detail?.requiredMedia.faceImageUrl ?? product?.img ?? '', helper: 'Close-up product face used for detail and finish reference.' },
    { role: 'heroImage' as const, label: 'Hero Image', url: editData?.heroImage?.url ?? detail?.requiredMedia.heroImageUrl ?? product?.img ?? '', helper: 'Marketing-led hero slot used when a dedicated hero is available.' },
  ];
  const threedAssets = detail?.media.filter((item) => item.role === 'asset_2_5d' || item.role === 'asset_3d') ?? [];
  const marketingAssets = detail?.media.filter((item) => item.role === 'project_image' || item.role === 'generated_image' || item.role === 'gallery_extra') ?? [];
  const canPublish = product ? product.publishStatus !== 'Published' : false;
  const compatibleAssetLibrary = useMemo(() => {
    if (!assetPickerTarget) {
      return [];
    }

    const isImageSlot = ['primaryImage', 'galleryImage', 'faceImage', 'heroImage'].includes(assetPickerTarget);
    const compatibleAssets = assetLibrary.filter((asset) => {
      if (asset.status === 'Archived' || asset.status === 'Restricted') {
        return false;
      }
      if (isImageSlot) {
        return asset.type === 'Image';
      }
      if (assetPickerTarget === 'asset25d') {
        return asset.type === '2.5D Asset';
      }
      return asset.type === '3D Asset' || asset.type === 'Model';
    });

    if (!assetPickerSearch.trim()) {
      return compatibleAssets;
    }

    const normalizedSearch = assetPickerSearch.trim().toLowerCase();
    return compatibleAssets.filter((asset) =>
      asset.name.toLowerCase().includes(normalizedSearch) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
      asset.productName?.toLowerCase().includes(normalizedSearch),
    );
  }, [assetLibrary, assetPickerSearch, assetPickerTarget]);

  useEffect(() => {
    if (detail) {
      setEditData(createInventoryDrawerEditState(detail));
    }
  }, [detail]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setPreviewImage(null);
      setAssetPickerTarget(null);
      setAssetPickerSearch('');
      setInlineSaveError(null);
    }
  }, [isOpen]);

  const handleHeaderEdit = () => {
    if (isEditMode) {
      setEditData(detail ? createInventoryDrawerEditState(detail) : null);
      setInlineSaveError(null);
      setIsEditMode(false);
      return;
    }

    setInlineSaveError(null);
    setIsEditMode(true);
  };

  const handleMediaCardClick = (card: (typeof requiredMediaCards)[number]) => {
    if (isEditMode) {
      setAssetPickerSearch('');
      setAssetPickerTarget(card.role);
      return;
    }

    if (!card.url) {
      return;
    }

    setPreviewImage({ label: card.label, url: card.url });
  };

  const applyAssetLibrarySelection = (field: 'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d', asset: Asset) => {
    setEditData((current) =>
      current
        ? {
            ...current,
            [field]: {
              assetId: asset.id,
              url: asset.img,
              filename: asset.name,
              mimeType: asset.type === 'Video' ? 'video/*' : asset.type === 'Model' || asset.type === '3D Asset' || asset.type === '2.5D Asset' ? 'model/*' : 'image/*',
              size: 0,
              source:
                asset.protectionLevel === 'Publishable Variant'
                  ? 'Studio Published'
                  : asset.protectionLevel === 'Managed Variant'
                    ? 'Marketing Tool'
                    : 'Asset Library',
              originalFilename: asset.storage?.originalFilename ?? asset.name,
              storedFilename: asset.storage?.storedFilename ?? undefined,
              storagePath: asset.storage?.storagePath ?? undefined,
              sha256: asset.storage?.sha256 ?? undefined,
            },
          }
        : current,
    );
    setAssetPickerTarget(null);
    setAssetPickerSearch('');
  };

  const handleSingleAssetUpload = async (
    field: 'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d',
    files: FileList | null,
  ) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setReplacingMediaRole(field);
    setInlineSaveError(null);

    try {
      const uploaded = await uploadInventoryFile(file);
      setEditData((current) =>
            current
          ? {
              ...current,
              [field]: {
                url: uploaded.url,
                filename: uploaded.filename,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
                originalFilename: uploaded.originalFilename,
                storedFilename: uploaded.storedFilename,
                storagePath: uploaded.storagePath,
                sha256: uploaded.sha256,
                kind: uploaded.kind,
              },
            }
          : current,
      );
    } catch (error) {
      setInlineSaveError(error instanceof Error ? error.message : 'Failed to upload asset.');
    } finally {
      setReplacingMediaRole(null);
    }
  };

  const handleUploadAssetToLibraryFromPicker = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !assetPickerTarget) {
      return;
    }

    setIsUploadingAssetToLibrary(true);
    setInlineSaveError(null);

    try {
      const asset = await onUploadAssetToLibrary({
        file,
        productRecordId: product?.recordId,
      });
      applyAssetLibrarySelection(assetPickerTarget, asset);
    } catch (error) {
      setInlineSaveError(error instanceof Error ? error.message : 'Failed to upload asset to Asset Lab.');
    } finally {
      setIsUploadingAssetToLibrary(false);
    }
  };

  const handleTestReportUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingTestReport(true);
    setInlineSaveError(null);

    try {
      const uploaded = await uploadInventoryFile(file);
      setEditData((current) =>
            current
          ? {
              ...current,
              latestTestReport: {
                url: uploaded.url,
                filename: uploaded.filename,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
                originalFilename: uploaded.originalFilename,
                storedFilename: uploaded.storedFilename,
                storagePath: uploaded.storagePath,
                sha256: uploaded.sha256,
                kind: uploaded.kind,
              },
            }
          : current,
      );
    } catch (error) {
      setInlineSaveError(error instanceof Error ? error.message : 'Failed to upload the latest test report.');
    } finally {
      setIsUploadingTestReport(false);
    }
  };

  const handleSaveInlineEdits = async () => {
    if (!editData) {
      return;
    }

    setIsSavingEdits(true);
    setInlineSaveError(null);

    try {
      await onSaveEdits({
        description: editData.description.trim(),
        marketingCopy: editData.marketingCopy.trim(),
        unitCostZar: editData.unitCostZar ? Number(editData.unitCostZar) : null,
        sellPriceZar: editData.sellPriceZar ? Number(editData.sellPriceZar) : null,
        pricingUnit: editData.pricingUnit,
        latestTestReport: editData.latestTestReport ? toAssetSlotInput(editData.latestTestReport) : null,
        latestTestLaboratoryName: editData.latestTestLaboratoryName.trim() || null,
        latestTestMethodStandard: editData.latestTestMethodStandard.trim() || null,
        latestTestReportReference: editData.latestTestReportReference.trim() || null,
        latestTestedAt: editData.latestTestedAt || null,
        latestTestIssuedAt: editData.latestTestIssuedAt || null,
        primaryImage: editData.primaryImage ? toAssetSlotInput(editData.primaryImage) : null,
        galleryImage: editData.galleryImage ? toAssetSlotInput(editData.galleryImage) : null,
        faceImage: editData.faceImage ? toAssetSlotInput(editData.faceImage) : null,
        heroImage: editData.heroImage ? toAssetSlotInput(editData.heroImage) : null,
        asset2_5d: editData.asset25d ? toAssetSlotInput(editData.asset25d) : null,
        asset3d: editData.asset3d ? toAssetSlotInput(editData.asset3d) : null,
        dimensions: {
          lengthMm: Number(editData.lengthMm),
          widthMm: Number(editData.widthMm),
          heightMm: Number(editData.heightMm),
          weightKg: Number(editData.weightKg),
          coverageOrientation: editData.coverageOrientation,
        },
        specifications: editData.specifications,
        testResults: editData.testResults
          .filter((result) => result.value.trim())
          .map((result) => ({
            type: result.type,
            value: Number(result.value),
            unit: result.unit.trim(),
            notes: result.notes.trim() || undefined,
          })),
      });
      setIsEditMode(false);
    } catch (error) {
      setInlineSaveError(error instanceof Error ? error.message : 'Failed to save product changes.');
    } finally {
      setIsSavingEdits(false);
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />
      )}
      {isOpen && (
        <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-[#0a0a0a] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white tracking-tight">{product.name}</h2>
                  <p className="text-xs text-white/40 font-mono tracking-widest uppercase">{product.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleHeaderEdit}
                  className={`p-2.5 border rounded-xl transition-all flex items-center gap-2 ${
                    isEditMode
                      ? 'bg-blue-400/10 border-blue-400/30 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Edit size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                    {isEditMode ? 'Cancel Edit' : 'Edit'}
                  </span>
                </button>
                {isEditMode ? (
                  <button
                    onClick={() => {
                      void handleSaveInlineEdits();
                    }}
                    disabled={isSavingEdits || Boolean(replacingMediaRole)}
                    className="px-4 py-2.5 bg-blue-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-300 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingEdits ? 'Saving...' : 'Save Changes'}
                  </button>
                ) : null}
                <button
                  onClick={onPublishToStore}
                  disabled={!canPublish || isPublishing}
                  className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {product.publishStatus === 'Published' ? 'Published' : isPublishing ? 'Publishing...' : 'Publish to Store'}
                </button>
                <button onClick={onClose} className="p-2.5 text-white/40 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5' : 'border-transparent text-white/40 hover:text-white'}`}
                  >
                    <Icon size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {inlineSaveError ? (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {inlineSaveError}
                </div>
              ) : null}
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  {/* Hero Image */}
                  <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 relative group">
                    <img src={product.img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <button className="absolute bottom-6 right-6 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all">
                      <Maximize2 size={20} />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Availability</p>
                      <p className={`text-2xl font-medium ${product.availabilityStatus === 'Ready to Procure' ? 'text-white' : 'text-amber-400'}`}>
                        {product.availabilityStatus?.replace('Supplier ', '') ?? 'Pending'}
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">{product.leadTimeLabel ?? 'Lead time pending'}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Unit Price</p>
                      <p className="text-2xl font-medium text-white">R {product.price.toFixed(2)}</p>
                      <p className="text-[10px] text-white/20 mt-1">Margin: {product.margin}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Catalog Health</p>
                      <p className="text-2xl font-medium text-[#00ff88]">{product.catalogHealth}%</p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-[#00ff88]" style={{ width: `${product.catalogHealth}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Readiness Checklist */}
                  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#00ff88]" /> Asset Readiness Checklist
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'Primary Image', ready: product.media.some((item) => item.role === 'primary_image' && item.status === 'Ready') },
                        { label: 'Gallery Image', ready: product.media.some((item) => item.role === 'gallery_image' && item.status === 'Ready') },
                        { label: 'Face Image', ready: product.media.some((item) => item.role === 'face_image' && item.status === 'Ready') },
                        { label: 'Calculator Data', ready: Boolean(product.dimensions?.unitsPerM2) },
                        { label: '2.5D Asset', ready: product.media.some((item) => item.role === 'asset_2_5d' && item.status === 'Ready') },
                        { label: '3D Asset', ready: product.media.some((item) => item.role === 'asset_3d' && item.status === 'Ready') },
                        { label: 'Supplier Linkage', ready: product.suppliersCount > 0 },
                        { label: 'Hero Image', ready: product.media.some((item) => item.role === 'hero_image' && item.status !== 'Missing') || Boolean(product.img) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.ready ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-white/5 text-white/20'}`}>
                            <CheckCircle2 size={12} />
                          </div>
                          <span className={`text-xs ${item.ready ? 'text-white/80' : 'text-white/30'}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Product Description</h3>
                    {isEditMode && editData ? (
                      <textarea
                        value={editData.description}
                        onChange={(event) => setEditData((current) => (current ? { ...current, description: event.target.value } : current))}
                        rows={5}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                      />
                    ) : (
                      <p className="text-sm text-white/60 leading-relaxed">
                        {product.description ?? `A ${product.category.toLowerCase()} product shaped for supplier-backed procurement and deterministic calculator behaviour.`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Length', field: 'lengthMm', suffix: 'mm', value: detail ? `${detail.dimensions.lengthMm} mm` : 'Pending' },
                      { label: 'Width', field: 'widthMm', suffix: 'mm', value: detail ? `${detail.dimensions.widthMm} mm` : 'Pending' },
                      { label: 'Height', field: 'heightMm', suffix: 'mm', value: detail ? `${detail.dimensions.heightMm} mm` : 'Pending' },
                      { label: 'Weight', field: 'weightKg', suffix: 'kg', value: detail ? `${detail.dimensions.weightKg.toFixed(2)} kg` : 'Pending' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.label}</p>
                        {isEditMode && editData ? (
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="number"
                              value={editData[item.field as keyof InventoryDrawerEditState] as string}
                              onChange={(event) =>
                                setEditData((current) =>
                                  current ? { ...current, [item.field]: event.target.value } : current,
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none transition-colors focus:border-blue-400/40"
                            />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.suffix}</span>
                          </div>
                        ) : (
                          <p className="mt-3 text-xl font-medium text-white">{item.value}</p>
                        )}
                      </div>
                    ))}
                    {[
                      { label: 'Face Area', value: detail ? `${detail.dimensions.faceAreaM2.toFixed(4)} m²` : 'Pending' },
                      { label: 'Units / m²', value: detail ? detail.dimensions.unitsPerM2.toFixed(2) : 'Pending' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.label}</p>
                        <p className="mt-3 text-xl font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-sm font-medium text-white">Technical Specification Set</h3>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {Object.entries(editData?.specifications ?? product.specs).map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">{label}</p>
                          {isEditMode && editData ? (
                            <input
                              type="text"
                              value={value}
                              onChange={(event) =>
                                setEditData((current) =>
                                  current
                                    ? {
                                        ...current,
                                        specifications: {
                                          ...current.specifications,
                                          [label]: event.target.value,
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                            />
                          ) : (
                            <p className="mt-2 text-sm text-white/80">{value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-white">Latest Test Results</h3>
                        <p className="mt-2 text-xs text-white/45">
                          Store the latest approved lab values here so the public spec sheet, technical copy, and architect-facing downloads stay deterministic.
                        </p>
                      </div>
                      {!isEditMode && detail ? (
                        <button
                          type="button"
                          onClick={() => openPdfPreview({
                            url: `/api/inventory/products/${detail.id}/spec-sheet.pdf`,
                            title: `${detail.name} Spec Sheet`,
                            subtitle: `${detail.publicSku} / Technical PDF`,
                            fileName: `${detail.publicSku.toLowerCase()}-spec-sheet.pdf`,
                          })}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/55 transition-colors hover:border-white/20 hover:text-white"
                        >
                          <Download size={12} />
                          Spec Sheet
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {(editData?.testResults ?? []).map((result, index) => (
                        <div key={`${result.type}-${index}`} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">{result.type}</p>
                          {isEditMode && editData ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={result.value}
                                  onChange={(event) =>
                                    setEditData((current) =>
                                      current
                                        ? {
                                            ...current,
                                            testResults: current.testResults.map((entry, entryIndex) =>
                                              entryIndex === index ? { ...entry, value: event.target.value } : entry,
                                            ),
                                          }
                                        : current,
                                    )
                                  }
                                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none transition-colors focus:border-blue-400/40"
                                />
                                <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">{result.unit}</span>
                              </div>
                              <input
                                type="text"
                                value={result.notes}
                                placeholder="Optional note"
                                onChange={(event) =>
                                  setEditData((current) =>
                                    current
                                      ? {
                                          ...current,
                                          testResults: current.testResults.map((entry, entryIndex) =>
                                            entryIndex === index ? { ...entry, notes: event.target.value } : entry,
                                          ),
                                        }
                                      : current,
                                  )
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="mt-2 text-sm text-white/80">
                                {result.value} {result.unit}
                              </p>
                              {result.notes ? <p className="mt-2 text-xs text-white/45">{result.notes}</p> : null}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {[
                        { label: 'Laboratory', field: 'latestTestLaboratoryName' as const, value: editData?.latestTestLaboratoryName ?? detail?.latestTestReport.laboratoryName ?? '' },
                        { label: 'Standard', field: 'latestTestMethodStandard' as const, value: editData?.latestTestMethodStandard ?? detail?.latestTestReport.methodStandard ?? '' },
                        { label: 'Report Reference', field: 'latestTestReportReference' as const, value: editData?.latestTestReportReference ?? detail?.latestTestReport.reportReference ?? '' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">{item.label}</p>
                          {isEditMode && editData ? (
                            <input
                              type="text"
                              value={item.value}
                              onChange={(event) =>
                                setEditData((current) =>
                                  current ? { ...current, [item.field]: event.target.value } : current,
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                            />
                          ) : (
                            <p className="mt-2 text-sm text-white/80">{item.value || 'Pending'}</p>
                          )}
                        </div>
                      ))}
                      {[
                        { label: 'Tested At', field: 'latestTestedAt' as const, value: editData?.latestTestedAt ?? toDateInputValue(detail?.latestTestReport.testedAt) },
                        { label: 'Issued At', field: 'latestTestIssuedAt' as const, value: editData?.latestTestIssuedAt ?? toDateInputValue(detail?.latestTestReport.issuedAt) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">{item.label}</p>
                          {isEditMode && editData ? (
                            <input
                              type="date"
                              value={item.value}
                              onChange={(event) =>
                                setEditData((current) =>
                                  current ? { ...current, [item.field]: event.target.value } : current,
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                            />
                          ) : (
                            <p className="mt-2 text-sm text-white/80">{item.value || 'Pending'}</p>
                          )}
                        </div>
                      ))}
                      <div className="col-span-2 rounded-2xl border border-white/5 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Latest Test Report PDF</p>
                            <p className="mt-2 text-sm text-white/80">
                              {editData?.latestTestReport?.filename ?? detail?.latestTestReport.name ?? 'No PDF attached'}
                            </p>
                          </div>
                          {isEditMode ? (
                            <div className="flex items-center gap-3">
                              <label
                                htmlFor="inventory-drawer-test-report"
                                className="inline-flex cursor-pointer items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
                              >
                                {isUploadingTestReport ? 'Uploading...' : editData?.latestTestReport ? 'Replace PDF' : 'Upload PDF'}
                              </label>
                              <input
                                id="inventory-drawer-test-report"
                                type="file"
                                accept={PDF_UPLOAD_ACCEPT}
                                className="sr-only"
                                onChange={(event) => {
                                  void handleTestReportUpload(event.target.files);
                                  event.currentTarget.value = '';
                                }}
                              />
                            </div>
                          ) : detail?.latestTestReport.url ? (
                            <button
                              type="button"
                              onClick={() => window.open(detail.latestTestReport.url!, '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/55 transition-colors hover:border-white/20 hover:text-white"
                            >
                              <Paperclip size={12} />
                              Open PDF
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Media Source Of Truth</p>
                      <p className="mt-2 text-xs text-white/45">
                        Required media is assigned from Asset Lab. In view mode, click any card to open the source media. In edit mode, click a slot to select an approved asset or upload a new one into Asset Lab first.
                      </p>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isEditMode ? 'border-blue-400/30 bg-blue-400/10 text-blue-400' : 'border-white/10 text-white/35'}`}>
                      {isEditMode ? 'Edit Active' : 'Preview Mode'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {requiredMediaCards.map((item) => (
                      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleMediaCardClick(item)}
                          className="group block w-full text-left"
                        >
                          <div className="relative aspect-[4/3] bg-black/30">
                            <img src={item.url || product.img} alt={item.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-90" />
                            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 p-2 text-white/75 backdrop-blur-md">
                              {isEditMode ? <Edit size={14} /> : <Maximize2 size={14} />}
                            </div>
                          <div className="absolute left-4 bottom-4 right-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{item.label}</p>
                                <p className="mt-2 text-xs text-white/60">{item.helper}</p>
                                {isEditMode ? (
                                  <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-blue-300/70">
                                    Select from Asset Lab
                                  </p>
                                ) : null}
                              </div>
                                {replacingMediaRole === item.role ? (
                                  <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-400">
                                    Uploading
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-sm font-medium text-white">Attached Media Assets</h3>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {(detail?.media ?? []).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPreviewImage({ label: item.name, url: item.img })}
                          className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden text-left group"
                        >
                          <div className="relative aspect-[4/3] bg-black/20">
                            <img src={item.img} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 p-2 text-white/75 backdrop-blur-md">
                              <Maximize2 size={14} />
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
                            <p className="text-xs font-medium text-white">{item.name}</p>
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/35">
                              <span>{item.role.replace(/_/g, ' ')}</span>
                              <span>{item.status}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === '3d' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: '2.5D Readiness', value: `${editData?.asset25d ? 'Attached' : 'Pending'}` },
                      { label: '3D Publish Readiness', value: `${product.threedReadiness}%` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.label}</p>
                        <p className="mt-3 text-xl font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {isEditMode && editData ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'asset25d', label: '2.5D Asset', value: editData.asset25d },
                        { id: 'asset3d', label: '3D Asset', value: editData.asset3d },
                      ].map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.label}</p>
                          <p className="mt-3 truncate text-sm text-white/60">{item.value?.filename ?? 'No asset attached'}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setAssetPickerSearch('');
                              setAssetPickerTarget(item.id as 'asset25d' | 'asset3d');
                            }}
                            className="mt-4 inline-flex items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
                          >
                            {item.value ? 'Select From Asset Lab' : 'Assign From Asset Lab'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    {threedAssets.length > 0 ? (
                      threedAssets.map((item) => (
                        <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">{item.status}</span>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{item.role.replace(/_/g, ' ')}</p>
                            <p className="mt-2 text-sm text-white/60">{item.source}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-white/35">
                        No 2.5D or 3D assets are attached yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'marketing' && (
                <div className="space-y-8">
                  <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="aspect-[16/9] bg-black/30">
                      <img src={editData?.heroImage?.url ?? detail?.requiredMedia.heroImageUrl ?? product.img} alt={`${product.name} hero`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Storefront Hero</p>
                      {isEditMode && editData ? (
                        <textarea
                          value={editData.marketingCopy}
                          onChange={(event) => setEditData((current) => (current ? { ...current, marketingCopy: event.target.value } : current))}
                          rows={6}
                          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-blue-400/40"
                        />
                      ) : (
                        <p className="mt-3 text-sm leading-relaxed text-white/65">
                          {detail?.marketingCopy?.trim() || product.description || 'Marketing copy has not been authored yet. The storefront will currently use the deterministic product description.'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Readiness Gaps</h3>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">{product.publishReadiness}% publish readiness</span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {(product.blockers.length > 0 ? product.blockers : ['No publish blockers remain']).map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-white">Distribution</h3>
                        <p className="mt-2 text-xs text-white/45">
                          Internal storefront publishing stays separate from external catalog sync. Only deterministic product destinations are shown here.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/35">
                        {detail?.distributionChannels.length ?? 0} channels
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                      {(detail?.distributionChannels ?? []).map((channel) => {
                        const statusTone =
                          channel.publicationStatus === 'Live'
                            ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                            : channel.publicationStatus === 'Failed'
                              ? 'border-red-400/20 bg-red-500/10 text-red-400'
                              : channel.publicationStatus === 'Queued' || channel.publicationStatus === 'Syncing'
                                ? 'border-blue-400/20 bg-blue-400/10 text-blue-400'
                                : 'border-white/10 bg-black/20 text-white/45';
                        const connectionTone =
                          channel.connectionStatus === 'Connected'
                            ? 'text-[#00ff88]'
                            : channel.connectionStatus === 'Degraded'
                              ? 'text-amber-400'
                              : channel.connectionStatus === 'Error'
                                ? 'text-red-400'
                                : 'text-white/35';

                        return (
                          <div key={channel.channel} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {channel.type === 'Messaging' ? (
                                    <MessageSquare size={14} className="text-blue-400" />
                                  ) : channel.isInternal ? (
                                    <ShoppingBag size={14} className="text-blue-400" />
                                  ) : (
                                    <Globe size={14} className="text-blue-400" />
                                  )}
                                  <p className="text-sm font-medium text-white">{channel.channel}</p>
                                </div>
                                <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
                                  {channel.type} • {channel.syncMode}
                                </p>
                              </div>
                              <div className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${statusTone}`}>
                                {channel.publicationStatus}
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-widest">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-white/25">Connection</p>
                                <p className={`mt-2 ${connectionTone}`}>{channel.connectionStatus}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-white/25">Last Sync</p>
                                <p className="mt-2 text-white/65">{channel.lastSyncedAt ? new Date(channel.lastSyncedAt).toLocaleDateString() : 'Never'}</p>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-[10px] font-mono uppercase tracking-widest text-white/35">
                              <div className="flex items-center justify-between gap-3">
                                <span>Catalog ID</span>
                                <span className="truncate text-right text-white/60">{channel.externalCatalogId ?? 'Not linked'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Listing ID</span>
                                <span className="truncate text-right text-white/60">{channel.externalListingId ?? 'Pending'}</span>
                              </div>
                              {channel.externalUrl ? (
                                <a
                                  href={channel.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-white/55 transition-colors hover:border-blue-400/20 hover:text-blue-400"
                                >
                                  <span>Destination</span>
                                  <span className="flex items-center gap-2">
                                    Open
                                    <ArrowUpRight size={12} />
                                  </span>
                                </a>
                              ) : null}
                              {channel.lastSyncError ? (
                                <div className="rounded-xl border border-red-400/10 bg-red-500/5 px-3 py-3 text-red-300/80 normal-case tracking-normal">
                                  {channel.lastSyncError}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {marketingAssets.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="aspect-square bg-black/20">
                          <img src={item.img} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-medium text-white">{item.name}</p>
                          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">{item.role.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Sell Price</p>
                      {isEditMode && editData ? (
                        <input
                          type="number"
                          value={editData.sellPriceZar}
                          onChange={(event) => setEditData((current) => (current ? { ...current, sellPriceZar: event.target.value } : current))}
                          className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-2xl font-medium text-white outline-none transition-colors focus:border-blue-400/40"
                        />
                      ) : (
                        <p className="mt-3 text-2xl font-medium text-white">R {product.price.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Unit Cost</p>
                      {isEditMode && editData ? (
                        <input
                          type="number"
                          value={editData.unitCostZar}
                          onChange={(event) => setEditData((current) => (current ? { ...current, unitCostZar: event.target.value } : current))}
                          className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-2xl font-medium text-white outline-none transition-colors focus:border-blue-400/40"
                        />
                      ) : (
                        <p className="mt-3 text-2xl font-medium text-white">R {product.cost.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Margin</p>
                      <p className="mt-3 text-2xl font-medium text-blue-400">{product.margin}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="text-sm font-medium text-white">Pricing Profile</h3>
                      <div className="mt-5 space-y-4 text-sm text-white/70">
                        <div className="flex items-center justify-between">
                          <span>Pricing Unit</span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/45">
                            {editData?.pricingUnit ?? detail?.pricing.unit ?? 'm2'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Availability</span>
                          <span className="font-mono uppercase">{product.procurementMode ?? 'Dropship'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Procurement Trigger</span>
                          <span className="font-mono uppercase">{product.procurementTrigger ?? 'Quote Paid'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="text-sm font-medium text-white">Logistics Snapshot</h3>
                      <div className="mt-5 space-y-4 text-sm text-white/70">
                        <div className="flex items-center justify-between">
                          <span>Primary Supplier</span>
                          <span>{detail?.logistics.defaultSupplierName ?? product.supplierName ?? 'Unlinked'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Origin</span>
                          <span>{detail?.logistics.defaultOriginLocation ?? 'Pending'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Lead Time</span>
                          <span>{product.leadTimeLabel ?? 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'suppliers' && (
                <div className="space-y-6">
                  {(detail?.suppliers ?? []).map((supplier) => (
                    <div key={supplier.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="text-lg font-medium text-white">{supplier.name}</p>
                          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/35">{supplier.type} · {supplier.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Lead Time</p>
                          <p className="mt-2 text-sm text-white/75">{supplier.leadTime}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-white/70">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Region</p>
                          <p className="mt-2">{supplier.region}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Capabilities</p>
                          <p className="mt-2">{supplier.capabilities.join(', ') || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {detail?.documentHistory?.length ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-white">Document History</h3>
                          <p className="mt-2 text-xs text-white/45">
                            Quotes, orders, invoices, and procurement records linked to this inventory item.
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/35">
                          {detail.documentHistory.length} documents
                        </span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {detail.documentHistory.map((document) => (
                          <div key={document.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-white">{document.title}</p>
                              <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">
                                {document.type} • {document.status} • {new Date(document.issuedAt).toLocaleDateString('en-ZA')}
                              </p>
                              <p className="mt-2 text-xs text-white/45">
                                {document.customerName ?? document.supplierName ?? 'BTS ERP OS'}{document.summary ? ` • ${document.summary}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-white">R {document.totalAmount.toLocaleString()}</p>
                              <button
                                type="button"
                                onClick={() => openPdfPreview({
                                  url: document.pdfUrl,
                                  title: document.key,
                                  subtitle: `${document.type} / ${document.status}`,
                                  fileName: `${document.key}.pdf`,
                                })}
                                className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:text-blue-300"
                              >
                                <Download size={12} />
                                Open PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {product.history.map((item) => (
                    <div key={`${item.date}-${item.action}`} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">{item.action}</p>
                          <p className="mt-1 text-xs text-white/45">{item.details ?? 'Inventory state change recorded.'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{item.date}</p>
                          <p className="mt-1 text-xs text-white/60">{item.user}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <AnimatePresence>
              {assetPickerTarget ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[135] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  onClick={() => {
                    if (isUploadingAssetToLibrary) {
                      return;
                    }
                    setAssetPickerTarget(null);
                    setAssetPickerSearch('');
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Asset Lab Assignment</p>
                        <h3 className="mt-2 text-2xl font-serif font-bold uppercase tracking-tighter text-white">
                          {assetPickerTarget === 'asset25d'
                            ? 'Assign 2.5D Asset'
                            : assetPickerTarget === 'asset3d'
                              ? 'Assign 3D Asset'
                              : 'Assign Media Asset'}
                        </h3>
                        <p className="mt-2 text-xs text-white/45">
                          Choose a compatible asset from Asset Lab so the slot reuses the correct source media and provenance.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAssetPickerTarget(null);
                          setAssetPickerSearch('');
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/40 transition-colors hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-6 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full max-w-sm">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                          <input
                            type="text"
                            value={assetPickerSearch}
                            onChange={(event) => setAssetPickerSearch(event.target.value)}
                            placeholder="Search Asset Lab..."
                            className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-blue-400/40"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="inventory-drawer-asset-lab-upload"
                            type="file"
                            accept={assetPickerTarget === 'asset25d' || assetPickerTarget === 'asset3d' ? MODEL_UPLOAD_ACCEPT : IMAGE_UPLOAD_ACCEPT}
                            className="sr-only"
                            onChange={(event) => {
                              void handleUploadAssetToLibraryFromPicker(event.target.files);
                              event.currentTarget.value = '';
                            }}
                          />
                          <label
                            htmlFor="inventory-drawer-asset-lab-upload"
                            className="inline-flex cursor-pointer items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
                          >
                            {isUploadingAssetToLibrary ? 'Uploading...' : 'Upload New Asset'}
                          </label>
                        </div>
                      </div>

                      <div className="grid max-h-[56vh] grid-cols-1 gap-4 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-2 xl:grid-cols-3">
                        {compatibleAssetLibrary.length > 0 ? (
                          compatibleAssetLibrary.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => applyAssetLibrarySelection(assetPickerTarget, asset)}
                              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:border-blue-400/20 hover:bg-white/[0.07]"
                            >
                              <div className="relative aspect-[4/3] bg-black/30">
                                <img src={asset.img} alt={asset.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute left-3 top-3 flex gap-2">
                                  <span className="rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white/55">
                                    {asset.type}
                                  </span>
                                  <span className="rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white/55">
                                    {asset.status}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3 p-4">
                                <div>
                                  <p className="text-sm font-medium text-white">{asset.name}</p>
                                  <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">
                                    {asset.protectionLevel} {asset.productName ? `• ${asset.productName}` : ''}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {asset.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white/45">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center">
                            <p className="text-sm font-medium text-white">No compatible assets found</p>
                            <p className="mt-2 text-xs text-white/45">
                              Upload a new asset into Asset Lab or adjust the search term.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence>
              {previewImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
                  onClick={() => setPreviewImage(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                    className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Original Media Preview</p>
                        <p className="mt-1 text-sm text-white">{previewImage.label}</p>
                      </div>
                      <button onClick={() => setPreviewImage(null)} className="rounded-xl p-2 text-white/40 transition-colors hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="max-h-[calc(90vh-72px)] overflow-auto bg-black">
                      <img src={previewImage.url} alt={previewImage.label} className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Custom Node Components ---

const CustomNode = ({ id, data, selected }: NodeProps) => {
 const Icon = data.icon as any;
 const category = data.category as string;
 const activeItems = data.activeItems as number || 0;
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 
 const getCategoryColor = (cat: string) => {
 switch (cat) {
 case 'DEMAND': return 'text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/2';
 case 'HUB': return 'text-blue-400 border-blue-400/20 bg-blue-400/2';
 case 'SALES': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/2';
 case 'SUPPLY': return 'text-amber-400 border-amber-400/20 bg-amber-400/2';
 case 'LOGISTICS': return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/2';
 case 'SUPPORT': return 'text-purple-400 border-purple-400/20 bg-purple-400/2';
 case 'MARKETING': return 'text-pink-400 border-pink-400/20 bg-pink-400/2';
 default: return 'text-white border-white/20 bg-white/2';
 }
 };

 const getActions = (cat: string) => {
  switch (cat) {
   case 'SALES': return ['Create Quote', 'Create Invoice'];
   case 'SUPPLY': return ['Create PO'];
   case 'LOGISTICS': return ['Create GRN', 'Schedule Delivery'];
   case 'MARKETING': return ['Create Ad', 'Request Design', 'Generate Copy'];
   case 'DEMAND': return ['Send Comms Message', 'View Leads'];
   case 'HUB': return ['Send Comms Message', 'View Analytics'];
   default: return ['View Details', 'Trigger Manual Sync'];
  }
 };

 const colorClasses = getCategoryColor(category);
 const actions = getActions(category);

 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (dropdownRef.current && !dropdownRef.current.contains(event.target as globalThis.Node)) {
       setIsDropdownOpen(false);
     }
   };
   if (isDropdownOpen) {
     document.addEventListener('mousedown', handleClickOutside);
   }
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [isDropdownOpen]);

 return (
 <div className="relative" ref={dropdownRef}>
  {/* Active Items Badge */}
  <AnimatePresence>
   {activeItems > 0 && (
    <motion.div 
     initial={{ scale: 0, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     exit={{ scale: 0, opacity: 0 }}
     className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#00ff88] text-black flex items-center justify-center text-[10px] font-bold shadow-[0_0_15px_rgba(0,255,136,0.6)] z-50 border border-black"
    >
     {activeItems}
    </motion.div>
   )}
  </AnimatePresence>

 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: 'spring', damping: 20, stiffness: 100 }}
 className={`px-5 py-4 rounded-xl border backdrop-blur-xl transition-all duration-500 min-w-[260px] relative group ${selected ? 'border-[#00ff88]/50 shadow-[0_0_50px_rgba(0,255,136,0.1)] ring-1 ring-[#00ff88]/30' : 'border-white/5'} bg-[#0a0a0a]/90`}
 >
 {/* Background Effects Container (overflow hidden) */}
 <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
  <div className="absolute inset-0 opacity-[0.01] z-10" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
 </div>

 <Handle type="target" position={Position.Left} className="!bg-[#00ff88] !border-none !w-1.5 !h-1.5 !-left-0.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity" />
 
 <div className="flex items-center gap-5 relative z-20">
 <div className={`p-3 rounded-xl bg-black/60 border border-white/5 ${colorClasses.split(' ')[0]} shadow-2xl transition-transform group-hover:scale-110 duration-500`}>
 <Icon size={20} strokeWidth={2} />
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1">
 <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.4em] opacity-60 ${colorClasses.split(' ')[0]}`}>{category}</span>
 
 {/* Action Menu Toggle */}
 <button 
  onClick={(e) => {
   e.stopPropagation();
   setIsDropdownOpen(!isDropdownOpen);
  }}
  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
 >
  <MoreVertical size={14} />
 </button>
 </div>
 <div className="text-[14px] font-bold text-white tracking-tight leading-none uppercase group-hover:text-[#00ff88] transition-colors">{data.label as string}</div>
 </div>
 </div>

 <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between relative z-20">
 <div className="flex items-center gap-2.5 text-[9px] font-mono text-white/30 uppercase tracking-widest">
 <Zap size={11} className={data.logic ? 'text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'text-white/5'} fill={data.logic ? '#00ff88' : 'none'} />
 <span className={data.logic ? 'text-white/60' : ''}>{data.logic ? 'Logic Executable' : 'Static Node'}</span>
 </div>
 <div className="flex gap-1.5">
 <div className={`w-1.5 h-1.5 rounded-full ${data.logic ? 'bg-[#00ff88] ' : 'bg-white/5'}`}></div>
 <div className="w-1.5 h-1.5 rounded-full bg-white/5"></div>
 </div>
 </div>

 <Handle type="source" position={Position.Right} className="!bg-[#00ff88] !border-none !w-1.5 !h-1.5 !-right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
 </motion.div>

 {/* Action Dropdown */}
 <AnimatePresence>
  {isDropdownOpen && (
   <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
   >
    <div className="p-2 border-b border-white/5 bg-white/5">
     <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Manual Actions</span>
    </div>
    <div className="p-1">
     {actions.map((action, idx) => (
      <button
       key={idx}
       onClick={(e) => {
        e.stopPropagation();
        setIsDropdownOpen(false);
        if (data.onActionClick) {
         (data.onActionClick as any)(action, id, data.label);
        }
       }}
       className="w-full text-left px-3 py-2 text-[12px] text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
      >
       <div className="w-1 h-1 rounded-full bg-[#00ff88]/50" />
       {action}
      </button>
     ))}
    </div>
   </motion.div>
  )}
 </AnimatePresence>
 </div>
 );
};

const nodeTypes = {
 businessStep: CustomNode,
};

// --- Initial Data ---

const initialNodes: Node[] = [
 // --- Demand Generation (Sources) ---
 { 
 id: 'meta', 
 type: 'businessStep', 
 position: { x: 50, y: 100 }, 
 data: { label: 'Meta / Instagram', category: 'DEMAND', icon: Share2, logic: 'INBOUND_DEMAND: Social campaigns, comments, and DMs route into the unified intake.' } 
 },
 { 
 id: 'whatsapp', 
 type: 'businessStep', 
 position: { x: 50, y: 200 }, 
 data: { label: 'WhatsApp Channel', category: 'DEMAND', icon: Phone, logic: 'INBOUND_DEMAND: Customer messages and delivery follow-ups route into Comms.' } 
 },
 { 
 id: 'tiktok', 
 type: 'businessStep', 
 position: { x: 50, y: 300 }, 
 data: { label: 'Storefront / App Orders', category: 'DEMAND', icon: Globe, logic: 'INBOUND_DEMAND: Web orders and catalogue requests enter the sales path automatically.' } 
 },
 { 
 id: 'email', 
 type: 'businessStep', 
 position: { x: 50, y: 400 }, 
 data: { label: 'Email / Tender Intake', category: 'DEMAND', icon: Mail, logic: 'INBOUND_DEMAND: RFQs, BOQs, and direct enquiries create CRM and tender intake.' } 
 },

 // --- Marketing Subsystem (Workflow Nodes) ---
 { 
 id: 'mkt_assets', 
 type: 'businessStep', 
 position: { x: 400, y: -100 }, 
 data: { label: 'Asset Lab', category: 'MARKETING', icon: Image, logic: 'BRAND_SYSTEM: Approved originals, managed variants, and publishable outputs stay reusable.' } 
 },
 { 
 id: 'mkt_templates', 
 type: 'businessStep', 
 position: { x: 700, y: -100 }, 
 data: { label: 'Blueprint Library', category: 'MARKETING', icon: LayoutDashboard, logic: 'LAYOUT_SYSTEM: Public surfaces and campaign formats resolve through reusable blueprints.' } 
 },
 { 
 id: 'mkt_campaigns', 
 type: 'businessStep', 
 position: { x: 1000, y: -100 }, 
 data: { label: 'Campaign Engine', category: 'MARKETING', icon: Megaphone, logic: 'ORCHESTRATION: Campaigns bind approved assets, customers, and publishing targets.' } 
 },
 { 
 id: 'mkt_calendar', 
 type: 'businessStep', 
 position: { x: 1300, y: -100 }, 
 data: { label: 'Calendar Scheduler', category: 'MARKETING', icon: Calendar, logic: 'SCHEDULING: Posts, notes, and reminders hold the operational and marketing timeline.' } 
 },
 { 
 id: 'mkt_publishing', 
 type: 'businessStep', 
 position: { x: 1600, y: -100 }, 
 data: { label: 'Publishing Queue', category: 'MARKETING', icon: ListOrdered, logic: 'DELIVERY: Approved creative outputs publish to connected channels with job tracking.' } 
 },
 { 
 id: 'mkt_connectors', 
 type: 'businessStep', 
 position: { x: 1900, y: -100 }, 
 data: { label: 'Channel Connectors', category: 'MARKETING', icon: Link, logic: 'CHANNEL_SYNC: External platforms and inbound connectors feed the same operating system.' } 
 },
 { 
 id: 'mkt_analytics', 
 type: 'businessStep', 
 position: { x: 2200, y: -100 }, 
 data: { label: 'Analytics & Community', category: 'MARKETING', icon: BarChart3, logic: 'FEEDBACK_LOOP: Performance and community response feed back into campaign and revenue insight.' } 
 },

 // --- Core Operations ---
 { 
 id: 'comms', 
 type: 'businessStep', 
 position: { x: 400, y: 250 }, 
 data: { label: 'Unified Comms Intake', category: 'HUB', icon: MessageSquare, logic: 'CENTRAL_TRIAGE: All inbound channels resolve into one customer and conversation stream.' } 
 },
 { 
 id: 'sales', 
 type: 'businessStep', 
 position: { x: 700, y: 250 }, 
 data: { label: 'CRM / Quote Desk', category: 'SALES', icon: FileText, logic: 'SALES_FLOW: Lead qualification, quoting, negotiation, and paid-quote conversion.' } 
 },
 { 
 id: 'supply', 
 type: 'businessStep', 
 position: { x: 1000, y: 250 }, 
 data: { label: 'Supplier Purchase Orders', category: 'SUPPLY', icon: Box, logic: 'SUPPLY_CHAIN: Paid quotes generate supplier purchase orders against linked source vendors.' } 
 },
 { 
 id: 'logistics', 
 type: 'businessStep', 
 position: { x: 1300, y: 250 }, 
 data: { label: 'Transport & Collection', category: 'LOGISTICS', icon: Truck, logic: 'TRANSPORT_FLOW: Collection notes, carrier costing, and dispatch coordination move the order forward.' } 
 },
 { 
 id: 'fulfillment', 
 type: 'businessStep', 
 position: { x: 1600, y: 250 }, 
 data: { label: 'Delivery / POD', category: 'SUPPORT', icon: CheckCircle2, logic: 'FULFILMENT: Delivery is tracked, POD closes the loop, and invoice closeout can proceed.' } 
 },
 { 
 id: 'marketing_ai', 
 type: 'businessStep', 
 position: { x: 1900, y: 150 }, 
 data: { label: 'Customer & Supplier Portals', category: 'SUPPORT', icon: Monitor, logic: 'VISIBILITY: Customer, supplier, and owner all see the same order and delivery state.' } 
 },
 { 
 id: 'finance', 
 type: 'businessStep', 
 position: { x: 1900, y: 350 }, 
 data: { label: 'Invoice & Finance Ledger', category: 'HUB', icon: BarChart3, logic: 'FINANCE_CLOSEOUT: Receivables, payables, margin, and invoice state reconcile the workflow.' } 
 },
];

const initialEdges: Edge[] = [
 // Demand to Comms
 { id: 'e_meta_comms', source: 'meta', target: 'comms', animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' } },
 { id: 'e_wa_comms', source: 'whatsapp', target: 'comms', animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' } },
 { id: 'e_tiktok_comms', source: 'tiktok', target: 'comms', animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' } },
 { id: 'e_email_comms', source: 'email', target: 'comms', animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' } },

 // Operational Flow
 { id: 'e_comms_sales', source: 'comms', target: 'sales', animated: true, style: { stroke: '#00ff88' } },
 { id: 'e_sales_supply', source: 'sales', target: 'supply', animated: true, style: { stroke: '#00ff88' } },
 { id: 'e_supply_logistics', source: 'supply', target: 'logistics', animated: true, style: { stroke: '#00ff88' } },
 { id: 'e_logistics_fulfillment', source: 'logistics', target: 'fulfillment', animated: true, style: { stroke: '#00ff88' } },
 { id: 'e_fulfillment_mkt_ai', source: 'fulfillment', target: 'marketing_ai', animated: true, style: { stroke: '#00ff88' } },
 { id: 'e_fulfillment_finance', source: 'fulfillment', target: 'finance', animated: true, style: { stroke: '#00ff88' } },

 // Marketing Subsystem Integration
 { id: 'e_sales_mkt_assets', source: 'sales', target: 'mkt_assets', animated: true, label: 'Product Data Feed', style: { stroke: '#ec4899', strokeDasharray: '5 5' } },
 { id: 'e_mkt_assets_templates', source: 'mkt_assets', target: 'mkt_templates', animated: true, style: { stroke: '#ec4899' } },
 { id: 'e_mkt_templates_campaigns', source: 'mkt_templates', target: 'mkt_campaigns', animated: true, style: { stroke: '#ec4899' } },
 { id: 'e_mkt_campaigns_calendar', source: 'mkt_campaigns', target: 'mkt_calendar', animated: true, style: { stroke: '#ec4899' } },
 { id: 'e_mkt_calendar_publishing', source: 'mkt_calendar', target: 'mkt_publishing', animated: true, style: { stroke: '#ec4899' } },
 { id: 'e_mkt_publishing_connectors', source: 'mkt_publishing', target: 'mkt_connectors', animated: true, style: { stroke: '#ec4899' } },
 { id: 'e_mkt_publishing_analytics', source: 'mkt_publishing', target: 'mkt_analytics', animated: true, style: { stroke: '#ec4899' } },
 
 // Connectors back to Demand Channels (Execution)
 { id: 'e_mkt_connectors_meta', source: 'mkt_connectors', target: 'meta', animated: true, style: { stroke: '#ec4899', strokeDasharray: '2 2' } },
];

export function EmployeePortal() {
 return (
 <ReactFlowProvider>
 <EmployeePortalContent />
 </ReactFlowProvider>
 );
}

type AddProductWizardState = {
  name: string;
  publicSku: string;
  category: InventoryCategory;
  productType: InventoryProductType;
  finish: InventoryFinish | '';
  collection: string;
  description: string;
  supplierId: string;
  unitCostZar: string;
  sellPriceZar: string;
  pricingUnit: InventoryPricingUnit;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  weightKg: string;
  piecesPerPallet: string;
  boxesPerPallet: string;
  palletsPerTruck: string;
  coverageOrientation: CoverageOrientation;
  testResults: ProductTestInputState[];
  latestTestReport: UploadedInventoryFile | null;
  latestTestLaboratoryName: string;
  latestTestMethodStandard: string;
  latestTestReportReference: string;
  latestTestedAt: string;
  latestTestIssuedAt: string;
  primaryImage: UploadedInventoryFile | null;
  galleryImage: UploadedInventoryFile | null;
  faceImage: UploadedInventoryFile | null;
  heroImage: UploadedInventoryFile | null;
  asset25d: UploadedInventoryFile | null;
  asset25dSource: InventoryAssetSource;
  asset3d: UploadedInventoryFile | null;
  asset3dSource: InventoryAssetSource;
  projectImages: UploadedInventoryFile[];
  generatedImages: UploadedInventoryFile[];
  galleryImages: UploadedInventoryFile[];
};

type UploadedInventoryFile = {
  assetId?: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  source?: InventoryAssetSource;
  originalFilename?: string;
  storedFilename?: string;
  storagePath?: string;
  sha256?: string;
  kind?: 'image' | 'video' | 'model' | 'document' | 'other';
};

type ProductTestInputState = {
  type: InventoryProductTestResultType;
  value: string;
  unit: string;
  notes: string;
};

type InventoryDrawerEditState = {
  description: string;
  marketingCopy: string;
  unitCostZar: string;
  sellPriceZar: string;
  pricingUnit: InventoryPricingUnit;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  weightKg: string;
  coverageOrientation: CoverageOrientation;
  specifications: Record<string, string>;
  testResults: ProductTestInputState[];
  latestTestReport: UploadedInventoryFile | null;
  latestTestLaboratoryName: string;
  latestTestMethodStandard: string;
  latestTestReportReference: string;
  latestTestedAt: string;
  latestTestIssuedAt: string;
  primaryImage: UploadedInventoryFile | null;
  galleryImage: UploadedInventoryFile | null;
  faceImage: UploadedInventoryFile | null;
  heroImage: UploadedInventoryFile | null;
  asset25d: UploadedInventoryFile | null;
  asset3d: UploadedInventoryFile | null;
};

type SingleUploadField = 'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d' | 'latestTestReport';
type MultiUploadField = 'projectImages' | 'generatedImages' | 'galleryImages';
type InventoryAssetPickerField = 'primaryImage' | 'galleryImage' | 'faceImage' | 'heroImage' | 'asset25d' | 'asset3d';
type InventoryCollectionPickerField = MultiUploadField;

const IMAGE_UPLOAD_ACCEPT = 'image/*';
const MODEL_UPLOAD_ACCEPT = '.glb,.gltf,.usdz,.obj,.fbx,model/gltf-binary,model/gltf+json';
const PDF_UPLOAD_ACCEPT = '.pdf,application/pdf';

function createUploadedInventoryFile(
  url: string,
  mimeType = 'image/*',
  options?: Partial<Pick<UploadedInventoryFile, 'assetId' | 'source' | 'originalFilename' | 'storedFilename' | 'storagePath' | 'sha256'>>,
): UploadedInventoryFile {
  const filename = url.split('/').pop() || 'asset';
  return {
    assetId: options?.assetId,
    url,
    filename,
    mimeType,
    size: 0,
    source: options?.source,
    originalFilename: options?.originalFilename ?? filename,
    storedFilename: options?.storedFilename,
    storagePath: options?.storagePath,
    sha256: options?.sha256,
  };
}

function toAssetSlotInput(file: UploadedInventoryFile, source: InventoryAssetSource = 'Direct Upload') {
  return {
    assetId: file.assetId,
    url: file.url,
    source: file.source ?? source,
    name: file.filename,
    originalFilename: file.originalFilename ?? file.filename,
    storedFilename: file.storedFilename,
    storagePath: file.storagePath,
    mimeType: file.mimeType,
    fileSizeBytes: file.size,
    sha256: file.sha256,
  };
}

function createUploadedInventoryFileFromAsset(asset: Asset): UploadedInventoryFile {
  const mimeType = asset.storage?.mimeType
    ?? (asset.type === 'Video' ? 'video/*' : asset.type === 'Model' || asset.type === '3D Asset' || asset.type === '2.5D Asset' ? 'model/*' : 'image/*');

  return {
    assetId: asset.id,
    url: asset.img,
    filename: asset.name,
    mimeType,
    size: asset.storage?.fileSizeBytes ?? 0,
    source: 'Asset Library',
    originalFilename: asset.storage?.originalFilename ?? asset.name,
    storedFilename: asset.storage?.storedFilename ?? undefined,
    storagePath: asset.storage?.storagePath ?? undefined,
    sha256: asset.storage?.sha256 ?? undefined,
    kind:
      asset.type === 'Video'
        ? 'video'
        : asset.type === 'Model' || asset.type === '3D Asset' || asset.type === '2.5D Asset'
          ? 'model'
          : 'image',
  };
}

function isAssetCompatibleWithInventorySlot(asset: Asset, field: InventoryAssetPickerField) {
  if (field === 'asset25d') {
    return asset.type === '2.5D Asset';
  }

  if (field === 'asset3d') {
    return asset.type === '3D Asset' || asset.type === 'Model';
  }

  return asset.type === 'Image';
}

function isAssetCompatibleWithInventoryCollection(asset: Asset, field: InventoryCollectionPickerField) {
  if (field === 'generatedImages') {
    return asset.type === 'Image' || asset.type === '3D Render';
  }

  return asset.type === 'Image';
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getDefaultTestInputs(category: InventoryCategory): ProductTestInputState[] {
  if (category === 'Bricks') {
    return [
      { type: 'Compressive Strength (MPa)', value: '', unit: 'MPa', notes: '' },
      { type: 'Water Absorption (%)', value: '', unit: '%', notes: '' },
      { type: 'Tested Length (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Tested Width (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Tested Height (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Dry Mass (kg)', value: '', unit: 'kg', notes: '' },
      { type: 'Wet Mass (kg)', value: '', unit: 'kg', notes: '' },
    ];
  }

  if (category === 'Cladding') {
    return [
      { type: 'Water Absorption (%)', value: '', unit: '%', notes: '' },
      { type: 'Tested Length (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Tested Width (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Tested Height (mm)', value: '', unit: 'mm', notes: '' },
      { type: 'Dry Mass (kg)', value: '', unit: 'kg', notes: '' },
      { type: 'Breaking Load (kN)', value: '', unit: 'kN', notes: '' },
    ];
  }

  return [
    { type: 'Tested Length (mm)', value: '', unit: 'mm', notes: '' },
    { type: 'Tested Width (mm)', value: '', unit: 'mm', notes: '' },
    { type: 'Tested Height (mm)', value: '', unit: 'mm', notes: '' },
    { type: 'Dry Mass (kg)', value: '', unit: 'kg', notes: '' },
  ];
}

function createInventoryDrawerEditState(detail: InventoryProductDetail): InventoryDrawerEditState {
  const slotByRole = (role: string) => detail.media.find((item) => item.role === role);
  const mediaByRole = (role: string) => slotByRole(role)?.img ?? null;

  return {
    description: detail.description,
    marketingCopy: detail.marketingCopy ?? '',
    unitCostZar: detail.pricing.costPriceZar > 0 ? String(detail.pricing.costPriceZar) : '',
    sellPriceZar: detail.pricing.sellPriceZar > 0 ? String(detail.pricing.sellPriceZar) : '',
    pricingUnit: detail.pricing.unit,
    lengthMm: detail.dimensions.lengthMm > 0 ? String(detail.dimensions.lengthMm) : '',
    widthMm: detail.dimensions.widthMm > 0 ? String(detail.dimensions.widthMm) : '',
    heightMm: detail.dimensions.heightMm > 0 ? String(detail.dimensions.heightMm) : '',
    weightKg: detail.dimensions.weightKg > 0 ? String(detail.dimensions.weightKg) : '',
    coverageOrientation: detail.dimensions.coverageOrientation,
    specifications: { ...detail.specifications },
    testResults:
      detail.testResults.length > 0
        ? detail.testResults.map((result) => ({
            type: result.type,
            value: String(result.value),
            unit: result.unit,
            notes: result.notes ?? '',
          }))
        : getDefaultTestInputs(detail.category),
    latestTestReport: detail.latestTestReport.url
      ? {
          url: detail.latestTestReport.url,
          filename: detail.latestTestReport.name ?? detail.latestTestReport.url.split('/').pop() ?? 'lab-report.pdf',
          mimeType: 'application/pdf',
          size: 0,
        }
      : null,
    latestTestLaboratoryName: detail.latestTestReport.laboratoryName ?? '',
    latestTestMethodStandard: detail.latestTestReport.methodStandard ?? '',
    latestTestReportReference: detail.latestTestReport.reportReference ?? '',
    latestTestedAt: toDateInputValue(detail.latestTestReport.testedAt),
    latestTestIssuedAt: toDateInputValue(detail.latestTestReport.issuedAt),
    primaryImage: detail.requiredMedia.primaryImageUrl
      ? createUploadedInventoryFile(detail.requiredMedia.primaryImageUrl, 'image/*', {
          assetId: slotByRole('primary_image')?.id,
          source: slotByRole('primary_image')?.source,
          originalFilename: slotByRole('primary_image')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('primary_image')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('primary_image')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('primary_image')?.storage?.sha256 ?? undefined,
        })
      : null,
    galleryImage: detail.requiredMedia.galleryImageUrl
      ? createUploadedInventoryFile(detail.requiredMedia.galleryImageUrl, 'image/*', {
          assetId: slotByRole('gallery_image')?.id,
          source: slotByRole('gallery_image')?.source,
          originalFilename: slotByRole('gallery_image')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('gallery_image')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('gallery_image')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('gallery_image')?.storage?.sha256 ?? undefined,
        })
      : null,
    faceImage: detail.requiredMedia.faceImageUrl
      ? createUploadedInventoryFile(detail.requiredMedia.faceImageUrl, 'image/*', {
          assetId: slotByRole('face_image')?.id,
          source: slotByRole('face_image')?.source,
          originalFilename: slotByRole('face_image')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('face_image')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('face_image')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('face_image')?.storage?.sha256 ?? undefined,
        })
      : null,
    heroImage: detail.requiredMedia.heroImageUrl
      ? createUploadedInventoryFile(detail.requiredMedia.heroImageUrl, 'image/*', {
          assetId: slotByRole('hero_image')?.id,
          source: slotByRole('hero_image')?.source,
          originalFilename: slotByRole('hero_image')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('hero_image')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('hero_image')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('hero_image')?.storage?.sha256 ?? undefined,
        })
      : null,
    asset25d: mediaByRole('asset_2_5d')
      ? createUploadedInventoryFile(mediaByRole('asset_2_5d')!, 'model/*', {
          assetId: slotByRole('asset_2_5d')?.id,
          source: slotByRole('asset_2_5d')?.source,
          originalFilename: slotByRole('asset_2_5d')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('asset_2_5d')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('asset_2_5d')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('asset_2_5d')?.storage?.sha256 ?? undefined,
        })
      : null,
    asset3d: mediaByRole('asset_3d')
      ? createUploadedInventoryFile(mediaByRole('asset_3d')!, 'model/*', {
          assetId: slotByRole('asset_3d')?.id,
          source: slotByRole('asset_3d')?.source,
          originalFilename: slotByRole('asset_3d')?.storage?.originalFilename ?? undefined,
          storedFilename: slotByRole('asset_3d')?.storage?.storedFilename ?? undefined,
          storagePath: slotByRole('asset_3d')?.storage?.storagePath ?? undefined,
          sha256: slotByRole('asset_3d')?.storage?.sha256 ?? undefined,
        })
      : null,
  };
}

function createInitialAddProductWizardStateFromDetail(detail: InventoryProductDetail): AddProductWizardState {
  const slotByRole = (role: string) => detail.media.find((item) => item.role === role);
  const mediaByRole = (role: string) => slotByRole(role)?.img ?? null;
  const mediaSource = (role: string, fallback: InventoryAssetSource = 'Direct Upload') =>
    slotByRole(role)?.source as InventoryAssetSource | undefined ?? fallback;
  const createRoleFile = (role: string, mimeType = 'image/*') => {
    const slot = slotByRole(role);
    if (!slot?.img) {
      return null;
    }
    return createUploadedInventoryFile(slot.img, mimeType, {
      assetId: slot.id,
      source: slot.source,
      originalFilename: slot.storage?.originalFilename ?? undefined,
      storedFilename: slot.storage?.storedFilename ?? undefined,
      storagePath: slot.storage?.storagePath ?? undefined,
      sha256: slot.storage?.sha256 ?? undefined,
    });
  };
  const createCollectionFile = (item: InventoryProductDetail['media'][number], mimeType = 'image/*') =>
    createUploadedInventoryFile(item.img, mimeType, {
      assetId: item.id,
      source: item.source,
      originalFilename: item.storage?.originalFilename ?? undefined,
      storedFilename: item.storage?.storedFilename ?? undefined,
      storagePath: item.storage?.storagePath ?? undefined,
      sha256: item.storage?.sha256 ?? undefined,
    });

  return {
    name: detail.name,
    publicSku: detail.publicSku,
    category: detail.category,
    productType: detail.productType,
    finish: detail.finish ?? '',
    collection: detail.collection ?? '',
    description: detail.description,
    supplierId: detail.logistics.defaultSupplierId ?? '',
    unitCostZar: detail.pricing.costPriceZar > 0 ? String(detail.pricing.costPriceZar) : '',
    sellPriceZar: detail.pricing.sellPriceZar > 0 ? String(detail.pricing.sellPriceZar) : '',
    pricingUnit: detail.pricing.unit,
    lengthMm: detail.dimensions.lengthMm > 0 ? String(detail.dimensions.lengthMm) : '',
    widthMm: detail.dimensions.widthMm > 0 ? String(detail.dimensions.widthMm) : '',
    heightMm: detail.dimensions.heightMm > 0 ? String(detail.dimensions.heightMm) : '',
    weightKg: detail.dimensions.weightKg > 0 ? String(detail.dimensions.weightKg) : '',
    piecesPerPallet: detail.packaging.piecesPerPallet > 0 ? String(detail.packaging.piecesPerPallet) : '',
    boxesPerPallet: detail.packaging.boxesPerPallet > 0 ? String(detail.packaging.boxesPerPallet) : '',
    palletsPerTruck: detail.packaging.palletsPerTruck > 0 ? String(detail.packaging.palletsPerTruck) : '24',
    coverageOrientation: detail.dimensions.coverageOrientation,
    testResults:
      detail.testResults.length > 0
        ? detail.testResults.map((result) => ({
            type: result.type,
            value: String(result.value),
            unit: result.unit,
            notes: result.notes ?? '',
          }))
        : getDefaultTestInputs(detail.category),
    latestTestReport: detail.latestTestReport.url
      ? {
          url: detail.latestTestReport.url,
          filename: detail.latestTestReport.name ?? detail.latestTestReport.url.split('/').pop() ?? 'lab-report.pdf',
          mimeType: 'application/pdf',
          size: 0,
        }
      : null,
    latestTestLaboratoryName: detail.latestTestReport.laboratoryName ?? '',
    latestTestMethodStandard: detail.latestTestReport.methodStandard ?? '',
    latestTestReportReference: detail.latestTestReport.reportReference ?? '',
    latestTestedAt: toDateInputValue(detail.latestTestReport.testedAt),
    latestTestIssuedAt: toDateInputValue(detail.latestTestReport.issuedAt),
    primaryImage: createRoleFile('primary_image'),
    galleryImage: createRoleFile('gallery_image'),
    faceImage: createRoleFile('face_image'),
    heroImage: createRoleFile('hero_image'),
    asset25d: createRoleFile('asset_2_5d', 'model/*'),
    asset25dSource: mediaSource('asset_2_5d', 'Marketing Tool'),
    asset3d: createRoleFile('asset_3d', 'model/*'),
    asset3dSource: mediaSource('asset_3d', 'Marketing Tool'),
    projectImages: detail.media
      .filter((item) => item.role === 'project_image')
      .map((item) => createCollectionFile(item)),
    generatedImages: detail.media
      .filter((item) => item.role === 'generated_image')
      .map((item) => createCollectionFile(item)),
    galleryImages: detail.media
      .filter((item) => item.role === 'gallery_extra')
      .map((item) => createCollectionFile(item)),
  };
}

function createInitialAddProductWizardState(): AddProductWizardState {
  return {
    name: '',
    publicSku: '',
    category: 'Cladding',
    productType: inventoryProductTypeOptionsByCategory.Cladding[0],
    finish: inventoryFinishOptions[0],
    collection: '',
    description: '',
    supplierId: '',
    unitCostZar: '',
    sellPriceZar: '',
    pricingUnit: pricingUnitOptions[0],
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    weightKg: '',
    piecesPerPallet: '2000',
    boxesPerPallet: '40',
    palletsPerTruck: '24',
    coverageOrientation: coverageOrientationOptions[1],
    testResults: getDefaultTestInputs('Cladding'),
    latestTestReport: null,
    latestTestLaboratoryName: '',
    latestTestMethodStandard: '',
    latestTestReportReference: '',
    latestTestedAt: '',
    latestTestIssuedAt: '',
    primaryImage: null,
    galleryImage: null,
    faceImage: null,
    heroImage: null,
    asset25d: null,
    asset25dSource: 'Marketing Tool',
    asset3d: null,
    asset3dSource: 'Marketing Tool',
    projectImages: [],
    generatedImages: [],
    galleryImages: [],
  };
}

function getWizardCommercialDefaults(category: InventoryCategory) {
  if (category === 'Bricks') {
    return {
      pricingUnit: 'piece' as InventoryPricingUnit,
      piecesPerPallet: '500',
      boxesPerPallet: '',
      palletsPerTruck: '24',
      unitsPerM2: 55,
    };
  }

  if (category === 'Cladding') {
    return {
      pricingUnit: 'm2' as InventoryPricingUnit,
      piecesPerPallet: '2000',
      boxesPerPallet: '40',
      palletsPerTruck: '24',
      unitsPerM2: 50,
    };
  }

  if (category === 'Paving') {
    return {
      pricingUnit: 'piece' as InventoryPricingUnit,
      piecesPerPallet: '360',
      boxesPerPallet: '',
      palletsPerTruck: '24',
      unitsPerM2: 50,
    };
  }

  return {
    pricingUnit: 'piece' as InventoryPricingUnit,
    piecesPerPallet: '100',
    boxesPerPallet: '',
    palletsPerTruck: '24',
    unitsPerM2: 12.5,
  };
}

const UploadSlotCard = ({
  inputId,
  label,
  helper,
  accept,
  uploading,
  required,
  value,
  onSelect,
  onClear,
  onOpenAssetLibrary,
  openAssetLibraryLabel = 'Select from Asset Lab',
  chooseFileLabel,
}: {
  inputId: string;
  label: string;
  helper: string;
  accept: string;
  uploading: boolean;
  required?: boolean;
  value: UploadedInventoryFile | null;
  onSelect: (files: FileList | null) => void;
  onClear: () => void;
  onOpenAssetLibrary?: () => void;
  openAssetLibraryLabel?: string;
  chooseFileLabel?: string;
}) => {
  const isImage = value?.mimeType.startsWith('image/');
  const isPdf = value?.mimeType.includes('pdf');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {value && isImage ? (
            <img src={value.url} alt={label} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/20">
              {isPdf ? <FileText size={18} /> : <Image size={18} />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</span>
            {required ? <span className="text-[9px] font-mono uppercase tracking-widest text-blue-400">Required</span> : null}
          </div>
          <p className="text-xs leading-relaxed text-white/45">{helper}</p>
          <div className="mt-3">
            <div className="truncate text-sm font-medium text-white">{value ? value.filename : 'No file selected'}</div>
            {value ? <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-white/30">{Math.max(1, value.size / 1024).toFixed(0)} KB</div> : null}
            {value?.source ? <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-blue-400/80">{value.source}</div> : null}
          </div>
          <div className="mt-4 flex items-center gap-3">
            {onOpenAssetLibrary ? (
              <button
                type="button"
                onClick={onOpenAssetLibrary}
                className="inline-flex items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
              >
                {openAssetLibraryLabel}
              </button>
            ) : null}
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/65 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              {uploading ? 'Uploading...' : chooseFileLabel ?? (value ? 'Upload New File' : 'Upload File')}
            </label>
            <input
              id={inputId}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(event) => {
                onSelect(event.target.files);
                event.currentTarget.value = '';
              }}
            />
            {value ? (
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] font-bold uppercase tracking-widest text-white/35 transition-colors hover:text-white"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadCollectionField = ({
  inputId,
  label,
  helper,
  accept,
  uploading,
  values,
  onSelect,
  onRemove,
  onOpenAssetLibrary,
  openAssetLibraryLabel = 'Select from Asset Lab',
  chooseFileLabel = 'Upload New Asset',
}: {
  inputId: string;
  label: string;
  helper: string;
  accept: string;
  uploading: boolean;
  values: UploadedInventoryFile[];
  onSelect: (files: FileList | null) => void;
  onRemove: (url: string) => void;
  onOpenAssetLibrary?: () => void;
  openAssetLibraryLabel?: string;
  chooseFileLabel?: string;
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</div>
          <p className="mt-2 text-xs leading-relaxed text-white/45">{helper}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {onOpenAssetLibrary ? (
            <button
              type="button"
              onClick={onOpenAssetLibrary}
              className="inline-flex items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
            >
              {openAssetLibraryLabel}
            </button>
          ) : null}
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/65 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {uploading ? 'Uploading...' : chooseFileLabel}
          </label>
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(event) => {
              onSelect(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </div>
      {values.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {values.map((file) => (
            <div key={file.url} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {file.mimeType.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Box size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{file.filename}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/30">{Math.max(1, file.size / 1024).toFixed(0)} KB</div>
                {file.source ? <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-blue-400/80">{file.source}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(file.url)}
                className="text-[10px] font-bold uppercase tracking-widest text-white/35 transition-colors hover:text-white"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-xs text-white/30">
          No files selected yet.
        </div>
      )}
    </div>
  );
};

const AddProductWizard = ({
  isOpen,
  onClose,
  suppliers,
  assetLibrary,
  mode = 'create',
  initialProductDetail,
  onCreateProduct,
  onUpdateProduct,
  onUploadAssetToLibrary,
}: {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Array<{
    id: string;
    name: string;
    status: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
    leadTime: string;
  }>;
  assetLibrary: Asset[];
  mode?: 'create' | 'edit';
  initialProductDetail?: InventoryProductDetail | null;
  onCreateProduct?: (input: CreateInventoryProductInput) => Promise<void>;
  onUpdateProduct?: (id: string, input: UpdateInventoryProductInput) => Promise<void>;
  onUploadAssetToLibrary: (input: { file: File; productRecordId?: string }) => Promise<Asset>;
}) => {
  const [step, setStep] = useState(1);
  const [productData, setProductData] = useState<AddProductWizardState>(createInitialAddProductWizardState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assetPickerTarget, setAssetPickerTarget] = useState<InventoryAssetPickerField | null>(null);
  const [collectionPickerTarget, setCollectionPickerTarget] = useState<InventoryCollectionPickerField | null>(null);
  const [assetPickerSearch, setAssetPickerSearch] = useState('');
  const [isUploadingAssetToLibrary, setIsUploadingAssetToLibrary] = useState(false);

  const typeOptions = inventoryProductTypeOptionsByCategory[productData.category];
  const finishEnabled = productData.category === 'Cladding' || productData.category === 'Bricks';
  const currentProductRecordId = initialProductDetail?.id;

  const compatibleAssetLibrary = useMemo(() => {
    if (!assetPickerTarget) {
      return [];
    }

    const searchTerm = assetPickerSearch.trim().toLowerCase();

    return assetLibrary.filter((asset) => {
      if (!isAssetCompatibleWithInventorySlot(asset, assetPickerTarget)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [asset.name, asset.productName ?? '', asset.type, ...asset.tags, ...asset.usage]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [assetLibrary, assetPickerSearch, assetPickerTarget]);

  const compatibleCollectionAssetLibrary = useMemo(() => {
    if (!collectionPickerTarget) {
      return [];
    }

    const searchTerm = assetPickerSearch.trim().toLowerCase();

    return assetLibrary.filter((asset) => {
      if (!isAssetCompatibleWithInventoryCollection(asset, collectionPickerTarget)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [asset.name, asset.productName ?? '', asset.type, ...asset.tags, ...asset.usage]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [assetLibrary, assetPickerSearch, collectionPickerTarget]);

  const coveragePreview = useMemo(() => {
    const lengthMm = Number(productData.lengthMm);
    const widthMm = Number(productData.widthMm);
    const heightMm = Number(productData.heightMm);

    if (!lengthMm || !widthMm || !heightMm) {
      return null;
    }

    let faceAreaMm2 = lengthMm * widthMm;
    if (productData.coverageOrientation === 'Length x Height') {
      faceAreaMm2 = lengthMm * heightMm;
    } else if (productData.coverageOrientation === 'Width x Height') {
      faceAreaMm2 = widthMm * heightMm;
    }

    const faceAreaM2 = faceAreaMm2 / 1_000_000;
    const commercialDefaults = getWizardCommercialDefaults(productData.category);
    const unitsPerM2 =
      productData.category === 'Cladding'
        ? (Number(productData.piecesPerPallet) > 0 && Number(productData.boxesPerPallet) > 0
            ? Number(productData.piecesPerPallet) / Number(productData.boxesPerPallet)
            : commercialDefaults.unitsPerM2)
        : productData.category === 'Bricks'
          ? commercialDefaults.unitsPerM2
          : faceAreaM2 > 0
            ? 1 / faceAreaM2
            : commercialDefaults.unitsPerM2;

    return {
      faceAreaM2,
      unitsPerM2,
    };
  }, [productData.boxesPerPallet, productData.category, productData.coverageOrientation, productData.heightMm, productData.lengthMm, productData.piecesPerPallet, productData.widthMm]);

  const reviewBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (!productData.name.trim()) blockers.push('Product name is required');
    if (!productData.publicSku.trim()) blockers.push('Public SKU is required');
    if (!productData.description.trim()) blockers.push('Description is required');
    if (!productData.supplierId.trim()) blockers.push('Linked supplier is required');
    if (!productData.unitCostZar.trim()) blockers.push('Unit cost in ZAR is required');
    if (!productData.lengthMm.trim() || !productData.widthMm.trim() || !productData.heightMm.trim()) blockers.push('Dimensions are required');
    if (!productData.weightKg.trim()) blockers.push('Weight is required');
    if (!productData.piecesPerPallet.trim()) blockers.push('Pieces per pallet is required');
    if (productData.category === 'Cladding' && !productData.boxesPerPallet.trim()) blockers.push('Boxes per pallet is required for cladding');
    if (!productData.palletsPerTruck.trim()) blockers.push('Pallets per truck is required');
    if (!productData.primaryImage) blockers.push('Primary image is required');
    if (!productData.galleryImage) blockers.push('Gallery image is required');
    if (!productData.faceImage) blockers.push('Face image is required');
    if (!coveragePreview) blockers.push('Coverage preview is incomplete');

    return blockers;
  }, [coveragePreview, productData.boxesPerPallet, productData.category, productData.description, productData.faceImage, productData.galleryImage, productData.heightMm, productData.lengthMm, productData.name, productData.palletsPerTruck, productData.piecesPerPallet, productData.primaryImage, productData.publicSku, productData.supplierId, productData.unitCostZar, productData.weightKg, productData.widthMm]);

  const isUploadingField = useCallback((field: string) => uploadingFields.includes(field), [uploadingFields]);

  const applyAssetLibrarySelection = useCallback((field: InventoryAssetPickerField, asset: Asset) => {
    setProductData((current) => ({
      ...current,
      [field]: createUploadedInventoryFileFromAsset(asset),
      ...(field === 'asset25d' ? { asset25dSource: 'Asset Library' as InventoryAssetSource } : {}),
      ...(field === 'asset3d' ? { asset3dSource: 'Asset Library' as InventoryAssetSource } : {}),
    }));
    setAssetPickerTarget(null);
    setAssetPickerSearch('');
  }, []);

  const applyCollectionAssetLibrarySelection = useCallback((field: InventoryCollectionPickerField, asset: Asset) => {
    const selected = createUploadedInventoryFileFromAsset(asset);
    setProductData((current) => ({
      ...current,
      [field]: current[field].some((item) => item.assetId === selected.assetId || item.url === selected.url)
        ? current[field]
        : [...current[field], selected],
    }));
    setCollectionPickerTarget(null);
    setAssetPickerSearch('');
  }, []);

  const handleSingleUpload = useCallback(async (field: SingleUploadField, files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setSubmitError(null);
    setUploadingFields((current) => [...current, field]);

    try {
      if (field !== 'latestTestReport') {
        const asset = await onUploadAssetToLibrary({ file, productRecordId: currentProductRecordId });
        setProductData((current) => ({
          ...current,
          [field]: createUploadedInventoryFileFromAsset(asset),
          ...(field === 'asset25d' ? { asset25dSource: 'Asset Library' as InventoryAssetSource } : {}),
          ...(field === 'asset3d' ? { asset3dSource: 'Asset Library' as InventoryAssetSource } : {}),
        }));
        return;
      }

      const uploaded = await uploadInventoryFile(file);
      setProductData((current) => {
        const next = { ...current };
        next[field] = {
          url: uploaded.url,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          originalFilename: uploaded.originalFilename,
          storedFilename: uploaded.storedFilename,
          storagePath: uploaded.storagePath,
          sha256: uploaded.sha256,
          kind: uploaded.kind,
          source: 'Direct Upload',
        };
        return next;
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to upload file.');
    } finally {
      setUploadingFields((current) => current.filter((entry) => entry !== field));
    }
  }, [currentProductRecordId, onUploadAssetToLibrary]);

  const handleMultiUpload = useCallback(async (field: MultiUploadField, files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setSubmitError(null);
    setUploadingFields((current) => [...current, field]);

    try {
      const uploadedAssets = await Promise.all(selectedFiles.map((file) => onUploadAssetToLibrary({ file, productRecordId: currentProductRecordId })));
      setProductData((current) => {
        const next = { ...current };
        next[field] = [
          ...current[field],
          ...uploadedAssets.map((asset) => createUploadedInventoryFileFromAsset(asset)),
        ];
        return next;
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to upload files.');
    } finally {
      setUploadingFields((current) => current.filter((entry) => entry !== field));
    }
  }, [currentProductRecordId, onUploadAssetToLibrary]);

  const handleUploadAssetToLibraryFromPicker = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || (!assetPickerTarget && !collectionPickerTarget)) {
      return;
    }

    setSubmitError(null);
    setIsUploadingAssetToLibrary(true);

    try {
      const asset = await onUploadAssetToLibrary({ file, productRecordId: currentProductRecordId });
      if (assetPickerTarget) {
        applyAssetLibrarySelection(assetPickerTarget, asset);
      } else if (collectionPickerTarget) {
        applyCollectionAssetLibrarySelection(collectionPickerTarget, asset);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to upload asset to Asset Lab.');
    } finally {
      setIsUploadingAssetToLibrary(false);
    }
  }, [applyAssetLibrarySelection, applyCollectionAssetLibrarySelection, assetPickerTarget, collectionPickerTarget, currentProductRecordId, onUploadAssetToLibrary]);

  const clearSingleUpload = useCallback((field: SingleUploadField) => {
    setProductData((current) => {
      const next = { ...current };
      next[field] = null;
      return next;
    });
  }, []);

  const removeMultiUpload = useCallback((field: MultiUploadField, url: string) => {
    setProductData((current) => {
      const next = { ...current };
      next[field] = current[field].filter((file) => file.url !== url);
      return next;
    });
  }, []);

  const validateStep = useCallback(() => {
    if (step === 1) {
      if (!productData.name.trim() || !productData.publicSku.trim() || !productData.description.trim() || !productData.supplierId.trim()) {
        setSubmitError('Complete the product identity, description, and supplier before continuing.');
        return false;
      }
    }

    if (step === 2) {
      if (
        !productData.unitCostZar.trim() ||
        !productData.lengthMm.trim() ||
        !productData.widthMm.trim() ||
        !productData.heightMm.trim() ||
        !productData.weightKg.trim() ||
        !productData.piecesPerPallet.trim() ||
        (productData.category === 'Cladding' && !productData.boxesPerPallet.trim()) ||
        !productData.palletsPerTruck.trim() ||
        !coveragePreview
      ) {
        setSubmitError('Complete the commercial, dimension, and calculator fields before continuing.');
        return false;
      }
    }

    if (step === 3) {
      if (!productData.primaryImage || !productData.galleryImage || !productData.faceImage) {
        setSubmitError('Primary, gallery, and face images are required before the product can be created.');
        return false;
      }
    }

    setSubmitError(null);
    return true;
  }, [coveragePreview, productData.boxesPerPallet, productData.category, productData.description, productData.faceImage, productData.galleryImage, productData.heightMm, productData.lengthMm, productData.name, productData.palletsPerTruck, productData.piecesPerPallet, productData.primaryImage, productData.publicSku, productData.supplierId, productData.unitCostZar, productData.weightKg, productData.widthMm, step]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setSubmitError(null);
    setIsSubmitting(false);
    setUploadingFields([]);
    setAssetPickerTarget(null);
    setCollectionPickerTarget(null);
    setAssetPickerSearch('');
    setIsUploadingAssetToLibrary(false);
    setProductData(initialProductDetail ? createInitialAddProductWizardStateFromDetail(initialProductDetail) : createInitialAddProductWizardState());
  }, [initialProductDetail, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Product Wizard</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex h-1 bg-white/5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`flex-1 transition-all duration-500 ${s <= step ? 'bg-blue-400' : 'bg-transparent'}`} 
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-10 min-h-[520px]">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Product Name</label>
                    <input 
                      type="text" 
                      value={productData.name}
                      onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. Emerald Glaze Brick"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Public SKU</label>
                    <input 
                      type="text" 
                      value={productData.publicSku}
                      onChange={(e) => setProductData({ ...productData, publicSku: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="BTS-BRK-NFX-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category</label>
                    <select 
                      value={productData.category}
                      onChange={(e) => {
                        const nextCategory = e.target.value as (typeof inventoryCategoryOptions)[number];
                        const defaults = getWizardCommercialDefaults(nextCategory);
                        setProductData((current) => ({
                          ...current,
                          category: nextCategory,
                          productType: inventoryProductTypeOptionsByCategory[nextCategory][0] as InventoryProductType,
                          finish: nextCategory === 'Cladding' || nextCategory === 'Bricks' ? current.finish : '',
                          pricingUnit: defaults.pricingUnit,
                          piecesPerPallet: defaults.piecesPerPallet,
                          boxesPerPallet: defaults.boxesPerPallet,
                          palletsPerTruck: defaults.palletsPerTruck,
                          coverageOrientation: (nextCategory === 'Paving' ? 'Length x Width' : 'Length x Height') as CoverageOrientation,
                          testResults: getDefaultTestInputs(nextCategory),
                        }));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                    >
                      {inventoryCategoryOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Type</label>
                    <select
                      value={productData.productType}
                      onChange={(e) => setProductData({ ...productData, productType: e.target.value as InventoryProductType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                    >
                      {typeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Finish</label>
                    <select
                      value={productData.finish}
                      onChange={(e) => setProductData({ ...productData, finish: e.target.value as InventoryFinish | '' })}
                      disabled={!finishEnabled}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none disabled:opacity-40"
                    >
                      <option value="">Not applicable</option>
                      {inventoryFinishOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Linked Supplier</label>
                    <select
                      value={productData.supplierId}
                      onChange={(e) => setProductData({ ...productData, supplierId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} · {supplier.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Collection / Range</label>
                  <input
                    type="text"
                    value={productData.collection}
                    onChange={(e) => setProductData({ ...productData, collection: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                    placeholder="Optional range or collection"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={3}
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors resize-none"
                    placeholder="Describe the product's aesthetic and technical qualities..."
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Unit Cost (ZAR)</label>
                    <input 
                      type="number" 
                      value={productData.unitCostZar}
                      onChange={(e) => setProductData({ ...productData, unitCostZar: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Sell Price (ZAR)</label>
                    <input
                      type="number"
                      value={productData.sellPriceZar}
                      onChange={(e) => setProductData({ ...productData, sellPriceZar: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="Optional selling price"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Pricing Unit</label>
                    <select 
                      value={productData.pricingUnit}
                      onChange={(e) => setProductData({ ...productData, pricingUnit: e.target.value as InventoryPricingUnit })}
                      disabled={productData.category === 'Bricks' || productData.category === 'Cladding'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none disabled:opacity-40"
                    >
                      {pricingUnitOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Coverage Face</label>
                    <select
                      value={productData.coverageOrientation}
                      onChange={(e) => setProductData({ ...productData, coverageOrientation: e.target.value as CoverageOrientation })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                    >
                      {coverageOrientationOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Length (mm)</label>
                    <input 
                      type="number" 
                      value={productData.lengthMm}
                      onChange={(e) => setProductData({ ...productData, lengthMm: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="215"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Width (mm)</label>
                    <input
                      type="number"
                      value={productData.widthMm}
                      onChange={(e) => setProductData({ ...productData, widthMm: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="102.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Height (mm)</label>
                    <input
                      type="number"
                      value={productData.heightMm}
                      onChange={(e) => setProductData({ ...productData, heightMm: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="65"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={productData.weightKg}
                      onChange={(e) => setProductData({ ...productData, weightKg: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. 2.4"
                    />
                  </div>
                </div>
                <div className={`grid gap-6 ${productData.category === 'Cladding' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Pieces Per Pallet</label>
                    <input
                      type="number"
                      value={productData.piecesPerPallet}
                      onChange={(e) => setProductData({ ...productData, piecesPerPallet: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. 500"
                    />
                  </div>
                  {productData.category === 'Cladding' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Boxes Per Pallet</label>
                      <input
                        type="number"
                        value={productData.boxesPerPallet}
                        onChange={(e) => setProductData({ ...productData, boxesPerPallet: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="e.g. 40"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Pallets Per Truck</label>
                    <input
                      type="number"
                      value={productData.palletsPerTruck}
                      onChange={(e) => setProductData({ ...productData, palletsPerTruck: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. 24"
                    />
                  </div>
                </div>
                <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 grid gap-4 ${productData.category === 'Cladding' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Coverage Face</div>
                    <div className="text-sm font-medium text-white">{productData.coverageOrientation}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Face Area</div>
                    <div className="text-sm font-medium text-white">{coveragePreview ? `${coveragePreview.faceAreaM2.toFixed(4)} m²` : 'Pending'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Units / m²</div>
                    <div className="text-sm font-medium text-blue-400">{coveragePreview ? coveragePreview.unitsPerM2.toFixed(2) : 'Pending'}</div>
                  </div>
                  {productData.category === 'Cladding' && (
                    <div>
                      <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Box Rule</div>
                      <div className="text-sm font-medium text-white">1 box = 1 m²</div>
                    </div>
                  )}
                </div>
                <div className={`grid gap-4 ${productData.category === 'Cladding' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">Pieces / Pallet</div>
                    <div className="mt-2 text-lg font-bold text-white">{productData.piecesPerPallet || 'Pending'}</div>
                  </div>
                  {productData.category === 'Cladding' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">Boxes / Pallet</div>
                      <div className="mt-2 text-lg font-bold text-white">{productData.boxesPerPallet || 'Pending'}</div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">Pallets / Truck</div>
                    <div className="mt-2 text-lg font-bold text-white">{productData.palletsPerTruck || 'Pending'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">Pieces / Truck</div>
                    <div className="mt-2 text-lg font-bold text-blue-400">
                      {productData.piecesPerPallet && productData.palletsPerTruck
                        ? Number(productData.piecesPerPallet) * Number(productData.palletsPerTruck)
                        : 'Pending'}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-400/5 border border-blue-400/10 rounded-2xl">
                  <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Inventory Mode</div>
                  <p className="text-sm text-white/60">This SKU is supplier-backed and procured when a quote is paid. Reorder point is fixed at zero, and quote logic will derive per-piece, per-pallet, per-truck, and per-m² values from the stored packaging data.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div>
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Latest Test Results</div>
                    <p className="mt-2 text-sm text-white/45">
                      Enter the current approved lab values here, or attach the latest PDF report. These values feed the public spec sheet and technical sales surfaces.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {productData.testResults.map((result, index) => (
                      <div key={`${result.type}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">{result.type}</div>
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="number"
                            step="0.01"
                            value={result.value}
                            onChange={(event) =>
                              setProductData((current) => ({
                                ...current,
                                testResults: current.testResults.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, value: event.target.value } : entry,
                                ),
                              }))
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                            placeholder="Enter value"
                          />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">{result.unit}</span>
                        </div>
                        <input
                          type="text"
                          value={result.notes}
                          onChange={(event) =>
                            setProductData((current) => ({
                              ...current,
                              testResults: current.testResults.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, notes: event.target.value } : entry,
                              ),
                            }))
                          }
                          className="mt-3 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                          placeholder="Optional note"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Laboratory</label>
                      <input
                        type="text"
                        value={productData.latestTestLaboratoryName}
                        onChange={(e) => setProductData({ ...productData, latestTestLaboratoryName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="e.g. Clay Performance Lab"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Test Standard</label>
                      <input
                        type="text"
                        value={productData.latestTestMethodStandard}
                        onChange={(e) => setProductData({ ...productData, latestTestMethodStandard: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="e.g. SANS 227"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Report Reference</label>
                      <input
                        type="text"
                        value={productData.latestTestReportReference}
                        onChange={(e) => setProductData({ ...productData, latestTestReportReference: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="e.g. LAB-BRK-205-2026-02"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Tested At</label>
                      <input
                        type="date"
                        value={productData.latestTestedAt}
                        onChange={(e) => setProductData({ ...productData, latestTestedAt: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Issued At</label>
                      <input
                        type="date"
                        value={productData.latestTestIssuedAt}
                        onChange={(e) => setProductData({ ...productData, latestTestIssuedAt: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Latest Report PDF</label>
                      <UploadSlotCard
                        inputId="inventory-latest-test-report"
                        label="Lab Report PDF"
                        helper="Optional upload of the most recent test report PDF for architect and site downloads."
                        accept={PDF_UPLOAD_ACCEPT}
                        uploading={isUploadingField('latestTestReport')}
                        value={productData.latestTestReport}
                        onSelect={(files) => {
                          void handleSingleUpload('latestTestReport', files);
                        }}
                        onClear={() => clearSingleUpload('latestTestReport')}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="bg-blue-400/5 border border-blue-400/10 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white uppercase tracking-tight">Required Media Slots</h3>
                  <p className="text-sm text-white/40 mt-2">Assign approved media from Asset Lab first. If the source does not exist yet, upload it here and the wizard will store it in Asset Lab before assigning the slot.</p>
                </div>
                <div className="space-y-6">
                  <UploadSlotCard
                    inputId="inventory-primary-image"
                    label="Primary Image"
                    helper="Used for the main product card, drawer thumbnail, and default hero fallback."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('primaryImage')}
                    required
                    value={productData.primaryImage}
                    onOpenAssetLibrary={() => setAssetPickerTarget('primaryImage')}
                    onSelect={(files) => {
                      void handleSingleUpload('primaryImage', files);
                    }}
                    onClear={() => clearSingleUpload('primaryImage')}
                  />
                  <UploadSlotCard
                    inputId="inventory-gallery-image"
                    label="Gallery Image"
                    helper="Used for gallery browsing and alternate storefront coverage."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('galleryImage')}
                    required
                    value={productData.galleryImage}
                    onOpenAssetLibrary={() => setAssetPickerTarget('galleryImage')}
                    onSelect={(files) => {
                      void handleSingleUpload('galleryImage', files);
                    }}
                    onClear={() => clearSingleUpload('galleryImage')}
                  />
                  <UploadSlotCard
                    inputId="inventory-face-image"
                    label="Single Face Image"
                    helper="Used for face texture, calculator context, and close-up product review."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('faceImage')}
                    required
                    value={productData.faceImage}
                    onOpenAssetLibrary={() => setAssetPickerTarget('faceImage')}
                    onSelect={(files) => {
                      void handleSingleUpload('faceImage', files);
                    }}
                    onClear={() => clearSingleUpload('faceImage')}
                  />
                </div>
                {submitError && (
                  <p className="text-xs text-red-400 text-center">{submitError}</p>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <UploadSlotCard
                    inputId="inventory-hero-image"
                    label="Hero Image"
                    helper="Optional premium storefront image. Assign from Asset Lab, or upload and store it there before using it."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('heroImage')}
                    value={productData.heroImage}
                    onOpenAssetLibrary={() => setAssetPickerTarget('heroImage')}
                    onSelect={(files) => {
                      void handleSingleUpload('heroImage', files);
                    }}
                    onClear={() => clearSingleUpload('heroImage')}
                  />
                  <UploadSlotCard
                    inputId="inventory-asset-25d"
                    label="2.5D Asset"
                    helper="Assign a prepared 2.5D asset from Asset Lab, or upload one and store it there for reuse."
                    accept={`${IMAGE_UPLOAD_ACCEPT},.psd,.tif,.tiff`}
                    uploading={isUploadingField('asset25d')}
                    value={productData.asset25d}
                    onOpenAssetLibrary={() => setAssetPickerTarget('asset25d')}
                    onSelect={(files) => {
                      void handleSingleUpload('asset25d', files);
                    }}
                    onClear={() => clearSingleUpload('asset25d')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <UploadSlotCard
                    inputId="inventory-asset-3d"
                    label="3D Asset"
                    helper="Assign the source 3D model from Asset Lab, or upload it here and store it there for downstream reuse."
                    accept={MODEL_UPLOAD_ACCEPT}
                    uploading={isUploadingField('asset3d')}
                    value={productData.asset3d}
                    onOpenAssetLibrary={() => setAssetPickerTarget('asset3d')}
                    onSelect={(files) => {
                      void handleSingleUpload('asset3d', files);
                    }}
                    onClear={() => clearSingleUpload('asset3d')}
                  />
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Asset Follow-on Workflow</div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      If 2.5D or 3D is missing at create time, save the draft and continue in Asset Lab or the marketing tool to generate and attach the assets.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <UploadCollectionField
                    inputId="inventory-gallery-extras"
                    label="Extra Gallery Images"
                    helper="Assign extra gallery assets from Asset Lab, or upload them here so they are stored there before reuse."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('galleryImages')}
                    values={productData.galleryImages}
                    onOpenAssetLibrary={() => setCollectionPickerTarget('galleryImages')}
                    onSelect={(files) => {
                      void handleMultiUpload('galleryImages', files);
                    }}
                    onRemove={(url) => removeMultiUpload('galleryImages', url)}
                  />
                  <UploadCollectionField
                    inputId="inventory-project-images"
                    label="Project Images"
                    helper="Assign installation and project imagery from Asset Lab, or upload and store it there first."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('projectImages')}
                    values={productData.projectImages}
                    onOpenAssetLibrary={() => setCollectionPickerTarget('projectImages')}
                    onSelect={(files) => {
                      void handleMultiUpload('projectImages', files);
                    }}
                    onRemove={(url) => removeMultiUpload('projectImages', url)}
                  />
                  <UploadCollectionField
                    inputId="inventory-generated-images"
                    label="Generated Images"
                    helper="Assign studio-generated publishable assets from Asset Lab, or upload them here and store them there first."
                    accept={IMAGE_UPLOAD_ACCEPT}
                    uploading={isUploadingField('generatedImages')}
                    values={productData.generatedImages}
                    onOpenAssetLibrary={() => setCollectionPickerTarget('generatedImages')}
                    onSelect={(files) => {
                      void handleMultiUpload('generatedImages', files);
                    }}
                    onRemove={(url) => removeMultiUpload('generatedImages', url)}
                  />
                </div>
                {submitError && (
                  <p className="text-xs text-red-400 text-center">{submitError}</p>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="bg-blue-400/5 border border-blue-400/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 size={18} className="text-blue-400" />
                    <h3 className="text-xl font-medium text-white uppercase tracking-tight">Review Product Draft</h3>
                  </div>
                  <p className="text-sm text-white/40">
                    {mode === 'edit'
                      ? 'Save deterministic product data changes without altering the surrounding portal shell.'
                      : 'This product will be created as a draft and remain supplier-backed with quote-paid procurement.'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Availability</div>
                    <div className="text-lg font-bold text-white">Dropship</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Reorder Point</div>
                    <div className="text-lg font-bold text-blue-400">0</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Coverage</div>
                    <div className="text-lg font-bold text-amber-400">{coveragePreview ? `${coveragePreview.unitsPerM2.toFixed(2)}/m²` : 'Pending'}</div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Readiness blockers</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${reviewBlockers.length === 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                      {reviewBlockers.length === 0 ? 'Ready to create' : `${reviewBlockers.length} remaining`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(reviewBlockers.length === 0 ? ['No blockers remaining'] : reviewBlockers).map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${reviewBlockers.length === 0 ? 'bg-blue-400/10 text-blue-400' : 'bg-amber-400/10 text-amber-400'}`}>
                          <CheckCircle2 size={12} />
                        </div>
                        <span className="text-xs text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {submitError && (
                  <p className="text-xs text-red-400 text-center">{submitError}</p>
                )}
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {assetPickerTarget || collectionPickerTarget ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                onClick={() => {
                  if (isUploadingAssetToLibrary) {
                    return;
                  }
                  setAssetPickerTarget(null);
                  setCollectionPickerTarget(null);
                  setAssetPickerSearch('');
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Asset Lab Assignment</p>
                      <h3 className="mt-2 text-2xl font-serif font-bold uppercase tracking-tighter text-white">
                        {collectionPickerTarget === 'galleryImages'
                          ? 'Add Extra Gallery Assets'
                          : collectionPickerTarget === 'projectImages'
                            ? 'Add Project Assets'
                            : collectionPickerTarget === 'generatedImages'
                              ? 'Add Generated Assets'
                              : assetPickerTarget === 'asset25d'
                            ? 'Assign 2.5D Asset'
                            : assetPickerTarget === 'asset3d'
                              ? 'Assign 3D Asset'
                              : 'Assign Media Asset'}
                      </h3>
                      <p className="mt-2 text-xs text-white/45">
                        Choose a compatible asset from Asset Lab so the wizard reuses the correct source media, provenance, and storage metadata.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAssetPickerTarget(null);
                        setCollectionPickerTarget(null);
                        setAssetPickerSearch('');
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/40 transition-colors hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input
                          type="text"
                          value={assetPickerSearch}
                          onChange={(event) => setAssetPickerSearch(event.target.value)}
                          placeholder="Search Asset Lab..."
                          className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-blue-400/40"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="inventory-wizard-asset-lab-upload"
                          type="file"
                          accept={assetPickerTarget === 'asset25d' || assetPickerTarget === 'asset3d' ? MODEL_UPLOAD_ACCEPT : IMAGE_UPLOAD_ACCEPT}
                          className="sr-only"
                          onChange={(event) => {
                            void handleUploadAssetToLibraryFromPicker(event.target.files);
                            event.currentTarget.value = '';
                          }}
                        />
                        <label
                          htmlFor="inventory-wizard-asset-lab-upload"
                          className="inline-flex cursor-pointer items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-400/40 hover:bg-blue-400/15"
                        >
                          {isUploadingAssetToLibrary ? 'Uploading...' : 'Upload New Asset'}
                        </label>
                      </div>
                    </div>

                    <div className="grid max-h-[56vh] grid-cols-1 gap-4 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-2 xl:grid-cols-3">
                      {(collectionPickerTarget ? compatibleCollectionAssetLibrary : compatibleAssetLibrary).length > 0 ? (
                        (collectionPickerTarget ? compatibleCollectionAssetLibrary : compatibleAssetLibrary).map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              if (collectionPickerTarget) {
                                applyCollectionAssetLibrarySelection(collectionPickerTarget, asset);
                                return;
                              }
                              if (assetPickerTarget) {
                                applyAssetLibrarySelection(assetPickerTarget, asset);
                              }
                            }}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:border-blue-400/20 hover:bg-white/[0.07]"
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-black/40">
                              {asset.type === 'Video' ? (
                                <video src={asset.img} className="h-full w-full object-cover" muted playsInline />
                              ) : (
                                <img src={asset.img} alt={asset.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              )}
                            </div>
                            <div className="space-y-3 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-white">{asset.name}</p>
                                  <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">{asset.type}</p>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-blue-400">
                                  {asset.protectionLevel}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {asset.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-white/45">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-white/30">
                                <span>{asset.productName ?? 'Shared Library'}</span>
                                <span>{asset.status}</span>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                          <p className="text-sm text-white/60">No compatible assets found for this assignment.</p>
                          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
                            Upload a new asset above to store it in Asset Lab and assign it immediately.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Footer */}
          <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <button 
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                step === 1 ? 'text-white/10 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Back
            </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (step < 5) {
                    if (!validateStep()) {
                      return;
                    }
                    setStep(step + 1);
                    return;
                  }

                  if (reviewBlockers.length > 0 || !coveragePreview) {
                    setSubmitError(`Resolve the remaining blockers before ${mode === 'edit' ? 'saving' : 'creating'} this product.`);
                    return;
                  }

                  if (uploadingFields.length > 0) {
                    setSubmitError('Wait for the current file uploads to finish before creating the product.');
                    return;
                  }

                  setIsSubmitting(true);
                  setSubmitError(null);

                  try {
                    const createPayload: CreateInventoryProductInput = {
                      name: productData.name.trim(),
                      publicSku: productData.publicSku.trim(),
                      category: productData.category,
                      productType: productData.productType,
                      finish: finishEnabled && productData.finish ? productData.finish : null,
                      collection: productData.collection.trim() || null,
                      description: productData.description.trim(),
                      linkedSupplierId: productData.supplierId,
                      unitCostZar: Number(productData.unitCostZar),
                      sellPriceZar: productData.sellPriceZar ? Number(productData.sellPriceZar) : undefined,
                      pricingUnit: productData.pricingUnit,
                      dimensions: {
                        lengthMm: Number(productData.lengthMm),
                        widthMm: Number(productData.widthMm),
                        heightMm: Number(productData.heightMm),
                        weightKg: Number(productData.weightKg),
                        coverageOrientation: productData.coverageOrientation,
                      },
                      packaging: {
                        piecesPerPallet: Number(productData.piecesPerPallet),
                        boxesPerPallet: productData.boxesPerPallet ? Number(productData.boxesPerPallet) : undefined,
                        palletsPerTruck: Number(productData.palletsPerTruck),
                      },
                      testResults: productData.testResults
                        .filter((result) => result.value.trim())
                        .map((result) => ({
                          type: result.type,
                          value: Number(result.value),
                          unit: result.unit.trim(),
                          notes: result.notes.trim() || undefined,
                        })),
                      latestTestReport: productData.latestTestReport
                        ? toAssetSlotInput(productData.latestTestReport)
                        : null,
                      latestTestLaboratoryName: productData.latestTestLaboratoryName.trim() || null,
                      latestTestMethodStandard: productData.latestTestMethodStandard.trim() || null,
                      latestTestReportReference: productData.latestTestReportReference.trim() || null,
                      latestTestedAt: productData.latestTestedAt || null,
                      latestTestIssuedAt: productData.latestTestIssuedAt || null,
                      primaryImage: toAssetSlotInput(productData.primaryImage!),
                      galleryImage: toAssetSlotInput(productData.galleryImage!),
                      faceImage: toAssetSlotInput(productData.faceImage!),
                      heroImage: productData.heroImage ? toAssetSlotInput(productData.heroImage) : undefined,
                      asset2_5d: productData.asset25d ? toAssetSlotInput(productData.asset25d) : undefined,
                      asset3d: productData.asset3d ? toAssetSlotInput(productData.asset3d) : undefined,
                      projectImages: productData.projectImages.map((file) => toAssetSlotInput(file, 'Community Submission')),
                      generatedImages: productData.generatedImages.map((file) => toAssetSlotInput(file, 'Studio Published')),
                      galleryImages: productData.galleryImages.map((file) => toAssetSlotInput(file)),
                    };

                    if (mode === 'edit') {
                      if (!initialProductDetail || !onUpdateProduct) {
                        throw new Error('Edit mode is not configured correctly.');
                      }

                      await onUpdateProduct(initialProductDetail.id, {
                        publicSku: createPayload.publicSku,
                        name: createPayload.name,
                        category: createPayload.category,
                        productType: createPayload.productType,
                        finish: createPayload.finish,
                        collection: createPayload.collection,
                        description: createPayload.description,
                        linkedSupplierId: createPayload.linkedSupplierId,
                        unitCostZar: createPayload.unitCostZar,
                        sellPriceZar: createPayload.sellPriceZar ?? null,
                        pricingUnit: createPayload.pricingUnit,
                        primaryImage: createPayload.primaryImage,
                        galleryImage: createPayload.galleryImage,
                        faceImage: createPayload.faceImage,
                        heroImage: createPayload.heroImage ?? null,
                        asset2_5d: createPayload.asset2_5d ?? null,
                        asset3d: createPayload.asset3d ?? null,
                        projectImages: createPayload.projectImages,
                        generatedImages: createPayload.generatedImages,
                        galleryImages: createPayload.galleryImages,
                        dimensions: createPayload.dimensions,
                        packaging: createPayload.packaging,
                        testResults: createPayload.testResults,
                        latestTestReport: createPayload.latestTestReport,
                        latestTestLaboratoryName: createPayload.latestTestLaboratoryName,
                        latestTestMethodStandard: createPayload.latestTestMethodStandard,
                        latestTestReportReference: createPayload.latestTestReportReference,
                        latestTestedAt: createPayload.latestTestedAt,
                        latestTestIssuedAt: createPayload.latestTestIssuedAt,
                        specifications: {
                          Category: createPayload.category,
                          Type: createPayload.productType,
                          ...(createPayload.finish ? { Finish: createPayload.finish } : {}),
                        },
                      });
                    } else {
                      if (!onCreateProduct) {
                        throw new Error('Create mode is not configured correctly.');
                      }

                      await onCreateProduct(createPayload);
                    }
                    onClose();
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : `Failed to ${mode === 'edit' ? 'update' : 'create'} product.`);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || uploadingFields.length > 0}
                className="px-8 py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]"
              >
                {isSubmitting
                  ? mode === 'edit'
                    ? 'Saving...'
                    : 'Creating...'
                  : uploadingFields.length > 0
                    ? 'Uploading...'
                    : step === 5
                      ? mode === 'edit'
                        ? 'Save Changes'
                        : 'Create Product'
                      : 'Next Step'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ImportPriceListWizard = ({
  isOpen,
  onClose,
  onImportPriceList,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImportPriceList: (input: CreatePriceListImportInput) => Promise<unknown>;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(null);
    }
  }, [isOpen]);

  const normalizeRows = useCallback((rows: Record<string, unknown>[]) => {
    return rows
      .map((row) => {
        const normalized = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]),
        );

        const category = String(
          normalized.category ??
            normalized.productcategory ??
            normalized.product_category ??
            'Bricks',
        ).trim() || 'Bricks';

        const productType = String(
          normalized.producttype ??
            normalized.product_type ??
            normalized.type ??
            'NFX',
        )
          .trim()
          .replace(/interlocing/i, 'Interlocking') || 'NFX';

        const tagsValue = normalized.tags;
        const tags = Array.isArray(tagsValue)
          ? tagsValue.map((value) => String(value))
          : typeof tagsValue === 'string'
          ? tagsValue.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined;

        const sellPriceValue = normalized.sellpricezar ?? normalized.sell_price_zar ?? normalized.sellprice ?? normalized.sell_price ?? normalized.price;
        const unitCostValue = normalized.unitcostzar ?? normalized.unit_cost_zar ?? normalized.unitcost ?? normalized.unit_cost ?? normalized.cost;

        return {
          publicSku: String(normalized.publicsku ?? normalized.public_sku ?? normalized.sku ?? '').trim(),
          name: String(normalized.name ?? '').trim(),
          category,
          productType,
          finish: String(normalized.finish ?? '').trim() || undefined,
          collection: String(normalized.collection ?? normalized.range ?? '').trim() || undefined,
          description: String(normalized.description ?? '').trim() || undefined,
          sellPriceZar: sellPriceValue !== undefined && sellPriceValue !== '' ? Number(sellPriceValue) : undefined,
          unitCostZar: unitCostValue !== undefined && unitCostValue !== '' ? Number(unitCostValue) : undefined,
          linkedSupplierId: String(normalized.linkedsupplierid ?? normalized.linked_supplier_id ?? normalized.supplierid ?? normalized.supplier ?? '').trim() || undefined,
          pricingUnit: String(normalized.pricingunit ?? normalized.pricing_unit ?? normalized.unit ?? 'm2').trim() || 'm2',
          lengthMm: normalized.lengthmm !== undefined && normalized.lengthmm !== '' ? Number(normalized.lengthmm) : undefined,
          widthMm: normalized.widthmm !== undefined && normalized.widthmm !== '' ? Number(normalized.widthmm) : undefined,
          heightMm: normalized.heightmm !== undefined && normalized.heightmm !== '' ? Number(normalized.heightmm) : undefined,
          weightKg: normalized.weightkg !== undefined && normalized.weightkg !== '' ? Number(normalized.weightkg) : undefined,
          piecesPerPallet:
            normalized.piecesperpallet !== undefined && normalized.piecesperpallet !== ''
              ? Number(normalized.piecesperpallet)
              : undefined,
          boxesPerPallet:
            normalized.boxesperpallet !== undefined && normalized.boxesperpallet !== ''
              ? Number(normalized.boxesperpallet)
              : undefined,
          palletsPerTruck:
            normalized.palletspertruck !== undefined && normalized.palletspertruck !== ''
              ? Number(normalized.palletspertruck)
              : undefined,
          primaryImageUrl: String(normalized.primaryimageurl ?? normalized.primary_image_url ?? '').trim() || undefined,
          galleryImageUrl: String(normalized.galleryimageurl ?? normalized.gallery_image_url ?? '').trim() || undefined,
          faceImageUrl: String(normalized.faceimageurl ?? normalized.face_image_url ?? '').trim() || undefined,
          heroImageUrl: String(normalized.heroimageurl ?? normalized.hero_image_url ?? '').trim() || undefined,
          tags,
        };
      })
      .filter((row) => row.publicSku && row.name);
  }, []);

  const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let rows: CreatePriceListImportInput['rows'] = [];

      if (extension === 'json') {
        const text = await file.text();
        const payload = JSON.parse(text);
        const inputRows = Array.isArray(payload) ? payload : Array.isArray(payload.rows) ? payload.rows : [];
        rows = normalizeRows(inputRows as Record<string, unknown>[]);
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
        rows = normalizeRows(sheetRows);
      }

      if (rows.length === 0) {
        throw new Error('No valid SKU rows were found in the selected file.');
      }

      setUploadProgress(45);
      await onImportPriceList({
        fileName: file.name,
        sourceType: extension === 'json' ? 'json' : extension === 'xlsx' ? 'xlsx' : 'csv',
        rows,
      });
      setUploadProgress(100);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to import the selected file.');
      setIsUploading(false);
      setUploadProgress(0);
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [normalizeRows, onClose, onImportPriceList]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download size={12} className="text-blue-400" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Data Import</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Import Price List</h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 text-center">
            {!isUploading ? (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-blue-400/5 border border-dashed border-blue-400/30 rounded-2xl flex items-center justify-center text-blue-400 mx-auto group hover:border-blue-400 transition-colors cursor-pointer">
                  <Plus size={32} className="group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white uppercase tracking-tight">Drop Price List Here</h3>
                  <p className="text-sm text-white/40 mt-2">Support for .csv, .xlsx, and .json with category, type, dimensions, supplier, and optional media columns.</p>
                  {uploadError && <p className="text-xs text-red-400 mt-3">{uploadError}</p>}
                </div>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                  >
                    Select File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.json"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-10">
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="48" cy="48" r="40" 
                      stroke="currentColor" strokeWidth="4" fill="transparent"
                      className="text-white/5"
                    />
                    <circle 
                      cx="48" cy="48" r="40" 
                      stroke="currentColor" strokeWidth="4" fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100}
                      className="text-blue-400 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold text-white">
                    {uploadProgress}%
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white uppercase tracking-tight">Processing Data...</h3>
                  <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-2">Mapping columns and validating SKUs</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Deterministic Data Mapping Engine v2.4</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InventoryInsights = ({
  dashboard,
  products,
}: {
  dashboard: InventoryDashboardSnapshot | null;
  products: Product[];
}) => {
  const procurementSeries = dashboard?.procurementSeries ?? [];
  const categoryDistribution = dashboard?.categoryDistribution ?? [];
  const assetRoi = dashboard?.assetRoi;
  const procurementFocus = dashboard?.procurementFocus;
  const topPerformers = dashboard?.topPerformers ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-2xl font-medium text-white tracking-tight uppercase">Inventory Insights</h2>
        <p className="text-sm text-white/40 mt-1">Procurement history, supplier pressure, and asset-backed readiness signals.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest">Procurement Velocity vs Demand</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Predicted</span>
                </div>
              </div>
            </div>
            <p className="mb-6 text-[10px] font-mono uppercase tracking-widest text-white/25">
              Derived from purchase-order spend history and current supplier procurement pressure.
            </p>
            <div className="h-64 flex items-end gap-2">
              {procurementSeries.map((series, i) => (
                <div key={`velocity-bar-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-white/5 rounded-t-sm group-hover:bg-white/10 transition-colors" 
                      style={{ height: `${series.predicted + 10}%` }} 
                    />
                    <div 
                      className="absolute bottom-0 w-full bg-blue-400/40 rounded-t-sm group-hover:bg-blue-400 transition-all" 
                      style={{ height: `${series.current}%` }} 
                    />
                  </div>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{series.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Category Distribution</h3>
              <div className="space-y-4">
                {categoryDistribution.map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">{item.label}</span>
                      <span className="text-white/60">{item.value}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${['bg-blue-400', 'bg-[#00ff88]', 'bg-purple-500', 'bg-amber-500'][index % 4]}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Asset Performance Signals</h3>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">3D Publish Lift</div>
                  <div className="text-2xl font-bold text-[#00ff88]">+{assetRoi?.threedPublishLift.toFixed(1) ?? '0.0'}%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Community Asset Coverage</div>
                  <div className="text-2xl font-bold text-blue-400">{assetRoi?.communityCoverage.toFixed(1) ?? '0.0'}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-400/5 border border-blue-400/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-400/20 rounded-lg text-blue-400">
                <Zap size={16} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest">Procurement Focus</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              {procurementFocus ? (
                <>
                  <span className="text-white font-bold">{procurementFocus.productName}</span> is the highest live procurement priority.
                  {' '}{procurementFocus.reason}
                </>
              ) : (
                'No active supplier or procurement pressure is currently flagged in the inventory domain.'
              )}
            </p>
            <button className="w-full py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all">
              {procurementFocus?.actionLabel ?? 'Open Procurement Queue'}
            </button>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Top Performers</h3>
            <div className="space-y-4">
              {topPerformers.map(p => (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                    <img src={p.primaryImageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight truncate">{p.name}</div>
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{p.readiness.catalogHealth}% Catalog Health</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorOverview = ({ onAddVendor }: { onAddVendor: () => void }) => {
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
            <span className="text-2xl font-mono text-white font-bold">24</span>
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
            {[
              { name: 'Brick Masters Ltd.', desc: 'Red Blends Delay', time: '14d', critical: false },
              { name: 'Stone & Clay Inc.', desc: 'Customs Hold', time: 'Critical', critical: true }
            ].map((item) => (
              <div key={item.name} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
                <div>
                  <div className="text-xs font-bold text-white/80 group-hover/item:text-white transition-colors">{item.name}</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">{item.desc}</div>
                </div>
                <span className={`text-[10px] font-mono font-bold ${item.critical ? 'text-red-400/80' : 'text-amber-400/80'}`}>{item.time}</span>
              </div>
            ))}
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
              { label: 'Supplier Onboarded', val: 92, color: 'bg-[#00ff88]/60' },
              { label: 'Linked to Products', val: 78, color: 'bg-blue-400/60' },
              { label: 'Dispatch Ready', val: 64, color: 'bg-amber-400/60' }
            ].map(item => (
              <div key={item.label} className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em]">
                  <span className="text-white/30 font-medium">{item.label}</span>
                  <span className="text-white/60 font-mono font-bold">{item.val}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full ${item.color} shadow-[0_0_10px_rgba(0,255,136,0.2)]`} 
                  />
                </div>
              </div>
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
            <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight group-hover/item:text-white/80 transition-colors">POs Issued (MTD)</span>
                <span className="text-base font-mono text-white">42</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">£124,500 Total Value</div>
            </div>
            <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight group-hover/item:text-white/80 transition-colors">Pending PODs</span>
                <span className="text-base font-mono text-amber-400/80">8</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Requires Claims Review</div>
            </div>
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
            <div className="flex justify-between items-center p-6 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all group/item">
              <div>
                <div className="text-sm font-bold text-white/80 group-hover/item:text-white transition-colors">Nordic Minimal</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">Awaiting Tax Docs</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-base font-mono font-bold text-blue-400/80">80%</span>
                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400/40 w-[80%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorDirectory = ({ onVendorClick, onAddVendor }: { onVendorClick: (vendor: Vendor) => void, onAddVendor: () => void }) => {
  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Vendor Directory</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Manage supplier relationships, terms, and performance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/20 transition-all w-72 font-mono"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]">
            <Filter size={14} /> Filter
          </button>
          <button onClick={onAddVendor} className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff88]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00ff88]/5">
            <UserPlus size={14} /> Add Vendor
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_VENDORS.map(vendor => (
          <div 
            key={vendor.id}
            onClick={() => onVendorClick(vendor)}
            className="group bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
          >
            {/* Subtle Gradient Background on Hover */}
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
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-[#00ff88] transition-colors tracking-tight leading-tight">{vendor.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.type}</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400/60">
                      <Star size={10} className="fill-amber-400/60" /> {vendor.rating}
                    </div>
                  </div>
                </div>
              </div>
              <span className={`text-[8px] uppercase font-bold tracking-[0.2em] px-2.5 py-1 rounded-full border ${
                vendor.status === 'Active' ? 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10' : 
                vendor.status === 'Onboarding' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                vendor.status === 'Delayed' ? 'bg-red-500/5 text-red-400 border-red-500/10' :
                'bg-amber-500/5 text-amber-400 border-amber-500/10'
              }`}>
                {vendor.status}
              </span>
            </div>

            <div className="space-y-6 flex-1 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {vendor.capabilities.slice(0, 2).map(cap => (
                    <span key={cap} className="px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/5 text-[9px] text-white/30 uppercase tracking-widest">
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {Object.entries(vendor.workflowMilestones).map(([key, val]) => (
                    <div 
                      key={key} 
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${val ? 'bg-[#00ff88]/40' : 'bg-white/5'}`} 
                      title={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${val ? 'Ready' : 'Pending'}`}
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
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2.5">Active POs</div>
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag size={12} className={vendor.orders.length > 0 ? 'text-[#00ff88]/40' : 'text-white/10'} />
                    <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">
                      {vendor.orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-xl font-mono text-white group-hover:text-[#00ff88] transition-colors">{vendor.productCount}</span>
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mt-1">Linked Products</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300 ease-out">
                <button 
                  onClick={(e) => { e.stopPropagation(); /* Products logic */ }}
                  className="p-3 bg-white/[0.03] backdrop-blur-md hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all border border-white/5 hover:scale-110 active:scale-95"
                  title="View Products"
                >
                  <Package size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onVendorClick(vendor); }}
                  className="px-6 py-3 bg-[#00ff88]/10 backdrop-blur-md hover:bg-[#00ff88] text-[#00ff88] hover:text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all border border-[#00ff88]/20 hover:border-transparent hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.1)] hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]"
                >
                  Open Profile
                </button>
              </div>
              
              <ChevronRight size={20} className="text-white/10 group-hover:opacity-0 transition-all duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorDetailDrawer = ({ 
  vendor, 
  isOpen, 
  onClose 
}: { 
  vendor: Vendor | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Contacts' | 'Products' | 'Terms' | 'Orders' | 'Performance' | 'History'>('Overview');

  if (!vendor) return null;

  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Contacts', label: 'Contacts / Departments' },
    { id: 'Products', label: 'Products / Capabilities' },
    { id: 'Terms', label: 'Commercial Terms' },
    { id: 'Orders', label: 'Orders / POs / PODs' },
    { id: 'Performance', label: 'Performance' },
    { id: 'History', label: 'History' }
  ] as const;

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
              {/* Header */}
              <div className="p-10 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] p-4 flex items-center justify-center shadow-inner">
                      <img src={vendor.logo} alt={vendor.name} className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700 ease-out" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-4xl font-serif font-bold text-white tracking-tight leading-none">{vendor.name}</h2>
                        <span className={`text-[9px] uppercase font-bold tracking-[0.25em] px-3 py-1 rounded-full border ${
                          vendor.status === 'Active' ? 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10' : 
                          vendor.status === 'Onboarding' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                          vendor.status === 'Delayed' ? 'bg-red-500/5 text-red-400 border-red-500/10' :
                          'bg-amber-500/5 text-amber-400 border-amber-500/10'
                        }`}>
                          {vendor.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.id}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">{vendor.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2 text-[11px] font-mono text-white/20 uppercase tracking-[0.2em]">
                          <MapPin size={12} className="text-white/10" /> {vendor.region}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5 active:scale-[0.98]">
                      Edit Profile
                    </button>
                    <button onClick={onClose} className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-[0.95]">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-10 overflow-x-auto no-scrollbar">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors relative whitespace-nowrap ${
                        activeTab === tab.id ? 'text-[#00ff88]' : 'text-white/20 hover:text-white/60'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="vendorTab" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff88]/60" 
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-10">
                {activeTab === 'Overview' && (
                  <div className="space-y-10">
                    {vendor.blocker && (
                      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-5">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                          <AlertTriangle size={20} className="text-red-400/80" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-red-400/60 uppercase tracking-[0.25em] mb-1.5">Active Operational Blocker</div>
                          <div className="text-sm text-white/80 leading-relaxed font-serif italic">{vendor.blocker}</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-6">
                      {[
                        { label: 'Linked Products', value: vendor.productCount, sub: 'Active SKUs' },
                        { label: 'Avg Lead Time', value: vendor.leadTime, sub: 'Ex-Works' },
                        { label: 'Vendor Rating', value: vendor.rating || '-', sub: 'Internal Score', icon: <Star size={14} className="fill-amber-400/40 text-amber-400/40" /> },
                        { label: 'On-Time Rate', value: `${vendor.performance.onTimeDelivery}%`, sub: 'Last 12 Months' }
                      ].map((stat) => (
                        <div key={stat.label} className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                          <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-4">{stat.label}</div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl font-mono text-white font-bold">{stat.value}</div>
                            {stat.icon}
                          </div>
                          <div className="text-[10px] text-white/20 uppercase tracking-widest font-medium">{stat.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 mb-8 flex items-center gap-3">
                        <Zap size={16} className="text-[#00ff88]/40" /> Workflow Readiness Lifecycle
                      </h3>
                      <div className="grid grid-cols-5 gap-6">
                        {[
                          { key: 'onboarded', label: 'Onboarded' },
                          { key: 'linkedToProducts', label: 'Linked' },
                          { key: 'poIssued', label: 'PO Ready' },
                          { key: 'dispatchReady', label: 'Dispatch' },
                          { key: 'claimsVerified', label: 'Claims' }
                        ].map((m) => (
                          <div key={m.key} className="flex flex-col items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 ${
                              vendor.workflowMilestones[m.key as keyof typeof vendor.workflowMilestones] 
                                ? 'bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]/60' 
                                : 'bg-white/[0.02] border-white/5 text-white/10'
                            }`}>
                              {vendor.workflowMilestones[m.key as keyof typeof vendor.workflowMilestones] ? <CheckCircle2 size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                            </div>
                            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
                              vendor.workflowMilestones[m.key as keyof typeof vendor.workflowMilestones] ? 'text-white/40' : 'text-white/10'
                            }`}>{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 mb-8 flex items-center gap-3">
                          <ShieldCheck size={16} className="text-blue-400/40" /> Core Capabilities
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                          {vendor.capabilities.map(cap => (
                            <span key={cap} className="px-4 py-2 bg-white/[0.03] rounded-xl border border-white/5 text-[11px] text-white/60 font-medium hover:border-white/10 transition-colors">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30 mb-8 flex items-center gap-3">
                          <Clock size={16} className="text-amber-400/40" /> Logistics Summary
                        </h3>
                        <div className="space-y-5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/30 uppercase tracking-widest">Default Incoterms</span>
                            <span className="text-xs text-white font-mono">{vendor.terms.incoterms}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/30 uppercase tracking-widest">Primary Region</span>
                            <span className="text-xs text-white font-mono">{vendor.region}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/30 uppercase tracking-widest">MOQ Policy</span>
                            <span className="text-xs text-white font-mono">{vendor.terms.moq}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Contacts' && (
                  <div className="space-y-6">
                    {vendor.contacts.map((contact) => (
                      <div key={`${contact.name}-${contact.email}`} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-start justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-start gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 font-bold text-xl shrink-0 group-hover:text-[#00ff88]/60 transition-colors">
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
                              <div className="flex items-center gap-2.5 text-[11px] text-white/40 font-mono">
                                <Phone size={14} className="text-white/10" /> {contact.phone}
                              </div>
                            </div>
                            {contact.notes && (
                              <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                                <p className="text-[11px] text-white/20 italic leading-relaxed font-serif">{contact.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all border border-white/5">
                            <Mail size={18} />
                          </button>
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all border border-white/5">
                            <MessageSquare size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-6 border border-dashed border-white/10 rounded-2xl text-white/20 text-[11px] font-bold uppercase tracking-[0.25em] hover:text-white/40 hover:border-white/20 transition-all active:scale-[0.99]">
                      + Add Department Contact
                    </button>
                  </div>
                )}

                {activeTab === 'Products' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Linked Catalog</h3>
                        <div className="text-2xl font-mono text-white">{vendor.productCount} Active SKUs</div>
                      </div>
                      <button className="px-4 py-2 bg-[#00ff88]/10 text-[#00ff88] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#00ff88] hover:text-black transition-all">
                        Manage Catalog
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {BTS_PRODUCTS.slice(0, 4).map(product => (
                        <div key={product.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex gap-4 group hover:border-white/20 transition-all">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                            <img src={product.img} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{product.sku}</div>
                            <div className="text-sm font-medium text-white truncate mb-2">{product.name}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/40 font-mono">Stock: {product.stock}</span>
                              <span className="text-[10px] text-[#00ff88] font-mono">£{product.cost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Production Capabilities</h3>
                      <div className="grid grid-cols-3 gap-6">
                        {['Material Sourcing', 'Custom Fabrication', 'Quality Control', 'Packaging', 'Direct Shipping', 'R&D Lab'].map(cap => (
                          <div key={cap} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded border border-[#00ff88]/30 flex items-center justify-center">
                              <Check size={10} className="text-[#00ff88]" />
                            </div>
                            <span className="text-xs text-white/60">{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Terms' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Financial Terms</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Payment Method</div>
                            <div className="text-sm text-white font-medium">{vendor.terms.payment}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Trading Currency</div>
                            <div className="text-sm text-white font-mono">{vendor.terms.currency}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Credit Limit</div>
                            <div className="text-sm text-white font-mono">£50,000.00</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Compliance</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Tax ID Verified', status: true },
                            { label: 'Insurance Certificate', status: true },
                            { label: 'Quality Agreement', status: true },
                            { label: 'Sustainability Pledge', status: false }
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-xs text-white/60">{item.label}</span>
                              {item.status ? (
                                <Check size={14} className="text-[#00ff88]" />
                              ) : (
                                <X size={14} className="text-white/20" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Logistics Terms</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Primary Incoterms</div>
                            <div className="text-sm text-white font-mono">{vendor.terms.incoterms}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Delivery Location</div>
                            <div className="text-sm text-white font-medium">{vendor.terms.delivery}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Minimum Order Quantity</div>
                            <div className="text-sm text-white font-medium">{vendor.terms.moq}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Orders' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Recent Transactions</h3>
                      <button className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View All Orders</button>
                    </div>
                    <div className="space-y-3">
                      {vendor.orders.map(order => (
                        <div key={order.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              order.type === 'PO' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {order.type === 'PO' ? <FileCheck size={18} /> : <Truck size={18} />}
                            </div>
                            <div>
                              <div className="text-sm font-mono text-white">{order.id}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{order.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <div className="text-sm font-mono text-white">£{order.amount.toLocaleString()}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{order.type} Total</div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                              order.status === 'Delivered' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
                              order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-white/5 text-white/40 border-white/10'
                            }`}>
                              {order.status}
                            </div>
                            <button className="p-2 text-white/20 hover:text-white transition-colors">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Performance' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Delivery Performance</h3>
                        <div className="flex items-end gap-2 h-32">
                          {[65, 82, 75, 94, 88, 92, 94].map((val, i) => (
                            <div key={`perf-bar-${i}`} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full bg-white/5 rounded-t-sm relative group">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${val}%` }}
                                  className="w-full bg-[#00ff88]/40 group-hover:bg-[#00ff88] transition-colors rounded-t-sm"
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {val}%
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-white/20">M{i+1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Quality Score</h3>
                        <div className="flex items-center justify-center h-32">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                className="text-white/5"
                                strokeDasharray="100, 100"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${vendor.performance.qualityScore}, 100` }}
                                className="text-[#00ff88]"
                                strokeWidth="3"
                                stroke="currentColor"
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
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
                        { label: 'Return Rate', value: `${vendor.performance.returnRate}%`, trend: 'down' },
                        { label: 'Price Index', value: `${vendor.performance.priceCompetitiveness}/100`, trend: 'up' },
                        { label: 'Audit Status', value: 'Passed', trend: 'stable' }
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
                          {item.details && (
                            <div className="text-xs text-white/40 leading-relaxed">{item.details}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={`team-member-${i}`} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/5 flex items-center justify-center text-[10px] text-white/40">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">3 Team members managing this vendor</div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all border border-white/5">
                  Request Audit
                </button>
                <button className="px-6 py-3 bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                  Create Purchase Order
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
const FinanceOverview = ({ onSelectRecord }: { onSelectRecord: (record: FinanceRecord) => void }) => {
  const primaryStats = [
    { label: 'Total Invoiced', value: '£1,284,500', trend: '+12.5%', icon: FileText, color: 'text-blue-400', description: 'Total value of all issued invoices MTD' },
    { label: 'Cash Collected', value: '£842,200', trend: '+8.2%', icon: CheckCircle2, color: 'text-[#00ff88]', description: 'Actual realized revenue in bank' },
    { label: 'Outstanding Receivables', value: '£442,300', trend: '+4.1%', icon: Clock, color: 'text-amber-400', description: 'Unpaid invoices within terms' },
    { label: 'Committed Payables', value: '£312,800', trend: '-2.4%', icon: CreditCard, color: 'text-purple-400', description: 'Approved POs and overheads' },
  ];

  const secondaryStats = [
    { label: 'Projected Gross Margin', value: '34.2%', trend: '+1.5%', icon: TrendingUp, color: 'text-[#00ff88]', status: 'Healthy' },
    { label: 'Negative-Margin Risk', value: '4 Orders', trend: 'High', icon: ShieldAlert, color: 'text-red-400', status: 'Critical' },
    { label: 'Overdue Invoices', value: '12', trend: '+2', icon: AlertCircle, color: 'text-red-400', status: 'Action Required' },
    { label: 'Unbooked Costs', value: '£18,400', trend: 'New', icon: Layers, color: 'text-blue-400', status: 'Pending' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Finance Command Center</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Real-time fiscal health, margin monitoring, and operational liquidity.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]">
            <Download size={14} /> Export Ledger
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <Plus size={14} /> New Entry
          </button>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} className={stat.color} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-mono uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-[#00ff88]' : 'text-red-400'}`}>{stat.trend}</span>
                <span className="text-[8px] text-white/10 uppercase tracking-[0.2em] mt-1">vs Last Month</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-white tracking-tighter mb-2">{stat.value}</p>
              <p className="text-[9px] text-white/20 font-serif italic leading-relaxed">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Metrics / Risk Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {secondaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + (i * 0.1) }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/[0.04] transition-all cursor-pointer group"
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
                <span className={`text-[10px] font-mono ${stat.trend.startsWith('+') ? 'text-[#00ff88]' : 'text-white/20'}`}>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Workspace / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Projection */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none">
            <Activity size={240} className="text-[#00ff88]" />
          </div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-1">Cash Flow Projection</h3>
              <p className="text-[10px] text-white/20 font-serif italic">30-day liquidity forecast based on committed orders.</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Outflow</span>
              </div>
            </div>
          </div>
          
          {/* Mock Chart Visualization */}
          <div className="h-48 flex items-end gap-3 relative z-10">
            {[45, 52, 48, 61, 55, 67, 72, 65, 58, 63, 75, 82].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1.5 items-center group">
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   transition={{ delay: 0.6 + (i * 0.05), type: 'spring', damping: 20, stiffness: 100 }}
                   className="w-full bg-gradient-to-t from-[#00ff88]/5 to-[#00ff88]/20 rounded-t-sm group-hover:to-[#00ff88]/40 transition-all cursor-pointer"
                />
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${h * 0.4}%` }}
                   transition={{ delay: 0.8 + (i * 0.05), type: 'spring', damping: 20, stiffness: 100 }}
                   className="w-full bg-gradient-to-t from-purple-500/5 to-purple-500/20 rounded-t-sm group-hover:to-purple-500/40 transition-all cursor-pointer"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            {['WK 12', 'WK 13', 'WK 14', 'WK 15'].map(wk => (
              <span key={wk} className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{wk}</span>
            ))}
          </div>
        </div>

        {/* Action Required / Exceptions */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Critical Actions</h3>
            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest rounded-md">4 Priority</span>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Negative Margin Flag', ref: 'ORD-8821', type: 'Margin', amount: '£1,240 loss' },
              { label: 'Overdue Supplier Payment', ref: 'INV-442', type: 'Payable', amount: '£12,400' },
              { label: 'Unbooked Logistics Cost', ref: 'ORD-8819', type: 'Cost', amount: '£450' },
              { label: 'Credit Limit Reached', ref: 'CUST-992', type: 'Credit', amount: '£50,000' },
            ].map((action, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-white group-hover:text-[#00ff88] transition-colors">{action.label}</span>
                  <ArrowUpRight size={12} className="text-white/20 group-hover:text-[#00ff88] transition-all" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{action.ref} • {action.type}</span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">{action.amount}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]">
            Enter Exception Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

const FinanceList = ({ 
  records, 
  title, 
  subtitle,
  onRecordClick 
}: { 
  records: FinanceRecord[]; 
  title: string; 
  subtitle: string;
  onRecordClick: (record: FinanceRecord) => void;
}) => {
  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">{title}</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">{subtitle}</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/20 transition-all w-72 font-mono uppercase tracking-widest"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]">
            <Filter size={14} /> Filter
          </button>
        </div>
      </header>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">ID / Order</th>
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Entity</th>
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Category</th>
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Status</th>
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Due Date</th>
              <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr 
                key={record.id} 
                onClick={() => onRecordClick(record)}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <td className="p-6">
                  <div className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{record.id}</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">{record.orderId}</div>
                </td>
                <td className="p-6">
                  <div className="text-sm text-white/80">{record.customerName}</div>
                </td>
                <td className="p-6">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{record.category}</span>
                </td>
                <td className="p-6">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    record.status === 'Paid' ? 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10' :
                    record.status === 'Overdue' ? 'bg-red-500/5 text-red-400 border-red-500/10' :
                    record.status === 'Mismatch' || record.status === 'Flagged' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' :
                    'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="p-6">
                  <div className="text-xs font-mono text-white/60">{record.dueDate}</div>
                </td>
                <td className="p-6 text-right">
                  <div className="text-sm font-mono font-bold text-white">£{record.amount.toLocaleString()}</div>
                  {record.balance > 0 && (
                    <div className="text-[9px] font-mono text-red-400/60 mt-1">Bal: £{record.balance.toLocaleString()}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FinanceReceivables = ({ onSelectRecord }: { onSelectRecord: (record: FinanceRecord) => void }) => {
  const [filter, setFilter] = useState<'All' | 'Overdue' | 'Pending' | 'Paid'>('All');
  const records = MOCK_FINANCE_RECORDS.filter(r => {
    if (r.type !== 'Receivable') return false;
    if (filter === 'All') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Receivables Queue</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Manage customer invoices, follow-ups, and payment realizations.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/20 transition-all w-64 font-mono uppercase tracking-widest"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]">
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {['All', 'Overdue', 'Pending', 'Paid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {f} ({MOCK_FINANCE_RECORDS.filter(r => r.type === 'Receivable' && (f === 'All' || r.status === f)).length})
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/50 transition-all w-64 font-mono uppercase tracking-widest"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {records.map((record, i) => (
          <motion.div
            key={record.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectRecord(record)}
            className="group flex items-center gap-6 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            {/* Status Indicator */}
            <div className={`w-1 h-10 rounded-full ${
              record.status === 'Paid' ? 'bg-[#00ff88]' :
              record.status === 'Overdue' ? 'bg-red-500' :
              'bg-amber-400'
            }`} />

            {/* Entity Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors truncate">{record.customerName}</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-mono text-white/40 uppercase tracking-widest">{record.orderId}</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Invoice: {record.id} • Issued {record.issueDate}</div>
            </div>

            {/* Amount Info */}
            <div className="w-40 text-right">
              <div className="text-sm font-mono font-bold text-white">£{record.amount.toLocaleString()}</div>
              {record.balance > 0 && record.balance < record.amount && (
                <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest mt-1">Bal: £{record.balance.toLocaleString()}</div>
              )}
            </div>

            {/* Due Info */}
            <div className="w-48 flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className={record.status === 'Overdue' ? 'text-red-400' : 'text-white/20'} />
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                  record.status === 'Overdue' ? 'text-red-400' : 'text-white/60'
                }`}>
                  {record.status === 'Overdue' ? 'Overdue' : 'Due'} {record.dueDate}
                </span>
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Net 30 Terms</div>
            </div>

            {/* Action Icon */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={16} className="text-white" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const FinancePayables = ({ onSelectRecord }: { onSelectRecord: (record: FinanceRecord) => void }) => {
  const [filter, setFilter] = useState<'All' | 'Supplier' | 'Logistics' | 'Overdue'>('All');
  const records = MOCK_FINANCE_RECORDS.filter(r => {
    if (r.type !== 'Payable') return false;
    if (filter === 'All') return true;
    if (filter === 'Overdue') return r.status === 'Overdue';
    return r.category === filter;
  });

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Payables Queue</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">Monitor supplier obligations, logistics costs, and committed spend.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88]/40 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search payables..." 
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/20 transition-all w-64 font-mono uppercase tracking-widest"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]">
            <Plus size={14} /> Add Cost
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {['All', 'Supplier', 'Logistics', 'Overdue'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {f} ({MOCK_FINANCE_RECORDS.filter(r => r.type === 'Payable' && (f === 'All' || (f === 'Overdue' ? r.status === 'Overdue' : r.category === f))).length})
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400/40 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search payables..." 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all w-64 font-mono uppercase tracking-widest"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {records.map((record, i) => (
          <motion.div
            key={record.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectRecord(record)}
            className="group flex items-center gap-6 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            {/* Category Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              record.category === 'Logistics' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' : 'bg-purple-500/5 border-purple-500/10 text-purple-400'
            }`}>
              {record.category === 'Logistics' ? <Truck size={20} /> : <Building2 size={20} />}
            </div>

            {/* Entity Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">{record.customerName || 'General Supplier'}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                  record.category === 'Logistics' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                }`}>{record.category}</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Ref: {record.id} • Linked to {record.orderId}</div>
            </div>

            {/* Amount Info */}
            <div className="w-40 text-right">
              <div className="text-sm font-mono font-bold text-white">£{record.amount.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Pending Approval</div>
            </div>

            {/* Due Info */}
            <div className="w-48 flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={12} className="text-white/20" />
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                  record.status === 'Overdue' ? 'text-red-400' : 'text-white/60'
                }`}>
                  Due {record.dueDate}
                </span>
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Scheduled for Next Run</div>
            </div>

            {/* Action Icon */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={16} className="text-white" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const FinanceMargin = ({ onSelectRecord }: { onSelectRecord: (record: FinanceRecord) => void }) => {
  const records = MOCK_FINANCE_RECORDS.filter(r => r.margin);
  
  const stats = [
    { label: 'Avg. Margin', value: '34.2%', icon: TrendingUp, color: 'text-[#00ff88]' },
    { label: 'Negative Risk', value: '4 Orders', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Total Value', value: '£1.2M', icon: DollarSign, color: 'text-blue-400' },
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
        {records.map((record, i) => {
          const m = record.margin!;
          const totalCost = m.productCost + m.logisticsCost + m.otherCosts;
          const marginPercent = (m.projectedMargin / m.sellingValue) * 100;
          
          return (
            <motion.div 
              key={record.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectRecord(record)}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
              {/* Status Glow */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-5 transition-opacity group-hover:opacity-10 ${
                m.status === 'Healthy' ? 'bg-[#00ff88]' :
                m.status === 'At Risk' ? 'bg-amber-500' :
                'bg-red-500'
              }`} />

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#00ff88] transition-colors tracking-tight">{record.orderId}</h3>
                    <span className={`text-[8px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded border ${
                      m.status === 'Healthy' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
                      m.status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {m.status === 'At Risk' ? 'Watch' : m.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{record.customerName}</p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Margin</div>
                  <div className={`text-2xl font-mono font-bold tracking-tighter ${
                    m.status === 'Healthy' ? 'text-[#00ff88]' :
                    m.status === 'At Risk' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {marginPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Visualization */}
              <div className="space-y-6 relative z-10 flex-1">
                <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.productCost / m.sellingValue) * 100}%` }}
                    className="bg-purple-500/40" 
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.logisticsCost / m.sellingValue) * 100}%` }}
                    className="bg-blue-500/40" 
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.otherCosts / m.sellingValue) * 100}%` }}
                    className="bg-white/10" 
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.projectedMargin / m.sellingValue) * 100}%` }}
                    className={m.status === 'Negative' ? 'bg-red-500/40' : 'bg-[#00ff88]/20'} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" /> Product Cost
                    </span>
                    <span className="text-xs font-mono text-white font-bold">£{m.productCost.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> Logistics
                    </span>
                    <span className="text-xs font-mono text-white font-bold">£{m.logisticsCost.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Selling Value</span>
                    <span className="text-xs font-mono text-white font-bold">£{m.sellingValue.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Net Margin</span>
                    <span className={`text-xs font-mono font-bold ${
                      m.status === 'Healthy' ? 'text-[#00ff88]' :
                      m.status === 'At Risk' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      £{m.projectedMargin.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    m.status === 'Healthy' ? 'bg-[#00ff88]' :
                    m.status === 'At Risk' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Realized: £{m.realizedMargin.toLocaleString()}</span>
                </div>
                <button className="text-[9px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors">
                  Audit Details
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const FinanceExceptions = ({ onSelectRecord }: { onSelectRecord: (record: FinanceRecord) => void }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const records = useMemo(() => {
    return MOCK_FINANCE_RECORDS.filter(r => 
      (r.exceptions && r.exceptions.length > 0) || 
      ['Disputed', 'Mismatch', 'Flagged', 'Overdue'].includes(r.status) ||
      r.margin?.status === 'Negative'
    );
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (activeFilter !== 'All') {
      filtered = filtered.filter(r => {
        if (activeFilter === 'Critical') return r.margin?.status === 'Negative' || r.status === 'Flagged';
        if (activeFilter === 'Payment') return r.status === 'Mismatch' || r.status === 'Overdue';
        if (activeFilter === 'Documentation') return r.exceptions?.some(e => e.toLowerCase().includes('invoice') || e.toLowerCase().includes('document'));
        return true;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(q) || 
        r.orderId.toLowerCase().includes(q) || 
        r.customerName.toLowerCase().includes(q) ||
        r.exceptions?.some(e => e.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [records, activeFilter, searchQuery]);

  const filters = [
    { name: 'All', count: records.length },
    { name: 'Critical', count: records.filter(r => r.margin?.status === 'Negative' || r.status === 'Flagged').length },
    { name: 'Payment', count: records.filter(r => r.status === 'Mismatch' || r.status === 'Overdue').length },
    { name: 'Documentation', count: records.filter(r => r.exceptions?.some(e => e.toLowerCase().includes('invoice') || e.toLowerCase().includes('document'))).length },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Exceptions Queue</h2>
          <p className="text-sm text-white/30 mt-1 font-serif italic">High-priority financial issues requiring immediate operator intervention.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search exceptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/40 focus:bg-white/[0.07] transition-all w-64"
            />
          </div>
        </div>
      </header>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.name}
            onClick={() => setActiveFilter(f.name)}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeFilter === f.name 
                ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.2)]' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            {f.name} <span className="ml-2 opacity-40 font-mono">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecords.map((record, i) => (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectRecord(record)}
              className="group flex items-center gap-6 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                record.margin?.status === 'Negative' || record.status === 'Flagged' ? 'bg-red-500' :
                record.status === 'Mismatch' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />

              <div className="flex-1 grid grid-cols-12 gap-6 items-center">
                <div className="col-span-4">
                  <div className="flex items-center gap-3 mb-1">
                    <AlertCircle size={14} className={
                      record.margin?.status === 'Negative' || record.status === 'Flagged' ? 'text-red-400' :
                      record.status === 'Mismatch' ? 'text-amber-400' :
                      'text-blue-400'
                    } />
                    <span className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors truncate">
                      {record.exceptions?.[0] || 'Unknown Exception'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    <span>{record.orderId}</span>
                    <span className="opacity-20">•</span>
                    <span>{record.customerName}</span>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Reference</div>
                  <div className="text-xs font-mono text-white">{record.id}</div>
                </div>

                <div className="col-span-3">
                  <div className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Impact</div>
                  <div className={`text-xs font-mono font-bold ${
                    record.margin?.status === 'Negative' ? 'text-red-400' : 'text-white'
                  }`}>
                    £{record.amount.toLocaleString()}
                  </div>
                </div>

                <div className="col-span-2 flex justify-end">
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] transition-all">
                    Resolve
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FinanceDetailDrawer = ({ 
  record, 
  isOpen, 
  onClose 
}: { 
  record: FinanceRecord | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'billing' | 'supplier' | 'logistics' | 'margin' | 'adjustments' | 'history'
  >('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'billing', label: 'Customer Billing', icon: FileText },
    { id: 'supplier', label: 'Supplier Costs', icon: Building2 },
    { id: 'logistics', label: 'Logistics Costs', icon: Truck },
    { id: 'margin', label: 'Margin Stack', icon: TrendingUp },
    { id: 'adjustments', label: 'Adjustments', icon: Edit },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  if (!record) return null;

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#050505] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            <header className="p-8 border-b border-white/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest px-2 py-0.5 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded">
                    {record.type}
                  </span>
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{record.id}</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight">{record.orderId}</h2>
                <p className="text-sm text-white/40 mt-1 font-serif italic">{record.customerName}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex border-b border-white/5 bg-white/[0.02] overflow-x-auto custom-scrollbar no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id ? 'text-[#00ff88]' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeFinanceTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff88]" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Amount</div>
                        <div className="text-2xl font-mono font-bold text-white">£{record.amount.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Outstanding Balance</div>
                        <div className={`text-2xl font-mono font-bold ${record.balance > 0 ? 'text-red-400' : 'text-[#00ff88]'}`}>
                          £{record.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Status Details</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Category', value: record.category },
                        { label: 'Current Status', value: record.status },
                        { label: 'Due Date', value: record.dueDate },
                        { label: 'Issue Date', value: record.issueDate },
                        { label: 'Payment Terms', value: 'Net 30' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-xs text-white/40 uppercase tracking-widest">{item.label}</span>
                          <span className="text-sm text-white font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {record.exceptions && record.exceptions.length > 0 && (
                    <section className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle size={16} className="text-red-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Exceptions</h3>
                      </div>
                      <div className="space-y-2">
                        {record.exceptions.map((exc, i) => (
                          <div key={i} className="text-sm text-white/60 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            {exc}
                          </div>
                        ))}
                      </div>
                      <button className="mt-6 w-full py-3 bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all">
                        Resolve All Issues
                      </button>
                    </section>
                  )}
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
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">Issued: {record.issueDate}</div>
                          </div>
                          <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest px-2 py-0.5 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded">
                            {record.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="text-xl font-mono font-bold text-white">£{record.amount.toLocaleString()}</div>
                          <button className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View PDF</button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Payment History</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">Bank Transfer</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-widest">2026-03-20 • Ref: TXN_9921</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-[#00ff88]">£{(record.amount - record.balance).toLocaleString()}</div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'supplier' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Supplier Obligations</h3>
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">Italian Stone Co</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">PO_2026_045 • Product Cost</div>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest px-2 py-0.5 bg-amber-500/5 border border-amber-500/10 rounded">
                            Committed
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="text-xl font-mono font-bold text-white">£{record.margin?.productCost.toLocaleString() || '0'}</div>
                          <button className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View PO</button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Logistics Costs</h3>
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest mb-1">Global Logistics</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">LOG_2026_012 • Freight & Duty</div>
                          </div>
                          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded">
                            Pending Invoice
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="text-xl font-mono font-bold text-white">£{record.margin?.logisticsCost.toLocaleString() || '0'}</div>
                          <button className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest hover:underline">View Quote</button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'margin' && record.margin && (
                <div className="space-y-10">
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
                          <span className={`text-sm font-mono font-bold ${item.color}`}>
                            {item.value > 0 ? '+' : ''}£{Math.abs(item.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-6 border-t border-white/10 mt-4">
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Net Profit Margin</span>
                        <div className="text-right">
                          <div className={`text-2xl font-mono font-bold ${record.margin.status === 'Healthy' ? 'text-[#00ff88]' : 'text-red-400'}`}>
                            £{record.margin.projectedMargin.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                            {((record.margin.projectedMargin / record.margin.sellingValue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'adjustments' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Adjustments & Credit Notes</h3>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-12 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Edit size={20} className="text-white/20" />
                      </div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No Adjustments Found</h4>
                      <p className="text-xs text-white/30 max-w-[240px]">There are no active adjustments or credit notes for this order.</p>
                      <button className="mt-6 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                        Create Adjustment
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-8">
                  <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Financial Audit Trail</h3>
                  <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    {[
                      { date: '2026-03-28 10:12', user: 'System', action: 'Margin threshold breached alert triggered' },
                      { date: '2026-03-25 14:20', user: 'Sarah Finance', action: 'Invoice INV_2026_002 issued to customer' },
                      { date: '2026-03-20 09:15', user: 'Logistics Bot', action: 'Logistics cost confirmed via Global Logistics API' },
                      { date: '2026-03-15 16:45', user: 'System', action: 'Order ORD_5512 financial record initialized' },
                    ].map((event, i) => (
                      <div key={i} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-[#050505] border-2 border-white/10" />
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest mb-1">{event.date} • {event.user}</div>
                        <div className="text-sm text-white/70">{event.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
};

const VendorOnboardingWizard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const steps = [
    { id: 1, title: 'Basics' },
    { id: 2, title: 'Legal / Tax / Addresses' },
    { id: 3, title: 'Departments & Contacts' },
    { id: 4, title: 'Capabilities & Products' },
    { id: 5, title: 'Commercial Terms' },
    { id: 6, title: 'Review & Activate' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
              {/* Header */}
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

              {/* Step Indicator */}
              <div className="px-10 py-6 bg-white/[0.01] border-b border-white/5 flex justify-between items-center">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[11px] font-bold transition-all duration-500 ${
                      step === s.id ? 'bg-[#00ff88] text-black scale-110 shadow-lg shadow-[#00ff88]/20' : 
                      step > s.id ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-white/[0.03] text-white/10'
                    }`}>
                      {step > s.id ? <Check size={14} /> : s.id}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                      step === s.id ? 'text-white' : 'text-white/10'
                    } hidden md:block`}>
                      {s.title}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="w-10 h-[1px] bg-white/5 mx-3 hidden lg:block" />
                    )}
                  </div>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                  {step === 1 && (
                    <div className="space-y-10 max-w-2xl mx-auto">
                      <div className="text-center mb-10">
                        <h3 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight uppercase">Basics</h3>
                        <p className="text-sm text-white/30 italic font-serif">Identify the core identity and classification of the supplier.</p>
                      </div>
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Company Name</label>
                            <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="e.g. Global Tiles Co." />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Display Name</label>
                            <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="e.g. Global Tiles" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Supplier Type</label>
                          <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                            <option value="manufacturer">Manufacturer</option>
                            <option value="distributor">Distributor</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="agent">Agent / Broker</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Primary Email</label>
                            <input type="email" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="contact@supplier.com" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Primary Phone</label>
                            <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-all" placeholder="+1 234 567 8900" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step === 2 && (
                    <div className="space-y-10 max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Legal / Tax / Addresses</h3>
                        <p className="text-sm text-white/40 italic font-serif">Official registration and physical presence data.</p>
                      </div>
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Legal Entity Name</label>
                            <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="Global Tiles Manufacturing S.p.A." />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Tax ID / VAT Number</label>
                            <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="IT1234567890" />
                          </div>
                        </div>
                        <div className="space-y-6 pt-4">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Headquarters Address</h4>
                            <div className="h-px flex-1 bg-white/5"></div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Street Address</label>
                            <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="Via del Marmo 45" />
                          </div>
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">City</label>
                              <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="Sassuolo" />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">State/Region</label>
                              <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="Modena" />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Country</label>
                              <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="Italy" />
                            </div>
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
                        {[
                          { id: 'sales', label: 'Sales / Account Management', icon: <Users size={14} />, desc: 'Primary commercial contact for quotes and orders.' },
                          { id: 'accounts', label: 'Accounts / Finance', icon: <CreditCard size={14} />, desc: 'Invoicing, statements, and payment queries.' },
                          { id: 'dispatch', label: 'Dispatch / Warehouse', icon: <Truck size={14} />, desc: 'Shipping coordination and collection bookings.' },
                          { id: 'claims', label: 'POD / Claims', icon: <ShieldAlert size={14} />, desc: 'Delivery discrepancies and damage claims.' },
                          { id: 'management', label: 'Executive Management', icon: <Briefcase size={14} />, desc: 'High-level escalations and partnership reviews.' }
                        ].map((dept) => (
                          <div key={dept.id} className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl space-y-8 group hover:border-white/10 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              {React.cloneElement(dept.icon as React.ReactElement<{ size?: number }>, { size: 80 })}
                            </div>
                            
                            <div className="flex items-start justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#00ff88]/10 rounded-xl text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                  {dept.icon}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{dept.label}</h4>
                                  <p className="text-[11px] text-white/30 mt-1">{dept.desc}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Routing ID</span>
                                <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest bg-[#00ff88]/5 px-2 py-0.5 rounded border border-[#00ff88]/10">{dept.id}_primary</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10">
                              <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Contact Person</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono placeholder:text-white/5" placeholder="Full Name" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Email Address</label>
                                <input type="email" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono placeholder:text-white/5" placeholder="email@supplier.com" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Phone Number</label>
                                <input type="tel" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono placeholder:text-white/5" placeholder="+00 000 000 000" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Preferred Channel</label>
                                <div className="relative">
                                  <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                                    <option value="email">Email (Default)</option>
                                    <option value="phone">Direct Phone</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="portal">Supplier Portal</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 relative z-10">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Operational Notes / Routing Instructions</label>
                              <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono placeholder:text-white/5 h-24 resize-none" placeholder="e.g. Best contacted after 2pm, or specific instructions for automated POD requests..." />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-10 max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Capabilities & Products</h3>
                        <p className="text-sm text-white/40 italic font-serif">Production strengths and catalog classification.</p>
                      </div>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Core Production Capabilities</label>
                          <div className="grid grid-cols-2 gap-4">
                            {['Porcelain Slabs', 'Ceramic Tiles', 'Natural Stone', 'Glass Mosaic', 'Custom Fabrication', 'Large Format Printing'].map(cap => (
                              <label key={cap} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                                <div className="relative flex items-center justify-center">
                                  <input type="checkbox" className="peer w-5 h-5 rounded border-white/20 bg-white/5 text-[#00ff88] focus:ring-[#00ff88]/30 transition-all appearance-none checked:bg-[#00ff88] checked:border-[#00ff88]" />
                                  <Check size={12} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-xs text-white/60 group-hover:text-white transition-colors">{cap}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Primary Product Category</label>
                            <div className="relative">
                              <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                                <option value="flooring">Flooring</option>
                                <option value="wall">Wall Coverings</option>
                                <option value="countertops">Countertops</option>
                                <option value="outdoor">Outdoor / Pavers</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Standard Lead Time (Days)</label>
                            <input type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="14" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-10 max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Commercial Terms</h3>
                        <p className="text-sm text-white/40 italic font-serif">Financial and delivery governance.</p>
                      </div>
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Payment Terms</label>
                            <div className="relative">
                              <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                                <option value="net30">Net 30</option>
                                <option value="net60">Net 60</option>
                                <option value="net90">Net 90</option>
                                <option value="due_on_receipt">Due on Receipt</option>
                                <option value="prepaid">Prepaid</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Currency</label>
                            <div className="relative">
                              <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="AUD">AUD ($)</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Minimum Order Value (MOV)</label>
                            <input type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="5000" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Standard Discount (%)</label>
                            <input type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 transition-all font-mono" placeholder="40" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Default Incoterms</label>
                          <div className="relative">
                            <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30 appearance-none transition-all font-mono">
                              <option value="fob">FOB (Free On Board)</option>
                              <option value="exw">EXW (Ex Works)</option>
                              <option value="ddp">DDP (Delivered Duty Paid)</option>
                              <option value="cif">CIF (Cost, Insurance & Freight)</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-10 max-w-2xl mx-auto">
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
                              { label: 'Supplier Onboarded', status: 'Ready', icon: <CheckCircle2 size={12} /> },
                              { label: 'Legal/Tax Verified', status: 'Ready', icon: <CheckCircle2 size={12} /> },
                              { label: 'Contacts Mapped', status: 'Ready', icon: <CheckCircle2 size={12} /> },
                              { label: 'Terms Negotiated', status: 'Ready', icon: <CheckCircle2 size={12} /> },
                              { label: 'Product Linkage', status: 'Pending', icon: <Clock size={12} />, color: 'text-amber-400/80' },
                              { label: 'Dispatch Readiness', status: 'Pending', icon: <Clock size={12} />, color: 'text-amber-400/80' }
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                                <span className="text-[10px] text-white/40 uppercase tracking-tight font-medium">{item.label}</span>
                                <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${item.color || 'text-[#00ff88]'}`}>
                                  {item.icon} {item.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Activation Checklist</h4>
                          <div className="space-y-4">
                            {[
                              'Verify all legal documents are uploaded',
                              'Confirm primary contact for POD/Claims is valid',
                              'Initialize supplier node in the business map',
                              'Enable automated PO issuance for this vendor'
                            ].map((item) => (
                              <div key={item} className="flex items-center gap-4 group">
                                <div className="w-5 h-5 rounded-full border border-[#00ff88]/20 flex items-center justify-center bg-[#00ff88]/5 group-hover:bg-[#00ff88]/10 transition-colors">
                                  <Check size={12} className="text-[#00ff88]" />
                                </div>
                                <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center">
                <button 
                  onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                  className="px-6 py-3 bg-white/5 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <div className="flex gap-4">
                  {step < totalSteps ? (
                    <button 
                      onClick={() => setStep(s => s + 1)} 
                      className="px-8 py-3 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#00cc6a] transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                    >
                      Continue
                    </button>
                  ) : (
                    <button 
                      onClick={onClose} 
                      className="px-8 py-3 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#00cc6a] transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)]"
                    >
                      Activate Supplier
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};


// ===============================================================
// CRM & COMMS COMPONENTS
// ===============================================================

function formatCrmRelativeTime(value?: string | null) {
  if (!value) return 'No activity';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'No activity';
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

function formatZarCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value).replace('ZAR', 'R').trim();
}

function formatOpsMapTime(value?: string | null) {
  if (!value) return '--:--:--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--:--:--';
  return parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getDateTimestamp(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function customerStageFromComms(stage?: string | null): Customer['stage'] {
  const allowed: CustomerStage[] = ['Lead', 'Qualified', 'Quote Sent', 'Awaiting Response', 'Negotiation', 'Won', 'Lost', 'Follow-up'];
  return allowed.includes(stage as CustomerStage) ? stage as CustomerStage : 'Lead';
}

function customerFromCommsSummary(customer: CommsCustomerSummary): Customer {
  return {
    id: customer.customerKey,
    name: customer.name,
    type: customer.customerType ?? 'Retail',
    email: customer.email ?? customer.externalIdentities.find((identity) => identity.email)?.email ?? 'Profile email pending',
    phone: customer.phone ?? customer.externalIdentities.find((identity) => identity.phone)?.phone ?? 'Profile phone pending',
    stage: customerStageFromComms(customer.stage),
    lastActivity: formatCrmRelativeTime(customer.lastActivityAt),
    unreadCount: customer.unreadCount,
    conversationCount: customer.conversationCount,
    portalStatus: customer.portalStatus,
    firstTouchProvider: customer.firstTouchProvider,
    linkedQuotes: customer.linkedQuotes,
    linkedOrders: customer.linkedOrders,
    readiness: customer.readiness,
    blockers: customer.blockers,
  };
}

function customersFromCommsSnapshot(studio?: CommsStudioSnapshot | null): Customer[] {
  return studio?.crm.customers.map(customerFromCommsSummary) ?? MOCK_CUSTOMERS;
}

function conversationsForCustomer(studio: CommsStudioSnapshot | null | undefined, customer: Customer | null) {
  if (!studio || !customer) return [];
  return studio.conversations.filter((conversation) => (
    conversation.linkedCustomer?.customerKey === customer.id
    || conversation.customerName === customer.name
  ));
}

function crmCustomerForInteraction(studio: CommsStudioSnapshot | null | undefined, customerKey?: string | null, customerName?: string) {
  const customers = customersFromCommsSnapshot(studio);
  return customers.find((customer) => customer.id === customerKey) ?? customers.find((customer) => customer.name === customerName) ?? null;
}

function normalizeCrmCustomerLookup(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function crmCustomerMatchesDraft(customer: Customer, draft: Pick<CreateCommsCustomerInput, 'name' | 'email' | 'phone'>) {
  const email = normalizeCrmCustomerLookup(draft.email);
  const phone = (draft.phone ?? '').replace(/[^\d+]/g, '').trim();
  if (email && normalizeCrmCustomerLookup(customer.email) === email) return true;
  if (phone && customer.phone.replace(/[^\d+]/g, '').trim() === phone) return true;
  return normalizeCrmCustomerLookup(customer.name) === normalizeCrmCustomerLookup(draft.name);
}

type CustomerCreateDraft = {
  name: string;
  customerType: Customer['type'];
  stage: CustomerStage;
  email: string;
  phone: string;
};

const DEFAULT_CUSTOMER_CREATE_DRAFT: CustomerCreateDraft = {
  name: '',
  customerType: 'Retail',
  stage: 'Lead',
  email: '',
  phone: '',
};

const CUSTOMER_READINESS_REQUEST_COPY: Record<keyof Customer['readiness'], string> = {
  address: 'Please send the confirmed delivery or site address for this project, including the site contact name, phone number, and any access notes we should know before quoting or dispatch.',
  accessChecklist: 'Please send the site access checklist for this project, including delivery hours, vehicle restrictions, offloading requirements, and any collection or induction instructions.',
  vatDetails: 'Please send your VAT details for this project, including the registered company name, VAT number, and billing details so we can prepare compliant quote and invoice documents.',
  contactChannel: 'Please confirm the best contact channel for this project, including the main email address and mobile or WhatsApp number we should use for quote updates and delivery coordination.',
};

type CrmQueueItem = {
  id: string;
  customer: Customer;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  due: 'Overdue' | 'Today' | 'Tomorrow';
  detail: string;
  category: 'Missing Info' | 'Quote Waiting' | 'Payment Follow-up' | 'Delivery Follow-up' | 'Due Today' | 'Overdue';
};

function buildCrmQueueItems(customers: Customer[]): CrmQueueItem[] {
  const items: CrmQueueItem[] = [];
  customers.forEach((customer) => {
    customer.blockers.forEach((blocker, index) => {
      const isDelivery = blocker.toLowerCase().includes('address');
      items.push({
        id: `${customer.id}-blocker-${index}`,
        customer,
        type: blocker,
        priority: blocker.toLowerCase().includes('portal') ? 'Medium' : 'High',
        due: customer.unreadCount ? 'Overdue' : 'Today',
        detail: `${blocker} is blocking a complete customer profile captured from ${customer.firstTouchProvider ?? 'comms'}.`,
        category: isDelivery ? 'Delivery Follow-up' : 'Missing Info',
      });
    });

    if (customer.stage === 'Quote Sent' || customer.stage === 'Awaiting Response') {
      items.push({
        id: `${customer.id}-quote-follow-up`,
        customer,
        type: 'Quote Follow-up',
        priority: customer.linkedQuotes > customer.linkedOrders ? 'High' : 'Medium',
        due: customer.unreadCount ? 'Overdue' : 'Tomorrow',
        detail: `Follow up on ${customer.linkedQuotes || 1} quote${customer.linkedQuotes === 1 ? '' : 's'} before the lead goes cold.`,
        category: 'Quote Waiting',
      });
    }

    if (customer.unreadCount) {
      items.push({
        id: `${customer.id}-unread-comms`,
        customer,
        type: 'Unread Channel Reply',
        priority: customer.unreadCount > 1 ? 'High' : 'Medium',
        due: 'Today',
        detail: `${customer.unreadCount} unread message${customer.unreadCount === 1 ? '' : 's'} waiting in the unified Comms inbox.`,
        category: 'Due Today',
      });
    }
  });
  return items;
}

function crmPipelineStageWeight(stage: Customer['stage']) {
  if (stage === 'Won') return 1;
  if (stage === 'Negotiation') return 0.8;
  if (stage === 'Awaiting Response' || stage === 'Quote Sent') return 0.65;
  if (stage === 'Follow-up' || stage === 'Qualified') return 0.5;
  if (stage === 'Lost') return 0.1;
  return 0.35;
}

function estimateCrmPipelineCustomerValue(customer: Customer) {
  const customerTypeSeed =
    customer.type === 'Architect' ? 22_000
      : customer.type === 'Trade' ? 28_000
        : 16_000;
  const quoteValue = customer.linkedQuotes * 18_500;
  const orderValue = customer.linkedOrders * 32_000;
  const unreadAdjustment = (customer.unreadCount ?? 0) * 1_250;
  const blockersAdjustment = customer.blockers.length * 950;
  const grossValue = Math.max(customerTypeSeed + quoteValue + orderValue + unreadAdjustment - blockersAdjustment, 7_500);
  return Math.round(grossValue * crmPipelineStageWeight(customer.stage));
}

function crmQueueItemTargetSection(item: CrmQueueItem) {
  if (item.category === 'Quote Waiting') return 'Quotes';
  if (item.category === 'Delivery Follow-up') return 'Logistics';
  if (item.category === 'Payment Follow-up') return 'Orders';
  if (item.category === 'Missing Info') return 'Readiness';
  return 'Comms';
}

function crmReadinessIssueTargetCategory(issueLabel: string) {
  const normalized = issueLabel.toLowerCase();
  if (normalized.includes('address') || normalized.includes('access')) return 'Delivery Follow-up';
  return 'Missing Info';
}

function crmStatusTone(status: 'Pending' | 'Success' | 'Warning' | 'Info') {
  if (status === 'Success') return 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10';
  if (status === 'Warning') return 'bg-amber-500/5 text-amber-400 border-amber-500/10';
  if (status === 'Pending') return 'bg-blue-500/5 text-blue-400 border-blue-500/10';
  return 'bg-white/5 text-white/40 border-white/10';
}

function crmStatusDot(status: 'Pending' | 'Success' | 'Warning' | 'Info') {
  if (status === 'Success') return 'bg-[#00ff88]';
  if (status === 'Warning') return 'bg-amber-400';
  if (status === 'Pending') return 'bg-blue-400';
  return 'bg-white/40';
}

function readinessIssueColor(color: 'red' | 'amber' | 'blue' | 'purple') {
  if (color === 'red') return 'bg-red-500';
  if (color === 'amber') return 'bg-amber-500';
  if (color === 'blue') return 'bg-blue-500';
  return 'bg-purple-500';
}

const CustomerCreateWizard = ({
  isOpen,
  isSaving,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (draft: CustomerCreateDraft) => Promise<void>;
}) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CustomerCreateDraft>(DEFAULT_CUSTOMER_CREATE_DRAFT);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDraft(DEFAULT_CUSTOMER_CREATE_DRAFT);
    }
  }, [isOpen]);

  const readinessPreview = useMemo(() => ({
    contactChannel: Boolean(draft.email.trim() || draft.phone.trim()),
    vatDetails: draft.customerType !== 'Trade',
    address: draft.stage === 'Won',
    accessChecklist: draft.stage === 'Won',
  }), [draft]);

  const canContinueIdentity = draft.name.trim().length > 1;
  const canFinish = draft.name.trim().length > 1;

  const updateDraft = <K extends keyof CustomerCreateDraft>(key: K, value: CustomerCreateDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-[95] w-[min(860px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] shadow-2xl"
          >
            <div className="border-b border-white/5 bg-[#0a0a0a] px-8 py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#00ff88]">CRM Intake</p>
                  <h2 className="mt-3 text-3xl font-serif font-bold uppercase tracking-tight text-white">Add Customer</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
                    Create a CRM customer profile directly inside the portal, keep it in the live comms-backed customer snapshot, and open the new profile immediately after save.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/40 transition-colors hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6 flex gap-2">
                {[1, 2, 3].map((index) => (
                  <div key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#00ff88]' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
              <div className="space-y-8 px-8 py-8">
                {step === 1 ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Step 1</p>
                      <h3 className="mt-3 text-xl font-bold text-white">Identity</h3>
                    </div>
                    <label className="block space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Customer Name</span>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(event) => updateDraft('name', event.target.value)}
                        placeholder="Brick Tile Shop Johannesburg"
                        className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00ff88]/35"
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Customer Type</span>
                        <select
                          value={draft.customerType}
                          onChange={(event) => updateDraft('customerType', event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/35"
                        >
                          {['Retail', 'Trade', 'Architect'].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Pipeline Stage</span>
                        <select
                          value={draft.stage}
                          onChange={(event) => updateDraft('stage', event.target.value as CustomerStage)}
                          className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/35"
                        >
                          {(['Lead', 'Qualified', 'Quote Sent', 'Awaiting Response', 'Negotiation', 'Won', 'Lost', 'Follow-up'] as CustomerStage[]).map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Step 2</p>
                      <h3 className="mt-3 text-xl font-bold text-white">Contact Channels</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Email</span>
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(event) => updateDraft('email', event.target.value)}
                          placeholder="client@example.com"
                          className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00ff88]/35"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Phone</span>
                        <input
                          type="tel"
                          value={draft.phone}
                          onChange={(event) => updateDraft('phone', event.target.value)}
                          placeholder="+27 82 000 0000"
                          className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00ff88]/35"
                        />
                      </label>
                    </div>
                    <div className="rounded-[24px] border border-[#00ff88]/10 bg-[#00ff88]/5 p-5">
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#00ff88]">Portal Readiness</p>
                      <p className="mt-3 text-sm leading-7 text-white/60">
                        If you provide an email or phone number, this customer will enter CRM with a ready contact channel and a non-provisional portal invite path.
                      </p>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Step 3</p>
                      <h3 className="mt-3 text-xl font-bold text-white">Review</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: 'Customer', value: draft.name || 'Pending name' },
                        { label: 'Type', value: draft.customerType },
                        { label: 'Stage', value: draft.stage },
                        { label: 'Channel', value: draft.email || draft.phone || 'Contact pending' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
                          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{item.label}</p>
                          <p className="mt-3 text-sm font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-white/5 bg-[#080808] px-8 py-8 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Readiness Preview</p>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Contact Channel', value: readinessPreview.contactChannel },
                    { label: 'VAT Details', value: readinessPreview.vatDetails },
                    { label: 'Delivery Address', value: readinessPreview.address },
                    { label: 'Access Checklist', value: readinessPreview.accessChecklist },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4">
                      <span className="text-xs uppercase tracking-widest text-white/45">{item.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.24em] ${item.value ? 'text-[#00ff88]' : 'text-amber-400'}`}>
                        {item.value ? 'Ready' : 'Needs Follow-up'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-[#0a0a0a] px-8 py-6">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-colors hover:text-white"
              >
                Back
              </button>
              <div className="flex gap-3">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => current + 1)}
                    disabled={step === 1 ? !canContinueIdentity : false}
                    className="rounded-2xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00cc6e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onCreate(draft)}
                    disabled={!canFinish || isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00cc6e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {isSaving ? 'Creating...' : 'Create Customer'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CRMDashboard = ({
  studio,
  onCustomerClick,
  onNavigateSubModule,
  onAddCustomer,
  onResolveAll,
}: {
  studio: CommsStudioSnapshot | null;
  onCustomerClick: (customer: Customer) => void;
  onNavigateSubModule: (subModule: CRMSubModule, options?: { queueCategory?: string; stageFilter?: CustomerStage | 'All' }) => void;
  onAddCustomer: () => void;
  onResolveAll?: () => void;
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const crmCustomers = customersFromCommsSnapshot(studio);
  const metricsSource = studio?.crm.metrics;
  const metrics = [
    { label: 'Total Customers', value: `${metricsSource?.totalCustomers ?? crmCustomers.length}`, trend: '+ Live', icon: Users, color: 'text-[#00ff88]', onClick: () => onNavigateSubModule('Directory', { stageFilter: 'All' as const }) },
    { label: 'Active Leads', value: `${metricsSource?.activeLeads ?? crmCustomers.filter((customer) => customer.stage !== 'Won' && customer.stage !== 'Lost').length}`, trend: '+ Sync', icon: Zap, color: 'text-amber-400', onClick: () => onNavigateSubModule('Pipeline') },
    { label: 'Conversion Rate', value: `${metricsSource?.conversionRatePct ?? 0}%`, trend: '+ Orders', icon: BarChart3, color: 'text-blue-400', onClick: () => onNavigateSubModule('Pipeline') },
    { label: 'Overdue Follow-ups', value: `${metricsSource?.overdueFollowUps ?? buildCrmQueueItems(crmCustomers).filter((item) => item.due === 'Overdue').length}`, trend: '- Queue', icon: Clock, color: 'text-red-400', onClick: () => onNavigateSubModule('Queue', { queueCategory: 'Overdue' }) },
  ];
  const recentInteractions = studio?.crm.recentInteractions ?? [
    { id: 'mock-1', customerName: 'John Doe', action: 'Quote Requested', occurredAt: new Date().toISOString(), status: 'Pending' as const, channel: 'WhatsApp' as CommsProvider, conversationId: 'THR_001', customerKey: 'CUST_001' },
    { id: 'mock-2', customerName: 'Sarah Smith', action: 'Order Confirmed', occurredAt: new Date().toISOString(), status: 'Success' as const, channel: 'Email' as CommsProvider, conversationId: 'THR_002', customerKey: 'CUST_002' },
  ];
  const readinessIssues = studio?.crm.readinessIssues ?? [
    { id: 'missing-delivery-addresses', label: 'Missing Delivery Addresses', count: 12, color: 'red' as const, customerKeys: [] },
    { id: 'pending-vat-verifications', label: 'Pending VAT Verifications', count: 5, color: 'amber' as const, customerKeys: [] },
    { id: 'access-checklists-needed', label: 'Access Checklists Needed', count: 8, color: 'blue' as const, customerKeys: [] },
    { id: 'unlinked-lead-sources', label: 'Provisional Lead Sources', count: 3, color: 'purple' as const, customerKeys: [] },
  ];

  const handleResolve = () => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      if (onResolveAll) onResolveAll();
    }, 1500);
  };

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">CRM Command Center</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-[0.3em]">Operational Relationship Overview</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => toast('Export routes through the CRM reporting pass. Opened Customer Directory instead.')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export Data
          </button>
          <button
            type="button"
            onClick={onAddCustomer}
            className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
          >
            <UserPlus size={14} /> Add Customer
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-[#00ff88]/30 transition-all group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 bg-white/5 rounded-xl ${stat.color} group-hover:bg-[#00ff88] group-hover:text-black transition-all`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-mono ${stat.trend.startsWith('+') ? 'text-[#00ff88]' : 'text-red-400'}`}>{stat.trend}</span>
            </div>
            <div className="text-4xl font-bold font-mono tracking-tighter mb-2 relative z-10">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 relative z-10">{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Interactions</h3>
            <button
              type="button"
              onClick={() => onNavigateSubModule('Directory', { stageFilter: 'All' })}
              className="text-[10px] text-[#00ff88] uppercase tracking-widest hover:underline font-bold"
            >
              View History
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {recentInteractions.map((item) => {
              const customer = crmCustomerForInteraction(studio, item.customerKey, item.customerName);
              return (
              <button
                type="button"
                key={item.id}
                onClick={() => customer && onCustomerClick(customer)}
                className="w-full p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-sm font-bold border border-white/10 group-hover:border-[#00ff88]/30 transition-all">
                    {item.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-[#00ff88] transition-colors">{item.customerName}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{item.action} • {item.channel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-white/20 mb-2">{formatCrmRelativeTime(item.occurredAt)}</div>
                  <div className={`inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${crmStatusTone(item.status)}`}>
                    <div className={`w-1 h-1 rounded-full ${crmStatusDot(item.status)}`} />
                    {item.status}
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 flex flex-col relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Zap size={160} className="text-[#00ff88]" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8">Readiness Issues</h3>
          <div className="space-y-8 flex-1">
            {readinessIssues.map((issue) => (
              <button
                key={issue.label}
                type="button"
                onClick={() => onNavigateSubModule('Queue', { queueCategory: crmReadinessIssueTargetCategory(issue.label) })}
                className="w-full space-y-3 text-left"
              >
                <div className="flex justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-white/40">{issue.label}</span>
                  <span className="text-white font-mono">{issue.count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${readinessIssueColor(issue.color)} opacity-40`} style={{ width: `${Math.min(100, (issue.count / Math.max(1, crmCustomers.length)) * 100)}%` }} />
                </div>
              </button>
            ))}
          </div>
          <button 
            onClick={handleResolve}
            disabled={isResolving}
            className="w-full mt-10 py-4 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]/20 transition-all shadow-[0_0_20px_rgba(0,255,136,0.05)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isResolving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {isResolving ? 'Resolving...' : 'Resolve All Blockers'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CRMQueue = ({
  customers,
  onCustomerClick,
  onOpenCustomerSection,
  onOpenCommsConversation,
  initialCategory,
}: {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onOpenCustomerSection: (customer: Customer, section: string) => void;
  onOpenCommsConversation: (customer: Customer) => void;
  initialCategory?: string | null;
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory ?? 'All');
  const [activeResolutionId, setActiveResolutionId] = useState<string | null>(null);
  const queueItems = useMemo(() => buildCrmQueueItems(customers), [customers]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);
  
  const categories = [
    { id: 'All', label: 'All Tasks', icon: ListTodo, count: queueItems.length },
    { id: 'Overdue', label: 'Overdue', icon: AlertCircle, count: queueItems.filter((item) => item.due === 'Overdue').length, color: 'text-red-500' },
    { id: 'Due Today', label: 'Due Today', icon: Clock, count: queueItems.filter((item) => item.due === 'Today' || item.category === 'Due Today').length, color: 'text-amber-400' },
    { id: 'Missing Info', label: 'Missing Info', icon: AlertTriangle, count: queueItems.filter((item) => item.category === 'Missing Info').length, color: 'text-blue-400' },
    { id: 'Quote Waiting', label: 'Quote Waiting', icon: FileText, count: queueItems.filter((item) => item.category === 'Quote Waiting').length, color: 'text-purple-400' },
    { id: 'Payment Follow-up', label: 'Payment Follow-up', icon: DollarSign, count: queueItems.filter((item) => item.category === 'Payment Follow-up').length, color: 'text-[#00ff88]' },
    { id: 'Delivery Follow-up', label: 'Delivery Follow-up', icon: Truck, count: queueItems.filter((item) => item.category === 'Delivery Follow-up').length, color: 'text-cyan-400' },
  ];

  const filteredItems = activeCategory === 'All' 
    ? queueItems 
    : queueItems.filter(item => item.category === activeCategory || item.due === activeCategory);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Operational Queue</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Actionable Customer Tasks</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search queue..." 
              className="bg-[#0f0f0f] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-xs text-white focus:outline-none focus:border-[#00ff88]/30 focus:bg-white/[0.02] w-64 transition-all"
            />
          </div>
          <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.02] transition-all">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap ${
              activeCategory === cat.id 
                ? 'bg-white/10 border-[#00ff88]/30 text-white shadow-[0_0_15px_rgba(0,255,136,0.05)]' 
                : 'bg-[#0f0f0f] border-white/5 text-white/40 hover:border-white/10 hover:bg-white/[0.02]'
            }`}
          >
            <cat.icon size={16} className={activeCategory === cat.id ? 'text-[#00ff88]' : cat.color} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-[#00ff88] text-black' : 'bg-white/5 text-white/30'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => onCustomerClick(item.customer)}
              className={`cursor-pointer rounded-2xl border p-6 shadow-xl transition-colors group flex items-center gap-8 ${
                activeResolutionId === item.id
                  ? 'border-[#00ff88]/25 bg-[#00ff88]/[0.04]'
                  : 'border-white/5 bg-[#0f0f0f] hover:border-white/10 hover:bg-white/[0.02]'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                item.due === 'Overdue' ? 'bg-red-500/5 border-red-500/10 text-red-500' : 'bg-white/5 border-white/5 text-white/40'
              }`}>
                {item.due === 'Overdue' ? <AlertCircle size={20} /> : <Clock size={20} />}
              </div>
              
              <div className="flex-1 grid grid-cols-4 gap-8">
                <div className="col-span-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Customer</div>
                  <div 
                    onClick={(event) => {
                      event.stopPropagation();
                      onCustomerClick(item.customer);
                    }}
                    className="text-sm font-bold text-white truncate group-hover:text-[#00ff88] transition-colors cursor-pointer"
                  >
                    {item.customer.name}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Task Type</div>
                  <div className="text-xs font-medium text-white/80 truncate">{item.type}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Priority</div>
                  <div className={`inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest ${
                    item.priority === 'High' ? 'text-red-400' : item.priority === 'Medium' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      item.priority === 'High' ? 'bg-red-400' : item.priority === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    {item.priority}
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Status</div>
                  <div className={`text-[10px] font-mono ${item.due === 'Overdue' ? 'text-red-500' : 'text-amber-400'}`}>
                    {item.due}
                  </div>
                </div>
              </div>

              <div className="flex-1 border-l border-white/5 pl-8 hidden lg:block">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Details</div>
                <div className="text-xs text-white/60 leading-relaxed line-clamp-2">{item.detail}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCustomerClick(item.customer);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/70 transition-all hover:border-white/20 hover:text-white"
                >
                  Open Profile
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveResolutionId(item.id);
                    toast(`Opened ${item.customer.name} -> ${crmQueueItemTargetSection(item)} to resolve ${item.type}.`);
                    onOpenCustomerSection(item.customer, crmQueueItemTargetSection(item));
                    window.setTimeout(() => {
                      setActiveResolutionId((current) => (current === item.id ? null : current));
                    }, 1800);
                  }}
                  className="px-4 py-2 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]/20 transition-all"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenCommsConversation(item.customer);
                  }}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const CRMPipeline = ({
  customers,
  onOpenCustomerSection,
}: {
  customers: Customer[];
  onOpenCustomerSection: (customer: Customer, section: string) => void;
}) => {
  const stages: CustomerStage[] = ['Lead', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];
  const weightedPipelineValue = useMemo(
    () => customers.reduce((total, customer) => total + estimateCrmPipelineCustomerValue(customer), 0),
    [customers],
  );
  
  return (
    <div className="h-full flex flex-col space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Sales Pipeline</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Revenue Flow Monitor</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-[#00ff88] tracking-tighter">{formatZarCurrency(weightedPipelineValue)}</div>
            <div className="text-[8px] uppercase tracking-widest text-white/30">Weighted Pipeline Value</div>
          </div>
          <button className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2">
            <Plus size={14} /> New Lead
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
        {stages.map((stage) => (
          <div key={stage} className="w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{stage}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono text-white/40">
                  {customers.filter(c => c.stage === stage).length}
                </span>
              </div>
              <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
            </div>
            
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-3 overflow-y-auto custom-scrollbar">
              {customers.filter(c => c.stage === stage).map((customer) => (
                <div 
                  key={customer.id} 
                  onClick={() => onOpenCustomerSection(customer, 'Overview')}
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 hover:border-[#00ff88]/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCustomerSection(customer, 'Overview');
                      }}
                      className="text-xs font-bold text-white group-hover:text-[#00ff88] transition-colors hover:text-[#00ff88]"
                    >
                      {customer.name}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCustomerSection(customer, 'Comms');
                      }}
                      className="text-[8px] font-mono text-white/30 transition-colors hover:text-white"
                    >
                      {customer.lastActivity}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenCustomerSection(customer, 'Contact');
                    }}
                    className="mb-4 text-[10px] text-white/40 transition-colors hover:text-white"
                  >
                    {customer.type}
                  </button>
                  
                  {/* Readiness Dots */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenCustomerSection(customer, 'Readiness');
                    }}
                    className="mb-4 flex gap-1"
                  >
                    {Object.entries(customer.readiness).map(([key, val]) => (
                      <div key={key} className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-[#00ff88]' : 'bg-red-500/50'}`} />
                    ))}
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomerSection(customer, 'Quotes');
                        }}
                        className="w-5 h-5 rounded-full border border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[8px] font-bold transition-colors hover:bg-[#00ff88] hover:text-black"
                        title="Open customer quotes"
                      >
                        Q
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomerSection(customer, 'Orders');
                        }}
                        className="w-5 h-5 rounded-full border border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[8px] font-bold transition-colors hover:bg-[#00ff88] hover:text-black"
                        title="Open customer orders"
                      >
                        O
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCustomerSection(customer, 'History');
                      }}
                      className="text-[10px] font-mono text-[#00ff88] font-bold transition-colors hover:text-white"
                      title="Open customer workflow history"
                    >
                      {formatZarCurrency(estimateCrmPipelineCustomerValue(customer))}
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] uppercase tracking-widest text-white/20 hover:text-white hover:border-white/30 transition-all">
                + Add Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CRMDirectory = ({
  customers,
  onCustomerClick,
  onOpenCustomerSection,
  initialStageFilter,
}: {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onOpenCustomerSection: (customer: Customer, section: string) => void;
  initialStageFilter?: CustomerStage | 'All' | null;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<CustomerStage | 'All'>(initialStageFilter ?? 'All');
  
  const stages: (CustomerStage | 'All')[] = ['All', 'Lead', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];

  useEffect(() => {
    if (initialStageFilter) {
      setActiveStageFilter(initialStageFilter);
    }
  }, [initialStageFilter]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = activeStageFilter === 'All' || customer.stage === activeStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Customer Directory</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Global Identity Registry</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search directory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0f0f0f] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-xs text-white focus:outline-none focus:border-[#00ff88]/30 focus:bg-white/[0.02] w-80 transition-all"
            />
          </div>
          <div className="flex bg-[#0f0f0f] border border-white/5 rounded-xl p-1">
            {stages.map((stage) => (
              <button
                key={stage}
                onClick={() => setActiveStageFilter(stage)}
                className={`px-4 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                  activeStageFilter === stage 
                    ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.2)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => toast('CRM export routes through the reporting layer. Open the filtered customer records directly from this directory.')}
            className="px-6 py-3 bg-[#0f0f0f] border border-white/5 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5 bg-white/[0.02]">
              <th className="px-8 py-5 font-normal">Identity</th>
              <th className="px-8 py-5 font-normal">Contact</th>
              <th className="px-8 py-5 font-normal">Stage</th>
              <th className="px-8 py-5 font-normal">Readiness</th>
              <th className="px-8 py-5 font-normal">Activity</th>
              <th className="px-8 py-5 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredCustomers.map((customer) => (
                <motion.tr 
                  key={customer.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => onCustomerClick(customer)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold border border-white/10 group-hover:border-[#00ff88]/30 transition-all">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{customer.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{customer.type} • {customer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs text-white/60 mb-1">{customer.email}</div>
                    <div className="text-[10px] font-mono text-white/30">{customer.phone}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full border text-[8px] font-bold uppercase tracking-widest ${
                      customer.stage === 'Won' ? 'bg-[#00ff88]/5 border-[#00ff88]/10 text-[#00ff88]' :
                      customer.stage === 'Lead' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' :
                      'bg-white/5 border-white/5 text-white/60'
                    }`}>
                      {customer.stage}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-1.5">
                      {Object.entries(customer.readiness).map(([key, val]) => (
                        <div 
                          key={key} 
                          className={`w-2 h-2 rounded-full ${val ? 'bg-[#00ff88]' : 'bg-red-500/50'}`}
                          title={key}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] font-mono text-[#00ff88] mb-1">{customer.lastActivity}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">{customer.linkedOrders} Orders • {customer.linkedQuotes} Quotes</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomerSection(customer, 'Contact');
                        }}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomerSection(customer, 'Contact');
                        }}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                      >
                        <Phone size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomerSection(customer, 'Overview');
                        }}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

type CrmAutomationStatus = 'Active' | 'Paused';
type CrmAutomationRuleType = 'newLeadWelcome' | 'sampleFollowUp' | 'dormantLeadReengagement' | 'quoteExpiryAlert' | 'custom';

type CrmAutomationConfig = {
  id: string;
  name: string;
  description: string;
  status: CrmAutomationStatus;
  trigger: string;
  ruleType: CrmAutomationRuleType;
  thresholdHours?: number;
  thresholdDays?: number;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
};

type CrmAutomationRuntime = {
  icon: LucideIcon;
  color: string;
  eligibleCount: number;
  eligibleLabel: string;
  lastRunLabel: string;
};

const CRM_AUTOMATION_STORAGE_KEY = 'bts.crm.automations.v1';

function nowIsoString() {
  return new Date().toISOString();
}

function createCrmAutomationConfig(
  input: Partial<CrmAutomationConfig> & Pick<CrmAutomationConfig, 'id' | 'ruleType'>,
): CrmAutomationConfig {
  const createdAt = input.createdAt ?? nowIsoString();
  const updatedAt = input.updatedAt ?? createdAt;

  if (input.ruleType === 'newLeadWelcome') {
    return {
      id: input.id,
      ruleType: input.ruleType,
      name: input.name ?? 'New Lead Welcome',
      description: input.description ?? 'Triggered when a new lead is captured. Sends welcome email and assigns to sales.',
      status: input.status ?? 'Active',
      trigger: input.trigger ?? 'Lead Created',
      thresholdHours: input.thresholdHours ?? 2,
      thresholdDays: input.thresholdDays,
      isSystem: input.isSystem ?? true,
      createdAt,
      updatedAt,
    };
  }

  if (input.ruleType === 'sampleFollowUp') {
    return {
      id: input.id,
      ruleType: input.ruleType,
      name: input.name ?? 'Sample Follow-up',
      description: input.description ?? 'Triggered 48h after sample delivery. Checks for feedback and quote readiness.',
      status: input.status ?? 'Active',
      trigger: input.trigger ?? 'Sample Delivered + 48h',
      thresholdHours: input.thresholdHours ?? 48,
      thresholdDays: input.thresholdDays,
      isSystem: input.isSystem ?? true,
      createdAt,
      updatedAt,
    };
  }

  if (input.ruleType === 'dormantLeadReengagement') {
    return {
      id: input.id,
      ruleType: input.ruleType,
      name: input.name ?? 'Dormant Lead Re-engagement',
      description: input.description ?? 'Triggered after 14 days of inactivity. Sends personalized re-engagement offer.',
      status: input.status ?? 'Paused',
      trigger: input.trigger ?? 'Inactivity > 14d',
      thresholdDays: input.thresholdDays ?? 14,
      thresholdHours: input.thresholdHours,
      isSystem: input.isSystem ?? true,
      createdAt,
      updatedAt,
    };
  }

  if (input.ruleType === 'quoteExpiryAlert') {
    return {
      id: input.id,
      ruleType: input.ruleType,
      name: input.name ?? 'Quote Expiry Alert',
      description: input.description ?? 'Triggered 24h before quote expiry. Notifies customer and account manager.',
      status: input.status ?? 'Active',
      trigger: input.trigger ?? 'Quote Expiry - 24h',
      thresholdHours: input.thresholdHours ?? 24,
      thresholdDays: input.thresholdDays,
      isSystem: input.isSystem ?? true,
      createdAt,
      updatedAt,
    };
  }

  return {
    id: input.id,
    ruleType: input.ruleType,
    name: input.name ?? 'Custom Automation',
    description: input.description ?? 'Custom CRM workflow logic for BTS customer follow-up.',
    status: input.status ?? 'Paused',
    trigger: input.trigger ?? 'Manual Rule',
    thresholdHours: input.thresholdHours,
    thresholdDays: input.thresholdDays,
    isSystem: input.isSystem ?? false,
    createdAt,
    updatedAt,
  };
}

const DEFAULT_CRM_AUTOMATIONS: CrmAutomationConfig[] = [
  createCrmAutomationConfig({ id: 'auto_001', ruleType: 'newLeadWelcome' }),
  createCrmAutomationConfig({ id: 'auto_002', ruleType: 'sampleFollowUp' }),
  createCrmAutomationConfig({ id: 'auto_003', ruleType: 'dormantLeadReengagement' }),
  createCrmAutomationConfig({ id: 'auto_004', ruleType: 'quoteExpiryAlert' }),
];

function mergeCrmAutomationConfigs(storedConfigs: CrmAutomationConfig[]) {
  const defaultById = new Map(DEFAULT_CRM_AUTOMATIONS.map((automation) => [automation.id, automation]));
  const mergedDefaults = DEFAULT_CRM_AUTOMATIONS.map((automation) => {
    const stored = storedConfigs.find((candidate) => candidate.id === automation.id);
    return stored ? createCrmAutomationConfig({ ...automation, ...stored, id: automation.id, ruleType: automation.ruleType }) : automation;
  });

  const customConfigs = storedConfigs
    .filter((automation) => !defaultById.has(automation.id))
    .map((automation) => createCrmAutomationConfig(automation));

  return [...mergedDefaults, ...customConfigs];
}

function readStoredCrmAutomationConfigs() {
  if (typeof window === 'undefined') {
    return DEFAULT_CRM_AUTOMATIONS;
  }

  try {
    const raw = window.localStorage.getItem(CRM_AUTOMATION_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CRM_AUTOMATIONS;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_CRM_AUTOMATIONS;
    }

    const hydrated = parsed
      .filter((entry): entry is Partial<CrmAutomationConfig> & Pick<CrmAutomationConfig, 'id' | 'ruleType'> => Boolean(entry && entry.id && entry.ruleType))
      .map((entry) => createCrmAutomationConfig(entry));

    return mergeCrmAutomationConfigs(hydrated);
  } catch {
    return DEFAULT_CRM_AUTOMATIONS;
  }
}

function persistCrmAutomationConfigs(configs: CrmAutomationConfig[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CRM_AUTOMATION_STORAGE_KEY, JSON.stringify(configs));
}

function crmAutomationVisuals(ruleType: CrmAutomationRuleType) {
  if (ruleType === 'newLeadWelcome') return { icon: Zap, color: 'text-[#00ff88]' };
  if (ruleType === 'sampleFollowUp') return { icon: Clock, color: 'text-amber-400' };
  if (ruleType === 'dormantLeadReengagement') return { icon: RefreshCw, color: 'text-blue-400' };
  if (ruleType === 'quoteExpiryAlert') return { icon: AlertCircle, color: 'text-red-400' };
  return { icon: Settings, color: 'text-white/60' };
}

function latestAutomationTimestamp(values: Array<string | null | undefined>) {
  return values
    .map((value) => {
      const timestamp = value ? new Date(value).getTime() : Number.NaN;
      return Number.isNaN(timestamp) ? null : timestamp;
    })
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left)[0] ?? null;
}

function formatAutomationRuntime(timestamp: number | null, fallback: string) {
  if (!timestamp) {
    return fallback;
  }
  return formatCrmRelativeTime(new Date(timestamp).toISOString());
}

function calendarEntryTimestamp(entry: MarketingCalendarEntry) {
  const timestamp = new Date(`${entry.date}T${entry.time || '00:00'}:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isDormantCustomer(customer: CommsCustomerSummary, thresholdDays: number) {
  const timestamp = customer.lastActivityAt ? new Date(customer.lastActivityAt).getTime() : Number.NaN;
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return Date.now() - timestamp >= thresholdDays * 24 * 60 * 60 * 1000;
}

function deriveCrmAutomationRuntime(
  automation: CrmAutomationConfig,
  studio: CommsStudioSnapshot | null | undefined,
  queueItems: CrmQueueItem[],
  calendarEntries: MarketingCalendarEntry[],
): CrmAutomationRuntime {
  const { icon, color } = crmAutomationVisuals(automation.ruleType);
  const rawCustomers = studio?.crm.customers ?? [];
  const recentInteractions = studio?.crm.recentInteractions ?? [];
  const sampleRegex = /sample/i;

  if (automation.ruleType === 'newLeadWelcome') {
    const leadCustomers = rawCustomers.filter((customer) => customer.stage === 'Lead');
    const lastRun = latestAutomationTimestamp([
      ...leadCustomers.map((customer) => customer.lastActivityAt),
      ...recentInteractions.filter((interaction) => /lead|profile|welcome/i.test(interaction.action)).map((interaction) => interaction.occurredAt),
    ]);
    return {
      icon,
      color,
      eligibleCount: leadCustomers.length,
      eligibleLabel: leadCustomers.length ? `${leadCustomers.length} live lead${leadCustomers.length === 1 ? '' : 's'} in welcome flow` : 'No new leads waiting',
      lastRunLabel: formatAutomationRuntime(lastRun, 'Waiting for inbound leads'),
    };
  }

  if (automation.ruleType === 'sampleFollowUp') {
    const sampleEntries = calendarEntries.filter((entry) => sampleRegex.test(`${entry.title} ${entry.description ?? ''}`));
    const sampleQueueItems = queueItems.filter((item) => sampleRegex.test(`${item.type} ${item.detail}`));
    const lastRun = latestAutomationTimestamp([
      ...sampleEntries.map((entry) => {
        const timestamp = calendarEntryTimestamp(entry);
        return timestamp ? new Date(timestamp).toISOString() : null;
      }),
      ...sampleQueueItems.map((item) => item.customer.lastActivity),
    ]);
    const eligibleCount = Math.max(sampleEntries.length, sampleQueueItems.length);
    return {
      icon,
      color,
      eligibleCount,
      eligibleLabel: eligibleCount ? `${eligibleCount} sample follow-up${eligibleCount === 1 ? '' : 's'} armed` : 'No sample events detected',
      lastRunLabel: formatAutomationRuntime(lastRun, 'Idle until next sample trigger'),
    };
  }

  if (automation.ruleType === 'dormantLeadReengagement') {
    const thresholdDays = automation.thresholdDays ?? 14;
    const dormantCustomers = rawCustomers.filter((customer) => !['Won', 'Lost'].includes(customer.stage ?? '') && isDormantCustomer(customer, thresholdDays));
    const lastRun = latestAutomationTimestamp(dormantCustomers.map((customer) => customer.lastActivityAt));
    return {
      icon,
      color,
      eligibleCount: dormantCustomers.length,
      eligibleLabel: dormantCustomers.length ? `${dormantCustomers.length} dormant lead${dormantCustomers.length === 1 ? '' : 's'} waiting` : `No leads dormant > ${thresholdDays}d`,
      lastRunLabel: formatAutomationRuntime(lastRun, `Watching ${thresholdDays}d inactivity window`),
    };
  }

  if (automation.ruleType === 'quoteExpiryAlert') {
    const quoteWaitingCustomers = rawCustomers.filter((customer) => customer.stage === 'Quote Sent' || customer.stage === 'Awaiting Response');
    const quoteQueueItems = queueItems.filter((item) => item.category === 'Quote Waiting');
    const lastRun = latestAutomationTimestamp([
      ...quoteWaitingCustomers.map((customer) => customer.lastActivityAt),
      ...recentInteractions.filter((interaction) => /quote/i.test(interaction.action)).map((interaction) => interaction.occurredAt),
    ]);
    const eligibleCount = Math.max(quoteWaitingCustomers.length, quoteQueueItems.length);
    return {
      icon,
      color,
      eligibleCount,
      eligibleLabel: eligibleCount ? `${eligibleCount} quote follow-up${eligibleCount === 1 ? '' : 's'} pending` : 'No quotes near follow-up window',
      lastRunLabel: formatAutomationRuntime(lastRun, 'Watching quote response window'),
    };
  }

  const lastRun = latestAutomationTimestamp(recentInteractions.map((interaction) => interaction.occurredAt));
  return {
    icon,
    color,
    eligibleCount: 0,
    eligibleLabel: 'Manual logic definition',
    lastRunLabel: formatAutomationRuntime(lastRun, 'Custom logic not evaluated yet'),
  };
}

function createCrmAutomationDraft() {
  return createCrmAutomationConfig({
    id: `auto_custom_${Math.random().toString(36).slice(2, 8)}`,
    ruleType: 'custom',
    status: 'Paused',
    isSystem: false,
  });
}

function automationLabelForRuleType(ruleType: CrmAutomationRuleType) {
  if (ruleType === 'newLeadWelcome') return 'New Lead Welcome';
  if (ruleType === 'sampleFollowUp') return 'Sample Follow-up';
  if (ruleType === 'dormantLeadReengagement') return 'Dormant Lead Re-engagement';
  if (ruleType === 'quoteExpiryAlert') return 'Quote Expiry Alert';
  return 'Custom Automation';
}

function buildAutomationTrigger(ruleType: CrmAutomationRuleType, config: Pick<CrmAutomationConfig, 'thresholdDays' | 'thresholdHours' | 'trigger'>) {
  if (ruleType === 'dormantLeadReengagement') {
    return `Inactivity > ${config.thresholdDays ?? 14}d`;
  }
  if (ruleType === 'sampleFollowUp') {
    return `Sample Delivered + ${config.thresholdHours ?? 48}h`;
  }
  if (ruleType === 'quoteExpiryAlert') {
    return `Quote Expiry - ${config.thresholdHours ?? 24}h`;
  }
  if (ruleType === 'newLeadWelcome') {
    return 'Lead Created';
  }
  return config.trigger || 'Manual Rule';
}

const CRMAutomations = ({
  studio,
  customers,
  calendarEntries,
}: {
  studio?: CommsStudioSnapshot | null;
  customers: Customer[];
  calendarEntries: MarketingCalendarEntry[];
}) => {
  const [automationConfigs, setAutomationConfigs] = useState<CrmAutomationConfig[]>(() => readStoredCrmAutomationConfigs());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<CrmAutomationConfig>(() => createCrmAutomationDraft());
  const queueItems = useMemo(() => buildCrmQueueItems(customers), [customers]);

  useEffect(() => {
    persistCrmAutomationConfigs(automationConfigs);
  }, [automationConfigs]);

  const automations = useMemo(
    () => automationConfigs.map((automation) => ({
      ...automation,
      ...deriveCrmAutomationRuntime(automation, studio, queueItems, calendarEntries),
    })),
    [automationConfigs, calendarEntries, queueItems, studio],
  );

  const openCreateEditor = useCallback(() => {
    setDraft(createCrmAutomationDraft());
    setIsEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((automation: CrmAutomationConfig) => {
    setDraft(automation);
    setIsEditorOpen(true);
  }, []);

  const toggleAutomationStatus = useCallback((automationId: string) => {
    const target = automationConfigs.find((automation) => automation.id === automationId);
    if (!target) {
      return;
    }

    const status = target.status === 'Active' ? 'Paused' : 'Active';
    setAutomationConfigs((current) => current.map((automation) => (
      automation.id === automationId
        ? {
          ...automation,
          status,
          updatedAt: nowIsoString(),
        }
        : automation
    )));
    toast(`${target.name} ${status === 'Active' ? 'activated' : 'paused'}.`);
  }, [automationConfigs]);

  const saveDraft = useCallback(() => {
    const nextDraft = createCrmAutomationConfig({
      ...draft,
      name: draft.name.trim() || automationLabelForRuleType(draft.ruleType),
      trigger: buildAutomationTrigger(draft.ruleType, draft),
      updatedAt: nowIsoString(),
    });

    setAutomationConfigs((current) => {
      const existingById = current.find((automation) => automation.id === nextDraft.id);
      const existingByRuleType = nextDraft.ruleType === 'custom'
        ? null
        : current.find((automation) => automation.ruleType === nextDraft.ruleType);

      if (existingById || existingByRuleType) {
        const targetId = existingById?.id ?? existingByRuleType?.id ?? nextDraft.id;
        return current.map((automation) => (
          automation.id === targetId
            ? {
              ...nextDraft,
              id: targetId,
              createdAt: automation.createdAt,
            }
            : automation
        ));
      }

      return [...current, nextDraft];
    });

    toast(`${nextDraft.name} logic saved.`);
    setIsEditorOpen(false);
  }, [draft]);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Workflow Automations</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Deterministic Relationship Logic</p>
        </div>
        <button
          type="button"
          onClick={openCreateEditor}
          className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
        >
          <Plus size={14} /> Create New Automation
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((auto) => (
          <div key={auto.id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-[#00ff88]/30 transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <auto.icon size={120} className={auto.color} />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className={`p-3 bg-white/5 rounded-xl ${auto.color} group-hover:bg-[#00ff88] group-hover:text-black transition-all`}>
                <auto.icon size={20} />
              </div>
              <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                auto.status === 'Active' ? 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10' : 'bg-white/5 text-white/40 border-white/10'
              }`}>
                {auto.status}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00ff88] transition-colors">{auto.name}</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-8 line-clamp-2">{auto.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Trigger</div>
                <div className="text-[10px] font-bold text-white truncate">{auto.trigger}</div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Last Run</div>
                <div className="text-[10px] font-mono text-white/60">{auto.lastRunLabel}</div>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Live Signal</div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] text-white/60">{auto.eligibleLabel}</div>
                <div className="text-[10px] font-mono text-[#00ff88]">{auto.eligibleCount}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => openEditEditor(auto)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Edit Logic
              </button>
              <button
                type="button"
                onClick={() => toggleAutomationStatus(auto.id)}
                title={auto.status === 'Active' ? 'Pause automation' : 'Activate automation'}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm px-6 py-10"
          >
            <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="w-full rounded-[28px] border border-white/10 bg-[#0b0b0b] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
              >
                <div className="flex items-start justify-between border-b border-white/5 px-8 py-6">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#00ff88]">Automation Logic</div>
                    <h2 className="mt-2 text-2xl font-serif font-bold uppercase tracking-tight text-white">
                      {draft.isSystem ? `Edit ${automationLabelForRuleType(draft.ruleType)}` : 'Create CRM Automation'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-6 px-8 py-8 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Automation Family</span>
                    <select
                      value={draft.ruleType}
                      disabled={draft.isSystem}
                      onChange={(event) => {
                        const ruleType = event.target.value as CrmAutomationRuleType;
                        const seeded = createCrmAutomationConfig({
                          id: draft.ruleType === 'custom' ? draft.id : `auto_custom_${Math.random().toString(36).slice(2, 8)}`,
                          ruleType,
                          status: draft.status,
                          isSystem: ruleType !== 'custom',
                        });
                        setDraft((current) => ({
                          ...current,
                          ...seeded,
                          id: current.isSystem && ruleType !== 'custom' ? current.id : seeded.id,
                        }));
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="newLeadWelcome">New Lead Welcome</option>
                      <option value="sampleFollowUp">Sample Follow-up</option>
                      <option value="dormantLeadReengagement">Dormant Lead Re-engagement</option>
                      <option value="quoteExpiryAlert">Quote Expiry Alert</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Name</span>
                    <input
                      value={draft.name}
                      onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as CrmAutomationStatus }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Description</span>
                    <textarea
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                    />
                  </label>

                  {draft.ruleType === 'dormantLeadReengagement' && (
                    <label className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Inactivity Days</span>
                      <input
                        type="number"
                        min={1}
                        value={draft.thresholdDays ?? 14}
                        onChange={(event) => setDraft((current) => ({ ...current, thresholdDays: Number(event.target.value) || 14 }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                      />
                    </label>
                  )}

                  {(draft.ruleType === 'sampleFollowUp' || draft.ruleType === 'quoteExpiryAlert') && (
                    <label className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">
                        {draft.ruleType === 'sampleFollowUp' ? 'Follow-up Hours' : 'Alert Window Hours'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={draft.thresholdHours ?? (draft.ruleType === 'sampleFollowUp' ? 48 : 24)}
                        onChange={(event) => setDraft((current) => ({ ...current, thresholdHours: Number(event.target.value) || (draft.ruleType === 'sampleFollowUp' ? 48 : 24) }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                      />
                    </label>
                  )}

                  {draft.ruleType === 'custom' && (
                    <label className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Trigger Label</span>
                      <input
                        value={draft.trigger}
                        onChange={(event) => setDraft((current) => ({ ...current, trigger: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#00ff88]/40"
                      />
                    </label>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Resolved Trigger</div>
                    <div className="mt-2 text-sm font-semibold text-white">{buildAutomationTrigger(draft.ruleType, draft)}</div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      This page now reads live CRM signals from inbound comms, quote follow-up stages, tender response reminders, and customer inactivity windows. Editing the logic updates how this automation is evaluated here without forking the workflow model.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 px-8 py-6">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
                    {draft.isSystem ? 'System automation' : 'Custom automation'}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="rounded-xl bg-[#00ff88] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e]"
                    >
                      Save Logic
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function formatCommsTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return parsed.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

function commsProviderIcon(provider: CommsProvider) {
  switch (provider) {
    case 'WhatsApp':
      return MessageSquare;
    case 'Email':
      return Mail;
    case 'Facebook':
      return Facebook;
    case 'Instagram':
      return Instagram;
    case 'LinkedIn':
      return Linkedin;
    case 'TikTok':
      return Music;
    case 'Pinterest':
      return Pin;
    default:
      return Globe;
  }
}

function commsProviderTone(provider: CommsProvider) {
  switch (provider) {
    case 'WhatsApp':
      return 'text-[#00ff88]';
    case 'Email':
      return 'text-blue-400';
    case 'Facebook':
      return 'text-indigo-400';
    case 'Instagram':
      return 'text-pink-400';
    case 'LinkedIn':
      return 'text-sky-400';
    case 'TikTok':
      return 'text-fuchsia-400';
    case 'Pinterest':
      return 'text-red-400';
    default:
      return 'text-white/40';
  }
}

function commsCategoryTone(category: CommsConversationSummary['category']) {
  switch (category) {
    case 'Quote':
      return 'bg-blue-500/5 text-blue-400 border-blue-500/10';
    case 'Delivery':
      return 'bg-amber-500/5 text-amber-400 border-amber-500/10';
    case 'Payment':
      return 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10';
    case 'Support':
      return 'bg-red-500/5 text-red-400 border-red-500/10';
    case 'Lead':
      return 'bg-purple-500/5 text-purple-400 border-purple-500/10';
    default:
      return 'bg-white/5 text-white/40 border-white/5';
  }
}

const COMMS_EMOJI_OPTIONS = ['👍', '🙏', '😊', '🔥', '✅', '📎', '📐', '🧱', '🚚', '💬', '💳', '📸'];

function formatCommsAttachmentSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function CommsAttachmentCard({ attachment, compact = false, onRemove }: { attachment: CommsAttachmentSummary; compact?: boolean; onRemove?: () => void }) {
  const isImage = attachment.kind === 'image' || attachment.mimeType.startsWith('image/');
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${compact ? 'p-3' : 'p-4'}`}>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 z-10 rounded-full border border-white/10 bg-black/70 p-1 text-white/50 transition-colors hover:text-white"
        >
          <X size={12} />
        </button>
      ) : null}
      {isImage ? (
        <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
          <img src={attachment.url} alt={attachment.fileName} className={`w-full rounded-xl object-cover ${compact ? 'h-20' : 'h-40'}`} />
        </a>
      ) : (
        <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#00ff88]">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-white">{attachment.fileName}</div>
            <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-white/30">{attachment.kind} • {formatCommsAttachmentSize(attachment.size)}</div>
          </div>
        </a>
      )}
      {isImage ? (
        <div className="mt-3 min-w-0">
          <div className="truncate text-[10px] font-bold uppercase tracking-widest text-white/65">{attachment.fileName}</div>
          <div className="mt-1 text-[8px] font-mono uppercase tracking-widest text-white/30">{formatCommsAttachmentSize(attachment.size)}</div>
        </div>
      ) : null}
    </div>
  );
}

function marketingChannelFromCommsProvider(provider: CommsProvider): MarketingChannel | undefined {
  if (provider === 'Web' || provider === 'Internal') {
    return undefined;
  }
  return provider;
}

const LiveCommsCentre = ({
  onCreateCalendarEntry,
  products,
  preferredConversationId,
}: {
  onCreateCalendarEntry?: (input: CreateMarketingCalendarEntryInput) => Promise<unknown>;
  products: Product[];
  preferredConversationId?: string | null;
}) => {
  const comms = useCommsData();
  const location = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<CommsAttachmentSummary[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeInbox, setActiveInbox] = useState<'all' | 'unread' | 'assigned' | 'resolved'>('all');
  const [activeProvider, setActiveProvider] = useState<CommsProvider | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteComposerSeed, setQuoteComposerSeed] = useState<{ customer: Customer; conversationId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedShareDraftRef = useRef<string | null>(null);

  const conversations = comms.studio?.conversations ?? [];
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null;

	  useEffect(() => {
	    if (!selectedConversationId && conversations[0]) {
	      setSelectedConversationId(conversations[0].id);
      return;
    }

    if (selectedConversationId && conversations.length && !conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0].id);
	    }
	  }, [conversations, selectedConversationId]);

	  useEffect(() => {
	    setPendingAttachments([]);
	    setIsEmojiPickerOpen(false);
	  }, [selectedConversationId]);

  useEffect(() => {
    if (!preferredConversationId) {
      return;
    }

    if (conversations.some((conversation) => conversation.id === preferredConversationId)) {
      setSelectedConversationId(preferredConversationId);
    }
  }, [conversations, preferredConversationId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shareDraft = params.get('shareDraft')?.trim();
    if (!shareDraft || stagedShareDraftRef.current === shareDraft) {
      return;
    }

    stagedShareDraftRef.current = shareDraft;
    setReplyText((current) => (current.trim() ? current : shareDraft));
    toast.success('Document share message staged in the Comms composer.');
  }, [location.search]);

  const filteredConversations = conversations.filter((conversation) => {
    const matchesInbox =
      activeInbox === 'all' ||
      (activeInbox === 'unread' && conversation.unreadCount > 0) ||
      (activeInbox === 'assigned' && Boolean(conversation.assignedTo)) ||
      (activeInbox === 'resolved' && conversation.status === 'Resolved');
    const matchesProvider = activeProvider === 'All' || conversation.provider === activeProvider;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !normalizedSearch ||
      conversation.customerName.toLowerCase().includes(normalizedSearch) ||
      (conversation.lastMessage ?? '').toLowerCase().includes(normalizedSearch) ||
      (conversation.linkedCustomer?.email ?? '').toLowerCase().includes(normalizedSearch);
    return matchesInbox && matchesProvider && matchesSearch;
  });

  const handleSendMessage = async () => {
    if ((!replyText.trim() && pendingAttachments.length === 0) || !selectedConversation) return;
    setIsSending(true);
    try {
      await comms.sendReply(selectedConversation.id, { body: replyText, actorLabel: 'Owner', attachments: pendingAttachments });
      setReplyText('');
      setPendingAttachments([]);
      setIsEmojiPickerOpen(false);
      toast.success('Reply sent through the Comms bridge.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reply.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentSelection = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => comms.uploadAttachment(file)));
      setPendingAttachments((current) => [...current, ...uploaded]);
      toast.success(`${uploaded.length} attachment${uploaded.length === 1 ? '' : 's'} staged for reply.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Attachment upload failed.');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const appendEmoji = (emoji: string) => {
    setReplyText((current) => `${current}${emoji}`);
    setIsEmojiPickerOpen(false);
  };

  const handleOpenQuoteComposer = useCallback(() => {
    if (!selectedConversation) {
      return;
    }

    const matchedCustomer = crmCustomerForInteraction(
      comms.studio,
      selectedConversation.linkedCustomer?.customerKey,
      selectedConversation.customerName,
    );

    if (!matchedCustomer) {
      toast.error('This conversation still needs a linked CRM customer before a quote can be created.');
      return;
    }

    setQuoteComposerSeed({
      customer: matchedCustomer,
      conversationId: selectedConversation.id,
    });
  }, [comms.studio, selectedConversation]);

	  const runAction = async (label: string, action: () => Promise<unknown>) => {
	    try {
	      await action();
	      toast.success(label);
	    } catch (error) {
	      toast.error(error instanceof Error ? error.message : 'Comms action failed.');
	    }
	  };

	  const handleCreateFollowUpTask = async () => {
	    if (!selectedConversation) return;
	    const customerName = selectedConversation.linkedCustomer?.name ?? selectedConversation.customerName;
	    const note = `Follow up with ${customerName} from ${selectedConversation.provider}.`;
	    const description = [
	      note,
	      selectedConversation.lastMessage ? `Last message: ${selectedConversation.lastMessage}` : null,
	      selectedConversation.linkedCustomer?.customerKey ? `Customer: ${selectedConversation.linkedCustomer.customerKey}` : null,
	      `Conversation: ${selectedConversation.conversationKey}`,
	    ].filter(Boolean).join('\n');

	    try {
	      await comms.createTask(selectedConversation.id, { actorLabel: 'Owner', note });
	      if (onCreateCalendarEntry) {
	        await onCreateCalendarEntry({
	          entryType: 'Reminder',
	          title: `Follow up: ${customerName}`,
	          description,
	          channel: marketingChannelFromCommsProvider(selectedConversation.provider),
	          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
	        });
	      }
	      toast.success('Follow-up task created and added to Calendar.');
	    } catch (error) {
	      toast.error(error instanceof Error ? error.message : 'Failed to create follow-up task.');
	    }
	  };

	  if (comms.isLoading && !comms.studio) {
    return (
      <div className="h-full flex items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
          <RefreshCw size={14} className="animate-spin text-[#00ff88]" /> Loading unified inbox
        </div>
      </div>
    );
  }

  if (comms.error && !comms.studio) {
    return (
      <div className="h-full flex items-center justify-center bg-[#050505] p-8">
        <div className="max-w-xl rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-300 mb-3">Comms Runtime</div>
          <div className="text-xl font-serif font-bold uppercase text-white mb-3">Inbox could not load</div>
          <p className="text-sm text-white/55 mb-6">{comms.error}</p>
          <button onClick={() => void comms.refresh()} className="px-6 py-3 rounded-xl bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-widest">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'all' as const, label: 'All', icon: Inbox },
          { id: 'unread' as const, label: 'Unread', icon: Bell },
          { id: 'assigned' as const, label: 'Assigned', icon: User },
          { id: 'resolved' as const, label: 'Resolved', icon: CheckCircle2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveInbox(item.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
              activeInbox === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'text-white/40 border-transparent'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">Comms Centre</h2>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mt-1">Unified Inbox</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
          <div className="space-y-1">
            <h3 className="px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Inboxes</h3>
            {[
              { id: 'all' as const, label: 'All Messages', icon: Inbox, count: comms.studio?.counts.all ?? 0 },
              { id: 'unread' as const, label: 'Unread', icon: Bell, count: comms.studio?.counts.unread ?? 0 },
              { id: 'assigned' as const, label: 'Assigned to Me', icon: User, count: comms.studio?.counts.assignedToMe ?? 0 },
              { id: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, count: comms.studio?.counts.resolved ?? 0 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveInbox(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all group ${
                  activeInbox === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={activeInbox === item.id ? 'text-[#00ff88]' : 'group-hover:text-[#00ff88] transition-colors'} />
                  {item.label}
                </div>
                {item.count > 0 && <span className="text-[10px] font-mono text-[#00ff88]">{item.count}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Channels</h3>
            <button
              onClick={() => setActiveProvider('All')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                activeProvider === 'All' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3"><Globe size={16} /> All Channels</span>
              <span className="text-[10px] font-mono text-[#00ff88]">{conversations.length}</span>
            </button>
            {(comms.studio?.channels ?? []).map((channel) => {
              const Icon = commsProviderIcon(channel.provider);
              return (
                <button
                  key={channel.provider}
                  onClick={() => setActiveProvider(channel.provider)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all group ${
                    activeProvider === channel.provider ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className={commsProviderTone(channel.provider)} />
                    {channel.provider}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">{channel.unreadCount || channel.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/5 flex-col bg-[#050505]`}>
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff88]/30 focus:bg-white/[0.02] transition-all"
            />
          </div>
          <button onClick={() => void comms.refresh()} className="p-2.5 bg-[#0f0f0f] border border-white/5 rounded-xl text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.02] transition-all">
            <RefreshCw size={16} className={comms.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
          {filteredConversations.length ? filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversationId(conversation.id)}
              className={`w-full p-6 text-left hover:bg-white/[0.04] transition-all relative group ${selectedConversation?.id === conversation.id ? 'bg-white/[0.06] border-l-2 border-[#00ff88]' : 'border-l-2 border-transparent'}`}
            >
              {conversation.unreadCount > 0 && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-full shadow-[0_0_8px_rgba(0,255,136,0.2)]" />}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{conversation.customerName}</div>
                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">{conversation.provider}</span>
                </div>
                <div className="text-[10px] font-mono text-white/20">{formatCommsTime(conversation.lastMessageAt)}</div>
              </div>
              <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-3">{conversation.lastMessage ?? 'No messages yet.'}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${commsCategoryTone(conversation.category)}`}>{conversation.category}</span>
                <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-white/25">
                  {conversation.linkedCustomer?.matchState ?? 'Unlinked'}
                </div>
              </div>
            </button>
          )) : (
            <div className="p-8 text-sm text-white/35">No conversations match this filter.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex bg-[#050505] relative">
        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <motion.div
              key={selectedConversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex w-full h-full"
            >
              <div className="flex-1 flex flex-col border-r border-white/5">
                <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-xl font-bold border border-white/5">
                      {selectedConversation.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">{selectedConversation.customerName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Active via {selectedConversation.provider}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Lead State: {selectedConversation.linkedCustomer?.stage ?? 'Provisional'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => runAction('Conversation assigned to Owner.', () => comms.assignConversation(selectedConversation.id, { assignedTo: 'Owner', actorLabel: 'Owner' }))} className="px-6 py-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2">
                      <UserPlus size={14} /> Assign
                    </button>
                    <button onClick={() => toast.success('Tagging is logged through workflow actions in the next connector pass.')} className="px-6 py-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2">
                      <Tag size={14} /> Tag
                    </button>
                    <button onClick={() => runAction('Conversation resolved.', () => comms.resolveConversation(selectedConversation.id, { actorLabel: 'Owner' }))} className="px-6 py-3 bg-[#00ff88]/5 text-[#00ff88] border border-[#00ff88]/10 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00ff88]/10 hover:border-[#00ff88]/20 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.05)]">
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                  {selectedConversation.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex ${message.direction === 'Outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md space-y-2 ${message.direction === 'Outbound' ? 'items-end' : 'items-start'}`}>
	                        <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
	                          message.direction === 'Outbound'
	                            ? 'bg-[#00ff88] text-black font-medium rounded-tr-none shadow-[0_10px_30px_rgba(0,255,136,0.1)]'
	                            : 'bg-[#0f0f0f] text-white border border-white/5 rounded-tl-none'
	                        }`}>
	                          {message.body}
	                        </div>
	                        {message.attachments.length ? (
	                          <div className="grid grid-cols-1 gap-3">
	                            {message.attachments.map((attachment) => (
	                              <CommsAttachmentCard key={attachment.id} attachment={attachment} />
	                            ))}
	                          </div>
	                        ) : null}
	                        <div className="text-[10px] font-mono text-white/20 px-1">{message.senderName} · {formatCommsTime(message.occurredAt)} · {message.status}</div>
	                      </div>
                    </motion.div>
                  ))}
                </div>

                <footer className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden focus-within:border-[#00ff88]/30 transition-all shadow-2xl">
                    <textarea
                      placeholder={`Reply to ${selectedConversation.customerName}...`}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleSendMessage();
                        }
	                      }}
	                      className="w-full bg-transparent p-6 text-sm text-white focus:outline-none resize-none h-32 custom-scrollbar"
	                    />
	                    {pendingAttachments.length ? (
	                      <div className="border-t border-white/5 p-4">
	                        <div className="mb-3 text-[9px] font-mono uppercase tracking-widest text-white/30">Staged attachments</div>
	                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
	                          {pendingAttachments.map((attachment) => (
	                            <CommsAttachmentCard
	                              key={attachment.id}
	                              attachment={attachment}
	                              compact
	                              onRemove={() => setPendingAttachments((current) => current.filter((item) => item.id !== attachment.id))}
	                            />
	                          ))}
	                        </div>
	                      </div>
	                    ) : null}
	                    <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
	                      <div className="relative flex gap-2">
	                        <input
	                          ref={fileInputRef}
	                          type="file"
	                          multiple
	                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
	                          onChange={(event) => { void handleAttachmentSelection(event.target.files); }}
	                          className="hidden"
	                        />
	                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAttachment} className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50">
	                          {isUploadingAttachment ? <RefreshCw size={18} className="animate-spin text-[#00ff88]" /> : <Paperclip size={18} />}
	                        </button>
	                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAttachment} className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"><Image size={18} /></button>
	                        <button type="button" onClick={() => setIsEmojiPickerOpen((current) => !current)} className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Smile size={18} /></button>
	                        {isEmojiPickerOpen ? (
	                          <div className="absolute bottom-12 left-0 z-20 grid w-64 grid-cols-6 gap-2 rounded-2xl border border-white/10 bg-[#050505] p-3 shadow-2xl">
	                            {COMMS_EMOJI_OPTIONS.map((emoji) => (
	                              <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} className="rounded-xl bg-white/[0.03] p-2 text-lg transition-colors hover:bg-white/10">
	                                {emoji}
	                              </button>
	                            ))}
	                          </div>
	                        ) : null}
	                      </div>
	                      <div className="flex items-center gap-4">
	                        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{pendingAttachments.length ? `${pendingAttachments.length} attachment${pendingAttachments.length === 1 ? '' : 's'} staged` : 'Press Enter to send'}</div>
	                        <button
	                          onClick={() => void handleSendMessage()}
	                          disabled={isSending || isUploadingAttachment || (!replyText.trim() && pendingAttachments.length === 0)}
                          className="px-8 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          {isSending ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>

              <div className="w-80 bg-[#0a0a0a] flex flex-col border-l border-white/5">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <GitMerge size={16} className="text-[#00ff88]" />
                    Workflow Routing
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
	                  <div className="rounded-2xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-4">
	                    <div className="flex items-center gap-3">
	                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ff88]/10 text-[#00ff88]">
	                        <UserCheck size={16} />
	                      </div>
	                      <div>
	                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">Automated Intake</div>
	                        <p className="mt-1 text-[10px] leading-relaxed text-white/45">Customer matching, provisional profile creation, portal readiness, and lead-stage CRM intake run when the first channel message lands.</p>
	                      </div>
	                    </div>
	                  </div>

	                  <div className="grid grid-cols-2 gap-2">
			                  <button onClick={handleOpenQuoteComposer} className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                      <FileText size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Create Quote</span>
	                    </button>
			                  <button onClick={() => void handleCreateFollowUpTask()} className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                      <ListTodo size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Create Task</span>
	                    </button>
			                  <button onClick={() => runAction('Missing info request sent.', () => comms.requestInfo(selectedConversation.id, { actorLabel: 'Owner' }))} className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
                      <AlertTriangle size={16} className="text-white/40 group-hover:text-[#00ff88]" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Req. Info</span>
                    </button>
			                  <button onClick={() => runAction('Support issue flagged.', () => comms.createSupportIssue(selectedConversation.id, { actorLabel: 'Owner' }))} className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
                      <ShieldAlert size={16} className="text-white/40 group-hover:text-[#00ff88]" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Support Issue</span>
                    </button>
                  </div>

                  <div className="w-full h-px bg-white/5" />
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Linked Context</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-white/40">Customer</span>
                        <span className={selectedConversation.linkedCustomer?.matchState === 'Verified' ? 'text-[#00ff88]' : 'text-amber-400'}>{selectedConversation.linkedCustomer?.matchState ?? 'Unlinked'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">{selectedConversation.customerName.charAt(0)}</div>
                        <div>
                          <div className="text-xs font-bold text-white">{selectedConversation.linkedCustomer?.name ?? selectedConversation.customerName}</div>
                          <div className="text-[10px] text-white/40">{selectedConversation.linkedCustomer?.email ?? selectedConversation.externalIdentity?.email ?? 'Email pending'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-white/40">Portal</span>
                        <span className="text-blue-400">{selectedConversation.portalInvite?.status ?? 'Pending'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5">
                        <div className="text-xs font-bold text-white">{selectedConversation.portalInvite?.portalPath ?? '/portal'}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Customer profile access path</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-white/40">Readiness</span>
                        <span className={selectedConversation.readinessIssues.length ? 'text-amber-400' : 'text-[#00ff88]'}>{selectedConversation.readinessIssues.length ? `${selectedConversation.readinessIssues.length} Open` : 'Ready'}</span>
                      </div>
                      <div className="space-y-2">
                        {(selectedConversation.readinessIssues.length ? selectedConversation.readinessIssues : ['No readiness issues detected']).map((issue) => (
                          <div key={issue} className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 text-[10px] text-white/45 uppercase tracking-widest">
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-white/40">Recent Actions</span>
                        <span className="text-white/30">{selectedConversation.actions.length}</span>
                      </div>
                      <div className="space-y-2">
                        {selectedConversation.actions.slice(0, 4).map((action) => (
                          <div key={action.id} className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5">
                            <div className="text-xs font-bold text-white">{action.actionType}</div>
                            <div className="text-[10px] text-white/40 mt-0.5">{action.label}</div>
                          </div>
                        ))}
                        {!selectedConversation.actions.length ? (
                          <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 text-[10px] text-white/35 uppercase tracking-widest">No workflow actions yet</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mb-6 border border-white/5">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">No conversation selected</h3>
              <p className="text-sm text-white/40 max-w-sm">Select a conversation from the unified inbox to view customer context and workflow routing.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <CustomerQuoteComposerDialog
          isOpen={Boolean(quoteComposerSeed)}
          customer={quoteComposerSeed?.customer ?? null}
          products={products}
          sourceConversationId={quoteComposerSeed?.conversationId}
          onClose={() => setQuoteComposerSeed(null)}
          onCreated={async () => {
            await comms.refresh();
          }}
        />
      </div>
    </div>
  );
};

const CommsCentre = ({ selectedThread, onThreadSelect }: { selectedThread: CommsThread | null, onThreadSelect: (thread: CommsThread) => void }) => {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedThread) return;
    
    setIsSending(true);
    // Simulate sending
    setTimeout(() => {
      setReplyText('');
      setIsSending(false);
      // In a real app, we would update the message list here
    }, 800);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav (Channels/Inboxes) */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'all', label: 'All', icon: Inbox },
          { id: 'unread', label: 'Unread', icon: Bell },
          { id: 'assigned', label: 'Assigned', icon: User },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
          { id: 'email', label: 'Email', icon: Mail },
        ].map((item) => (
          <button
            key={item.id}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/40 border border-transparent"
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>
      {/* Left Column: Filters (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">Comms Centre</h2>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mt-1">Unified Inbox</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
          <div className="space-y-1">
            <h3 className="px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Inboxes</h3>
            {[
              { id: 'all', label: 'All Messages', icon: Inbox, count: 12 },
              { id: 'unread', label: 'Unread', icon: Bell, count: 5 },
              { id: 'assigned', label: 'Assigned to Me', icon: User, count: 3 },
              { id: 'resolved', label: 'Resolved', icon: CheckCircle2, count: 0 },
            ].map((item) => (
              <button key={item.id} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="group-hover:text-[#00ff88] transition-colors" />
                  {item.label}
                </div>
                {item.count > 0 && <span className="text-[10px] font-mono text-[#00ff88]">{item.count}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Channels</h3>
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
              { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-500' },
              { id: 'meta', label: 'Meta', icon: Facebook, color: 'text-purple-500' },
              { id: 'tiktok', label: 'TikTok', icon: Music, color: 'text-pink-500' },
            ].map((item) => (
              <button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all group">
                <item.icon size={16} className={item.color} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Column: Thread List */}
      <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/5 flex-col bg-[#050505]`}>
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff88]/30 focus:bg-white/[0.02] transition-all"
            />
          </div>
          <button className="p-2.5 bg-[#0f0f0f] border border-white/5 rounded-xl text-white/40 hover:text-white hover:border-white/10 hover:bg-white/[0.02] transition-all">
            <Filter size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
          {MOCK_COMMS_THREADS.map((thread) => (
            <button 
              key={thread.id} 
              onClick={() => onThreadSelect(thread)}
              className={`w-full p-6 text-left hover:bg-white/[0.04] transition-all relative group ${selectedThread?.id === thread.id ? 'bg-white/[0.06] border-l-2 border-[#00ff88]' : 'border-l-2 border-transparent'}`}
            >
              {thread.unread && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-full shadow-[0_0_8px_rgba(0,255,136,0.2)]" />}
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{thread.customerName}</div>
                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">{thread.channel}</span>
                </div>
                <div className="text-[10px] font-mono text-white/20">{thread.timestamp}</div>
              </div>
              
              <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-3">{thread.lastMessage}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                    thread.category === 'Quote' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' : 
                    thread.category === 'Delivery' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' : 
                    'bg-white/5 text-white/40 border-white/5'
                  }`}>
                    {thread.category}
                  </span>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full border border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[6px] font-bold">RK</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Active Thread + Context */}
      <div className="flex-1 flex bg-[#050505] relative">
        <AnimatePresence mode="wait">
          {selectedThread ? (
            <motion.div 
              key={selectedThread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex w-full h-full"
            >
              {/* Chat Area */}
              <div className="flex-1 flex flex-col border-r border-white/5">
                <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-xl font-bold border border-white/5">
                      {selectedThread.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">{selectedThread.customerName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Active via {selectedThread.channel}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Lead State: Warm</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2">
                      <UserPlus size={14} /> Assign
                    </button>
                    <button className="px-6 py-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2">
                      <Tag size={14} /> Tag
                    </button>
                    <button className="px-6 py-3 bg-[#00ff88]/5 text-[#00ff88] border border-[#00ff88]/10 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00ff88]/10 hover:border-[#00ff88]/20 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.05)]">
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                    <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.02] hover:border-white/10 transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                  <div className="flex justify-center">
                    <span className="px-4 py-1 rounded-full bg-white/5 border border-white/5 text-[8px] font-bold uppercase tracking-widest text-white/20">Yesterday</span>
                  </div>
                  
                  {MOCK_MESSAGES.filter(m => m.threadId === selectedThread.id).map((msg, index) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${msg.sender === 'Agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md space-y-2 ${msg.sender === 'Agent' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'Agent' 
                            ? 'bg-[#00ff88] text-black font-medium rounded-tr-none shadow-[0_10px_30px_rgba(0,255,136,0.1)]' 
                            : 'bg-[#0f0f0f] text-white border border-white/5 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <div className="text-[10px] font-mono text-white/20 px-1">{msg.timestamp}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <footer className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden focus-within:border-[#00ff88]/30 transition-all shadow-2xl">
                    <textarea 
                      placeholder={`Reply to ${selectedThread.customerName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="w-full bg-transparent p-6 text-sm text-white focus:outline-none resize-none h-32 custom-scrollbar"
                    />
                    <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Paperclip size={18} /></button>
                        <button className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Image size={18} /></button>
                        <button className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Smile size={18} /></button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Press Enter to send</div>
                        <button 
                          onClick={handleSendMessage}
                          disabled={isSending || !replyText.trim()}
                          className="px-8 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSending ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          {isSending ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>

            {/* Context Sidebar */}
            <div className="w-80 bg-[#0a0a0a] flex flex-col border-l border-white/5">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <GitMerge size={16} className="text-[#00ff88]" />
                  Workflow Routing
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
	                <div className="rounded-2xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-4">
	                  <div className="flex items-center gap-3">
	                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ff88]/10 text-[#00ff88]">
	                      <UserCheck size={16} />
	                    </div>
	                    <div>
	                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">Automated Intake</div>
	                      <p className="mt-1 text-[10px] leading-relaxed text-white/45">Customer matching, provisional profile creation, portal readiness, and lead-stage CRM intake run when the first channel message lands.</p>
	                    </div>
	                  </div>
	                </div>

	                {/* Quick Actions Grid */}
	                <div className="grid grid-cols-2 gap-2">
		                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                    <FileText size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Convert Quote</span>
	                  </button>
		                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                    <ListTodo size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Create Task</span>
	                  </button>
		                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                    <AlertTriangle size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Req. Info</span>
	                  </button>
		                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
	                    <ShieldAlert size={16} className="text-white/40 group-hover:text-[#00ff88]" />
	                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Support Issue</span>
                  </button>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* Linked Context */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Linked Context</h4>
                  
                  {/* Customer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">Customer</span>
                      <span className="text-[#00ff88]">Verified</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">{selectedThread.customerName.charAt(0)}</div>
                      <div>
                        <div className="text-xs font-bold text-white">{selectedThread.customerName}</div>
                        <div className="text-[10px] text-white/40">{selectedThread.customerName.toLowerCase().replace(' ', '.')}@example.com</div>
                      </div>
                    </div>
                  </div>

                  {/* Lead */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">Active Lead</span>
                      <span className="text-blue-400">Warm</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white">Kitchen Renovation</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Stage: Quote Sent</div>
                      </div>
                      <div className="text-xs font-mono text-[#00ff88]">£3,200</div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">Linked Quote</span>
                      <span className="text-yellow-400">Pending</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white">QT-2026-089</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Midnight Obsidian x 40m²</div>
                      </div>
                      <FileText size={14} className="text-white/20" />
                    </div>
                  </div>

                  {/* Order */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">Recent Order</span>
                      <span className="text-white/60">Completed</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center opacity-70">
                      <div>
                        <div className="text-xs font-bold text-white">ORD-2026-042</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Delivered 2 weeks ago</div>
                      </div>
                      <Box size={14} className="text-white/20" />
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-white/40">Active Delivery</span>
                      <span className="text-amber-400">Scheduled</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white">DEL-8821</div>
                        <div className="text-[10px] text-white/40 mt-0.5">ETA: Tomorrow, 10:00 AM</div>
                      </div>
                      <Truck size={14} className="text-white/20" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mb-6 border border-white/5">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2 uppercase tracking-tighter">No Conversation Selected</h3>
              <p className="text-sm text-white/30 max-w-xs leading-relaxed">Select a thread from the list to start managing the customer relationship.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CustomerQuoteComposerDialog = ({
  isOpen,
  customer,
  products,
  sourceConversationId,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  customer: Customer | null;
  products: Product[];
  sourceConversationId?: string;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
}) => {
  const quoteableProducts = useMemo(
    () => products.filter((product) => product.suppliersCount > 0),
    [products],
  );
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const preferredProduct = quoteableProducts[0];
    setTitle(customer ? `Customer Quote · ${customer.name}` : '');
    setSummary(customer ? `Draft quote prepared for ${customer.name}.` : '');
    setDueAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setSelectedProductId(preferredProduct?.id ?? '');
    setQuantity(10);
  }, [customer, isOpen, quoteableProducts]);

  const selectedProduct = quoteableProducts.find((product) => product.id === selectedProductId) ?? null;
  const estimatedTotal = selectedProduct ? selectedProduct.price * quantity : 0;

  const handleSubmit = async () => {
    if (!customer) {
      toast.error('A linked customer is required before a quote can be created.');
      return;
    }
    if (!selectedProductId) {
      toast.error('Select a product for the quote.');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomerQuoteDocument(customer.id, {
        title: title.trim() || undefined,
        summary: summary.trim() || undefined,
        dueAt: dueAt || undefined,
        sourceConversationId,
        lineItems: [{ productId: selectedProductId, quantity }],
      });
      toast.success('Customer quote created and linked into the workflow.');
      await Promise.resolve(onCreated?.());
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create customer quote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="fixed left-1/2 top-1/2 z-[141] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        <div className="border-b border-white/5 px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88]">CRM Workflow</div>
              <h3 className="mt-2 text-2xl font-serif font-bold uppercase tracking-tight text-white">Create Quote Draft</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                This creates a real customer quote, updates the CRM stage, and keeps the conversation and document lineage intact.
              </p>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/40 transition-colors hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-8 px-8 py-8 md:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">Customer</div>
              <div className="mt-2 text-lg font-semibold text-white">{customer?.name ?? 'No linked customer'}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
                {customer?.email ?? 'Email pending'} • {customer?.phone ?? 'Phone pending'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quote Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Due Date</span>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Workflow Summary</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="h-28 w-full rounded-2xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
              />
            </label>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quoted Product</div>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
              >
                <option value="">Select linked catalog product</option>
                {quoteableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.sku}
                  </option>
                ))}
              </select>

              <label className="mt-4 block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quantity</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Unit Price</span>
                <span className="text-sm font-semibold text-white">{selectedProduct ? formatZarCurrency(selectedProduct.price) : 'R 0'}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Estimated Total</span>
                <span className="text-2xl font-bold tracking-tight text-[#00ff88]">{formatZarCurrency(estimatedTotal)}</span>
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-widest text-white/25">
                Supplier-backed catalog products only. Purchase orders are created automatically once the quote is paid.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/65 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || quoteableProducts.length === 0}
                className="rounded-2xl bg-[#00ff88] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#00cc6e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const CustomerDetailDrawer = ({
  customer,
  isOpen,
  onClose,
  commsStudio,
  products,
  initialSection,
  onWorkflowChanged,
  onRequestReadinessInfo,
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  commsStudio?: CommsStudioSnapshot | null;
  products: Product[];
  initialSection?: string;
  onWorkflowChanged?: () => Promise<void> | void;
  onRequestReadinessInfo?: (customer: Customer, field: keyof Customer['readiness']) => Promise<void>;
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection ?? 'Overview');
  const [documentHistory, setDocumentHistory] = useState<CustomerDocumentHistory | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');
  const [isQuoteComposerOpen, setIsQuoteComposerOpen] = useState(false);
  const [activeWorkflowKey, setActiveWorkflowKey] = useState<string | null>(null);
  const [activeReadinessRequestKey, setActiveReadinessRequestKey] = useState<keyof Customer['readiness'] | null>(null);
  const { openPdfPreview } = usePdfPreview();
  const liveCommsHistory = useMemo(() => conversationsForCustomer(commsStudio, customer), [commsStudio, customer]);
  const customerTaskActions = useMemo(() => (
    liveCommsHistory
      .flatMap((thread) => thread.actions
        .filter((action) => action.actionType === 'Create Task')
        .map((action) => ({ action, thread })))
      .sort((a, b) => new Date(b.action.occurredAt).getTime() - new Date(a.action.occurredAt).getTime())
  ), [liveCommsHistory]);
  const lifetimeValue = useMemo(() => (
    (documentHistory?.documents ?? [])
      .filter((document) => document.type === 'Customer Invoice' && document.status === 'Paid')
      .reduce((sum, document) => sum + document.totalAmount, 0)
  ), [documentHistory?.documents]);

  const loadDocumentHistory = useCallback(async () => {
    if (!customer) {
      setDocumentHistory(null);
      return;
    }

    setIsLoadingDocuments(true);
    try {
      const payload = await fetchInventoryCustomerDocuments(customer.id);
      setDocumentHistory(payload);
    } catch {
      setDocumentHistory(null);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [customer]);

  const handleWorkflowRefresh = useCallback(async () => {
    await loadDocumentHistory();
    await Promise.resolve(onWorkflowChanged?.());
  }, [loadDocumentHistory, onWorkflowChanged]);

  const handleMarkQuotePaid = useCallback(async (documentKey: string) => {
    setActiveWorkflowKey(documentKey);
    try {
      await markCustomerQuotePaid(documentKey);
      await handleWorkflowRefresh();
      setActiveSection('Orders');
      toast.success(`Quote ${documentKey} marked as paid and converted into an order.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark quote as paid.');
    } finally {
      setActiveWorkflowKey(null);
    }
  }, [handleWorkflowRefresh]);

  const handleCompleteOrder = useCallback(async (documentKey: string, fulfilmentMode: 'Delivery' | 'Collection') => {
    setActiveWorkflowKey(documentKey);
    try {
      await completeCustomerOrderWorkflow(documentKey, {
        fulfilmentMode,
        note: `${fulfilmentMode} completed from CRM customer drawer.`,
      });
      await handleWorkflowRefresh();
      setActiveSection('History');
      toast.success(`${documentKey} completed as ${fulfilmentMode.toLowerCase()} and invoiced.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete customer order.');
    } finally {
      setActiveWorkflowKey(null);
    }
  }, [handleWorkflowRefresh]);

  const openCustomerDocumentPdf = useCallback((document: BusinessDocumentSummary) => {
    openPdfPreview({
      url: document.pdfUrl,
      title: document.key,
      subtitle: `${document.type} / ${document.status}`,
      fileName: `${document.key}.pdf`,
    });
  }, [openPdfPreview]);

  const handleRequestReadinessInfo = useCallback(async (field: keyof Customer['readiness']) => {
    if (!customer || !onRequestReadinessInfo) {
      return;
    }

    setActiveReadinessRequestKey(field);
    try {
      await onRequestReadinessInfo(customer, field);
      setActiveSection('Comms');
    } finally {
      setActiveReadinessRequestKey(null);
    }
  }, [customer, onRequestReadinessInfo]);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !customer) {
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      try {
        await loadDocumentHistory();
      } catch {
        if (!cancelled) {
          setDocumentHistory(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [customer?.id, isOpen, loadDocumentHistory]);

  useEffect(() => {
    if (!isOpen || !customer) {
      return;
    }

    setActiveSection(initialSection ?? 'Overview');
  }, [customer?.id, initialSection, isOpen]);

  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    const documents = documentHistory?.documents ?? [];
    if (!query) {
      return documents;
    }

    return documents.filter((document) =>
      document.key.toLowerCase().includes(query) ||
      document.title.toLowerCase().includes(query) ||
      document.type.toLowerCase().includes(query) ||
      (document.productName ?? '').toLowerCase().includes(query),
    );
  }, [documentHistory?.documents, documentSearch]);

  const quoteDocuments = filteredDocuments.filter((document) => document.type === 'Customer Quote');
  const orderDocuments = filteredDocuments.filter(
    (document) =>
      document.type === 'Customer Order' ||
      document.type === 'Customer Invoice' ||
      document.type === 'Delivery Note' ||
      document.type === 'Proof of Delivery',
  );

  if (!customer) return null;

  const sections = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Contact', label: 'Contact Channels', icon: MessageSquare },
    { id: 'Quotes', label: 'Quotes', icon: FileText },
    { id: 'Orders', label: 'Orders', icon: Box },
    { id: 'Logistics', label: 'Delivery/Logistics', icon: Truck },
    { id: 'Readiness', label: 'Readiness', icon: CheckCircle2 },
    { id: 'Comms', label: 'Comms History', icon: History },
    { id: 'Notes', label: 'Notes/Tasks', icon: ClipboardList },
    { id: 'History', label: 'History', icon: Activity },
  ];

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[900px] bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-2xl font-bold text-[#00ff88]">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold tracking-tighter text-white uppercase">{customer.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">{customer.type}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">ID: {customer.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsQuoteComposerOpen(true)}
                  className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                >
                  <Zap size={14} /> Create Quote
                </button>
                <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Navigation */}
              <aside className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-4 gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${
                      activeSection === section.id 
                        ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' 
                        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <section.icon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{section.label}</span>
                  </button>
                ))}
              </aside>

              {/* Content Area */}
              <main className="flex-1 overflow-y-auto custom-scrollbar p-12">
                {activeSection === 'Overview' && (
                  <div className="space-y-12">
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Total Quotes', value: documentHistory?.documents.filter((document) => document.type === 'Customer Quote').length ?? customer.linkedQuotes, icon: FileText },
                        { label: 'Total Orders', value: documentHistory?.documents.filter((document) => document.type === 'Customer Order').length ?? customer.linkedOrders, icon: Box },
                        { label: 'Lifetime Value', value: formatZarCurrency(lifetimeValue), icon: BarChart3 },
                      ].map((stat) => (
                        <button
                          key={stat.label}
                          type="button"
                          onClick={() => setActiveSection(
                            stat.label === 'Total Quotes'
                              ? 'Quotes'
                              : stat.label === 'Total Orders'
                                ? 'Orders'
                                : 'History',
                          )}
                          className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left transition-colors hover:border-[#00ff88]/20 hover:bg-white/[0.07]"
                        >
                          <stat.icon size={18} className="text-[#00ff88] mb-4" />
                          <div className="text-2xl font-bold font-mono tracking-tighter mb-1">{stat.value}</div>
                          <div className="text-[10px] uppercase tracking-widest text-white/30">{stat.label}</div>
                        </button>
                      ))}
                    </div>

                    <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-white/40">Active Blockers</h3>
                      <div className="space-y-4">
                        {customer.blockers.length > 0 ? (
                          customer.blockers.map((blocker, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400">
                              <AlertCircle size={16} />
                              <span className="text-xs font-medium">{blocker}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-white/20 italic">No active blockers detected.</div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeSection === 'Contact' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                            <Mail size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-1">{customer.email}</div>
                            <div className="text-[10px] uppercase tracking-widest text-white/30">Primary Email</div>
                          </div>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">Copy</button>
                      </div>

                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                            <Phone size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-1">{customer.phone}</div>
                            <div className="text-[10px] uppercase tracking-widest text-white/30">Mobile Phone</div>
                          </div>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">Call</button>
                      </div>

                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex items-center gap-6 group">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white mb-1">WhatsApp</div>
                          <div className="text-[10px] uppercase tracking-widest text-[#00ff88]">Active Channel</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'Readiness' && (
                  <div className="space-y-8">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl divide-y divide-white/5">
                      {Object.entries(customer.readiness).map(([key, val]) => {
                        const readinessKey = key as keyof Customer['readiness'];
                        const isRequesting = activeReadinessRequestKey === readinessKey;
                        return (
                        <div key={key} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${val ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                              {val ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                          <button
                            type="button"
                            disabled={val || isRequesting}
                            onClick={() => {
                              if (!val) {
                                void handleRequestReadinessInfo(readinessKey);
                              }
                            }}
                            className={`text-[10px] font-bold uppercase tracking-widest ${val ? 'text-white/20' : 'text-[#00ff88] hover:underline disabled:opacity-50 disabled:no-underline'}`}
                          >
                            {val ? 'Verified' : isRequesting ? 'Sending...' : 'Request Info'}
                          </button>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {activeSection === 'Quotes' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Linked Quotes</h3>
                      <div className="flex items-center gap-3">
                        <input
                          value={documentSearch}
                          onChange={(event) => setDocumentSearch(event.target.value)}
                          placeholder="Search quote history"
                          className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#00ff88]/30"
                        />
                        <button onClick={() => setIsQuoteComposerOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">+ New Quote</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {isLoadingDocuments ? (
                        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 text-xs text-white/35">Loading quote history...</div>
                      ) : quoteDocuments.map((quote) => (
                        <div key={quote.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white mb-1">{quote.key}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/30">{new Date(quote.issuedAt).toLocaleDateString('en-ZA')} • {quote.status}</div>
                              {quote.productName ? (
                                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/20">{quote.productName}</div>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-sm font-bold font-mono text-white">{formatZarCurrency(quote.totalAmount)}</div>
                            <div className="flex items-center justify-end gap-3">
                              {quote.status !== 'Paid' ? (
                                <button
                                  onClick={() => void handleMarkQuotePaid(quote.key)}
                                  disabled={activeWorkflowKey === quote.key}
                                  className="text-[10px] font-bold uppercase tracking-widest text-amber-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {activeWorkflowKey === quote.key ? 'Converting...' : 'Mark Paid'}
                                </button>
                              ) : null}
                              <button onClick={() => openCustomerDocumentPdf(quote)} className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">View PDF</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!isLoadingDocuments && quoteDocuments.length === 0 && (
                        <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                          <p className="text-xs text-white/20">No quotes found for this customer.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'Orders' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Order History</h3>
                      <div className="flex items-center gap-3">
                        <input
                          value={documentSearch}
                          onChange={(event) => setDocumentSearch(event.target.value)}
                          placeholder="Search order history"
                          className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#00ff88]/30"
                        />
                        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total: {orderDocuments.length || customer.linkedOrders}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {isLoadingDocuments ? (
                        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 text-xs text-white/35">Loading order history...</div>
                      ) : orderDocuments.map((order) => (
                        <div key={order.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                              <Box size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white mb-1">{order.key}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/30">{order.type} • {order.status}</div>
                              <div className="mt-2 text-[10px] uppercase tracking-widest text-white/20">{new Date(order.issuedAt).toLocaleDateString('en-ZA')}</div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-bold font-mono text-[#00ff88]">{formatZarCurrency(order.totalAmount)}</div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mt-1">{order.status}</div>
                            <div className="flex items-center justify-end gap-3">
                              {order.type === 'Customer Order' && order.status !== 'Delivered' ? (
                                <>
                                  <button
                                    onClick={() => void handleCompleteOrder(order.key, 'Collection')}
                                    disabled={activeWorkflowKey === order.key}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/55 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Collect
                                  </button>
                                  <button
                                    onClick={() => void handleCompleteOrder(order.key, 'Delivery')}
                                    disabled={activeWorkflowKey === order.key}
                                    className="text-[10px] font-bold uppercase tracking-widest text-amber-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {activeWorkflowKey === order.key ? 'Completing...' : 'Deliver'}
                                  </button>
                                </>
                              ) : null}
                              <button onClick={() => openCustomerDocumentPdf(order)} className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">View PDF</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!isLoadingDocuments && orderDocuments.length === 0 && (
                        <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                          <p className="text-xs text-white/20">No completed orders found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'Logistics' && (
                  <div className="space-y-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Delivery & Logistics</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <Truck size={18} className="text-amber-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-tight">Active Delivery: DEL-8821</span>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Scheduled</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between text-[10px] uppercase tracking-widest">
                            <span className="text-white/30">ETA</span>
                            <span className="text-white">Tomorrow, 10:00 AM</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-widest">
                            <span className="text-white/30">Carrier</span>
                            <span className="text-white">Truck OS Premium</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-widest">
                            <span className="text-white/30">Address</span>
                            <span className="text-white text-right max-w-[200px]">123 Kensington High St, London</span>
                          </div>
                        </div>
                        <button className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                          Track Shipment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'Comms' && (
                  <div className="space-y-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Communication History</h3>
                    <div className="space-y-4">
                      {liveCommsHistory.map((thread) => (
                        <div key={thread.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl hover:border-white/20 transition-all group cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">{thread.provider}</span>
                              <span className="text-[10px] font-mono text-white/20">{formatCrmRelativeTime(thread.lastMessageAt)}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${thread.unreadCount > 0 ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' : 'bg-white/5 text-white/30 border-white/10'}`}>{thread.status}</span>
                            </div>
                            <ChevronRight size={14} className="text-white/20 group-hover:text-[#00ff88] transition-colors" />
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed line-clamp-2 italic">"{thread.lastMessage ?? thread.subject ?? 'Conversation captured from channel.'}"</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {thread.readinessIssues.map((issue) => (
                              <span key={issue} className="rounded-full border border-red-500/10 bg-red-500/5 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-red-300">{issue}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {liveCommsHistory.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-white/25">
                          No unified Comms history has been captured for this customer yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'History' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Document Timeline</h3>
                      <input
                        value={documentSearch}
                        onChange={(event) => setDocumentSearch(event.target.value)}
                        placeholder="Search document timeline"
                        className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#00ff88]/30"
                      />
                    </div>
                    <div className="space-y-3">
                      {isLoadingDocuments ? (
                        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 text-xs text-white/35">Loading history...</div>
                      ) : filteredDocuments.map((document) => (
                        <div key={document.id} className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-white">{document.title}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30">{document.type} • {document.status}</div>
                            <div className="mt-2 text-xs text-white/45">{document.summary ?? 'Historical document record captured for this customer.'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-white/35">{new Date(document.issuedAt).toLocaleDateString('en-ZA')}</div>
                            <div className="mt-2 text-sm font-mono text-white">{formatZarCurrency(document.totalAmount)}</div>
                            <button onClick={() => openCustomerDocumentPdf(document)} className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">
                              Open PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

	                {activeSection === 'Notes' && (
	                  <div className="space-y-6">
	                    <div className="flex items-center justify-between">
	                      <div>
	                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Client Tasks & Notes</h3>
	                        <p className="mt-2 text-xs text-white/30">Follow-up actions created from Comms are tied to this customer and mirrored into the Calendar reminder stream.</p>
	                      </div>
	                      <span className="rounded-full border border-[#00ff88]/10 bg-[#00ff88]/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#00ff88]">
	                        {customerTaskActions.length} Active
	                      </span>
	                    </div>
	                    <div className="space-y-3">
	                      {customerTaskActions.map(({ action, thread }) => (
	                        <div key={action.id} className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 transition-all hover:border-[#00ff88]/20">
	                          <div className="flex items-start justify-between gap-4">
	                            <div className="flex items-start gap-4">
	                              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00ff88]/10 bg-[#00ff88]/5 text-[#00ff88]">
	                                <ListTodo size={16} />
	                              </div>
	                              <div>
	                                <div className="text-sm font-bold text-white">{action.label}</div>
	                                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30">
	                                  {thread.provider} • {thread.conversationKey} • {action.actorLabel ?? 'System'}
	                                </div>
	                                <p className="mt-3 text-xs leading-relaxed text-white/45">{thread.lastMessage ?? thread.subject ?? 'Follow-up task captured from this client conversation.'}</p>
	                              </div>
	                            </div>
	                            <div className="text-right">
	                              <div className={`text-[8px] font-bold uppercase tracking-widest ${action.status === 'Completed' ? 'text-[#00ff88]' : 'text-amber-300'}`}>{action.status}</div>
	                              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/25">{formatCrmRelativeTime(action.occurredAt)}</div>
	                            </div>
	                          </div>
	                        </div>
	                      ))}
	                      {customerTaskActions.length === 0 && (
	                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
	                          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-white/15">
	                            <ClipboardList size={26} />
	                          </div>
	                          <h4 className="text-lg font-serif font-bold uppercase tracking-tight text-white">No Follow-Up Tasks</h4>
	                          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/30">Create a task from the Comms drawer and it will appear here for this customer and on the Calendar as a reminder.</p>
	                        </div>
	                      )}
	                    </div>
	                  </div>
	                )}
              </main>
            </div>
          </motion.div>
          <CustomerQuoteComposerDialog
            isOpen={isQuoteComposerOpen}
            customer={customer}
            products={products}
            onClose={() => setIsQuoteComposerOpen(false)}
            onCreated={async () => {
              await handleWorkflowRefresh();
              setActiveSection('Quotes');
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

const NodeActionWizard = ({ 
  wizardState, 
  onClose, 
  onComplete 
}: { 
  wizardState: {type: string, nodeId: string, nodeLabel: string} | null; 
  onClose: () => void; 
  onComplete: (action: string, nodeId: string, nodeLabel: string) => void;
}) => {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (wizardState) {
      setStep(1);
      setSelection('');
      setDetails('');
    }
  }, [wizardState]);

  const handleNext = () => setStep(s => s + 1);
  const handleFinish = () => {
    onComplete(wizardState.type, wizardState.nodeId, wizardState.nodeLabel);
    onClose();
  };

  const renderContent = () => {
    if (wizardState?.type === 'Create Quote') {
      if (step === 1) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Select Customer</h3>
          <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white" value={selection} onChange={e => setSelection(e.target.value)}>
            <option value="">-- Select Customer --</option>
            <option value="acme">Acme Corp</option>
            <option value="smith">Smith Builders</option>
            <option value="new">+ New Customer</option>
          </select>
        </div>
      );
      if (step === 2) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Quote Details</h3>
          <textarea placeholder="Enter items, quantities, and terms..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white h-32" value={details} onChange={e => setDetails(e.target.value)}></textarea>
        </div>
      );
    }
    if (wizardState?.type === 'Create Invoice') {
      if (step === 1) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Invoice Source</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setSelection('quote')} className={`p-4 rounded-xl border ${selection === 'quote' ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-white/10 bg-white/5'} text-left hover:border-[#00ff88]/50 transition-colors`}>
              <div className="font-bold text-white mb-1">From Existing Quote</div>
              <div className="text-xs text-white/50">Convert an approved quote</div>
            </button>
            <button onClick={() => setSelection('new')} className={`p-4 rounded-xl border ${selection === 'new' ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-white/10 bg-white/5'} text-left hover:border-[#00ff88]/50 transition-colors`}>
              <div className="font-bold text-white mb-1">Blank Invoice</div>
              <div className="text-xs text-white/50">Create from scratch</div>
            </button>
          </div>
        </div>
      );
      if (step === 2) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">{selection === 'quote' ? 'Select Quote' : 'Customer Details'}</h3>
          {selection === 'quote' ? (
            <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white" value={details} onChange={e => setDetails(e.target.value)}>
              <option value="">-- Select Approved Quote --</option>
              <option value="QT-1024">QT-1024: Acme Corp - $12,400</option>
              <option value="QT-1025">QT-1025: Smith Builders - $4,200</option>
            </select>
          ) : (
            <textarea placeholder="Enter customer and line items..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white h-32" value={details} onChange={e => setDetails(e.target.value)}></textarea>
          )}
        </div>
      );
    }
    if (wizardState?.type === 'Create PO') {
      if (step === 1) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Purchase Order Source</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setSelection('order')} className={`p-4 rounded-xl border ${selection === 'order' ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-white/10 bg-white/5'} text-left hover:border-[#00ff88]/50 transition-colors`}>
              <div className="font-bold text-white mb-1">From Sales Order</div>
              <div className="text-xs text-white/50">Fulfill existing pipeline order</div>
            </button>
            <button onClick={() => setSelection('restock')} className={`p-4 rounded-xl border ${selection === 'restock' ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-white/10 bg-white/5'} text-left hover:border-[#00ff88]/50 transition-colors`}>
              <div className="font-bold text-white mb-1">Restock / New</div>
              <div className="text-xs text-white/50">Order inventory for warehouse</div>
            </button>
          </div>
        </div>
      );
      if (step === 2) return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">{selection === 'order' ? 'Select Sales Order' : 'Select Supplier'}</h3>
          {selection === 'order' ? (
            <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white" value={details} onChange={e => setDetails(e.target.value)}>
              <option value="">-- Select Pipeline Order --</option>
              <option value="SO-992">SO-992: Acme Corp (Awaiting Supply)</option>
            </select>
          ) : (
            <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white" value={details} onChange={e => setDetails(e.target.value)}>
              <option value="">-- Select Supplier --</option>
              <option value="brickco">BrickCo Industries</option>
              <option value="tilemaster">TileMaster Global</option>
            </select>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {wizardState && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Workflow Action</span>
                </div>
                <h2 className="text-xl font-bold text-white">{wizardState.type}</h2>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 min-h-[250px]">
              {renderContent()}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <div className="flex gap-1">
                {[1, 2].map(i => (
                  <div key={i} className={`w-8 h-1 rounded-full ${i <= step ? 'bg-[#00ff88]' : 'bg-white/10'}`} />
                ))}
              </div>
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button 
                    onClick={handleNext} 
                    disabled={!selection}
                    className="px-6 py-2 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish} 
                    disabled={!details}
                    className="px-6 py-2 rounded-xl bg-[#00ff88] text-black hover:bg-[#00cc6a] transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Generate <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MARKETING_COMMUNITY_ACTOR_STORAGE_KEY = 'bts.marketing.community.actor-key';

function getMarketingCommunityActorIdentity() {
 if (typeof window === 'undefined') {
  return {
   key: 'employee-portal-operator',
   name: 'BTS Team',
   role: 'Marketing Ops',
  };
 }

 let actorKey = window.localStorage.getItem(MARKETING_COMMUNITY_ACTOR_STORAGE_KEY);
 if (!actorKey) {
  actorKey = `employee-portal-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(MARKETING_COMMUNITY_ACTOR_STORAGE_KEY, actorKey);
 }

 return {
  key: actorKey,
  name: 'BTS Team',
  role: 'Marketing Ops',
 };
}

function EmployeePortalContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<'Map' | 'Customers' | 'Suppliers' | 'Inventory' | 'Marketing' | 'Comms' | 'Finance'>('Map');
  const [activeCRMSubModule, setActiveCRMSubModule] = useState<CRMSubModule>('Dashboard');
  const [crmQueueCategorySeed, setCrmQueueCategorySeed] = useState<string | null>(null);
  const [crmDirectoryStageSeed, setCrmDirectoryStageSeed] = useState<CustomerStage | 'All' | null>(null);
  const [activeInventorySubModule, setActiveInventorySubModule] = useState<'Overview' | 'Catalog' | 'Insights'>('Overview');
  const [activeMarketingSubModule, setActiveMarketingSubModule] = useState<'Dashboard' | 'AssetLab' | 'Templates' | 'CreativeGenerator' | 'Campaigns' | 'Calendar' | 'Publishing' | 'Analytics' | 'CommunityFeed' | 'ContentStudio'>('Dashboard');
  const [activeVendorSubModule, setActiveVendorSubModule] = useState<'Overview' | 'Directory' | 'Insights'>('Overview');
  const [focusedVendorId, setFocusedVendorId] = useState<string | null>(null);
  const [focusedVendorTab, setFocusedVendorTab] = useState<SupplierDetailTab>('Overview');
  const [preferredFinanceSubModule, setPreferredFinanceSubModule] = useState<FinanceSubModule>('Overview');
  const [preferredFinanceRecordId, setPreferredFinanceRecordId] = useState<string | null>(null);
  const [selectedOsWorkflowId, setSelectedOsWorkflowId] = useState('auto');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetailSection, setSelectedCustomerDetailSection] = useState<string>('Overview');
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isCustomerCreateWizardOpen, setIsCustomerCreateWizardOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [preferredCommsConversationId, setPreferredCommsConversationId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<CommsThread | null>(MOCK_COMMS_THREADS[0]);
  
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null);
  const [isInventoryDetailOpen, setIsInventoryDetailOpen] = useState(false);
  const [inventoryDetailTab, setInventoryDetailTab] = useState<'overview' | 'specs' | 'media' | '3d' | 'marketing' | 'pricing' | 'suppliers' | 'history'>('overview');
  const [isAddProductWizardOpen, setIsAddProductWizardOpen] = useState(false);
  const [isImportPriceListOpen, setIsImportPriceListOpen] = useState(false);
  const [isPublishingInventoryProduct, setIsPublishingInventoryProduct] = useState(false);
  const { setIsLoggedIn, setUserRole, setIsViewingPortal } = useVisualLab();
  const communityLikeActor = useMemo(() => getMarketingCommunityActorIdentity(), []);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [activeActionWizard, setActiveActionWizard] = useState<{type: string, nodeId: string, nodeLabel: string} | null>(null);
  const inventoryPortal = useInventoryPortalData();
  const commsData = useCommsData();
  const financeStudio = useFinanceData();
  const workflowMap = useWorkflowMapData();
  const crmCustomers = useMemo(() => customersFromCommsSnapshot(commsData.studio), [commsData.studio]);

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    const refreshedCustomer = crmCustomers.find((customer) => customer.id === selectedCustomer.id);
    if (refreshedCustomer && refreshedCustomer !== selectedCustomer) {
      setSelectedCustomer(refreshedCustomer);
    }
  }, [crmCustomers, selectedCustomer]);

  const openCustomerDetail = useCallback((customer: Customer, section: string = 'Overview') => {
    setSelectedCustomer(customer);
    setSelectedCustomerDetailSection(section);
    setIsCustomerDetailOpen(true);
  }, []);

  const openCrmSubModule = useCallback(
    (subModule: CRMSubModule, options?: { queueCategory?: string; stageFilter?: CustomerStage | 'All' }) => {
      setActiveCRMSubModule(subModule);
      setCrmQueueCategorySeed(options?.queueCategory ?? null);
      setCrmDirectoryStageSeed(options?.stageFilter ?? null);
    },
    [],
  );

  const openCommsConversationForCustomer = useCallback((customer: Customer) => {
    const matchingConversation = (commsData.studio?.conversations ?? []).find((conversation) => (
      conversation.linkedCustomer?.customerKey === customer.id
      || conversation.customerName === customer.name
    ));

    if (!matchingConversation) {
      toast('No unified conversation exists yet for this customer. Opened CRM comms history instead.');
      openCustomerDetail(customer, 'Comms');
      return;
    }

    setPreferredCommsConversationId(matchingConversation.id);
    setActiveModule('Comms');
  }, [commsData.studio?.conversations, openCustomerDetail]);

  const handleCreateCustomer = useCallback(async (draft: CustomerCreateDraft) => {
    setIsCreatingCustomer(true);
    try {
      const snapshot = await commsData.createCustomer({
        name: draft.name,
        customerType: draft.customerType,
        stage: draft.stage,
        email: draft.email || undefined,
        phone: draft.phone || undefined,
        actorLabel: 'CRM Manual Intake',
      });
      const createdCustomer = customersFromCommsSnapshot(snapshot).find((customer) => crmCustomerMatchesDraft(customer, draft)) ?? null;
      setIsCustomerCreateWizardOpen(false);
      setActiveCRMSubModule('Directory');
      toast.success(`${draft.name} is now in CRM.`);
      if (createdCustomer) {
        openCustomerDetail(createdCustomer);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create customer.');
    } finally {
      setIsCreatingCustomer(false);
    }
  }, [commsData, openCustomerDetail]);

  const handleRequestCustomerReadinessInfo = useCallback(async (customer: Customer, field: keyof Customer['readiness']) => {
    const note = CUSTOMER_READINESS_REQUEST_COPY[field];
    try {
      await commsData.requestCustomerInfo(customer.id, {
        actorLabel: 'Owner',
        note,
      });
      toast.success(`Requested ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} from ${customer.name} in Comms.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send the customer info request.');
      throw error;
    }
  }, [commsData]);

  const handleActionComplete = useCallback((action: string, nodeId: string, nodeLabel: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-[#00ff88] text-black font-bold rounded-full text-[10px] uppercase tracking-widest shadow-2xl animate-bounce';
    toast.innerText = `Action Triggered: ${action} on ${nodeLabel}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            activeItems: (n.data.activeItems as number || 0) + 1
          }
        };
      }
      return n;
    }));
  }, [setNodes]);

  const handleActionClick = useCallback((action: string, nodeId: string, nodeLabel: string) => {
    if (['Create Quote', 'Create Invoice', 'Create PO'].includes(action)) {
      setActiveActionWizard({ type: action, nodeId, nodeLabel });
      return;
    }
    handleActionComplete(action, nodeId, nodeLabel);
  }, [handleActionComplete]);

  useEffect(() => {
    setNodes((nds) => nds.map(n => {
      if (n.data.onActionClick !== handleActionClick) {
        return {
          ...n,
          data: {
            ...n.data,
            onActionClick: handleActionClick
          }
        };
      }
      return n;
    }));
  }, [handleActionClick, setNodes]);

  useEffect(() => {
    if (!selectedInventoryProduct && inventoryPortal.products.length > 0) {
      setSelectedInventoryProduct(inventoryPortal.products[0]);
    }
  }, [inventoryPortal.products, selectedInventoryProduct]);

  useEffect(() => {
    if (!selectedInventoryProduct) {
      return;
    }

    const updatedProduct = inventoryPortal.productsById[selectedInventoryProduct.id];
    if (updatedProduct && updatedProduct !== selectedInventoryProduct) {
      setSelectedInventoryProduct(updatedProduct);
    }
  }, [inventoryPortal.productsById, selectedInventoryProduct]);

  const selectedInventoryDetail = useMemo(
    () => (selectedInventoryProduct ? inventoryPortal.rawProductsById[selectedInventoryProduct.id] ?? null : null),
    [inventoryPortal.rawProductsById, selectedInventoryProduct],
  );

  const actionableAssetCoverage = useMemo(
    () =>
      (inventoryPortal.dashboard?.assetCoverage ?? []).filter(
        (item) => item.health === 'Needs Assets' || item.health === 'Missing All',
      ),
    [inventoryPortal.dashboard?.assetCoverage],
  );

  const openInventoryProductFromOverview = useCallback(
    (
      productId: string,
      tab: 'overview' | 'specs' | 'media' | '3d' | 'marketing' | 'pricing' | 'suppliers' | 'history',
    ) => {
      const product = inventoryPortal.productsById[productId];
      if (!product) {
        return;
      }

      setActiveInventorySubModule('Catalog');
      setSelectedInventoryProduct(product);
      setInventoryDetailTab(tab);
      setIsInventoryDetailOpen(true);
    },
    [inventoryPortal.productsById],
  );

  const handlePublishInventoryProduct = useCallback(async () => {
    if (!selectedInventoryProduct) {
      return;
    }

    setIsPublishingInventoryProduct(true);

    try {
      await inventoryPortal.publishProduct(selectedInventoryProduct.id);
      setInventoryDetailTab('marketing');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to publish product.');
    } finally {
      setIsPublishingInventoryProduct(false);
    }
  }, [inventoryPortal, selectedInventoryProduct]);

  const handleSaveInventoryDrawerEdits = useCallback(
    async (input: UpdateInventoryProductInput) => {
      if (!selectedInventoryDetail) {
        throw new Error('This product detail is still loading. Try again in a moment.');
      }

      await inventoryPortal.updateProduct(selectedInventoryDetail.id, input);
    },
    [inventoryPortal, selectedInventoryDetail],
  );

  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isMasterPromptOpen, setIsMasterPromptOpen] = useState(false);
 const marketingStudio = useMarketingStudioData();
 const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
 const [isEditingSelectedAsset, setIsEditingSelectedAsset] = useState(false);
 const [isMutatingSelectedAsset, setIsMutatingSelectedAsset] = useState(false);
 const [selectedAssetNameDraft, setSelectedAssetNameDraft] = useState('');
 const [selectedAssetTagsDraft, setSelectedAssetTagsDraft] = useState<string[]>([]);
 const [selectedAssetTagInput, setSelectedAssetTagInput] = useState('');
 const [selectedAssetFeedback, setSelectedAssetFeedback] = useState<string | null>(null);
 const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
 const [variantWizardStep, setVariantWizardStep] = useState(1);
 const [variantSettings, setVariantSettings] = useState({
 transparentBg: false,
 watermarkProfile: 'Standard BTS',
 usagePurpose: 'Publishable Variant',
 channelSize: 'Original'
 });
 const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
 const [creativeSeedAssetId, setCreativeSeedAssetId] = useState<string | null>(null);
 const [creativeSeedMode, setCreativeSeedMode] = useState<'blueprint' | 'cutout' | 'scene' | null>(null);
 const [showArchivedTemplates, setShowArchivedTemplates] = useState(false);
 const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
 const [templateEditorMode, setTemplateEditorMode] = useState<'create' | 'edit'>('create');
 const [templateDraft, setTemplateDraft] = useState<MarketingTemplateDraft>(createTemplateDraft());
 const [templateTagInput, setTemplateTagInput] = useState('');
 const [allowedTargetInput, setAllowedTargetInput] = useState('');
 const [isSavingTemplate, setIsSavingTemplate] = useState(false);
 const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
 const [generatorCopy, setGeneratorCopy] = useState('Premium materials for modern architectural visions.');
 const [isRendering, setIsRendering] = useState(false);
 const [isWizardOpen, setIsWizardOpen] = useState(false);
 const [wizardStep, setWizardStep] = useState(1);
 const [calendarView, setCalendarView] = useState<'Week' | 'Month'>('Week');
 const [calendarAnchorDate, setCalendarAnchorDate] = useState(() => startOfLocalDay(new Date()));
 const [highlightedCalendarEntryId, setHighlightedCalendarEntryId] = useState<string | null>(null);
 const [selectedCalendarEntry, setSelectedCalendarEntry] = useState<ScheduledPost | null>(null);
 const [isCalendarEntryWizardOpen, setIsCalendarEntryWizardOpen] = useState(false);
 const [calendarEntryWizardStep, setCalendarEntryWizardStep] = useState(1);
 const [isCreatingCalendarEntry, setIsCreatingCalendarEntry] = useState(false);
 const [calendarEntryDraft, setCalendarEntryDraft] = useState<CalendarEntryDraft>(() => createCalendarEntryDraft(new Date()));
 const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
 const [publishingStatusFilter, setPublishingStatusFilter] = useState<'All' | PublishingStatus | 'Active'>('All');
 const [publishingChannelFilter, setPublishingChannelFilter] = useState<MarketingChannel | 'All'>('All');
 const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
 name: '',
 description: '',
 owner: 'Rikus Klue',
 status: 'Draft',
 startDate: '',
 endDate: '',
 channels: [],
 linkedAssetIds: [],
 productIds: [],
 budget: '',
 });
 const [assetSearch, setAssetSearch] = useState('');
 const [assetFilter, setAssetFilter] = useState('All');
 const [isUploadingMarketingAsset, setIsUploadingMarketingAsset] = useState(false);
 const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
 const [nodeSearch, setNodeSearch] = useState('');
 const [pinnedNodes, setPinnedNodes] = useState<string[]>([]);
 const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
 
 const canvasRef = useRef<HTMLDivElement>(null);
 const libraryRef = useRef<HTMLDivElement>(null);
 const marketingAssetUploadInputRef = useRef<HTMLInputElement>(null);
 const marketingAssets = (marketingStudio.assets.length ? marketingStudio.assets : MOCK_ASSETS) as unknown as Asset[];
 const marketingTemplates = (marketingStudio.templates.length ? marketingStudio.templates : MOCK_TEMPLATES) as unknown as MarketingTemplate[];
 const archivedMarketingTemplates = (marketingStudio.archivedTemplates ?? []) as unknown as MarketingTemplate[];
 const marketingCampaigns = (marketingStudio.campaigns.length ? marketingStudio.campaigns : MOCK_CAMPAIGNS) as unknown as Campaign[];
 const scheduledPosts = (marketingStudio.calendarEntries.length ? marketingStudio.calendarEntries : MOCK_SCHEDULED_POSTS) as unknown as ScheduledPost[];
 const publishingJobs = (marketingStudio.publishingJobs.length ? marketingStudio.publishingJobs : MOCK_PUBLISHING_JOBS) as unknown as PublishingJob[];
const channelHealth = (marketingStudio.channelHealth.length ? marketingStudio.channelHealth : MOCK_CHANNEL_HEALTH) as unknown as ChannelHealth[];
const campaignPerformance = marketingStudio.analytics?.performance?.length ? marketingStudio.analytics.performance : MOCK_CAMPAIGN_PERFORMANCE;
const analyticsSnapshot = marketingStudio.analytics;
const analyticsKpis = analyticsSnapshot?.kpis ?? [];
const analyticsTrend = analyticsSnapshot?.trend ?? [];
const analyticsChannelAttribution = analyticsSnapshot?.channelAttribution ?? [];
const analyticsTopAsset = analyticsSnapshot?.topAsset ?? null;
const marketingDashboard = marketingStudio.dashboard;
 const financeSnapshot = financeStudio.studio;
 const weightedOsPipelineValue = useMemo(
  () => crmCustomers.reduce((total, customer) => total + estimateCrmPipelineCustomerValue(customer), 0),
  [crmCustomers],
 );
 const osMapMetrics = useMemo(() => {
  const channelSummaries = commsData.studio?.channels ?? [];
  const socialChannels = channelSummaries.filter((channel) => channel.provider === 'Facebook' || channel.provider === 'Instagram');
  const emailChannel = channelSummaries.find((channel) => channel.provider === 'Email') ?? null;
  const whatsappChannel = channelSummaries.find((channel) => channel.provider === 'WhatsApp') ?? null;
  const webChannel = channelSummaries.find((channel) => channel.provider === 'Web') ?? null;
  const linkedQuotes = crmCustomers.reduce((total, customer) => total + customer.linkedQuotes, 0);
  const linkedOrders = crmCustomers.reduce((total, customer) => total + customer.linkedOrders, 0);
  const quoteWaitingCustomers = crmCustomers.filter((customer) => customer.stage === 'Quote Sent' || customer.stage === 'Awaiting Response');
  const negotiationCustomers = crmCustomers.filter((customer) => customer.stage === 'Negotiation');
  const wonCustomers = crmCustomers.filter((customer) => customer.stage === 'Won');
  const vendorOrders = inventoryPortal.suppliers.flatMap((vendor) => vendor.orders);
  const supplierPoOrders = vendorOrders.filter((order) => order.type === 'PO');
  const supplierConfirmedOrders = supplierPoOrders.filter((order) => order.status === 'Confirmed' || order.status === 'Shipped' || order.status === 'Delivered');
  const transportPartners = inventoryPortal.suppliers.filter((vendor) => vendor.providesTransport);
  const dispatchReadyVendors = inventoryPortal.suppliers.filter((vendor) => vendor.workflowMilestones.dispatchReady);
  const podOrders = vendorOrders.filter((order) => order.type === 'POD');
  const deliveredPods = podOrders.filter((order) => order.status === 'Delivered');
  const financePayables = financeSnapshot?.payables ?? [];
  const financeReceivables = financeSnapshot?.receivables ?? [];
  const logisticsRecords = financePayables.filter((record) => record.category === 'Logistics' || record.workflowNode?.startsWith('logistics.'));
  const purchaseOrderRecords = financePayables.filter((record) => record.category === 'PO' || record.workflowNode?.startsWith('purchase_order.'));
  const invoiceRecords = financeReceivables.filter((record) => record.category === 'Invoice' || record.workflowNode?.startsWith('invoice.'));
  const overdueInvoices = financeSnapshot?.overview.overdueInvoiceCount.value ?? 0;
  const negativeMarginOrders = financeSnapshot?.overview.negativeMarginRiskCount.value ?? 0;
  const customerPortalReady = crmCustomers.filter((customer) => customer.portalStatus && customer.portalStatus !== 'Provisional').length;
  const supplierPortalUsers = inventoryPortal.suppliers.reduce(
    (total, vendor) => total + vendor.portalUsers.filter((portalUser) => portalUser.isActive).length,
    0,
  );
  const totalStockUnits = inventoryPortal.products.reduce((total, product) => total + product.stock, 0);
  const connectedChannels = channelSummaries.filter((channel) => channel.status === 'Connected' || channel.status === 'Degraded' || channel.status === 'Simulated').length;
  const activeWorkflows =
    (commsData.studio?.counts.unread ?? 0)
    + quoteWaitingCustomers.length
    + purchaseOrderRecords.length
    + logisticsRecords.length
    + overdueInvoices
    + negativeMarginOrders;
  const latestSyncCandidates = [
    commsData.studio?.lastUpdatedAt ?? null,
    inventoryPortal.dashboard?.generatedAt ?? null,
    marketingDashboard?.generatedAt ?? null,
    financeSnapshot?.lastUpdatedAt ?? null,
  ].filter((value): value is string => Boolean(value));
  const latestSyncAt = latestSyncCandidates.length
    ? new Date(Math.max(...latestSyncCandidates.map((value) => new Date(value).getTime()))).toISOString()
    : new Date().toISOString();

  return {
    latestSyncAt,
    totalStockUnits,
    activeWorkflows,
    weightedOsPipelineValue,
    activeLeads: commsData.studio?.crm.metrics.activeLeads ?? crmCustomers.filter((customer) => customer.stage !== 'Won' && customer.stage !== 'Lost').length,
    openConversations: commsData.studio?.counts.all ?? 0,
    unreadConversations: commsData.studio?.counts.unread ?? 0,
    metaCount: socialChannels.reduce((total, channel) => total + channel.count, 0),
    metaUnread: socialChannels.reduce((total, channel) => total + channel.unreadCount, 0),
    whatsappCount: whatsappChannel?.count ?? 0,
    whatsappUnread: whatsappChannel?.unreadCount ?? 0,
    emailCount: emailChannel?.count ?? 0,
    emailUnread: emailChannel?.unreadCount ?? 0,
    webCount: webChannel?.count ?? 0,
    webUnread: webChannel?.unreadCount ?? 0,
    linkedQuotes,
    linkedOrders,
    quoteWaitingCount: quoteWaitingCustomers.length,
    negotiationCount: negotiationCustomers.length,
    wonCount: wonCustomers.length,
    purchaseOrderCount: purchaseOrderRecords.length || supplierPoOrders.length,
    supplierConfirmedCount: supplierConfirmedOrders.length,
    logisticsCount: logisticsRecords.length,
    transportPartnerCount: transportPartners.length,
    dispatchReadyCount: dispatchReadyVendors.length,
    podCount: podOrders.length,
    deliveredPodCount: deliveredPods.length,
    invoiceCount: invoiceRecords.length,
    cashCollectedValue: financeSnapshot?.overview.cashCollected.value ?? 0,
    invoicedValue: financeSnapshot?.overview.totalInvoiced.value ?? 0,
    outstandingReceivablesValue: financeSnapshot?.overview.outstandingReceivables.value ?? 0,
    committedPayablesValue: financeSnapshot?.overview.committedPayables.value ?? 0,
    negativeMarginOrders,
    overdueInvoices,
    customerPortalReady,
    customerPortalTotal: crmCustomers.length,
    supplierPortalUsers,
    liveCampaignCount: marketingDashboard?.liveCampaigns.length ?? 0,
    marketingAssetCount: marketingDashboard?.totalAssets ?? marketingAssets.length,
    blueprintCount: marketingTemplates.length,
    scheduledPostsCount: scheduledPosts.filter((entry) => entry.status === 'Scheduled').length,
    publishQueueCount: publishingJobs.filter((job) => job.status === 'Queued' || job.status === 'Publishing' || job.status === 'Retrying').length,
    connectedChannelCount: connectedChannels,
    communityPostCount: marketingStudio.communityPosts.length,
  };
 }, [
  commsData.studio,
  crmCustomers,
  financeSnapshot,
  inventoryPortal.dashboard?.generatedAt,
  inventoryPortal.products,
  inventoryPortal.suppliers,
  marketingDashboard,
  marketingAssets.length,
 marketingStudio.communityPosts.length,
  marketingTemplates.length,
  publishingJobs,
  scheduledPosts,
  weightedOsPipelineValue,
 ]);
 const osMapWorkflowOptions = useMemo<OsMapWorkflowCandidate[]>(
  () => (workflowMap.snapshot?.instances ?? []).slice(0, 12),
  [workflowMap.snapshot?.instances],
 );
 const selectedOsWorkflow = useMemo(
  () => osMapWorkflowOptions.find((candidate) => candidate.id === selectedOsWorkflowId) ?? null,
  [osMapWorkflowOptions, selectedOsWorkflowId],
 );
 useEffect(() => {
  if (selectedOsWorkflowId !== 'auto' && !osMapWorkflowOptions.some((candidate) => candidate.id === selectedOsWorkflowId)) {
    setSelectedOsWorkflowId('auto');
  }
 }, [osMapWorkflowOptions, selectedOsWorkflowId]);
 const osMapWorkflowContext = useMemo(() => {
  const conversations = [...(commsData.studio?.conversations ?? [])].sort((left, right) => {
   if (right.unreadCount !== left.unreadCount) {
    return right.unreadCount - left.unreadCount;
   }

   return getDateTimestamp(right.lastMessageAt) - getDateTimestamp(left.lastMessageAt);
  });
 const receivables = [...(financeSnapshot?.receivables ?? [])].sort(
   (left, right) => Math.max(getDateTimestamp(right.issueDate), getDateTimestamp(right.dueDate)) - Math.max(getDateTimestamp(left.issueDate), getDateTimestamp(left.dueDate)),
  );
  const payables = [...(financeSnapshot?.payables ?? [])].sort(
   (left, right) => Math.max(getDateTimestamp(right.issueDate), getDateTimestamp(right.dueDate)) - Math.max(getDateTimestamp(left.issueDate), getDateTimestamp(left.dueDate)),
  );
  const isFocusedWorkflow = Boolean(selectedOsWorkflow);
  const selectedRecordIds = new Set(selectedOsWorkflow?.recordIds ?? []);
  const recordMatchesFocus = (record: FinanceRecord) => {
   if (!selectedOsWorkflow) {
    return true;
   }

   return selectedRecordIds.has(record.id)
    || record.orderId === selectedOsWorkflow.sourceKey
    || (!!selectedOsWorkflow.customerKey && record.customerKey === selectedOsWorkflow.customerKey)
    || (!!selectedOsWorkflow.customerName && record.customerName === selectedOsWorkflow.customerName);
  };
  const focusedReceivables = selectedOsWorkflow ? receivables.filter(recordMatchesFocus) : receivables;
  const focusedPayables = selectedOsWorkflow ? payables.filter(recordMatchesFocus) : payables;
  const focusedConversations = selectedOsWorkflow
   ? conversations.filter((conversation) => (
    conversation.id === selectedOsWorkflow.conversationId
    || conversation.conversationKey === selectedOsWorkflow.sourceKey
    || (!!selectedOsWorkflow.customerKey && conversation.linkedCustomer?.customerKey === selectedOsWorkflow.customerKey)
    || (!!selectedOsWorkflow.customerName && conversation.customerName === selectedOsWorkflow.customerName)
   ))
   : conversations;

  const resolveCustomer = (customerKey?: string | null, customerName?: string | null) => (
   crmCustomers.find((customer) => customer.id === customerKey)
   ?? crmCustomers.find((customer) => customer.name === customerName)
   ?? null
  );

  const resolveSupplier = (
   record?: FinanceRecord | null,
   mode: 'products' | 'transport' | 'any' = 'any',
  ) => {
   const fallbackVendor = isFocusedWorkflow ? null : inventoryPortal.suppliers.find((vendor) => (
    mode === 'products'
     ? vendor.providesProducts
     : mode === 'transport'
       ? vendor.providesTransport
       : true
   )) ?? null;

   if (!record) {
    return fallbackVendor;
   }

   const directMatch = inventoryPortal.suppliers.find((vendor) => (
    vendor.id === record.supplierKey
    || vendor.name === record.supplierName
    || vendor.name === record.customerName
   )) ?? null;
   if (directMatch && (
    mode === 'any'
    || (mode === 'products' && directMatch.providesProducts)
    || (mode === 'transport' && directMatch.providesTransport)
   )) {
    return directMatch;
   }

   return fallbackVendor;
  };

  const pickConversation = (providers?: CommsProvider[]) => {
   const pool = focusedConversations.length ? focusedConversations : (isFocusedWorkflow ? [] : conversations);
   if (!providers || providers.length === 0) {
    return pool[0] ?? null;
   }

   return pool.find((conversation) => providers.includes(conversation.provider)) ?? null;
  };

  const quoteRecord = focusedReceivables.find((record) => record.category === 'Quote' || record.workflowNode?.startsWith('quote.')) ?? null;
  const salesOrderRecord = focusedReceivables.find((record) => record.category === 'Sales Order' || record.workflowNode?.startsWith('sales_order.')) ?? null;
  const purchaseOrderRecord = focusedPayables.find((record) => record.category === 'PO' || record.workflowNode?.startsWith('purchase_order.')) ?? null;
  const logisticsRecord = focusedPayables.find((record) => record.category === 'Logistics' || record.workflowNode?.startsWith('logistics.')) ?? null;
  const invoiceRecord = focusedReceivables.find((record) => (
   record.category === 'Invoice'
   || record.workflowNode?.startsWith('invoice.')
   || record.workflowNode?.startsWith('payment.')
  )) ?? null;
  const exceptionRecord = selectedOsWorkflow
   ? (financeSnapshot?.exceptionRecords ?? []).find(recordMatchesFocus) ?? null
   : financeSnapshot?.exceptionRecords[0] ?? null;

  const salesCustomer = resolveCustomer(
   selectedOsWorkflow?.customerKey ?? quoteRecord?.customerKey ?? salesOrderRecord?.customerKey ?? null,
   selectedOsWorkflow?.customerName ?? quoteRecord?.customerName ?? salesOrderRecord?.customerName ?? null,
  ) ?? (isFocusedWorkflow ? null : crmCustomers.find((customer) => (
   customer.stage === 'Quote Sent'
   || customer.stage === 'Awaiting Response'
   || customer.stage === 'Negotiation'
   || customer.linkedQuotes > 0
  )) ?? crmCustomers[0] ?? null);

  const orderCustomer = resolveCustomer(
   selectedOsWorkflow?.customerKey ?? invoiceRecord?.customerKey ?? salesOrderRecord?.customerKey ?? logisticsRecord?.customerKey ?? null,
   selectedOsWorkflow?.customerName ?? invoiceRecord?.customerName ?? salesOrderRecord?.customerName ?? logisticsRecord?.customerName ?? null,
  ) ?? (isFocusedWorkflow ? null : crmCustomers.find((customer) => customer.linkedOrders > 0 || customer.stage === 'Won') ?? crmCustomers[0] ?? null);

  const portalCustomer = crmCustomers.find((customer) => (
   customer.linkedOrders > 0
   && customer.portalStatus !== 'Ready'
   && customer.portalStatus !== 'Verified'
  )) ?? orderCustomer;

  const supplyVendor = resolveSupplier(purchaseOrderRecord, 'products');
  const transportVendor = resolveSupplier(logisticsRecord, 'transport');
  const portalVendor = [transportVendor, supplyVendor, ...inventoryPortal.suppliers].find((vendor) => (
   Boolean(vendor) && vendor.portalUsers.some((portalUser) => portalUser.isActive)
  )) ?? null;

  const financeFocusRecord = exceptionRecord ?? invoiceRecord ?? logisticsRecord ?? purchaseOrderRecord ?? quoteRecord ?? salesOrderRecord ?? (isFocusedWorkflow ? null : receivables[0] ?? payables[0]) ?? null;
  const financeFocusSubModule =
   financeFocusRecord?.exceptions?.length
    ? 'Exceptions'
    : financeFocusRecord?.margin && financeFocusRecord.margin.status !== 'Healthy'
      ? 'Margin'
      : financeFocusRecord?.type === 'Payable'
        ? 'Payables'
        : financeFocusRecord
          ? 'Receivables'
          : 'Overview';

  return {
   conversations: {
    meta: pickConversation(['Facebook', 'Instagram']),
    whatsapp: pickConversation(['WhatsApp']),
    email: pickConversation(['Email']),
    web: pickConversation(['Web']),
    inbox: pickConversation(),
   },
   records: {
    quote: quoteRecord,
    salesOrder: salesOrderRecord,
    purchaseOrder: purchaseOrderRecord,
    logistics: logisticsRecord,
    invoice: invoiceRecord,
    finance: financeFocusRecord,
   },
   customers: {
    sales: salesCustomer,
    order: orderCustomer,
    portal: portalCustomer,
   },
   vendors: {
    supply: supplyVendor,
    transport: transportVendor,
    portal: portalVendor,
   },
   financeFocusSubModule,
  } as const;
 }, [
  commsData.studio?.conversations,
  crmCustomers,
  financeSnapshot?.exceptionRecords,
  financeSnapshot?.payables,
  financeSnapshot?.receivables,
  inventoryPortal.suppliers,
  selectedOsWorkflow,
 ]);
 const systemLogs = useMemo(() => {
  const workflowEvents: WorkflowEventSummary[] = selectedOsWorkflow
   ? selectedOsWorkflow.events
   : workflowMap.snapshot?.events ?? [];
  if (workflowEvents.length > 0) {
   return workflowEvents.slice(0, 7).map((event) => ({
    id: event.id,
    time: formatOpsMapTime(event.occurredAt),
    text: `${event.type.toUpperCase()}: ${event.label}`,
   }));
  }

  const intakeConversation = osMapWorkflowContext.conversations.inbox;
  const pushRecordEvent = (id: string, prefix: string, record?: FinanceRecord | null) => {
   if (!record) {
    return null;
   }

   const historyEvent = record.history[0];
   return {
    id,
    time: formatOpsMapTime(historyEvent?.date ?? record.issueDate),
    text: `${prefix}: ${historyEvent?.action ?? `${record.category} ${record.sourceDocumentKey ?? record.id} active in ${record.status.toLowerCase()} state.`}`,
   };
  };

  return [
   intakeConversation
    ? {
      id: 'ops-intake',
      time: formatOpsMapTime(intakeConversation.lastMessageAt),
      text: `INTAKE_EVENT: ${intakeConversation.provider} -> ${intakeConversation.customerName} -> ${intakeConversation.lastMessage ?? 'Conversation updated in unified inbox.'}`,
     }
    : null,
   pushRecordEvent('ops-sales', 'QUOTE_CHAIN', osMapWorkflowContext.records.quote ?? osMapWorkflowContext.records.salesOrder),
   pushRecordEvent('ops-supply', 'PROCUREMENT_EVENT', osMapWorkflowContext.records.purchaseOrder),
   pushRecordEvent('ops-logistics', 'TRANSPORT_EVENT', osMapWorkflowContext.records.logistics),
   pushRecordEvent('ops-finance', 'FINANCE_EVENT', osMapWorkflowContext.records.invoice ?? osMapWorkflowContext.records.finance),
   {
    id: 'ops-portals',
    time: formatOpsMapTime(osMapMetrics.latestSyncAt),
    text: `PORTAL_VISIBILITY: ${osMapMetrics.customerPortalReady}/${osMapMetrics.customerPortalTotal} customer portals ready, ${osMapMetrics.supplierPortalUsers} supplier portal users active.`,
   },
   {
    id: 'ops-marketing',
    time: formatOpsMapTime(marketingDashboard?.generatedAt ?? osMapMetrics.latestSyncAt),
    text: `MARKETING_LOOP: ${osMapMetrics.liveCampaignCount} live campaigns, ${osMapMetrics.scheduledPostsCount} scheduled posts, ${osMapMetrics.communityPostCount} community posts feeding attribution.`,
   },
  ].filter((entry): entry is { id: string; time: string; text: string } => entry !== null);
 }, [
 marketingDashboard?.generatedAt,
 osMapMetrics,
  osMapWorkflowContext,
  selectedOsWorkflow,
  workflowMap.snapshot?.events,
 ]);
 const isOsWorkflowFocused = Boolean(selectedOsWorkflow);
 const osMapFocusLabel = selectedOsWorkflow?.label ?? 'All Live Ops';
 useEffect(() => {
  const nodeSnapshot: Record<string, { label: string; logic: string; activeItems: number }> = {
   meta: {
    label: `Meta / Instagram (${osMapMetrics.metaUnread} unread)`,
    logic: `SOCIAL_INTAKE: ${osMapMetrics.metaCount} social conversations routed into Comms with live customer matching.`,
    activeItems: osMapMetrics.metaUnread,
   },
   whatsapp: {
    label: `WhatsApp Channel (${osMapMetrics.whatsappUnread} unread)`,
    logic: `WHATSAPP_FLOW: ${osMapMetrics.whatsappCount} WhatsApp threads feeding quote, payment, and delivery follow-ups.`,
    activeItems: osMapMetrics.whatsappUnread,
   },
   tiktok: {
    label: `Storefront / App Orders (${osMapMetrics.webCount})`,
    logic: `STORE_ORDERS: ${osMapMetrics.webUnread} fresh web or app orders awaiting intake into CRM and sales workflow.`,
    activeItems: osMapMetrics.webUnread,
   },
   email: {
    label: `Email / Tender Intake (${osMapMetrics.emailUnread} unread)`,
    logic: `EMAIL_RFQ: ${osMapMetrics.emailCount} email threads and tender packs feeding BOQ, RFQ, and quote intake.`,
    activeItems: osMapMetrics.emailUnread,
   },
   mkt_assets: {
    label: `Asset Lab (${osMapMetrics.marketingAssetCount} assets)`,
    logic: 'ASSET_SYSTEM: Protected originals, managed variants, and publishable outputs stay reusable across the business.',
    activeItems: Math.max(osMapMetrics.marketingAssetCount, 0),
   },
   mkt_templates: {
    label: `Blueprint Library (${osMapMetrics.blueprintCount})`,
    logic: 'BLUEPRINTS: Reusable layouts drive public surfaces, ads, and Creative Studio outputs without drift.',
    activeItems: osMapMetrics.blueprintCount,
   },
   mkt_campaigns: {
    label: `Campaign Engine (${osMapMetrics.liveCampaignCount} live)`,
    logic: 'CAMPAIGN_ORCHESTRATION: Live campaigns connect creative outputs, product data, and publishing targets.',
    activeItems: osMapMetrics.liveCampaignCount,
   },
   mkt_calendar: {
    label: `Calendar Scheduler (${osMapMetrics.scheduledPostsCount} scheduled)`,
    logic: 'TIMELINE_CONTROL: Scheduled posts, reminders, and campaign timing stay inside one marketing timeline.',
    activeItems: osMapMetrics.scheduledPostsCount,
   },
   mkt_publishing: {
    label: `Publishing Queue (${osMapMetrics.publishQueueCount} active)`,
    logic: 'PUBLISH_FLOW: Approved jobs push through connected channels with retry and status tracking.',
    activeItems: osMapMetrics.publishQueueCount,
   },
   mkt_connectors: {
    label: `Channel Connectors (${osMapMetrics.connectedChannelCount} live)`,
    logic: 'CHANNEL_BRIDGE: Connected APIs and inbound endpoints keep external demand and publishing in sync.',
    activeItems: osMapMetrics.connectedChannelCount,
   },
   mkt_analytics: {
    label: `Analytics & Community (${osMapMetrics.communityPostCount} posts)`,
    logic: 'FEEDBACK_LOOP: Community engagement and campaign performance feed the retention and attribution model.',
    activeItems: osMapMetrics.communityPostCount,
   },
   comms: {
    label: isOsWorkflowFocused
      ? `Unified Comms Intake (${osMapWorkflowContext.conversations.inbox?.provider ?? 'pending'})`
      : `Unified Comms Intake (${osMapMetrics.unreadConversations} unread)`,
    logic: isOsWorkflowFocused
      ? `COMMS_HUB: Focused on ${osMapFocusLabel}. ${osMapWorkflowContext.conversations.inbox ? `Conversation ${osMapWorkflowContext.conversations.inbox.conversationKey} is the intake source.` : 'No linked conversation has been captured for this workflow yet.'}`
      : `COMMS_HUB: ${osMapMetrics.openConversations} conversations -> ${crmCustomers.length} CRM profiles -> ${osMapMetrics.activeLeads} active leads.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.conversations.inbox ? 1 : 0) : osMapMetrics.unreadConversations,
   },
   sales: {
    label: isOsWorkflowFocused
      ? `CRM / Quote Desk (${osMapWorkflowContext.records.quote?.status ?? osMapWorkflowContext.customers.sales?.stage ?? 'pending'})`
      : `CRM / Quote Desk (${osMapMetrics.linkedQuotes} quotes)`,
    logic: isOsWorkflowFocused
      ? `SALES_FLOW: ${osMapFocusLabel} -> ${osMapWorkflowContext.records.quote ? `${osMapWorkflowContext.records.quote.sourceDocumentKey ?? osMapWorkflowContext.records.quote.id} ${osMapWorkflowContext.records.quote.status}` : 'quote not issued yet'}.`
      : `SALES_FLOW: ${osMapMetrics.quoteWaitingCount} waiting on quote response -> ${osMapMetrics.negotiationCount} in negotiation -> ${formatZarCurrency(osMapMetrics.weightedOsPipelineValue)} weighted pipeline.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.records.quote || osMapWorkflowContext.records.salesOrder ? 1 : 0) : osMapMetrics.quoteWaitingCount + osMapMetrics.negotiationCount,
   },
   supply: {
    label: isOsWorkflowFocused
      ? `Supplier Purchase Orders (${osMapWorkflowContext.records.purchaseOrder?.status ?? 'not issued'})`
      : `Supplier Purchase Orders (${osMapMetrics.purchaseOrderCount})`,
    logic: isOsWorkflowFocused
      ? `PROCUREMENT: ${osMapWorkflowContext.records.purchaseOrder ? `${osMapWorkflowContext.records.purchaseOrder.sourceDocumentKey ?? osMapWorkflowContext.records.purchaseOrder.id} is linked to ${osMapWorkflowContext.vendors.supply?.name ?? osMapWorkflowContext.records.purchaseOrder.supplierName ?? 'supplier pending'}.` : 'No supplier PO is linked to this selected workflow yet.'}`
      : `PROCUREMENT: Paid quotes issue supplier POs automatically. ${osMapMetrics.supplierConfirmedCount} supplier confirmations already received.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.records.purchaseOrder ? 1 : 0) : Math.max(osMapMetrics.purchaseOrderCount - osMapMetrics.supplierConfirmedCount, 0),
   },
   logistics: {
    label: isOsWorkflowFocused
      ? `Transport & Collection (${osMapWorkflowContext.records.logistics?.status ?? 'pending'})`
      : `Transport & Collection (${osMapMetrics.logisticsCount})`,
    logic: isOsWorkflowFocused
      ? `TRANSPORT: ${osMapWorkflowContext.records.logistics ? `${osMapWorkflowContext.records.logistics.sourceDocumentKey ?? osMapWorkflowContext.records.logistics.id} is linked to ${osMapWorkflowContext.vendors.transport?.name ?? osMapWorkflowContext.records.logistics.supplierName ?? 'transport vendor pending'}.` : 'Transport costing or collection has not been created for this workflow yet.'}`
      : `TRANSPORT: ${osMapMetrics.transportPartnerCount} transport vendors, ${osMapMetrics.dispatchReadyCount} dispatch-ready suppliers, live collection and delivery cost tracking in ZAR.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.records.logistics ? 1 : 0) : osMapMetrics.logisticsCount + osMapMetrics.dispatchReadyCount,
   },
   fulfillment: {
    label: isOsWorkflowFocused
      ? `Delivery / POD (${osMapWorkflowContext.records.invoice ? 'invoice ready' : 'awaiting POD'})`
      : `Delivery / POD (${osMapMetrics.podCount})`,
    logic: isOsWorkflowFocused
      ? `FULFILMENT: ${osMapWorkflowContext.customers.order?.name ?? osMapFocusLabel} delivery state is tied to this workflow before finance closeout.`
      : `FULFILMENT: ${osMapMetrics.linkedOrders} customer orders in flight -> ${osMapMetrics.deliveredPodCount} delivered POD checkpoints -> invoice closeout follows confirmation.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.records.invoice ? 0 : 1) : Math.max(osMapMetrics.podCount - osMapMetrics.deliveredPodCount, 0),
   },
   marketing_ai: {
    label: isOsWorkflowFocused
      ? `Customer & Supplier Portals (${osMapWorkflowContext.customers.portal?.portalStatus ?? (osMapWorkflowContext.vendors.portal ? 'linked' : 'pending')})`
      : `Customer & Supplier Portals (${osMapMetrics.customerPortalReady}/${osMapMetrics.customerPortalTotal})`,
    logic: isOsWorkflowFocused
      ? `PORTAL_VISIBILITY: ${osMapWorkflowContext.customers.portal?.name ?? osMapWorkflowContext.vendors.portal?.name ?? osMapFocusLabel} is the focused portal visibility path.`
      : `PORTAL_VISIBILITY: ${osMapMetrics.customerPortalReady} customer portals ready and ${osMapMetrics.supplierPortalUsers} active supplier portal users sharing order state.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.customers.portal || osMapWorkflowContext.vendors.portal ? 1 : 0) : Math.max(osMapMetrics.customerPortalTotal - osMapMetrics.customerPortalReady, 0),
   },
   finance: {
    label: isOsWorkflowFocused
      ? `Invoice & Finance Ledger (${osMapWorkflowContext.records.finance?.status ?? 'pending'})`
      : `Invoice & Finance Ledger (${osMapMetrics.invoiceCount})`,
    logic: isOsWorkflowFocused
      ? `FINANCE_CLOSEOUT: ${osMapWorkflowContext.records.finance ? `${osMapWorkflowContext.records.finance.sourceDocumentKey ?? osMapWorkflowContext.records.finance.id} / ${formatZarCurrency(osMapWorkflowContext.records.finance.amount)} / ${osMapWorkflowContext.records.finance.status}.` : 'No finance ledger record has been generated for this selected workflow yet.'}`
      : `FINANCE_CLOSEOUT: ${formatZarCurrency(osMapMetrics.cashCollectedValue)} collected -> ${formatZarCurrency(osMapMetrics.outstandingReceivablesValue)} outstanding -> ${osMapMetrics.negativeMarginOrders} negative-margin flags.`,
    activeItems: isOsWorkflowFocused ? (osMapWorkflowContext.records.finance ? 1 : 0) : osMapMetrics.overdueInvoices + osMapMetrics.negativeMarginOrders,
   },
  };

  setNodes((currentNodes) => currentNodes.map((node) => {
   const snapshot = nodeSnapshot[node.id];
   if (!snapshot) {
    return node;
   }

   return {
    ...node,
    data: {
     ...node.data,
     label: snapshot.label,
     logic: snapshot.logic,
     activeItems: snapshot.activeItems,
    },
   };
  }));
 }, [crmCustomers.length, isOsWorkflowFocused, osMapFocusLabel, osMapMetrics, osMapWorkflowContext, setNodes]);
 const filteredPublishingJobs = useMemo(() => {
  return publishingJobs.filter((job) => {
   const matchesStatus =
    publishingStatusFilter === 'All'
     ? true
     : publishingStatusFilter === 'Active'
       ? job.status === 'Publishing' || job.status === 'Retrying' || job.status === 'Queued'
       : job.status === publishingStatusFilter;
   const matchesChannel = publishingChannelFilter === 'All' ? true : job.channel === publishingChannelFilter;
   return matchesStatus && matchesChannel;
  });
 }, [publishingChannelFilter, publishingJobs, publishingStatusFilter]);
 const calendarWeekDates = useMemo(() => buildWeekDates(calendarAnchorDate), [calendarAnchorDate]);
 const calendarMonthCells = useMemo(() => buildMonthCells(calendarAnchorDate), [calendarAnchorDate]);
 const calendarTitle = useMemo(
  () => calendarAnchorDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }).toUpperCase(),
  [calendarAnchorDate],
 );
 const calendarWeekRangeLabel = useMemo(() => {
  const start = calendarWeekDates[0]?.date;
  const end = calendarWeekDates[6]?.date;
  if (!start || !end) {
   return '';
  }

  const startLabel = start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }).toUpperCase();
  const endLabel = end.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${startLabel} - ${endLabel}`;
 }, [calendarWeekDates]);
 const publishingJobsByPostId = useMemo(() => {
  const map = new Map<string, PublishingJob[]>();
  publishingJobs.forEach((job) => {
   if (!job.postId) {
    return;
   }

   const existing = map.get(job.postId) ?? [];
   existing.push(job);
   map.set(job.postId, existing);
  });

  return map;
 }, [publishingJobs]);
const analyticsCampaignIds = useMemo(() => new Set(campaignPerformance.map((campaign) => campaign.id)), [campaignPerformance]);
const analyticsTrendMaxLeads = useMemo(
 () => Math.max(...analyticsTrend.map((item) => item.leads), 1),
 [analyticsTrend],
);
const analyticsTrendMaxQuotes = useMemo(
 () => Math.max(...analyticsTrend.map((item) => item.quotes), 1),
 [analyticsTrend],
);

 useEffect(() => {
  if (!highlightedCalendarEntryId) {
   return undefined;
  }

  const target = window.setTimeout(() => {
   setHighlightedCalendarEntryId(null);
  }, 4500);

  return () => window.clearTimeout(target);
 }, [highlightedCalendarEntryId]);

 useEffect(() => {
  if (activeModule !== 'Marketing' || activeMarketingSubModule !== 'Calendar' || !highlightedCalendarEntryId) {
   return;
  }

  const target = document.getElementById(`calendar-entry-${highlightedCalendarEntryId}`);
  target?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
 }, [activeMarketingSubModule, activeModule, highlightedCalendarEntryId, scheduledPosts]);

 useEffect(() => {
  const params = new URLSearchParams(location.search);
  const moduleParam = params.get('module');
  const marketingSubmoduleParam = params.get('submodule');
  const creativeModeParam = params.get('creativeMode');

  const validModules = ['Map', 'Customers', 'Suppliers', 'Inventory', 'Marketing', 'Comms', 'Finance'] as const;
  const validMarketingSubmodules = ['Dashboard', 'AssetLab', 'Templates', 'CreativeGenerator', 'Campaigns', 'Calendar', 'Publishing', 'Analytics', 'CommunityFeed', 'ContentStudio'] as const;
  const validCreativeModes = ['blueprint', 'cutout', 'scene'] as const;

  if (moduleParam && validModules.includes(moduleParam as (typeof validModules)[number])) {
   setActiveModule(moduleParam as (typeof validModules)[number]);
  }

  if (
   marketingSubmoduleParam &&
   validMarketingSubmodules.includes(marketingSubmoduleParam as (typeof validMarketingSubmodules)[number])
  ) {
   setActiveMarketingSubModule(marketingSubmoduleParam as (typeof validMarketingSubmodules)[number]);
  }

  if (creativeModeParam && validCreativeModes.includes(creativeModeParam as (typeof validCreativeModes)[number])) {
   setCreativeSeedMode(creativeModeParam as (typeof validCreativeModes)[number]);
  }
 }, [location.search]);
 const selectedAssetLinkedProducts = useMemo(() => {
  if (!selectedAsset) {
   return [];
  }

  const assetProductIds = Array.from(new Set([
   ...(selectedAsset.linkedProductIds ?? []),
   ...(selectedAsset.productId ? [selectedAsset.productId] : []),
  ]));

  return assetProductIds
   .map((id) => inventoryPortal.productsById[id])
   .filter(Boolean);
 }, [inventoryPortal.productsById, selectedAsset]);

 const selectedAssetLinkedCampaigns = useMemo(() => {
  if (!selectedAsset) {
   return [];
  }

  const assetCampaignIds = Array.from(new Set([
   ...(selectedAsset.linkedCampaignIds ?? []),
   ...(selectedAsset.campaignId ? [selectedAsset.campaignId] : []),
  ]));

  return assetCampaignIds
   .map((id) => marketingStudio.campaignsById[id])
   .filter((campaign): campaign is typeof marketingStudio.campaigns[number] => Boolean(campaign));
 }, [marketingStudio.campaignsById, selectedAsset]);

useEffect(() => {
 if (!selectedProduct && inventoryPortal.products.length > 0) {
  setSelectedProduct(inventoryPortal.products[0]);
 }
}, [inventoryPortal.products, selectedProduct]);

useEffect(() => {
 if (!selectedProduct) {
  return;
 }

 const refreshedProduct = inventoryPortal.productsById[selectedProduct.id];
 if (refreshedProduct) {
  if (refreshedProduct !== selectedProduct) {
   setSelectedProduct(refreshedProduct as Product);
  }
  return;
 }

 if (inventoryPortal.products.length > 0) {
  setSelectedProduct(inventoryPortal.products[0] as Product);
 } else {
  setSelectedProduct(null);
 }
}, [inventoryPortal.products, inventoryPortal.productsById, selectedProduct]);

 useEffect(() => {
  if (!selectedTemplate && marketingStudio.templates.length > 0) {
   setSelectedTemplate(marketingStudio.templates[0] as MarketingTemplate);
  }
 }, [marketingStudio.templates, selectedTemplate]);

 const activeBlueprintConfig = useMemo(
  () => selectedTemplate?.blueprintConfig ?? createDefaultBlueprintConfig('Product Card', 'Instagram Post'),
  [selectedTemplate],
 );
 const activeTemplateDestination = selectedTemplate?.destination ?? 'Instagram Post';
 const activeHeroSlot = getTemplateSlot(selectedTemplate, 'image');
 const activeTitleSlot = getTemplateSlot(selectedTemplate, 'title');
 const activeCopySlot = getTemplateSlot(selectedTemplate, 'copy');
 const activePriceSlot = getTemplateSlot(selectedTemplate, 'price');
 const activeCtaSlot = getTemplateSlot(selectedTemplate, 'cta');
 const activeCollectionSlot = getTemplateSlot(selectedTemplate, 'collection');
 const activeSpecStripSlot = getTemplateSlot(selectedTemplate, 'spec-strip');
 const templateEditorPreviewProduct = selectedProduct ?? inventoryPortal.products[0] ?? null;

 const openCreativeStudio = useCallback(
  (input?: {
   mode?: 'blueprint' | 'cutout' | 'scene' | null;
   assetId?: string | null;
   productId?: string | null;
   templateId?: string | null;
   campaignId?: string | null;
   legacyDesignId?: string | null;
  }) => {
   navigate(
    buildStudioCreativePath({
     mode: creativeModeToStudioRouteMode(input?.mode ?? creativeSeedMode ?? 'blueprint'),
     assetId: input?.assetId ?? creativeSeedAssetId,
     productId: input?.productId ?? selectedProduct?.id ?? null,
     templateId: input?.templateId ?? selectedTemplate?.id ?? null,
     campaignId: input?.campaignId ?? null,
     legacyDesignId: input?.legacyDesignId ?? null,
    }),
   );
  },
  [creativeSeedAssetId, creativeSeedMode, navigate, selectedProduct?.id, selectedTemplate?.id],
 );

 useEffect(() => {
  if (activeModule !== 'Marketing' || activeMarketingSubModule !== 'CreativeGenerator') {
   return;
  }

  navigate(
   buildStudioCreativePath({
    mode: creativeModeToStudioRouteMode(creativeSeedMode ?? 'blueprint'),
    assetId: creativeSeedAssetId,
    productId: selectedProduct?.id ?? null,
    templateId: selectedTemplate?.id ?? null,
   }),
   { replace: true },
  );
 }, [
  activeMarketingSubModule,
  activeModule,
  creativeSeedAssetId,
  creativeSeedMode,
  navigate,
  selectedProduct?.id,
  selectedTemplate?.id,
 ]);

 useEffect(() => {
  if (!selectedAsset || !marketingStudio.assetsById[selectedAsset.id]) {
   return;
  }

  const refreshedAsset = marketingStudio.assetsById[selectedAsset.id];
  if (refreshedAsset && refreshedAsset !== selectedAsset) {
   setSelectedAsset(refreshedAsset as Asset);
  }
 }, [marketingStudio.assetsById, selectedAsset]);

 useEffect(() => {
 if (!selectedAsset) {
  setIsEditingSelectedAsset(false);
  setSelectedAssetNameDraft('');
  setSelectedAssetTagsDraft([]);
  setSelectedAssetTagInput('');
  setSelectedAssetFeedback(null);
   return;
  }

  setSelectedAssetNameDraft(selectedAsset.name);
  setSelectedAssetTagsDraft(selectedAsset.tags);
  setSelectedAssetTagInput('');
 }, [selectedAsset]);

 const openAssetLinkedProduct = useCallback((asset: Asset) => {
  const productId = asset.linkedProductIds?.[0] ?? asset.productId;
  if (!productId) {
   return;
  }

  const product = inventoryPortal.productsById[productId];
  if (!product) {
   return;
  }

  const targetTab = asset.type === '2.5D Asset' || asset.type === '3D Asset' || asset.type === '3D Render' || asset.type === 'Model'
   ? '3d'
   : 'media';

  setActiveModule('Inventory');
  setActiveInventorySubModule('Catalog');
  setSelectedInventoryProduct(product);
  setInventoryDetailTab(targetTab);
  setIsInventoryDetailOpen(true);
  setSelectedAsset(null);
 }, [inventoryPortal.productsById, setActiveModule]);

 const openAssetLinkedCampaign = useCallback((asset: Asset) => {
  const campaignId = asset.linkedCampaignIds?.[0] ?? asset.campaignId;
  if (!campaignId) {
   return;
  }

  setActiveModule('Marketing');
  setActiveMarketingSubModule('Campaigns');
  setExpandedCampaignId(campaignId);
  setSelectedAsset(null);
 }, [setActiveModule]);

  const openAssetWorkflowNode = useCallback((asset: Asset) => {
  if (!asset.workflowNode) {
   return;
  }

  setActiveModule('Marketing');

  if (asset.workflowNode.startsWith('publish.')) {
   setActiveMarketingSubModule('Publishing');
  } else if (asset.workflowNode.startsWith('post.')) {
   setActiveMarketingSubModule('Calendar');
  } else if (asset.workflowNode.startsWith('campaign.')) {
   setActiveMarketingSubModule('Campaigns');
   if (asset.linkedCampaignIds?.[0] ?? asset.campaignId) {
    setExpandedCampaignId((asset.linkedCampaignIds?.[0] ?? asset.campaignId)!);
   }
  } else if (asset.workflowNode.startsWith('analytics.')) {
   setActiveMarketingSubModule('Analytics');
  } else if (asset.workflowNode.startsWith('creative.')) {
   openCreativeStudio({
    mode: 'blueprint',
    assetId: asset.id,
    productId: asset.productId ?? selectedProduct?.id ?? null,
   });
   return;
  } else {
   setActiveMarketingSubModule('AssetLab');
  }

  setSelectedAsset(null);
  }, [openCreativeStudio, selectedProduct?.id, setActiveModule]);

  const openFinanceProduct = useCallback((record: FinanceRecord) => {
    if (!record.productId) {
      toast.message('This finance record is not linked to an inventory product.');
      return;
    }

    const product = inventoryPortal.productsById[record.productId];
    if (!product) {
      toast.message('The linked inventory product could not be resolved.');
      return;
    }

    setActiveModule('Inventory');
    setActiveInventorySubModule('Catalog');
    setSelectedInventoryProduct(product);
    setInventoryDetailTab(record.type === 'Payable' ? 'suppliers' : 'history');
    setIsInventoryDetailOpen(true);
  }, [inventoryPortal.productsById]);

  const openFinanceCustomer = useCallback(async (record: FinanceRecord) => {
    if (!record.customerKey) {
      toast.message('This finance record is not linked to a customer profile.');
      return;
    }

    setActiveModule('Customers');
    setActiveCRMSubModule('Directory');

    try {
      const payload = await fetchInventoryCustomerDocuments(record.customerKey);
      const customerType: Customer['type'] =
        payload.type === 'Trade' || payload.type === 'Retail' || payload.type === 'Architect'
          ? payload.type
          : 'Retail';
      const customerStage: Customer['stage'] =
        payload.stage === 'Lead' ||
        payload.stage === 'Qualified' ||
        payload.stage === 'Quote Sent' ||
        payload.stage === 'Awaiting Response' ||
        payload.stage === 'Negotiation' ||
        payload.stage === 'Won' ||
        payload.stage === 'Lost' ||
        payload.stage === 'Follow-up'
          ? payload.stage
          : 'Qualified';

      setSelectedCustomer({
        id: payload.id,
        name: payload.name,
        type: customerType,
        email: payload.email ?? 'Not captured',
        phone: payload.phone ?? 'Not captured',
        stage: customerStage,
        lastActivity: 'Finance linked',
        linkedQuotes: payload.documents.filter((document) => document.type === 'Customer Quote').length,
        linkedOrders: payload.documents.filter((document) => document.type === 'Customer Order').length,
        readiness: {
          address: true,
          accessChecklist: true,
          vatDetails: true,
          contactChannel: true,
        },
        blockers: [],
      });
      setIsCustomerDetailOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Customer finance source could not be opened.');
    }
  }, []);

  const openFinanceSupplier = useCallback((record: FinanceRecord) => {
    if (!record.supplierKey) {
      toast.message('This finance record is not linked to a supplier profile.');
      return;
    }

    const vendor =
      inventoryPortal.suppliers.find((supplier) => supplier.id === record.supplierKey) ??
      inventoryPortal.suppliers.find((supplier) => supplier.name === (record.supplierName ?? record.customerName));

    if (!vendor) {
      toast.message('The linked supplier could not be resolved in the vendor directory.');
      return;
    }

    setActiveModule('Suppliers');
    setActiveVendorSubModule('Directory');
    setFocusedVendorId(vendor.id);
    setFocusedVendorTab(record.category === 'Logistics' ? 'Orders' : 'Overview');
  }, [inventoryPortal.suppliers]);

  const openFinanceWorkflow = useCallback((record: FinanceRecord) => {
    if (!record.workflowNode) {
      toast.message('This finance record does not have a workflow source attached yet.');
      return;
    }

    const targetNodeId = record.workflowNode.startsWith('quote.') || record.workflowNode.startsWith('sales_order.')
      ? 'sales'
      : record.workflowNode.startsWith('purchase_order.') || record.workflowNode.startsWith('supplier_invoice.')
        ? 'supply'
        : record.workflowNode.startsWith('logistics.')
          ? 'logistics'
          : record.workflowNode.startsWith('payment.') || record.workflowNode.startsWith('invoice.')
            ? 'finance'
            : 'finance';

    const targetNode = nodes.find((node) => node.id === targetNodeId) ?? null;

    setActiveModule('Map');
    if (targetNode) {
      setSelectedNode(targetNode);
      setSelectedEdge(null);
      setIsDetailPanelOpen(true);
    }
    toast.message(`Opened workflow context for ${record.sourceDocumentKey ?? record.id}.`);
  }, [nodes]);

 const openCalendarEntryWizard = useCallback((seed?: Partial<CalendarEntryDraft>) => {
  setCalendarEntryDraft({
   ...createCalendarEntryDraft(seed?.scheduledFor ? new Date(seed.scheduledFor) : calendarAnchorDate),
   ...seed,
  });
  setCalendarEntryWizardStep(1);
  setIsCalendarEntryWizardOpen(true);
 }, [calendarAnchorDate]);

 const findMarketingAssetById = useCallback((assetId?: string | null) => {
  if (!assetId) {
   return null;
  }

  return ((marketingStudio.assetsById[assetId] as Asset | undefined) ?? marketingAssets.find((asset) => asset.id === assetId) ?? null) as Asset | null;
 }, [marketingAssets, marketingStudio.assetsById]);

 const openCalendarEntrySource = useCallback((post: ScheduledPost) => {
  if (post.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(post.campaignId);
   return;
  }

  const linkedAsset = findMarketingAssetById(post.assetId);
  if (linkedAsset) {
   setSelectedAsset(linkedAsset);
   return;
  }

  setSelectedCalendarEntry(post);
 }, [findMarketingAssetById, setActiveModule]);

 const openCalendarEntryAsset = useCallback((post: ScheduledPost) => {
  const linkedAsset = findMarketingAssetById(post.assetId);
  if (!linkedAsset) {
   toast.error('No linked asset exists for this calendar slot yet.');
   return;
  }

  setSelectedAsset(linkedAsset);
 }, [findMarketingAssetById]);

 const openCalendarEntryPublishing = useCallback((post: ScheduledPost) => {
  if (post.entryType !== 'Post') {
   toast('Internal notes and reminders do not create publishing jobs.');
   return;
  }

  setActiveModule('Marketing');
  setActiveMarketingSubModule('Publishing');

  const linkedJobs = publishingJobsByPostId.get(post.id) ?? [];
  if (linkedJobs.length === 0) {
   toast('No publishing job exists for this slot yet.');
  }
 }, [publishingJobsByPostId, setActiveModule]);

 const openCalendarEntryAnalytics = useCallback((post: ScheduledPost) => {
  if (post.entryType !== 'Post') {
   toast('Analytics are attached to campaign posts, not internal reminders.');
   return;
  }

  if (post.campaignId && analyticsCampaignIds.has(post.campaignId)) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Analytics');
   return;
  }

  if (post.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(post.campaignId);
   toast('No analytics snapshot exists for this campaign yet. Opened the source campaign instead.');
   return;
  }

  toast.error('No linked campaign exists for this slot yet.');
 }, [analyticsCampaignIds, setActiveModule]);

 const openPublishingJobSource = useCallback((job: PublishingJob) => {
  if (job.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(job.campaignId);
   return;
  }

  const linkedPost = job.postId ? scheduledPosts.find((post) => post.id === job.postId) ?? null : null;
  if (linkedPost) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Calendar');
   setSelectedCalendarEntry(linkedPost);
   setHighlightedCalendarEntryId(linkedPost.id);
   return;
  }

  const linkedAsset = findMarketingAssetById(job.assetId);
  if (linkedAsset) {
   setSelectedAsset(linkedAsset);
   return;
  }

  toast.error('No source record is linked to this publishing job yet.');
 }, [findMarketingAssetById, scheduledPosts, setActiveModule]);

 const openPublishingJobCalendar = useCallback((job: PublishingJob) => {
  const linkedPost = job.postId ? scheduledPosts.find((post) => post.id === job.postId) ?? null : null;
  if (!linkedPost) {
   toast('No calendar entry is linked to this publishing job yet.');
   return;
  }

  setActiveModule('Marketing');
  setActiveMarketingSubModule('Calendar');
  setSelectedCalendarEntry(linkedPost);
  setHighlightedCalendarEntryId(linkedPost.id);
 }, [scheduledPosts, setActiveModule]);

 const openPublishingJobAsset = useCallback((job: PublishingJob) => {
  const linkedAsset = findMarketingAssetById(job.assetId ?? (job.postId ? scheduledPosts.find((post) => post.id === job.postId)?.assetId : undefined));
  if (!linkedAsset) {
   toast('No asset is linked to this publishing job yet.');
   return;
  }

  setSelectedAsset(linkedAsset);
 }, [findMarketingAssetById, scheduledPosts]);

const openPublishingJobAnalytics = useCallback((job: PublishingJob) => {
  if (job.campaignId && analyticsCampaignIds.has(job.campaignId)) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Analytics');
   return;
  }

  if (job.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(job.campaignId);
   toast('No analytics snapshot exists for this campaign yet. Opened the campaign source instead.');
   return;
  }

  toast.error('No campaign is linked to this publishing job yet.');
 }, [analyticsCampaignIds, setActiveModule]);

 const openAnalyticsSourceModule = useCallback((
  sourceModule: MarketingAnalyticsSourceModule | undefined,
  options?: {
   campaignId?: string | null;
   assetId?: string | null;
   assetName?: string | null;
   channel?: MarketingChannel;
   aggregateMessage?: string;
  },
 ) => {
  const linkedAsset = findMarketingAssetById(options?.assetId);

  if (sourceModule === 'AssetLab') {
   if (linkedAsset) {
    setSelectedAsset(linkedAsset);
    return;
   }

   setActiveModule('Marketing');
   setActiveMarketingSubModule('AssetLab');
   setAssetFilter('All');
   if (options?.assetName) {
    setAssetSearch(options.assetName);
   }
   if (options?.aggregateMessage) {
    toast(options.aggregateMessage);
   }
   return;
  }

  if (sourceModule === 'Publishing') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Publishing');
    setPublishingStatusFilter('All');
    setPublishingChannelFilter(options?.channel ?? 'All');
    if (!options?.channel && options?.aggregateMessage) {
      toast(options.aggregateMessage);
    }
    return;
  }

  if (sourceModule === 'CommunityFeed') {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('CommunityFeed');
   return;
  }

  if (sourceModule === 'Calendar') {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Calendar');
   if (options?.aggregateMessage) {
    toast(options.aggregateMessage);
   }
   return;
  }

  setActiveModule('Marketing');

  if (options?.campaignId) {
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(options.campaignId);
   return;
  }

  setActiveMarketingSubModule(sourceModule === 'Analytics' ? 'Analytics' : 'Campaigns');
  if (options?.aggregateMessage) {
   toast(options.aggregateMessage);
  }
 }, [findMarketingAssetById, setActiveModule]);

 const openAnalyticsKpi = useCallback((kpi: MarketingAnalyticsSnapshot['kpis'][number]) => {
  openAnalyticsSourceModule(kpi.sourceModule, {
   campaignId: kpi.campaignId,
   channel: kpi.channel,
   aggregateMessage: 'Opened the closest source workspace for this KPI.',
  });
 }, [openAnalyticsSourceModule]);

 const openAnalyticsTrendPoint = useCallback((point: MarketingAnalyticsSnapshot['trend'][number]) => {
  openAnalyticsSourceModule(point.sourceModule, {
   campaignId: point.campaignId,
   aggregateMessage: point.campaignId
    ? undefined
    : `Trend slice ${point.label} is aggregated across campaigns. Opened the campaign board for source review.`,
  });
 }, [openAnalyticsSourceModule]);

 const openAnalyticsChannelAttribution = useCallback((channel: MarketingAnalyticsSnapshot['channelAttribution'][number]) => {
  openAnalyticsSourceModule(channel.sourceModule, {
   campaignId: channel.campaignId,
   channel: channel.channel,
   aggregateMessage: channel.channel
    ? undefined
    : `${channel.name} is a rolled-up attribution bucket. Opened the closest source workspace for investigation.`,
  });
 }, [openAnalyticsSourceModule]);

 const openAnalyticsTopAsset = useCallback(() => {
  if (!analyticsTopAsset) {
   toast('No top-performing asset is available yet.');
   return;
  }

  openAnalyticsSourceModule(analyticsTopAsset.sourceModule, {
   campaignId: analyticsTopAsset.campaignId,
   assetId: analyticsTopAsset.id,
   assetName: analyticsTopAsset.name,
   aggregateMessage: 'Opened Asset Lab search for the top-performing asset.',
  });
 }, [analyticsTopAsset, openAnalyticsSourceModule]);

 const handleExportAnalyticsReport = useCallback(() => {
  const report = {
   exportedAt: new Date().toISOString(),
   kpis: analyticsKpis,
   trend: analyticsTrend,
   channelAttribution: analyticsChannelAttribution,
   topAsset: analyticsTopAsset,
   performance: campaignPerformance,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `marketing-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
  toast.success('Analytics report exported.');
 }, [analyticsChannelAttribution, analyticsKpis, analyticsTopAsset, analyticsTrend, campaignPerformance]);

 const handleOpenAnalyticsLiveView = useCallback(async () => {
  try {
   await marketingStudio.refresh();
   toast.success('Analytics refreshed.');
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to refresh analytics.');
  }
 }, [marketingStudio]);

 const openCommunityPostCampaign = useCallback((post: MarketingCommunityPostSummary) => {
  if (!post.campaignId) {
   toast('No linked campaign exists for this community post yet.');
   return;
  }

  setActiveModule('Marketing');
  setActiveMarketingSubModule('Campaigns');
  setExpandedCampaignId(post.campaignId);
 }, [setActiveModule]);

 const openCommunityPostAsset = useCallback((post: MarketingCommunityPostSummary) => {
  const linkedAsset =
   findMarketingAssetById(post.assetId) ??
   marketingAssets.find((asset) => asset.img === post.mediaUrl) ??
   null;

  if (!linkedAsset) {
   toast('No linked source asset exists for this post yet.');
   return;
  }

  setSelectedAsset(linkedAsset as Asset);
 }, [findMarketingAssetById, marketingAssets]);

 const openCommunityPostAnalytics = useCallback((post: MarketingCommunityPostSummary) => {
  if (post.campaignId && analyticsCampaignIds.has(post.campaignId)) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Analytics');
   return;
  }

  if (post.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Campaigns');
   setExpandedCampaignId(post.campaignId);
   toast('No analytics snapshot exists for this community post yet. Opened the linked campaign instead.');
   return;
  }

  toast('No linked analytics source exists for this community post yet.');
 }, [analyticsCampaignIds, setActiveModule]);

 const openCommunityPostHistory = useCallback((post: MarketingCommunityPostSummary) => {
  const linkedCalendarEntry = post.calendarEntryIds
   .map((calendarEntryId) => scheduledPosts.find((entry) => entry.id === calendarEntryId) ?? null)
   .find((entry): entry is ScheduledPost => Boolean(entry));

  if (linkedCalendarEntry) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Calendar');
   setSelectedCalendarEntry(linkedCalendarEntry);
   setHighlightedCalendarEntryId(linkedCalendarEntry.id);
   return;
  }

  if (post.campaignId) {
   setActiveModule('Marketing');
   setActiveMarketingSubModule('Calendar');
   toast('No direct calendar entry is linked yet. Opened Calendar for the linked campaign context.');
   return;
  }

  toast('No calendar history exists for this post yet.');
 }, [scheduledPosts, setActiveModule]);

 const openCommunityPostChannel = useCallback((post: MarketingCommunityPostSummary, channel: MarketingCommunityChannelStats) => {
  setActiveModule('Marketing');
  setActiveMarketingSubModule('Publishing');
  setPublishingStatusFilter('All');
  setPublishingChannelFilter(channel.channel);

  if (channel.publishingJobId || channel.calendarEntryId) {
   return;
  }

  if (post.campaignId) {
   toast(`Opened Publishing filtered to ${channel.channel} for the linked campaign context.`);
   return;
  }

  toast(`Opened Publishing filtered to ${channel.channel}.`);
 }, [setActiveModule]);

 const likeCommunityFeedPost = useCallback(async (post: MarketingCommunityPostSummary) => {
  await marketingStudio.likeCommunityPost(post.id, {
   actor: communityLikeActor,
  });
 }, [communityLikeActor, marketingStudio]);

 const commentOnCommunityFeedPost = useCallback(async (post: MarketingCommunityPostSummary, content: string) => {
  await marketingStudio.commentOnCommunityPost(post.id, {
   content,
   user: {
    name: 'BTS Team',
    avatar: 'https://i.pravatar.cc/150?u=bts-team',
    role: 'Marketing Ops',
   },
  });
 }, [marketingStudio]);

 const handleCreateCalendarEntry = useCallback(async () => {
  if (!calendarEntryDraft.title.trim()) {
   toast.error('Entry title is required.');
   return;
  }

  if (!calendarEntryDraft.scheduledFor) {
   toast.error('Choose when this calendar item should appear.');
   return;
  }

  if (calendarEntryDraft.entryType === 'Post' && !calendarEntryDraft.channel) {
   toast.error('Choose a channel for scheduled posts.');
   return;
  }

  setIsCreatingCalendarEntry(true);

  try {
   const entry = await marketingStudio.createCalendarEntry({
    entryType: calendarEntryDraft.entryType,
    title: calendarEntryDraft.title.trim(),
    description: calendarEntryDraft.description.trim() || undefined,
    campaignId: calendarEntryDraft.campaignId ?? undefined,
    assetId: calendarEntryDraft.entryType === 'Post' ? calendarEntryDraft.assetId ?? undefined : undefined,
    channel: calendarEntryDraft.entryType === 'Post' ? calendarEntryDraft.channel : undefined,
    scheduledFor: new Date(calendarEntryDraft.scheduledFor).toISOString(),
   });

   setIsCalendarEntryWizardOpen(false);
   setCalendarEntryWizardStep(1);
   setCalendarEntryDraft(createCalendarEntryDraft(new Date(calendarEntryDraft.scheduledFor)));
   setCalendarAnchorDate(startOfLocalDay(new Date(`${entry.date}T12:00:00`)));
   setHighlightedCalendarEntryId(entry.id);
   setSelectedCalendarEntry(entry as ScheduledPost);
   toast.success(`${entry.entryType} created and focused in Calendar.`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to create calendar entry.');
  } finally {
   setIsCreatingCalendarEntry(false);
  }
 }, [calendarEntryDraft, marketingStudio]);

 const filterAssetTag = useCallback((tag: string) => {
  setActiveModule('Marketing');
  setActiveMarketingSubModule('AssetLab');
  setAssetFilter('All');
  setAssetSearch(tag);
  setSelectedAsset(null);
 }, [setActiveModule]);

 const handleAddSelectedAssetTag = useCallback(() => {
  const nextTag = selectedAssetTagInput.trim().replace(/^#/, '');
  if (!nextTag) {
   return;
  }

  setSelectedAssetTagsDraft((currentTags) => {
   const normalized = currentTags.map((tag) => tag.toLowerCase());
   if (normalized.includes(nextTag.toLowerCase())) {
    return currentTags;
   }

   return [...currentTags, nextTag];
  });
  setSelectedAssetTagInput('');
 }, [selectedAssetTagInput]);

 const handleRemoveSelectedAssetTag = useCallback((tagToRemove: string) => {
  setSelectedAssetTagsDraft((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
 }, []);

 const handleUpdateSelectedAssetMetadata = useCallback(async () => {
  if (!selectedAsset) {
   return;
  }

  if (!isEditingSelectedAsset) {
   setIsEditingSelectedAsset(true);
   setSelectedAssetFeedback('Asset name and tags are now editable.');
   return;
  }

  setIsMutatingSelectedAsset(true);
  setSelectedAssetFeedback(null);

  try {
   const updatedAsset = await marketingStudio.updateAsset(selectedAsset.id, {
    name: selectedAssetNameDraft.trim(),
    tags: selectedAssetTagsDraft,
   });

   setSelectedAsset(updatedAsset as Asset);
   setIsEditingSelectedAsset(false);
   setSelectedAssetFeedback('Asset details updated.');
  } catch (error) {
   setSelectedAssetFeedback(error instanceof Error ? error.message : 'Failed to update asset details.');
  } finally {
   setIsMutatingSelectedAsset(false);
  }
 }, [isEditingSelectedAsset, marketingStudio, selectedAsset, selectedAssetNameDraft, selectedAssetTagsDraft]);

 const handleDuplicateSelectedAsset = useCallback(async () => {
  if (!selectedAsset) {
   return;
  }

  setIsMutatingSelectedAsset(true);
  setSelectedAssetFeedback(null);

  try {
   const duplicatedAsset = await marketingStudio.duplicateAsset(selectedAsset.id);
   setSelectedAsset(duplicatedAsset as Asset);
   setIsEditingSelectedAsset(false);
   setSelectedAssetFeedback('Asset duplicated. You are now viewing the copy.');
  } catch (error) {
   setSelectedAssetFeedback(error instanceof Error ? error.message : 'Failed to duplicate asset.');
  } finally {
   setIsMutatingSelectedAsset(false);
  }
 }, [marketingStudio, selectedAsset]);

 const handleArchiveSelectedAsset = useCallback(async () => {
  if (!selectedAsset) {
   return;
  }

  const confirmed = window.confirm(`Archive ${selectedAsset.name}? It will remain searchable in history but will be marked archived.`);
  if (!confirmed) {
   return;
  }

  setIsMutatingSelectedAsset(true);
  setSelectedAssetFeedback(null);

  try {
   const archivedAsset = await marketingStudio.archiveAsset(selectedAsset.id);
   setSelectedAsset(archivedAsset as Asset);
   setIsEditingSelectedAsset(false);
   setSelectedAssetFeedback('Asset archived.');
  } catch (error) {
   setSelectedAssetFeedback(error instanceof Error ? error.message : 'Failed to archive asset.');
  } finally {
   setIsMutatingSelectedAsset(false);
  }
 }, [marketingStudio, selectedAsset]);

 const handleOpenNewTemplateEditor = useCallback(() => {
  setTemplateEditorMode('create');
  setTemplateDraft(createTemplateDraft());
  setTemplateTagInput('');
  setAllowedTargetInput('');
  setIsTemplateEditorOpen(true);
 }, []);

 const handleOpenTemplateEditor = useCallback((template: MarketingTemplate) => {
  setTemplateEditorMode('edit');
  setTemplateDraft(createTemplateDraft(template));
  setTemplateTagInput('');
  setAllowedTargetInput('');
  setIsTemplateEditorOpen(true);
 }, []);

 const handleAddTemplateTag = useCallback(() => {
  const nextTag = templateTagInput.trim().replace(/^#/, '');
  if (!nextTag) {
   return;
  }
  setTemplateDraft((current) => ({
   ...current,
   tags: current.tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase()) ? current.tags : [...current.tags, nextTag],
  }));
  setTemplateTagInput('');
 }, [templateTagInput]);

 const handleAddAllowedTarget = useCallback(() => {
  const nextTarget = allowedTargetInput.trim();
  if (!nextTarget) {
   return;
  }
  setTemplateDraft((current) => ({
   ...current,
   allowedTargets: current.allowedTargets.some((target) => target.toLowerCase() === nextTarget.toLowerCase())
    ? current.allowedTargets
    : [...current.allowedTargets, nextTarget],
  }));
  setAllowedTargetInput('');
 }, [allowedTargetInput]);

 const handleSaveTemplate = useCallback(async () => {
  if (!templateDraft.name.trim()) {
   toast.error('Blueprint name is required.');
   return;
  }

  setIsSavingTemplate(true);

  try {
   const payload = {
    name: templateDraft.name.trim(),
    description: templateDraft.description.trim(),
    type: templateDraft.type,
    status: templateDraft.status,
    destination: templateDraft.destination,
    thumbnail: templateDraft.thumbnail.trim(),
    tags: templateDraft.tags,
    publicSurfaceEligible: templateDraft.publicSurfaceEligible,
    allowedTargets: templateDraft.allowedTargets,
    blueprintConfig: templateDraft.blueprintConfig,
    blueprint: summarizeBlueprintConfig(templateDraft.blueprintConfig, templateDraft.destination),
   };

   const template =
    templateEditorMode === 'edit' && templateDraft.id
     ? await marketingStudio.updateTemplate(templateDraft.id, payload)
     : await marketingStudio.createTemplate(payload);

   setSelectedTemplate(template as MarketingTemplate);
   setIsTemplateEditorOpen(false);
   setActiveMarketingSubModule('Templates');
   toast.success(templateEditorMode === 'edit' ? 'Blueprint updated.' : 'Blueprint created.');
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to save blueprint.');
  } finally {
   setIsSavingTemplate(false);
  }
 }, [marketingStudio, templateDraft, templateEditorMode]);

 const handleDuplicateTemplate = useCallback(async (template: MarketingTemplate) => {
  try {
   const duplicated = await marketingStudio.duplicateTemplate(template.id);
   setSelectedTemplate(duplicated as MarketingTemplate);
   toast.success(`${template.name} duplicated.`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to duplicate blueprint.');
  }
 }, [marketingStudio]);

 const executeArchiveTemplate = useCallback(async (template: MarketingTemplate) => {
  try {
   const archived = await marketingStudio.archiveTemplate(template.id);
   if (selectedTemplate?.id === archived.id) {
    setSelectedTemplate(null);
   }
   toast.success(`${template.name} archived. You can restore it from Archived.`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to archive blueprint.');
  }
 }, [marketingStudio, selectedTemplate?.id]);

 const handleArchiveTemplate = useCallback((template: MarketingTemplate) => {
  toast(`Archive ${template.name}?`, {
   description: 'It will move out of the active template library, but you can restore it from Archived at any time.',
   action: {
    label: 'Archive',
    onClick: () => {
     void executeArchiveTemplate(template);
    },
   },
  });
 }, [executeArchiveTemplate]);

 const handleRestoreTemplate = useCallback(async (template: MarketingTemplate) => {
  try {
   const restored = await marketingStudio.restoreTemplate(template.id);
   setSelectedTemplate(restored as MarketingTemplate);
   setShowArchivedTemplates(true);
   toast.success(`${template.name} restored to the active library.`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to restore blueprint.');
  }
 }, [marketingStudio]);

 const handleCreateAssetLabAsset = useCallback(
  async ({ file, productId, productRecordId }: { file: File; productId?: string; productRecordId?: string }) => {
   return createMarketingAssetFromUpload({
    file,
    linkedProductId: productId ?? productRecordId,
    createAsset: marketingStudio.createAsset,
   });
  },
  [marketingStudio],
 );

 const handleUploadMarketingAsset = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = '';

  if (!file) {
   return;
  }

  setIsUploadingMarketingAsset(true);

  try {
   const asset = await handleCreateAssetLabAsset({ file });
   setSelectedAsset(asset as Asset);
  } catch (error) {
   window.alert(error instanceof Error ? error.message : 'Failed to upload asset.');
  } finally {
   setIsUploadingMarketingAsset(false);
  }
 }, [handleCreateAssetLabAsset]);

 const handleRenderMarketingCreative = useCallback(async () => {
  if (!selectedTemplate || !selectedProduct) {
   window.alert('Select a template and source product before rendering.');
   return;
  }

  setIsRendering(true);

  try {
   await new Promise((resolve) => window.setTimeout(resolve, 1200));
   const asset = await marketingStudio.createRender({
    templateId: selectedTemplate.id,
    productId: selectedProduct.id,
    copy: generatorCopy,
    transparentBg: variantSettings.transparentBg,
    watermarkProfile: variantSettings.watermarkProfile,
    usagePurpose: variantSettings.usagePurpose,
    channelSize: variantSettings.channelSize,
   });
   setSelectedAsset(asset as Asset);
  } catch (error) {
   window.alert(error instanceof Error ? error.message : 'Failed to render creative.');
  } finally {
   setIsRendering(false);
  }
 }, [generatorCopy, marketingStudio, selectedProduct, selectedTemplate, variantSettings]);

 const handleCreateCampaign = useCallback(async (options?: { openStudio?: boolean }) => {
  if (!newCampaign.name || !newCampaign.startDate || !newCampaign.endDate) {
   window.alert('Campaign name, start date, and end date are required.');
   return;
  }

  try {
   const campaign = await marketingStudio.createCampaign({
    name: newCampaign.name,
    owner: newCampaign.owner || 'BTS Operator',
    description: newCampaign.description || '',
    status: (newCampaign.status as CampaignStatus) || 'Draft',
    startDate: newCampaign.startDate,
    endDate: newCampaign.endDate,
    channels: (newCampaign.channels as MarketingChannel[]) || [],
    linkedAssetIds: newCampaign.linkedAssetIds || [],
    productIds: newCampaign.productIds || [],
    budget: newCampaign.budget || 'R 0',
   });
   setExpandedCampaignId(campaign.id);
   setIsWizardOpen(false);
   setWizardStep(1);
   setActiveMarketingSubModule('Campaigns');
   if (options?.openStudio) {
    openCreativeStudio({
     mode: 'blueprint',
     campaignId: campaign.id,
     productId: newCampaign.productIds?.[0] ?? selectedProduct?.id ?? null,
     assetId: newCampaign.linkedAssetIds?.[0] ?? null,
    });
   }
   setNewCampaign({
    name: '',
    description: '',
    owner: 'Rikus Klue',
    status: 'Draft',
    startDate: '',
    endDate: '',
    channels: [],
    linkedAssetIds: [],
    productIds: [],
    budget: '',
   });
  } catch (error) {
   window.alert(error instanceof Error ? error.message : 'Failed to create campaign.');
  }
 }, [marketingStudio, newCampaign, openCreativeStudio, selectedProduct?.id]);

 const handleRefreshPublishingQueue = useCallback(async () => {
  setIsRefreshingQueue(true);
  try {
   await marketingStudio.refreshPublishing();
   toast.success('Publishing queue refreshed.');
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Failed to refresh publishing queue.');
  } finally {
   setIsRefreshingQueue(false);
  }
 }, [marketingStudio]);

 const handleGenerateMarketingVariant = useCallback(async () => {
  if (!selectedAsset) {
   return;
  }

  try {
   const asset = await marketingStudio.createAssetVariant(selectedAsset.id, variantSettings);
   setSelectedAsset(asset as Asset);
   setIsGeneratingVariant(false);
   setVariantWizardStep(1);
  } catch (error) {
   window.alert(error instanceof Error ? error.message : 'Failed to generate variant.');
  }
 }, [marketingStudio, selectedAsset, variantSettings]);

 const clampTwoLineStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
 };

 const clampThreeLineStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  overflow: 'hidden',
 };

 const NODE_GROUPS = [
  { 
  group: 'Core',
  nodes: [
  { label: 'Unified Intake', icon: Database, category: 'HUB', color: 'text-blue-400', desc: 'Shared comms and workflow truth' },
  { label: 'Demand Channel', icon: Share2, category: 'DEMAND', color: 'text-[#00ff88]', desc: 'Inbound customer and order source' },
  { label: 'Workflow Sync', icon: RefreshCw, category: 'CORE', color: 'text-indigo-400', desc: 'Cross-module state reconciliation' },
  ]
  },
  {
  group: 'Operations',
  nodes: [
  { label: 'CRM / Quote Step', icon: FileText, category: 'SALES', color: 'text-emerald-400', desc: 'Lead, quote, and paid-quote conversion' },
  { label: 'Supplier PO Step', icon: Box, category: 'SUPPLY', color: 'text-amber-400', desc: 'Supplier-backed procurement release' },
  { label: 'Transport Step', icon: Truck, category: 'LOGISTICS', color: 'text-cyan-400', desc: 'Collection, dispatch, and delivery flow' },
  { label: 'POD / Portal Step', icon: CheckCircle2, category: 'SUPPORT', color: 'text-purple-400', desc: 'POD, portal visibility, and closeout' },
  { label: 'Finance Closeout', icon: ShieldCheck, category: 'HUB', color: 'text-teal-400', desc: 'Invoice, margin, and reconciliation gate' },
  ]
  },
  {
  group: 'Marketing',
  nodes: [
  { label: 'Asset Lab', icon: Image, category: 'MARKETING', color: 'text-pink-400', desc: 'Reusable creative system of record' },
  { label: 'Creative Studio', icon: Wand2, category: 'MARKETING', color: 'text-purple-400', desc: 'Structured ad and scene generation' },
  { label: 'Campaign Engine', icon: Megaphone, category: 'MARKETING', color: 'text-pink-500', desc: 'Campaign orchestration and publishing' },
  { label: 'Analytics Node', icon: BarChart3, category: 'MARKETING', color: 'text-blue-400', desc: 'Performance and community feedback' },
  { label: 'Channel Sync', icon: Link, category: 'MARKETING', color: 'text-emerald-400', desc: 'External channel and connector bridge' },
  ]
  }
 ];

 const filteredNodeGroups = useMemo(() => {
  const allNodes = NODE_GROUPS.flatMap(g => g.nodes);
  const pinned = {
    group: 'Pinned',
    nodes: allNodes.filter(n => pinnedNodes.includes(n.label))
  };

  const groups = nodeSearch 
    ? NODE_GROUPS.map(group => ({
        ...group,
        nodes: group.nodes.filter(node => 
          node.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
          node.category.toLowerCase().includes(nodeSearch.toLowerCase()) ||
          node.desc.toLowerCase().includes(nodeSearch.toLowerCase())
        )
      })).filter(group => group.nodes.length > 0)
    : NODE_GROUPS;

  return pinned.nodes.length > 0 ? [pinned, ...groups] : groups;
 }, [nodeSearch, pinnedNodes]);

 const onDragStart = (event: React.DragEvent, nodeType: string, label: string, category: string, icon: any) => {
 event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label, category, iconName: icon.name }));
 event.dataTransfer.effectAllowed = 'move';
 };

 const onDragOver = useCallback((event: React.DragEvent) => {
 event.preventDefault();
 event.dataTransfer.dropEffect = 'move';
 }, []);

 const onDrop = useCallback(
 (event: React.DragEvent) => {
 event.preventDefault();

 const dataStr = event.dataTransfer.getData('application/reactflow');
 if (!dataStr) return;

 const { label, category, iconName } = JSON.parse(dataStr);
 
 // Map icon name back to component
 const iconMap: { [key: string]: any } = {
 Database, Share2, FileText, Box, Truck, Megaphone, CheckCircle2, Image, Wand2, BarChart3, Link
 };

 const position = screenToFlowPosition({
 x: event.clientX,
 y: event.clientY,
 });

 const newNode: Node = {
 id: Math.random().toString(36).substr(2, 9),
 type: 'businessStep',
 position,
 data: { 
 label, 
 category, 
 icon: iconMap[iconName] || Database, 
 logic: '' 
 },
 };

 setNodes((nds) => nds.concat(newNode));
 },
 [screenToFlowPosition, setNodes]
 );

  useEffect(() => {
    if (!libraryRef.current || !canvasRef.current) return;

    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: "expo.out" }
    });

    if (isLibraryExpanded) {
      // EXPANDING
      tl.to(libraryRef.current, { width: 300 }, 0)
        .to(canvasRef.current, { paddingLeft: 300 }, 0)
        .to(".node-library-content", { opacity: 1, x: 0, pointerEvents: "auto" }, 0.1)
        .to(".node-library-toggle", { rotation: 0, scale: 1, backgroundColor: "rgba(255,255,255,0.05)" }, 0);
    } else {
      // COLLAPSING
      tl.to(".node-library-content", { opacity: 0, x: -20, pointerEvents: "none" }, 0)
        .to(libraryRef.current, { width: 72 }, 0.1)
        .to(canvasRef.current, { paddingLeft: 72 }, 0.1)
        .to(".node-library-toggle", { rotation: 180, scale: 0.9, backgroundColor: "rgba(255,255,255,0.1)" }, 0.1);
    }

    return () => { tl.kill(); };
 }, [isLibraryExpanded]);

 const openCommsConversationFromMap = useCallback((conversation: CommsConversationSummary | null, fallbackCustomer?: Customer | null) => {
  if (conversation) {
   setPreferredCommsConversationId(conversation.id);
   setActiveModule('Comms');
   return;
  }

  if (fallbackCustomer) {
   openCommsConversationForCustomer(fallbackCustomer);
   return;
  }

  setPreferredCommsConversationId(null);
  setActiveModule('Comms');
 }, [openCommsConversationForCustomer]);

 const openOsMapSource = useCallback((nodeId: string) => {
  if (nodeId === 'meta') {
    openCommsConversationFromMap(osMapWorkflowContext.conversations.meta, osMapWorkflowContext.customers.sales);
    return;
  }

  if (nodeId === 'whatsapp') {
    openCommsConversationFromMap(osMapWorkflowContext.conversations.whatsapp, osMapWorkflowContext.customers.order ?? osMapWorkflowContext.customers.sales);
    return;
  }

  if (nodeId === 'email') {
    openCommsConversationFromMap(osMapWorkflowContext.conversations.email, osMapWorkflowContext.customers.sales);
    return;
  }

  if (nodeId === 'comms') {
    openCommsConversationFromMap(osMapWorkflowContext.conversations.inbox, osMapWorkflowContext.customers.sales ?? osMapWorkflowContext.customers.order);
    return;
  }

  if (nodeId === 'tiktok') {
    if (osMapWorkflowContext.conversations.web) {
      openCommsConversationFromMap(osMapWorkflowContext.conversations.web, osMapWorkflowContext.customers.order);
      return;
    }

    setActiveModule('Customers');
    openCrmSubModule('Dashboard');
    if (osMapWorkflowContext.customers.order) {
      openCustomerDetail(osMapWorkflowContext.customers.order, 'Orders');
    }
    return;
  }

  if (nodeId === 'sales') {
    setActiveModule('Customers');
    openCrmSubModule('Pipeline');
    if (osMapWorkflowContext.customers.sales) {
      openCustomerDetail(osMapWorkflowContext.customers.sales, 'Quotes');
    }
    return;
  }

  if (nodeId === 'supply') {
    setActiveModule('Suppliers');
    setActiveVendorSubModule('Directory');
    if (osMapWorkflowContext.vendors.supply) {
      setFocusedVendorId(osMapWorkflowContext.vendors.supply.id);
      setFocusedVendorTab('Orders');
      return;
    }

    if (osMapWorkflowContext.customers.sales) {
      setActiveModule('Customers');
      openCrmSubModule('Directory');
      openCustomerDetail(osMapWorkflowContext.customers.sales, 'Quotes');
    }
    return;
  }

  if (nodeId === 'logistics') {
    if (osMapWorkflowContext.vendors.transport) {
      setActiveModule('Suppliers');
      setActiveVendorSubModule('Directory');
      setFocusedVendorId(osMapWorkflowContext.vendors.transport.id);
      setFocusedVendorTab('Orders');
      return;
    }

    setActiveModule('Customers');
    openCrmSubModule('Directory');
    if (osMapWorkflowContext.customers.order) {
      openCustomerDetail(osMapWorkflowContext.customers.order, 'Logistics');
    }
    return;
  }

  if (nodeId === 'fulfillment') {
    setActiveModule('Customers');
    openCrmSubModule('Directory');
    if (osMapWorkflowContext.customers.order) {
      openCustomerDetail(osMapWorkflowContext.customers.order, 'Logistics');
    }
    return;
  }

  if (nodeId === 'marketing_ai') {
    if (osMapWorkflowContext.customers.portal) {
      setActiveModule('Customers');
      openCrmSubModule('Directory');
      openCustomerDetail(osMapWorkflowContext.customers.portal, 'Logistics');
      return;
    }

    if (osMapWorkflowContext.vendors.portal) {
      setActiveModule('Suppliers');
      setActiveVendorSubModule('Directory');
      setFocusedVendorId(osMapWorkflowContext.vendors.portal.id);
      setFocusedVendorTab('Orders');
    }
    return;
  }

  if (nodeId === 'finance') {
    setPreferredFinanceSubModule(osMapWorkflowContext.financeFocusSubModule);
    setPreferredFinanceRecordId(osMapWorkflowContext.records.finance?.id ?? null);
    setActiveModule('Finance');
    return;
  }

  if (nodeId === 'mkt_assets') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('AssetLab');
    return;
  }

  if (nodeId === 'mkt_templates') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Templates');
    return;
  }

  if (nodeId === 'mkt_campaigns') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Campaigns');
    return;
  }

  if (nodeId === 'mkt_calendar') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Calendar');
    return;
  }

  if (nodeId === 'mkt_publishing' || nodeId === 'mkt_connectors') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Publishing');
    return;
  }

  if (nodeId === 'mkt_analytics') {
    setActiveModule('Marketing');
    setActiveMarketingSubModule('Analytics');
  }
 }, [
  openCommsConversationFromMap,
  openCrmSubModule,
  openCustomerDetail,
  osMapWorkflowContext,
 ]);

 const onConnect = useCallback(
 (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff88' } }, eds)),
 [setEdges]
 );

 const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
 event.preventDefault();
 setSelectedNode(node);
 setSelectedEdge(null);
 setIsDetailPanelOpen(false);
 openOsMapSource(node.id);
 }, [openOsMapSource]);

 const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
 setSelectedEdge(edge);
 setSelectedNode(null);
 setIsDetailPanelOpen(true);
 }, []);

 const deleteNode = () => {
 if (selectedNode) {
 setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
 setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
 setIsDetailPanelOpen(false);
 }
 };

 const deleteEdge = () => {
 if (selectedEdge) {
 setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
 setIsDetailPanelOpen(false);
 }
 };

 const clearMap = () => {
 setNodes([]);
 setEdges([]);
 const toast = document.createElement('div');
 toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-red-500 text-white font-bold rounded-full text-[10px] uppercase tracking-widest shadow-2xl';
 toast.innerText = 'Map Cleared';
 document.body.appendChild(toast);
 setTimeout(() => toast.remove(), 3000);
 };

 const saveChanges = () => {
 // Simulate saving
 const toast = document.createElement('div');
 toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-[#00ff88] text-black font-bold rounded-full text-[10px] uppercase tracking-widest shadow-2xl animate-bounce';
 toast.innerText = 'Changes Saved to Cloud';
 document.body.appendChild(toast);
 setTimeout(() => toast.remove(), 3000);
 };

 const handleLogout = () => {
 setIsLoggedIn(false);
 setUserRole(null);
 setIsViewingPortal(false);
 };

 const generateMasterPrompt = () => {
 const workflowDescription = nodes.map(node => {
 const outgoingEdges = edges.filter(e => e.source === node.id);
 const targets = outgoingEdges.map(e => nodes.find(n => n.id === e.target)?.data.label).join(', ');
 return `- ${node.data.label} (${node.data.category}): Logic:"${node.data.logic || 'None'}". Flows to: ${targets || 'End'}`;
 }).join('\n');

 return `SYSTEM WORKFLOW PROMPT:\n\nThis business operates as a high-tech retail OS with the following automated logic:\n\n${workflowDescription}\n\nExecute all backend operations following these triggers and actions.`;
 };

 return (
 <div className="flex flex-col md:flex-row h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
 <NodeActionWizard 
   wizardState={activeActionWizard} 
   onClose={() => setActiveActionWizard(null)} 
   onComplete={handleActionComplete} 
 />
 <CustomerCreateWizard
   isOpen={isCustomerCreateWizardOpen}
   isSaving={isCreatingCustomer}
   onClose={() => setIsCustomerCreateWizardOpen(false)}
   onCreate={handleCreateCustomer}
 />
 <CustomerDetailDrawer 
   isOpen={isCustomerDetailOpen} 
   onClose={() => setIsCustomerDetailOpen(false)} 
   customer={selectedCustomer} 
   commsStudio={commsData.studio}
   products={inventoryPortal.products}
   initialSection={selectedCustomerDetailSection}
   onWorkflowChanged={commsData.refresh}
   onRequestReadinessInfo={handleRequestCustomerReadinessInfo}
 />
 {/* Technical Grid Overlay */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
 <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
 
 {/* Side Navigation Rail (Desktop) */}
 <aside className="hidden md:flex w-20 flex-col items-center py-8 border-r border-white/5 bg-[#0a0a0a] z-50">
 <div className="mb-12">
 <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
 <Database size={20} />
 </div>
 </div>
 
 <nav className="flex-1 flex flex-col gap-8">
 {[
 { id: 'Map', icon: Share2, label: 'OS Map' },
 { id: 'Customers', icon: Users, label: 'CRM' },
 { id: 'Comms', icon: MessageSquare, label: 'Comms' },
 { id: 'Finance', icon: DollarSign, label: 'Finance' },
 { id: 'Suppliers', icon: Truck, label: 'Vendors' },
 { id: 'Inventory', icon: Box, label: 'Stock' },
 { id: 'Marketing', icon: Megaphone, label: 'Social' },
 ].map((item) => (
 <button
 key={item.id}
 onClick={() => setActiveModule(item.id as any)}
 className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${activeModule === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
 >
 <item.icon size={20} />
 <span className="absolute left-16 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
 {item.label}
 </span>
 </button>
 ))}
 </nav>

 <div className="mt-auto flex flex-col gap-6">
 <button onClick={() => setIsViewingPortal(false)} className="text-white/30 hover:text-white transition-colors">
 <ArrowLeft size={20} />
 </button>
 <button onClick={handleLogout} className="text-white/30 hover:text-red-400 transition-colors">
 <LogOut size={20} />
 </button>
 </div>
 </aside>

 {/* Bottom Navigation Bar (Mobile) */}
 <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
 {[
 { id: 'Map', icon: Share2, label: 'Map' },
 { id: 'Customers', icon: Users, label: 'CRM' },
 { id: 'Inventory', icon: Box, label: 'Stock' },
 { id: 'Marketing', icon: Megaphone, label: 'Social' },
 { id: 'More', icon: MoreHorizontal, label: 'More' },
 ].map((item) => (
 <button
 key={item.id}
 onClick={() => {
   if (item.id === 'More') {
     setActiveModule('Finance');
   } else {
     setActiveModule(item.id as any);
   }
 }}
 className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeModule === item.id || (item.id === 'More' && ['Finance', 'Suppliers', 'Comms'].includes(activeModule)) ? 'text-[#00ff88]' : 'text-white/40'}`}
 >
 <item.icon size={20} strokeWidth={activeModule === item.id ? 2.5 : 2} />
 <span className="text-[9px] uppercase tracking-widest font-bold">
 {item.label}
 </span>
 </button>
 ))}
 </nav>
 
 {/* Main Content Area */}
 <main className="flex-1 relative overflow-hidden flex flex-col h-[calc(100vh-4rem)] md:h-screen">
 {activeModule === 'Map' && (
 <>
 {/* Header Overlay */}
 <header className="absolute top-4 left-4 md:top-8 md:left-8 z-40 pointer-events-none">
 <h1 className="text-2xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Brick Tile Shop</h1>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></div>
 <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88]">OPERATING SYSTEM MAP</span>
 </div>
 </header>

 {/* Workflow Focus Selector */}
 <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 hidden xl:flex w-[520px] items-center gap-4 rounded-2xl border border-white/10 bg-[#111]/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]">
 <GitMerge size={16} />
 </div>
 <div className="min-w-0 flex-1">
 <div className="mb-1 flex items-center justify-between gap-3">
 <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">Focus Workflow</span>
 <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-[#00ff88]/70">
 {selectedOsWorkflow ? selectedOsWorkflow.status : 'Auto Priority'}
 </span>
 </div>
 <select
 value={selectedOsWorkflowId}
 onChange={(event) => setSelectedOsWorkflowId(event.target.value)}
 className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-[#00ff88]/40"
 >
 <option value="auto">All Live Ops / Auto Priority</option>
 {osMapWorkflowOptions.map((candidate) => (
 <option key={candidate.id} value={candidate.id}>
 {candidate.label}
 </option>
 ))}
 </select>
 </div>
 <button
 type="button"
 onClick={() => setSelectedOsWorkflowId('auto')}
 disabled={selectedOsWorkflowId === 'auto'}
 className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 transition-all hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
 >
 Reset
 </button>
 <div className="absolute -bottom-7 left-16 max-w-[420px] truncate text-[9px] font-mono uppercase tracking-[0.16em] text-white/30">
 {selectedOsWorkflow ? `${selectedOsWorkflow.detail} / ${selectedOsWorkflow.customerName ?? 'source linked'}` : `${osMapWorkflowOptions.length} live workflow chains available`}
 </div>
 </div>

 {/* Live System Stats Overlay */}
 <Panel position="top-right" className="m-4 md:m-8 z-40 hidden md:block">
 <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-64 shadow-2xl">
 <div className="flex items-center justify-between mb-6">
 <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
 <Zap size={10} className="text-[#00ff88]" /> Live System Stats
 </span>
 <div className="flex gap-1">
 <div className="w-1 h-1 bg-[#00ff88] rounded-full"></div>
 <div className="w-1 h-1 bg-[#00ff88]/30 rounded-full"></div>
 <div className="w-1 h-1 bg-[#00ff88]/30 rounded-full"></div>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Cash Collected</span>
 <BarChart3 size={12} className="text-[#00ff88]" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">{formatZarCurrency(osMapMetrics.cashCollectedValue)}</div>
 </div>
 
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Stock Units</span>
 <Box size={12} className="text-amber-400" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">{osMapMetrics.totalStockUnits.toLocaleString('en-ZA')}</div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Open Workflows</span>
 <Zap size={12} className="text-blue-400" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">{osMapMetrics.activeWorkflows.toLocaleString('en-ZA')}</div>
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
 <span className="text-[8px] font-mono text-white/20 uppercase">Last Sync: {formatOpsMapTime(osMapMetrics.latestSyncAt)}</span>
 <div className="flex items-center gap-1">
 <span className="text-[8px] font-mono text-[#00ff88] uppercase">Online</span>
 </div>
 </div>
 </div>
 </Panel>

 {/* System Log Overlay */}
 <div className="absolute bottom-32 right-8 z-40 w-72 bg-[#1a1a1a]/40 backdrop-blur-md border border-white/10 rounded-xl p-6 hidden lg:block">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-4">Automation Log</h3>
 <div className="space-y-3">
 <AnimatePresence mode="popLayout">
 {systemLogs.map((log) => (
 <motion.div
 key={log.id}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="text-[9px] font-mono leading-relaxed"
 >
 <span className="text-white/20 mr-2">[{log.time}]</span>
 <span className="text-[#00ff88]/80">{log.text}</span>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>

 {/* Node Library Sidebar (Floating) */}
 <motion.div 
   ref={libraryRef}
   initial={false}
   className="absolute top-20 md:top-32 left-4 md:left-8 z-40 bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
   style={{ width: isLibraryExpanded ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100vw - 32px)' : 300) : 72 }}
 >
   <div className="p-4 flex flex-col h-full min-w-[300px]">
     <div className="flex items-center justify-between mb-6 px-2 w-full">
       <div className="flex items-center gap-3 overflow-hidden">
         <AnimatePresence mode="wait">
           {isLibraryExpanded && (
             <motion.div
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               className="flex items-center gap-2"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
               <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">
                 Node Library
               </h3>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
       <button 
         onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
         className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-200 text-white/60 hover:text-white shrink-0 group"
       >
         <motion.div
           animate={{ rotate: isLibraryExpanded ? 0 : 180 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
         >
           <ChevronLeft size={14} className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300" />
         </motion.div>
       </button>
     </div>

     {isLibraryExpanded && (
       <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="mb-6 px-2"
       >
         <div className="relative group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff88] transition-colors duration-300" size={12} />
           <input 
             type="text"
             placeholder="Search nodes..."
             value={nodeSearch}
             onChange={(e) => setNodeSearch(e.target.value)}
             className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-8 pr-4 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/40 focus:bg-[#00ff88]/5 focus:shadow-[0_0_15px_rgba(0,255,136,0.1)] transition-all duration-300"
           />
         </div>
       </motion.div>
     )}

     <div className={`overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar overflow-x-hidden ${isLibraryExpanded ? 'space-y-6' : 'space-y-4'}`}>
       {filteredNodeGroups.map((section, sIdx) => (
         <div key={section.group} className={isLibraryExpanded ? "mb-6" : "relative"}>
           {isLibraryExpanded ? (
             <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: sIdx * 0.05 }}
               className="px-2 pb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-white/30 flex items-center gap-2 border-b border-white/5 mb-3"
             >
               {section.group}
             </motion.div>
           ) : (
             sIdx > 0 && (
               <motion.div 
                 initial={{ width: 0, opacity: 0 }}
                 animate={{ width: 16, opacity: 1 }}
                 transition={{ delay: sIdx * 0.05 }}
                 className="h-px bg-white/10 mx-auto mb-4" 
               />
             )
           )}
           <div className="space-y-0.5">
             {section.nodes.map((node, nIdx) => (
               <motion.div
                 key={node.label}
                 initial={false}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: (sIdx * 0.1) + (nIdx * 0.05) }}
                 draggable
                 onDragStart={(e: any) => onDragStart(e, 'businessStep', node.label, node.category, node.icon)}
                 className={`
                   flex items-center gap-3 rounded-xl border border-transparent 
                   cursor-grab active:cursor-grabbing active:scale-[0.98]
                   transition-all duration-200 group relative
                   ${!isLibraryExpanded ? 'w-10 h-10 justify-center ml-1 p-0 hover:bg-white/5' : 'w-full p-1.5 hover:border-white/10 hover:bg-white/5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]'}
                 `}
               >
                 <div className={`w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center ${node.color} shrink-0 group-hover:scale-110 group-active:scale-95 group-hover:bg-white/10 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] transition-all duration-300`}>
                   <node.icon size={14} />
                 </div>
                 
                 {isLibraryExpanded && (
                   <div className="flex flex-col min-w-0">
                     <span className="text-[11px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                       {node.label}
                     </span>
                     <span className="text-[9px] text-white/30 group-hover:text-white/50 transition-colors truncate">
                       {node.desc}
                     </span>
                   </div>
                 )}

                 {!isLibraryExpanded && (
                   <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50 flex flex-col gap-1">
                     <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
                     <div className="flex items-center gap-2 relative z-10">
                       <node.icon size={12} className={node.color} />
                       <span className="text-[11px] font-medium text-white/90 tracking-wide">{node.label}</span>
                     </div>
                     <span className="text-[9px] text-white/40 font-mono relative z-10 pl-5">{node.desc}</span>
                   </div>
                 )}
               </motion.div>
             ))}
           </div>
         </div>
       ))}
     </div>
   </div>

   {/* Footer Actions */}
   <div className="mt-auto border-t border-white/5 bg-black/40 p-3 shrink-0">
     <div className={`grid ${isLibraryExpanded ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-3'} w-full`}>
       <button 
         onClick={clearMap}
         className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-white/40 hover:text-white transition-all group relative ${!isLibraryExpanded && 'w-10 h-10 mx-auto'}`}
       >
         <Trash2 size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
         {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Clear</span>}
         {!isLibraryExpanded && (
           <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
             <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
             <span className="text-[10px] font-mono uppercase tracking-widest text-white/90">Clear Map</span>
           </div>
         )}
       </button>
       <button 
         onClick={saveChanges}
         className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-[#00ff88]/20 hover:bg-[#00ff88]/10 text-[#00ff88]/60 hover:text-[#00ff88] transition-all group relative ${!isLibraryExpanded && 'w-10 h-10 mx-auto'}`}
       >
         <Save size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
         {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Save</span>}
         {!isLibraryExpanded && (
           <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
             <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
             <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]/90">Save Changes</span>
           </div>
         )}
       </button>
       <button 
         onClick={() => setIsMasterPromptOpen(true)}
         className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-purple-500/20 hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-400 transition-all group relative ${!isLibraryExpanded && 'w-10 h-10 mx-auto'}`}
       >
         <Terminal size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
         {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Prompt</span>}
         {!isLibraryExpanded && (
           <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
             <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
             <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/90">Master Prompt</span>
           </div>
         )}
       </button>
       <button 
         onClick={() => setIsViewingPortal(false)}
         className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-red-500/20 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all group relative ${!isLibraryExpanded && 'w-10 h-10 mx-auto'}`}
       >
         <LogOut size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
         {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Exit OS</span>}
         {!isLibraryExpanded && (
           <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
             <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
             <span className="text-[10px] font-mono uppercase tracking-widest text-red-400/90">Exit OS</span>
           </div>
         )}
       </button>
     </div>
   </div>
 </motion.div>

 {/* React Flow Canvas */}
 <div ref={canvasRef} className="flex-1 w-full h-full" style={{ paddingLeft: isLibraryExpanded ? 300 : 72 }} onDragOver={onDragOver} onDrop={onDrop}>
 <ReactFlow
 nodes={nodes}
 edges={edges}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 onConnect={onConnect}
 onNodeClick={onNodeClick}
 nodeTypes={nodeTypes}
 fitView
 colorMode="dark"
 className="bg-[#050505]"
 >
 <Background color="#1a1a1a" gap={25} size={1} variant={BackgroundVariant.Dots} />
 <Controls className="!bg-[#1a1a1a] !border-white/10 !fill-white" />
 </ReactFlow>
 </div>
 </>
 )}

	 {activeModule === 'Comms' && (
	    <LiveCommsCentre
        onCreateCalendarEntry={marketingStudio.createCalendarEntry}
        products={inventoryPortal.products}
        preferredConversationId={preferredCommsConversationId}
      />
	  )}

  {activeModule === 'Customers' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'Queue', label: 'Work Queue', icon: ListTodo },
          { id: 'Pipeline', label: 'Pipeline', icon: GitMerge },
          { id: 'Directory', label: 'Directory', icon: Users },
          { id: 'ProjectsTenders', label: 'Projects & Tenders', icon: Building2 },
          { id: 'Automations', label: 'Automations', icon: Zap },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveCRMSubModule(item.id as any)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCRMSubModule === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/40 border border-transparent'}`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>
      {/* CRM Sub-Nav (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">CRM OS</h2>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mt-1">Relationship Engine</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'Queue', label: 'Work Queue', icon: ListTodo },
            { id: 'Pipeline', label: 'Pipeline', icon: GitMerge },
            { id: 'Directory', label: 'Directory', icon: Users },
            { id: 'ProjectsTenders', label: 'Projects & Tenders', icon: Building2 },
            { id: 'Automations', label: 'Automations', icon: Zap },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveCRMSubModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeCRMSubModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} className={activeCRMSubModule === item.id ? 'text-[#00ff88]' : ''} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* CRM Main Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCRMSubModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeCRMSubModule === 'Dashboard' && (
              <CRMDashboard
                studio={commsData.studio}
                onCustomerClick={(c) => { openCustomerDetail(c); }}
                onNavigateSubModule={openCrmSubModule}
                onAddCustomer={() => { setIsCustomerCreateWizardOpen(true); }}
                onResolveAll={() => { openCrmSubModule('Queue', { queueCategory: 'Missing Info' }); }}
              />
            )}
            {activeCRMSubModule === 'Queue' && (
              <CRMQueue
                customers={crmCustomers}
                onCustomerClick={(c) => { openCustomerDetail(c); }}
                onOpenCustomerSection={(customer, section) => { openCustomerDetail(customer, section); }}
                onOpenCommsConversation={(customer) => { openCommsConversationForCustomer(customer); }}
                initialCategory={crmQueueCategorySeed}
              />
            )}
            {activeCRMSubModule === 'Pipeline' && (
              <CRMPipeline
                customers={crmCustomers}
                onOpenCustomerSection={(customer, section) => { openCustomerDetail(customer, section); }}
              />
            )}
            {activeCRMSubModule === 'Directory' && (
              <CRMDirectory 
                customers={crmCustomers}
                onCustomerClick={(customer) => {
                  openCustomerDetail(customer);
                }}
                onOpenCustomerSection={(customer, section) => {
                  openCustomerDetail(customer, section);
                }}
                initialStageFilter={crmDirectoryStageSeed}
              />
            )}
            {activeCRMSubModule === 'ProjectsTenders' && <CRMProjectsTenders products={inventoryPortal.products} />}
            {activeCRMSubModule === 'Automations' && (
              <CRMAutomations
                studio={commsData.studio}
                customers={crmCustomers}
                calendarEntries={marketingStudio.calendarEntries}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )}

  {activeModule === 'Suppliers' && (
    <SupplierVendorModule
      activeSubModule={activeVendorSubModule}
      onSubModuleChange={setActiveVendorSubModule}
      vendors={inventoryPortal.suppliers}
      products={inventoryPortal.rawProducts}
      isSaving={inventoryPortal.isSaving}
      onCreateVendor={inventoryPortal.createSupplier}
      onUpdateVendor={inventoryPortal.updateSupplier}
      onDeleteVendor={inventoryPortal.deleteSupplier}
      onAddSupplierContact={inventoryPortal.addSupplierContact}
      onAddSupplierDocument={inventoryPortal.addSupplierDocument}
      onLinkSupplierProducts={inventoryPortal.linkSupplierProducts}
      focusedVendorId={focusedVendorId}
      focusedVendorTab={focusedVendorTab}
    />
  )}

  {activeModule === 'Inventory' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'Catalog', label: 'Catalog', icon: Package },
          { id: 'Insights', label: 'Insights', icon: TrendingUp },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveInventorySubModule(sub.id as any)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeInventorySubModule === sub.id ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' : 'text-white/40 border border-transparent'}`}
          >
            <sub.icon size={14} />
            {sub.label}
          </button>
        ))}
      </div>
      {/* Inventory Sub-Nav (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase tracking-tight">Inventory OS</h2>
          <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mt-1">Product Data Source</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'Catalog', label: 'Catalog', icon: Package },
            { id: 'Insights', label: 'Insights', icon: TrendingUp },
          ].map((sub) => {
            const Icon = sub.icon;
            const isActive = activeInventorySubModule === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveInventorySubModule(sub.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20 shadow-[0_0_20px_rgba(96,165,250,0.1)]' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-xs font-bold uppercase tracking-widest">{sub.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </nav>

	        <div className="p-6 border-t border-white/5">
	          <div className="bg-blue-400/5 border border-blue-400/10 rounded-xl p-4">
	            <div className="flex items-center gap-2 mb-2">
	              <Activity size={12} className="text-blue-400" />
	              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Catalog Health</span>
	            </div>
	            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
	              <div className="h-full bg-blue-400" style={{ width: `${inventoryPortal.dashboard?.summary.globalCatalogHealth ?? 0}%` }} />
	            </div>
	            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mt-2">{inventoryPortal.dashboard?.summary.globalCatalogHealth ?? 0}% Global Readiness</p>
	          </div>
	        </div>
	      </div>

      {/* Inventory Content Area */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.02),transparent)]">
        <div className="p-8 max-w-7xl mx-auto">
          {activeInventorySubModule === 'Overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Inventory Overview</h1>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Supplier Availability & Asset Health Monitoring</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-blue-400">
                    Live Event Stream
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45">
                    Activity {inventoryPortal.dashboard?.latestActivityAt ? new Date(inventoryPortal.dashboard.latestActivityAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45">
                    Updated {inventoryPortal.dashboard?.generatedAt ? new Date(inventoryPortal.dashboard.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </div>
              </header>

	              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
	                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
	                  <div className="flex items-center justify-between mb-8">
	                    <h3 className="text-xs font-bold uppercase tracking-widest">Supplier Availability Alerts</h3>
	                    <div className="flex items-center gap-2 text-red-400 text-[10px] uppercase tracking-widest font-bold">
	                      <AlertCircle size={14} /> {inventoryPortal.dashboard?.summary.supplierAlertCount ?? 0} Items Need Attention
	                    </div>
	                  </div>
	                  {(inventoryPortal.dashboard?.availabilityAlerts ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-[#00ff88]/15 bg-[#00ff88]/5 p-5">
                        <div className="flex items-center gap-3 text-[#00ff88]">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">All supplier flags are green</span>
                        </div>
                        <p className="mt-3 text-sm text-white/50">Products with missing, delayed, or onboarding suppliers will surface here automatically.</p>
                      </div>
                    ) : (
  	                  <div className="space-y-4">
  	                    {(inventoryPortal.dashboard?.availabilityAlerts ?? []).map((item) => (
  	                      <button
                            key={item.id}
                            onClick={() => openInventoryProductFromOverview(item.id, 'suppliers')}
                            className="w-full flex items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/5 text-left hover:border-blue-400/30 hover:bg-blue-400/5 transition-all group"
                          >
  	                        <div className="flex-1">
  	                          <div className="flex items-center gap-3">
                                <div className="text-sm font-bold mb-1">{item.name}</div>
                                <div className={`text-[8px] uppercase tracking-widest font-bold ${item.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>{item.severity}</div>
                              </div>
                              <div className="text-[10px] font-mono text-white/50 mt-1">{item.message}</div>
                              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2">
                                {item.supplierName ?? 'No supplier'} · {item.leadTime ?? 'Lead time pending'}
                              </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold">{item.status}</div>
                            <div className="mt-2 text-[8px] uppercase tracking-widest font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Inspect Supplier</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    )}
                </div>

	                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
	                  <div className="flex items-center justify-between mb-8">
	                    <h3 className="text-xs font-bold uppercase tracking-widest">Marketing Asset Health</h3>
	                    <div className="flex items-center gap-2 text-[#00ff88] text-[10px] uppercase tracking-widest font-bold">
	                      <CheckCircle2 size={14} /> {Math.round(inventoryPortal.dashboard?.summary.globalAssetReadiness ?? 0)}% Coverage
	                    </div>
	                  </div>
	                  {actionableAssetCoverage.length === 0 ? (
                      <div className="rounded-2xl border border-[#00ff88]/15 bg-[#00ff88]/5 p-5">
                        <div className="flex items-center gap-3 text-[#00ff88]">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">All asset flags are green</span>
                        </div>
                        <p className="mt-3 text-sm text-white/50">Products missing required media, renders, or 3D coverage will appear here automatically.</p>
                      </div>
                    ) : (
  	                  <div className="space-y-4">
  	                    {actionableAssetCoverage.map((item) => (
  	                      <button
                            key={item.id}
                            onClick={() => openInventoryProductFromOverview(item.id, item.model3D ? 'media' : '3d')}
                            className="w-full p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-3 text-left hover:border-blue-400/30 hover:bg-blue-400/5 transition-all group"
                          >
  	                        <div className="flex items-center justify-between">
  	                          <div>
                              <div className="text-sm font-bold">{item.name}</div>
                              <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{item.id}</div>
                            </div>
                            <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                              item.health === 'Excellent' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
                              item.health === 'Good' ? 'bg-blue-500/10 text-blue-400' :
                              item.health === 'Needs Assets' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {item.health}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/60">
                            <div className="flex items-center gap-1" title="Images"><Image size={12} className={item.images > 0 ? 'text-[#00ff88]' : 'text-white/20'} /> {item.images}</div>
                            <div className="flex items-center gap-1" title="Campaigns"><Megaphone size={12} className={item.campaigns > 0 ? 'text-[#00ff88]' : 'text-white/20'} /> {item.campaigns}</div>
                            <div className="flex items-center gap-1" title="3D Model"><Box size={12} className={item.model3D ? 'text-[#00ff88]' : 'text-red-400'} /> {item.model3D ? 'Yes' : 'No'}</div>
                            <div className="flex items-center gap-1" title="Renders"><Wand2 size={12} className={item.renders > 0 ? 'text-[#00ff88]' : 'text-white/20'} /> {item.renders}</div>
                          </div>
                          <div className="text-[8px] uppercase tracking-widest font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.model3D ? 'Inspect Media' : 'Inspect 3D Coverage'}
                          </div>
                        </button>
                      ))}
                    </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}

	          {activeInventorySubModule === 'Catalog' && (
	            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
	              <InventoryCatalog 
	                products={inventoryPortal.products}
	                onProductClick={(product) => {
	                  setSelectedInventoryProduct(product);
	                  setIsInventoryDetailOpen(true);
	                }}
	                onAddProduct={() => setIsAddProductWizardOpen(true)}
	                onImportPriceList={() => setIsImportPriceListOpen(true)}
	              />
	            </motion.div>
	          )}
	
	          {activeInventorySubModule === 'Insights' && (
	            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
	              <InventoryInsights dashboard={inventoryPortal.dashboard} products={inventoryPortal.products} />
	            </motion.div>
	          )}
        </div>
      </div>
      {/* Inventory Detail Drawer */}
	      <InventoryDetailDrawer 
	        product={selectedInventoryProduct}
          detail={selectedInventoryDetail}
          assetLibrary={marketingAssets}
	        isOpen={isInventoryDetailOpen}
	        onClose={() => setIsInventoryDetailOpen(false)}
	        activeTab={inventoryDetailTab}
        onTabChange={(tab) => setInventoryDetailTab(tab as any)}
        onSaveEdits={handleSaveInventoryDrawerEdits}
        onPublishToStore={() => {
          void handlePublishInventoryProduct();
        }}
        onUploadAssetToLibrary={handleCreateAssetLabAsset}
        isPublishing={isPublishingInventoryProduct}
      />
    </div>
  )}

  {activeModule === 'Marketing' && (
    <PortalSectionErrorBoundary
      resetKey={`marketing:${activeMarketingSubModule}`}
      title="Marketing Studio"
      onReset={() => {
        setSelectedAsset(null);
        setCreativeSeedAssetId(null);
        setCreativeSeedMode(null);
        setActiveMarketingSubModule('Dashboard');
      }}
    >
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'AssetLab', label: 'Asset Lab', icon: Image },
          { id: 'Templates', label: 'Templates', icon: FileText },
          { id: 'CreativeGenerator', label: 'Creative Studio', icon: Wand2 },
          { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'Calendar', label: 'Calendar', icon: Calendar },
          { id: 'Publishing', label: 'Publishing', icon: ListOrdered },
          { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'CommunityFeed', label: 'Community Feed', icon: Users },
          { id: 'ContentStudio', label: 'Content Desk', icon: BookOpen },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => {
              if (sub.id === 'CreativeGenerator') {
                openCreativeStudio({ mode: 'blueprint' });
                return;
              }
              setActiveMarketingSubModule(sub.id as any);
            }}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeMarketingSubModule === sub.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/40 border border-transparent'}`}
          >
            <sub.icon size={14} />
            {sub.label}
          </button>
        ))}
      </div>
      {/* Marketing Sub-Nav (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
 <div className="p-8 border-bottom border-white/5">
 <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">Marketing Studio</h2>
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mt-1">Subsystem v2.5</p>
 </div>
 
 <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
 {[
 { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { id: 'AssetLab', label: 'Asset Lab', icon: Image },
 { id: 'Templates', label: 'Templates', icon: FileText },
 { id: 'CreativeGenerator', label: 'Creative Studio', icon: Wand2 },
 { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
 { id: 'Calendar', label: 'Calendar', icon: Calendar },
 { id: 'Publishing', label: 'Publishing', icon: ListOrdered },
 { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
 { id: 'CommunityFeed', label: 'Community Feed', icon: Users },
 { id: 'ContentStudio', label: 'Content Desk', icon: BookOpen },
].map((sub) => {
 const Icon = sub.icon;
 const isActive = activeMarketingSubModule === sub.id;
 return (
 <button
 key={sub.id}
 onClick={() => {
  if (sub.id === 'CreativeGenerator') {
   openCreativeStudio({ mode: 'blueprint' });
   return;
  }
  setActiveMarketingSubModule(sub.id as any);
 }}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
 isActive 
 ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_20px_rgba(0,255,136,0.1)]' 
 : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
 }`}
 >
 <Icon size={18} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
 <span className="text-xs font-bold uppercase tracking-widest">{sub.label}</span>
 {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00ff88]" />}
 </button>
 );
 })}
 </nav>

 <div className="p-6 border-t border-white/5">
 <div className="bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-xl p-4">
 <div className="flex items-center gap-2 mb-2">
 <Activity size={12} className="text-[#00ff88]" />
 <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">System Health</span>
 </div>
 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
 <div className="w-3/4 h-full bg-[#00ff88]" />
 </div>
 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mt-2">All Nodes Operational</p>
 </div>
 </div>
 </div>

 {/* Marketing Content Area */}
 <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.03),transparent)]">
 <div className="p-8 max-w-7xl mx-auto">
 {activeMarketingSubModule === 'Dashboard' && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <header>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Command Center</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Runtime Monitoring & Global Orchestration</p>
 </header>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {(marketingDashboard?.kpis ?? []).map((stat, i) => {
 const iconMap = {
  'Active Campaigns': Megaphone,
  'Pending Renders': Wand2,
  'Total Reach': Users,
  Conversion: Activity,
 };
 const colorMap = {
  'Active Campaigns': 'text-blue-400',
  'Pending Renders': 'text-purple-400',
  'Total Reach': 'text-[#00ff88]',
  Conversion: 'text-pink-400',
 };
 const Icon = iconMap[stat.label as keyof typeof iconMap] ?? Activity;
 const color = colorMap[stat.label as keyof typeof colorMap] ?? 'text-white';
 return (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 onClick={() => {
  if (stat.route === 'CreativeGenerator') {
   openCreativeStudio({ mode: 'blueprint' });
   return;
  }
  setActiveMarketingSubModule(stat.route);
 }}
 className="bg-[#111] border border-white/10 rounded-xl p-6 hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 group relative overflow-hidden shadow-xl cursor-pointer"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-xl bg-black border border-white/5 shadow-inner ${color}`}>
 <Icon size={20} />
 </div>
 <span className="text-[10px] font-mono text-[#00ff88] px-2 py-1 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 shadow-sm">{stat.trend}</span>
 </div>
 <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/60 transition-colors">{stat.label}</h3>
 <p className="text-3xl font-bold text-white tracking-tighter group-hover:text-[#00ff88] transition-colors">{stat.value}</p>
 </div>
 </motion.div>
 );
 })}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="bg-[#111] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group shadow-2xl hover:border-[#00ff88]/20 transition-all duration-500"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-10">
 <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Live Campaign Stream</h3>
 <button onClick={() => setActiveMarketingSubModule('Campaigns')} className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline">View All</button>
 </div>
 <div className="space-y-6">
 {(marketingDashboard?.liveCampaigns ?? []).map((camp, i) => (
 <motion.div 
 key={camp.name} 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.2 + (i * 0.1) }}
 onClick={() => {
  setExpandedCampaignId(marketingCampaigns.find((item) => item.name === camp.name)?.id ?? null);
  setActiveMarketingSubModule('Campaigns');
 }}
 className="p-8 bg-black border border-white/5 rounded-xl hover:border-[#00ff88]/20 transition-all group/item relative overflow-hidden shadow-inner cursor-pointer"
 >
 <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className="space-y-1">
 <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest opacity-60 group-hover/item:opacity-100 transition-opacity">{camp.id}</span>
 <h4 className="text-xl font-serif font-bold text-white uppercase tracking-tight group-hover/item:text-[#00ff88] transition-colors">{camp.name}</h4>
 </div>
 <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${camp.status === 'Active' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : camp.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
 {camp.status}
 </span>
 </div>
 <div className="space-y-3">
 <div className="flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest">
 <span>Execution Progress</span>
 <span className="group-hover/item:text-[#00ff88] transition-colors">{camp.progress}%</span>
 </div>
 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${camp.progress}%` }}
 transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.5 + (i * 0.1) }}
 className={`h-full ${camp.status === 'Active' ? 'bg-[#00ff88]' : camp.status === 'Scheduled' ? 'bg-blue-400' : 'bg-white/20'} shadow-[0_0_15px_currentColor]`}
 />
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-[#111] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group shadow-2xl hover:border-[#00ff88]/20 transition-all duration-500"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-10">
 <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Asset Lab Status</h3>
 <button onClick={() => setActiveMarketingSubModule('AssetLab')} className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline">Open Lab</button>
 </div>
 <div className="grid grid-cols-2 gap-6">
 {(marketingDashboard?.assetLabStats ?? []).map((stat, i) => (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.3 + (i * 0.05) }}
 onClick={() => {
  if (stat.route === 'CreativeGenerator') {
   openCreativeStudio({ mode: 'blueprint' });
   return;
  }
  setActiveMarketingSubModule(stat.route);
 }}
 className="p-8 bg-black border border-white/5 rounded-xl hover:border-[#00ff88]/20 transition-all group/stat relative overflow-hidden shadow-inner cursor-pointer"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <p className={`text-4xl font-serif font-bold mb-2 ${stat.label === '3D Readiness' ? 'text-[#00ff88]' : stat.label === 'Active Renders' ? 'text-purple-400' : stat.label === 'New Variants' ? 'text-blue-400' : 'text-white'} group-hover/stat:scale-110 group-hover/stat:text-[#00ff88] transition-all origin-left duration-500`}>{stat.value}</p>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest group-hover/stat:text-white/60 transition-colors">{stat.label}</p>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </motion.div>
 </div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'AssetLab' && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Asset Lab</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Media Intelligence & Variant Management</p>
 </div>
 <div className="flex items-center gap-4">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
 <input 
 type="text" 
 placeholder="SEARCH ASSETS..." 
 value={assetSearch}
 onChange={(e) => setAssetSearch(e.target.value)}
 className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/50 w-64 uppercase tracking-widest"
 />
 </div>
 <input
 ref={marketingAssetUploadInputRef}
 type="file"
 className="hidden"
 onChange={handleUploadMarketingAsset}
 />
 <button onClick={() => marketingAssetUploadInputRef.current?.click()} className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 disabled:opacity-50" disabled={isUploadingMarketingAsset || marketingStudio.isSaving}>
 <Plus size={16} /> {isUploadingMarketingAsset ? 'Uploading...' : 'Upload Asset'}
 </button>
 </div>
 </header>

 <div className="flex flex-wrap gap-4 p-2 bg-white/5 border border-white/10 rounded-xl w-fit">
 {['All', 'Images', 'Videos', '3D Models', 'Renders', 'Originals', 'Variants'].map((filter) => (
 <button 
 key={filter} 
 onClick={() => setAssetFilter(filter)}
 className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${assetFilter === filter ? 'bg-[#00ff88] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
 >
 {filter}
 </button>
 ))}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {marketingAssets
 .filter(asset => {
 const matchesSearch = asset.name.toLowerCase().includes(assetSearch.toLowerCase()) || asset.tags.some(t => t.toLowerCase().includes(assetSearch.toLowerCase()));
 const matchesFilter = assetFilter === 'All' || 
 (assetFilter === 'Originals' && asset.protectionLevel === 'Protected Original') ||
 (assetFilter === 'Variants' && asset.protectionLevel !== 'Protected Original') ||
 (assetFilter === asset.type + 's') || 
 (assetFilter === '3D Models' && asset.type === '3D Asset');
 return matchesSearch && matchesFilter;
 })
 .map((asset, i) => (
 <motion.div 
 key={asset.id} 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05 }}
 onClick={() => setSelectedAsset(asset)}
 className="group relative bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 cursor-pointer"
 >
 <div className="aspect-square overflow-hidden relative bg-black">
 {asset.type === 'Video' ? (
 <video
 src={asset.img}
 className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
 muted
 loop
 playsInline
 autoPlay
 preload="metadata"
 />
 ) : (
 <img src={asset.img} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" referrerPolicy="no-referrer" />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
 <div className="p-3 bg-white/10 rounded-xl text-white backdrop-blur-md border border-white/20">
 <Eye size={20} />
 </div>
 </div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[7px] font-bold text-white/60 uppercase tracking-widest w-fit shadow-lg flex items-center gap-1.5">
            {asset.type === '3D Asset' || asset.type === 'Model' ? <Box size={10} /> : asset.type === 'Video' ? <Video size={10} /> : <Image size={10} />}
            {asset.type}
          </div>
          {asset.protectionLevel === 'Protected Original' ? (
            <div className="px-2 py-1 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded text-[7px] font-bold text-red-400 uppercase tracking-widest w-fit shadow-lg flex items-center gap-1.5">
              <Lock size={10} /> Protected Original
            </div>
          ) : asset.protectionLevel === 'Publishable Variant' ? (
            <div className="px-2 py-1 bg-[#00ff88]/20 backdrop-blur-md border border-[#00ff88]/30 rounded text-[7px] font-bold text-[#00ff88] uppercase tracking-widest w-fit shadow-lg flex items-center gap-1.5">
              <Share size={10} /> Publishable Variant
            </div>
          ) : (
            <div className="px-2 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded text-[7px] font-bold text-blue-400 uppercase tracking-widest w-fit shadow-lg flex items-center gap-1.5">
              <Layers size={10} /> Managed Variant
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-4">
          <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-md border shadow-lg ${
            asset.status === 'Approved' ? 'bg-black/60 text-[#00ff88] border-[#00ff88]/30' : 
            asset.status === 'Review' ? 'bg-black/60 text-orange-400 border-orange-500/30' : 
            'bg-black/60 text-white/40 border-white/10'
          }`}>
            {asset.status}
          </span>
        </div>
 </div>
 <div className="p-5 relative z-10 bg-gradient-to-b from-[#111] to-black">
 <div className="flex items-center justify-between mb-2">
 <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00ff88] transition-colors">{asset.name}</h4>
 {asset.is3DReady && (
 <div className="text-[#00ff88] bg-[#00ff88]/10 p-1 rounded border border-[#00ff88]/20" title="3D Ready">
 <Box size={12} />
 </div>
 )}
 </div>
 
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{asset.size}</span>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{asset.usage[0]}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Products</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
              <ShoppingBag size={10} className="text-white/20" />
              <span>{asset.linkedProductIds?.length || (asset.productId ? 1 : 0)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Campaigns</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
              <Megaphone size={10} className="text-white/20" />
              <span>{asset.linkedCampaignIds?.length || (asset.campaignId ? 1 : 0)}</span>
            </div>
          </div>
          {asset.completeness !== undefined && (
            <div className="flex-1 flex flex-col gap-1.5 ml-2">
              <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Health</span>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${asset.completeness === 100 ? 'bg-[#00ff88]' : 'bg-amber-400'}`} 
                  style={{ width: `${asset.completeness}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {asset.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[7px] font-bold text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded uppercase tracking-widest">{tag}</span>
          ))}
          {asset.tags.length > 2 && <span className="text-[7px] font-bold text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded uppercase tracking-widest">+ {asset.tags.length - 2}</span>}
        </div>
        
        {asset.workflowNode && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[7px] font-bold text-purple-400/60 uppercase tracking-widest">
            <Activity size={10} /> {asset.workflowNode}
          </div>
        )}
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'Templates' && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Templates</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Deterministic Blueprints for Creative Output</p>
 </div>
 <div className="flex items-center gap-3">
  <button
   type="button"
   onClick={() => setShowArchivedTemplates((current) => !current)}
   className={`px-5 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${showArchivedTemplates ? 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'}`}
  >
   <History size={14} /> Archived ({archivedMarketingTemplates.length})
  </button>
  <button onClick={handleOpenNewTemplateEditor} className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
  <Plus size={16} /> New Blueprint
  </button>
 </div>
</header>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {marketingTemplates.map((template, i) => (
 <motion.div 
 key={template.id} 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 group relative overflow-hidden flex flex-col"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="w-full aspect-video bg-black border border-white/5 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden shadow-inner">
 <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="flex items-center gap-2">
  <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-[#00ff88] uppercase tracking-widest shadow-lg">
  {template.type}
  </div>
  <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-white/55 uppercase tracking-widest shadow-lg">
  {template.destination}
  </div>
 </div>
 </div>
 </div>
 <h3 className="text-xl font-serif font-bold text-white uppercase tracking-tighter mb-2 group-hover:text-[#00ff88] transition-colors relative z-10">{template.name}</h3>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed mb-6 flex-1 relative z-10">{template.description}</p>
 
 <div className="p-4 bg-black/40 border border-white/5 rounded-xl mb-8 relative z-10 shadow-inner">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-2">Deterministic Blueprint</p>
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">{template.blueprint}</p>
 <div className="mt-4 flex flex-wrap gap-2">
  {template.tags.slice(0, 3).map((tag) => (
   <span key={tag} className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white/45">
    #{tag}
   </span>
  ))}
 </div>
 </div>

 <div className="mt-auto grid grid-cols-2 gap-3 relative z-10">
  <button 
  onClick={() => {
  setSelectedTemplate(template);
  openCreativeStudio({ mode: 'blueprint', templateId: template.id, productId: selectedProduct?.id ?? null });
  }}
  className="col-span-2 w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] transition-all"
  >
  Use Blueprint
  </button>
  <button
  onClick={() => handleOpenTemplateEditor(template)}
  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all"
  >
  Edit Blueprint
  </button>
  <button
  onClick={() => { void handleDuplicateTemplate(template); }}
  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all"
  >
  Duplicate
  </button>
  <button
  onClick={() => { void handleArchiveTemplate(template); }}
  className="col-span-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/70 uppercase tracking-widest hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 transition-all"
  >
  Archive Blueprint
  </button>
 </div>
 </motion.div>
 ))}
 </div>
 {showArchivedTemplates && (
  <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 md:p-8">
   <div className="flex items-center justify-between gap-4 mb-6">
    <div>
     <h2 className="text-lg font-serif font-bold uppercase tracking-tight text-white">Archived Blueprints</h2>
     <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/35">Preserved in history and restorable into the active template library.</p>
    </div>
    <button
     type="button"
     onClick={() => setShowArchivedTemplates(false)}
     className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/55 transition-all hover:bg-white/10 hover:text-white"
    >
     Hide Archived
    </button>
   </div>

   {archivedMarketingTemplates.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-6 py-10 text-center">
     <p className="text-sm text-white/50">No blueprints are archived right now.</p>
    </div>
   ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {archivedMarketingTemplates.map((template, i) => (
      <motion.div
       key={template.id}
       initial={{ opacity: 0, y: 16 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: i * 0.06 }}
       className="relative overflow-hidden rounded-3xl border border-white/8 bg-black/40 p-6 opacity-90"
      >
       <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
       <div className="w-full aspect-video rounded-2xl border border-white/5 bg-black/50 overflow-hidden mb-5">
        <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover opacity-25 grayscale" referrerPolicy="no-referrer" />
       </div>
       <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full border border-white/10 px-3 py-1 text-[8px] font-mono uppercase tracking-widest text-white/45">{template.type}</span>
        <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[8px] font-mono uppercase tracking-widest text-red-300">Archived</span>
       </div>
       <h3 className="text-lg font-serif font-bold uppercase tracking-tight text-white mb-2">{template.name}</h3>
       <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 leading-relaxed mb-4">{template.blueprint}</p>
       <div className="flex flex-wrap gap-2 mb-5">
        {template.tags.slice(0, 3).map((tag) => (
         <span key={tag} className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white/35">#{tag}</span>
        ))}
       </div>
       <button
        type="button"
        onClick={() => { void handleRestoreTemplate(template); }}
        className="w-full rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88] hover:text-black"
       >
        Restore Blueprint
       </button>
      </motion.div>
     ))}
    </div>
   )}
  </div>
 )}
 </motion.div>
 )}

 <AnimatePresence>
 {isTemplateEditorOpen && (
 <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
  onClick={() => {
   if (!isSavingTemplate) {
    setIsTemplateEditorOpen(false);
   }
  }}
 >
  <motion.div
   initial={{ opacity: 0, y: 20, scale: 0.98 }}
   animate={{ opacity: 1, y: 0, scale: 1 }}
   exit={{ opacity: 0, y: 20, scale: 0.98 }}
   transition={{ duration: 0.22 }}
   onClick={(event) => event.stopPropagation()}
   className="w-full max-w-7xl rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden"
  >
   <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
    <div>
     <p className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">Blueprint Editor</p>
     <h2 className="mt-2 text-3xl font-serif font-bold uppercase tracking-tighter text-white">
      {templateEditorMode === 'create' ? 'Create Blueprint' : 'Edit Blueprint'}
     </h2>
     <p className="mt-2 text-xs text-white/45">Define reusable canvas rules, slot layout, styling, and behavior without leaving the current Templates workflow.</p>
    </div>
    <button
     type="button"
     onClick={() => setIsTemplateEditorOpen(false)}
     className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/40 transition-colors hover:text-white"
    >
     <X size={18} />
    </button>
   </div>

   <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
    <div className="max-h-[78vh] overflow-y-auto border-r border-white/5 p-8 custom-scrollbar space-y-8">
     <section className="space-y-5">
      <div>
       <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Basics</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Blueprint Name</label>
        <input
         type="text"
         value={templateDraft.name}
         onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
         placeholder="e.g. Seasonal Hero Blueprint"
        />
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Status</label>
        <select
         value={templateDraft.status}
         onChange={(event) => setTemplateDraft((current) => ({ ...current, status: event.target.value as MarketingTemplateStatus }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Draft">Draft</option>
         <option value="Active">Active</option>
         <option value="Archived">Archived</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Template Type</label>
        <select
         value={templateDraft.type}
         onChange={(event) => {
          const nextType = event.target.value as MarketingTemplateType;
          setTemplateDraft((current) => ({
           ...current,
           type: nextType,
           blueprintConfig: createDefaultBlueprintConfig(nextType, current.destination),
          }));
         }}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Product Card">Product Card</option>
         <option value="Collection Highlight">Collection Highlight</option>
         <option value="Quote CTA">Quote CTA</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Destination</label>
        <select
         value={templateDraft.destination}
         onChange={(event) => {
          const nextDestination = event.target.value as MarketingTemplateDestination;
          setTemplateDraft((current) => ({
           ...current,
           destination: nextDestination,
           allowedTargets: current.allowedTargets.length > 0 ? Array.from(new Set([nextDestination, ...current.allowedTargets])) : [nextDestination],
           blueprintConfig: createDefaultBlueprintConfig(current.type, nextDestination),
          }));
         }}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         {marketingTemplateDestinationOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
         ))}
        </select>
       </div>
      </div>
      <div className="space-y-2">
       <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Description</label>
       <textarea
        value={templateDraft.description}
        onChange={(event) => setTemplateDraft((current) => ({ ...current, description: event.target.value }))}
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40 resize-none"
        placeholder="What this blueprint is optimized for and where it should be reused."
       />
      </div>
     </section>

     <section className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Canvas</h3>
      <div className="grid grid-cols-3 gap-4">
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Width</label>
        <input
         type="number"
         value={templateDraft.blueprintConfig.canvas.width}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           canvas: {
            ...current.blueprintConfig.canvas,
            width: Number(event.target.value) || 1080,
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        />
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Height</label>
        <input
         type="number"
         value={templateDraft.blueprintConfig.canvas.height}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           canvas: {
            ...current.blueprintConfig.canvas,
            height: Number(event.target.value) || 1080,
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        />
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Aspect Label</label>
        <input
         type="text"
         value={templateDraft.blueprintConfig.canvas.aspectRatio}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           canvas: {
            ...current.blueprintConfig.canvas,
            aspectRatio: event.target.value,
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        />
       </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
       {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
        <div key={edge} className="space-y-2">
         <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{edge} Safe Zone</label>
         <input
          type="number"
          value={templateDraft.blueprintConfig.canvas.safeZone[edge]}
          onChange={(event) => setTemplateDraft((current) => ({
           ...current,
           blueprintConfig: {
            ...current.blueprintConfig,
            canvas: {
             ...current.blueprintConfig.canvas,
             safeZone: {
              ...current.blueprintConfig.canvas.safeZone,
              [edge]: Number(event.target.value) || 0,
             },
            },
           },
          }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
         />
        </div>
       ))}
      </div>
     </section>

     <section className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Style Rules</h3>
      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Typography</label>
        <select
         value={templateDraft.blueprintConfig.style.typographyPreset}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           style: {
            ...current.blueprintConfig.style,
            typographyPreset: event.target.value as MarketingBlueprintConfig['style']['typographyPreset'],
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Serif Display">Serif Display</option>
         <option value="Editorial Contrast">Editorial Contrast</option>
         <option value="Campaign Sans">Campaign Sans</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Overlay</label>
        <select
         value={templateDraft.blueprintConfig.style.overlayMode}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           style: {
            ...current.blueprintConfig.style,
            overlayMode: event.target.value as MarketingBlueprintConfig['style']['overlayMode'],
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Gradient Lift">Gradient Lift</option>
         <option value="Glass Panel">Glass Panel</option>
         <option value="Solid Wash">Solid Wash</option>
         <option value="None">None</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Color Treatment</label>
        <select
         value={templateDraft.blueprintConfig.style.colorTreatment}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           style: {
            ...current.blueprintConfig.style,
            colorTreatment: event.target.value as MarketingBlueprintConfig['style']['colorTreatment'],
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Brand Dark">Brand Dark</option>
         <option value="Seasonal Warm">Seasonal Warm</option>
         <option value="Stone Neutral">Stone Neutral</option>
         <option value="Emerald Promo">Emerald Promo</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Badge Style</label>
        <select
         value={templateDraft.blueprintConfig.style.badgeStyle}
         onChange={(event) => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           style: {
            ...current.blueprintConfig.style,
            badgeStyle: event.target.value as MarketingBlueprintConfig['style']['badgeStyle'],
           },
          },
         }))}
         className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
        >
         <option value="Price Pill">Price Pill</option>
         <option value="Corner Flag">Corner Flag</option>
         <option value="Inline Chip">Inline Chip</option>
         <option value="None">None</option>
        </select>
       </div>
      </div>
     </section>

     <section className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Layout Slots</h3>
      <div className="space-y-4">
       {templateDraft.blueprintConfig.slots.map((slot, index) => (
        <div key={slot.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
         <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] items-end gap-3">
          <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">Slot</label>
           <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <div className="text-xs font-medium text-white">{slot.label}</div>
            <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">{slot.kind}</div>
           </div>
          </div>
          <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">Enabled</label>
           <button
            type="button"
            onClick={() => setTemplateDraft((current) => ({
             ...current,
             blueprintConfig: {
              ...current.blueprintConfig,
              slots: current.blueprintConfig.slots.map((entry, entryIndex) => entryIndex === index ? { ...entry, enabled: !entry.enabled } : entry),
             },
            }))}
            className={`w-full rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${slot.enabled ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/10 bg-black/30 text-white/45'}`}
           >
            {slot.enabled ? 'Enabled' : 'Disabled'}
           </button>
          </div>
          <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">Width %</label>
           <input
            type="number"
            value={slot.widthPct}
            onChange={(event) => setTemplateDraft((current) => ({
             ...current,
             blueprintConfig: {
              ...current.blueprintConfig,
              slots: current.blueprintConfig.slots.map((entry, entryIndex) => entryIndex === index ? { ...entry, widthPct: Number(event.target.value) || 0 } : entry),
             },
            }))}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
           />
          </div>
          <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">Height %</label>
           <input
            type="number"
            value={slot.heightPct}
            onChange={(event) => setTemplateDraft((current) => ({
             ...current,
             blueprintConfig: {
              ...current.blueprintConfig,
              slots: current.blueprintConfig.slots.map((entry, entryIndex) => entryIndex === index ? { ...entry, heightPct: Number(event.target.value) || 0 } : entry),
             },
            }))}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
           />
          </div>
          <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">Lines</label>
           <input
            type="number"
            value={slot.maxLines ?? 1}
            onChange={(event) => setTemplateDraft((current) => ({
             ...current,
             blueprintConfig: {
              ...current.blueprintConfig,
              slots: current.blueprintConfig.slots.map((entry, entryIndex) => entryIndex === index ? { ...entry, maxLines: Number(event.target.value) || 1 } : entry),
             },
            }))}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/40"
           />
          </div>
         </div>
        </div>
       ))}
      </div>
     </section>

     <section className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Behavior and Reuse</h3>
      <div className="grid grid-cols-2 gap-4">
       {[
        ['showPrice', 'Show Price'],
        ['showCta', 'Show CTA'],
        ['showCollectionLabel', 'Show Collection Label'],
        ['showSpecStrip', 'Show Spec Strip'],
       ].map(([field, label]) => (
        <button
         key={field}
         type="button"
         onClick={() => setTemplateDraft((current) => ({
          ...current,
          blueprintConfig: {
           ...current.blueprintConfig,
           behavior: {
            ...current.blueprintConfig.behavior,
            [field]: !current.blueprintConfig.behavior[field as keyof MarketingBlueprintConfig['behavior']],
           },
          },
         }))}
         className={`rounded-2xl border p-4 text-left transition-all ${
          templateDraft.blueprintConfig.behavior[field as keyof MarketingBlueprintConfig['behavior']]
           ? 'border-[#00ff88]/30 bg-[#00ff88]/10'
           : 'border-white/10 bg-white/5'
         }`}
        >
         <div className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</div>
        </button>
       ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
       <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
         <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/35">Tags</h4>
         <div className="flex items-center gap-2">
          <input
           type="text"
           value={templateTagInput}
           onChange={(event) => setTemplateTagInput(event.target.value)}
           placeholder="Add tag"
           className="w-28 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none focus:border-[#00ff88]/40"
          />
          <button type="button" onClick={handleAddTemplateTag} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white">Add</button>
         </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
         {templateDraft.tags.map((tag) => (
          <button key={tag} type="button" onClick={() => setTemplateDraft((current) => ({ ...current, tags: current.tags.filter((entry) => entry !== tag) }))} className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-white/55 hover:border-red-400/30 hover:text-red-300">
           #{tag}
          </button>
         ))}
        </div>
       </div>
       <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
         <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/35">Allowed Targets</h4>
         <div className="flex items-center gap-2">
          <input
           type="text"
           value={allowedTargetInput}
           onChange={(event) => setAllowedTargetInput(event.target.value)}
           placeholder="Add target"
           className="w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none focus:border-[#00ff88]/40"
          />
          <button type="button" onClick={handleAddAllowedTarget} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white">Add</button>
         </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
         {templateDraft.allowedTargets.map((target) => (
          <button key={target} type="button" onClick={() => setTemplateDraft((current) => ({ ...current, allowedTargets: current.allowedTargets.filter((entry) => entry !== target) }))} className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-white/55 hover:border-red-400/30 hover:text-red-300">
           {target}
          </button>
         ))}
        </div>
       </div>
      </div>
      <button
       type="button"
       onClick={() => setTemplateDraft((current) => ({ ...current, publicSurfaceEligible: !current.publicSurfaceEligible }))}
       className={`w-full rounded-2xl border p-4 text-left transition-all ${templateDraft.publicSurfaceEligible ? 'border-[#00ff88]/30 bg-[#00ff88]/10' : 'border-white/10 bg-white/5'}`}
      >
       <div className="text-[10px] font-bold uppercase tracking-widest text-white">Eligible For Public Surface Reuse</div>
       <div className="mt-2 text-xs text-white/45">Marks the blueprint as safe to reuse in approved public-site slots later.</div>
      </button>
     </section>
    </div>

    <div className="max-h-[78vh] overflow-y-auto p-8 custom-scrollbar space-y-6">
     <div>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Blueprint Summary</h3>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-5">
       <div className="text-sm font-medium text-white">{templateDraft.name || 'Untitled Blueprint'}</div>
       <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">{summarizeBlueprintConfig(templateDraft.blueprintConfig, templateDraft.destination)}</div>
      </div>
     </div>
     <div>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Live Preview</h3>
      <div className="mt-3 rounded-3xl border border-white/10 bg-black p-6">
       <div className={`relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#050505] ${templateDraft.blueprintConfig.canvas.aspectRatio === '9:16' ? 'aspect-[9/16]' : templateDraft.blueprintConfig.canvas.aspectRatio === '1200:630' ? 'aspect-[1200/630]' : 'aspect-square'}`}>
        <img src={templateEditorPreviewProduct?.img ?? 'https://picsum.photos/seed/blueprint-preview/800/800'} alt="Blueprint preview" className="h-full w-full object-cover opacity-80" referrerPolicy="no-referrer" />
        <div className={`absolute inset-0 ${
         templateDraft.blueprintConfig.style.overlayMode === 'Glass Panel'
          ? 'bg-black/35 backdrop-blur-[2px]'
          : templateDraft.blueprintConfig.style.overlayMode === 'Solid Wash'
            ? 'bg-black/55'
            : templateDraft.blueprintConfig.style.overlayMode === 'Gradient Lift'
              ? 'bg-gradient-to-t from-black/90 via-black/30 to-transparent'
              : ''
        }`} />
        <div className="absolute inset-0 z-10 flex items-end justify-between p-8">
         <div className="max-w-[68%]">
          {templateDraft.blueprintConfig.slots.some((slot) => slot.kind === 'title' && slot.enabled) ? (
           <h4 className={`uppercase tracking-tighter text-white ${templateDraft.blueprintConfig.style.typographyPreset === 'Campaign Sans' ? 'font-sans text-2xl font-black' : 'font-serif text-3xl font-bold'}`}>
            {templateEditorPreviewProduct?.name ?? 'Preview Product'}
           </h4>
          ) : null}
          {templateDraft.blueprintConfig.slots.some((slot) => slot.kind === 'copy' && slot.enabled) ? (
           <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/60">Deterministic preview copy for this blueprint.</p>
          ) : null}
         </div>
         {templateDraft.blueprintConfig.behavior.showPrice ? (
          <div className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
           templateDraft.blueprintConfig.style.badgeStyle === 'Inline Chip'
            ? 'border border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]'
            : templateDraft.blueprintConfig.style.badgeStyle === 'Corner Flag'
              ? 'bg-amber-300 text-black'
              : 'bg-[#00ff88] text-black'
          }`}>
           R 18.50
          </div>
         ) : null}
        </div>
        {templateDraft.blueprintConfig.behavior.showCta ? (
         <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <button className="rounded-xl bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black">CTA</button>
         </div>
        ) : null}
       </div>
      </div>
     </div>
    </div>
   </div>

   <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-8 py-5">
    <button
     type="button"
     onClick={() => setIsTemplateEditorOpen(false)}
     className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white"
    >
     Cancel
    </button>
    <div className="flex items-center gap-3">
     <button
      type="button"
      onClick={() => {
       setSelectedTemplate({
        id: templateDraft.id ?? 'draft-template',
        name: templateDraft.name || 'Untitled Blueprint',
        description: templateDraft.description,
        type: templateDraft.type,
        thumbnail: templateDraft.thumbnail,
        blueprint: summarizeBlueprintConfig(templateDraft.blueprintConfig, templateDraft.destination),
        status: templateDraft.status,
        destination: templateDraft.destination,
        tags: templateDraft.tags,
        publicSurfaceEligible: templateDraft.publicSurfaceEligible,
        allowedTargets: templateDraft.allowedTargets,
       blueprintConfig: templateDraft.blueprintConfig,
       });
       setIsTemplateEditorOpen(false);
       openCreativeStudio({
        mode: 'blueprint',
        templateId: templateDraft.id ?? null,
        productId: templateEditorPreviewProduct?.id ?? null,
       });
      }}
      className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
     >
      Preview In Generator
     </button>
     <button
      type="button"
      onClick={() => { void handleSaveTemplate(); }}
      disabled={isSavingTemplate}
      className="px-8 py-3 rounded-xl bg-[#00ff88] text-[10px] font-bold uppercase tracking-widest text-black hover:bg-[#00cc6e] transition-all disabled:opacity-50"
     >
      {isSavingTemplate ? 'Saving...' : templateEditorMode === 'create' ? 'Create Blueprint' : 'Save Blueprint'}
     </button>
    </div>
   </div>
  </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {activeMarketingSubModule === 'CreativeGenerator' && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
  <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.12),transparent_34%),linear-gradient(135deg,#101010_0%,#060606_60%,#0d0d0d_100%)] p-10 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.85)]">
   <p className="text-[10px] font-mono uppercase tracking-[0.34em] text-[#00ff88]">Dedicated Studio Route</p>
   <h2 className="mt-5 text-4xl font-serif font-bold uppercase tracking-tight text-white">Creative Studio Opens Outside The Portal</h2>
   <p className="mt-5 max-w-2xl text-sm leading-8 text-white/56">
    The embedded generator has been retired so the canvas can live in a larger first-screen workspace with route-backed state, protected originals, and managed derivatives that stay linked to Asset Lab.
   </p>
   <div className="mt-8 flex flex-wrap gap-4">
    <button
     type="button"
     onClick={() => openCreativeStudio({ mode: creativeSeedMode ?? 'blueprint' })}
     className="inline-flex items-center gap-3 rounded-2xl bg-[#00ff88] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.35em] text-black transition-all hover:bg-[#00d876]"
    >
     <Wand2 size={16} />
     Open Creative Studio
    </button>
    <button
     type="button"
     onClick={() => setActiveMarketingSubModule('Dashboard')}
     className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
    >
     <ArrowLeft size={16} />
     Back To Dashboard
    </button>
   </div>
  </div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'Publishing' && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Publishing</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Runtime Monitor & Job Execution Status</p>
 </div>
 <button 
 onClick={() => {
 void handleRefreshPublishingQueue();
 }}
 className={`flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all ${isRefreshingQueue ? 'opacity-50 cursor-not-allowed' : ''}`}
 >
 <RefreshCw size={14} className={isRefreshingQueue ? 'animate-spin' : ''} />
 {isRefreshingQueue ? 'Refreshing...' : 'Refresh Status'}
 </button>
 </header>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
 {[
 { label: 'Total Jobs', value: publishingJobs.length, icon: Activity, color: 'text-white', filter: 'All' as const },
 { label: 'Publishing', value: publishingJobs.filter(j => j.status === 'Publishing' || j.status === 'Retrying' || j.status === 'Queued').length, icon: Zap, color: 'text-blue-400', filter: 'Active' as const },
 { label: 'Failed', value: publishingJobs.filter(j => j.status === 'Failed').length, icon: AlertCircle, color: 'text-red-400', filter: 'Failed' as const },
 { label: 'Completed', value: publishingJobs.filter(j => j.status === 'Published').length, icon: CheckCircle2, color: 'text-[#00ff88]', filter: 'Published' as const },
].map((stat, i) => (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 onClick={() => setPublishingStatusFilter(stat.filter)}
 className={`bg-[#111] border rounded-xl p-8 space-y-6 relative overflow-hidden group hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 shadow-xl cursor-pointer ${
  publishingStatusFilter === stat.filter ? 'border-[#00ff88]/30' : 'border-white/10'
 }`}
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className={`p-3 rounded-xl bg-black border border-white/5 shadow-inner ${stat.color}`}>
 <stat.icon size={24} />
 </div>
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
 <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Live Monitor</span>
 </div>
 </div>
 <div>
 <p className="text-4xl font-serif font-bold text-white tracking-tighter mb-1 group-hover:scale-105 group-hover:text-[#00ff88] transition-all origin-left duration-500">{stat.value}</p>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</p>
 </div>
 </div>
 </motion.div>
 ))}
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/25">Filters</span>
 <button
  onClick={() => {
   setPublishingStatusFilter('All');
   setPublishingChannelFilter('All');
  }}
  className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-[0.22em] transition-colors ${
   publishingStatusFilter === 'All' && publishingChannelFilter === 'All'
    ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]'
    : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white'
  }`}
 >
  All
 </button>
 {publishingStatusFilter !== 'All' && (
  <span className="px-3 py-1.5 rounded-lg border border-blue-400/20 bg-blue-500/10 text-[9px] font-mono uppercase tracking-[0.22em] text-blue-300">
   Status: {publishingStatusFilter}
  </span>
 )}
 {publishingChannelFilter !== 'All' && (
  <span className="px-3 py-1.5 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/10 text-[9px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">
   Channel: {publishingChannelFilter}
  </span>
 )}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Job Table */}
 <div className="lg:col-span-3 space-y-8">
 <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl hover:border-[#00ff88]/20 transition-all duration-500">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-white/10 bg-white/5">
 <th className="px-10 py-8 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Job ID</th>
 <th className="px-10 py-8 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Creative / Channel</th>
 <th className="px-10 py-8 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Status / Progress</th>
 <th className="px-10 py-8 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] text-right">Timestamp</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {filteredPublishingJobs.map((job, i) => {
 const linkedPost = job.postId ? scheduledPosts.find((post) => post.id === job.postId) ?? null : null;
 const hasLinkedAsset = Boolean(job.assetId ?? linkedPost?.assetId);
 return (
 <motion.tr 
 key={job.id} 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.05 }}
 className="hover:bg-white/[0.02] transition-colors group relative cursor-pointer"
 onClick={() => openPublishingJobSource(job)}
 >
 <td className="px-10 py-8">
 <span className="text-xs font-mono text-white/40 group-hover:text-[#00ff88] transition-colors">{job.id}</span>
 </td>
 <td className="px-10 py-8">
 <div className="space-y-1.5">
 <p className="text-sm font-serif font-bold text-white uppercase tracking-tight group-hover:text-[#00ff88] transition-colors">{job.creativeName}</p>
 <div className="flex items-center gap-2">
 <p className="text-[10px] font-mono text-[#00ff88]/60 uppercase tracking-widest">{job.channel}</p>
 {job.campaignId && (
 <>
 <span className="text-white/20">•</span>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
 <Megaphone size={10} /> {marketingCampaigns.find(c => c.id === job.campaignId)?.name}
 </p>
 </>
 )}
 {job.workflowNode && (
 <>
 <span className="text-white/20">•</span>
 <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1">
 <Activity size={10} /> {job.workflowNode}
 </p>
  </>
 )}
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
  onClick={(event) => {
   event.stopPropagation();
   openPublishingJobSource(job);
  }}
  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/65 hover:text-white hover:border-[#00ff88]/30 transition-colors"
 >
  <ExternalLink size={10} /> Source
 </button>
 {job.postId && (
  <button
   onClick={(event) => {
    event.stopPropagation();
    openPublishingJobCalendar(job);
   }}
   className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/65 hover:text-white hover:border-[#00ff88]/30 transition-colors"
  >
   <Calendar size={10} /> Calendar
  </button>
 )}
 {hasLinkedAsset && (
  <button
   onClick={(event) => {
    event.stopPropagation();
    openPublishingJobAsset(job);
   }}
   className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/65 hover:text-white hover:border-[#00ff88]/30 transition-colors"
  >
   <Image size={10} /> Asset
  </button>
 )}
 {job.campaignId && (
  <button
   onClick={(event) => {
    event.stopPropagation();
    openPublishingJobAnalytics(job);
   }}
   className="inline-flex items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-purple-300 hover:text-white transition-colors"
  >
   <BarChart3 size={10} /> Analytics
  </button>
 )}
 </div>
 </div>
 </td>
 <td className="px-10 py-8">
 <div className="flex items-center gap-6">
 <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border whitespace-nowrap shadow-sm ${
 job.status === 'Published' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
 job.status === 'Publishing' ? 'bg-blue-500/10 text-blue-400 border-blue-400/20 animate-pulse' :
 job.status === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
 job.status === 'Retrying' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
 'bg-white/5 text-white/40 border-white/10'
 }`}>
 {job.status}
 </span>
 {(job.status === 'Publishing' || job.status === 'Retrying') && (
 <div className="w-40 h-1.5 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${job.progress}%` }}
 transition={{ type: 'spring', damping: 20, delay: 0.5 + (i * 0.05) }}
 className={`h-full ${job.status === 'Retrying' ? 'bg-yellow-400' : 'bg-blue-400'} shadow-[0_0_10px_currentColor]`}
 />
 </div>
 )}
 {job.status === 'Failed' && (
 <span className="text-[9px] font-mono text-red-400/60 uppercase tracking-widest">{job.error}</span>
 )}
 </div>
 </td>
 <td className="px-10 py-8 text-right">
 <span className="text-xs font-mono text-white/40">{job.timestamp}</span>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>
 {filteredPublishingJobs.length === 0 && (
  <div className="px-10 py-16 text-center">
   <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/25">No publishing jobs match the active filters.</p>
  </div>
 )}
 </div>
 </div>

 {/* Channel Health */}
 <div className="space-y-6">
 <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
 <div className="flex items-center justify-between">
 <h3 className="text-xs font-bold uppercase tracking-widest text-white">Channel Health</h3>
 <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
 </div>
 
 <div className="space-y-6">
 {channelHealth.map((channel) => (
 <button
 key={channel.name}
 onClick={() => setPublishingChannelFilter((current) => current === channel.name ? 'All' : channel.name)}
 className={`w-full text-left space-y-3 rounded-xl p-2 -mx-2 transition-colors ${
  publishingChannelFilter === channel.name ? 'bg-[#00ff88]/6' : 'hover:bg-white/[0.03]'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono text-white uppercase tracking-widest">{channel.name}</span>
 <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
 channel.status === 'Healthy' ? 'text-[#00ff88] bg-[#00ff88]/10' :
 channel.status === 'Degraded' ? 'text-yellow-400 bg-yellow-400/10' :
 'text-red-400 bg-red-400/10'
 }`}>
 {channel.status}
 </span>
 </div>
 <div className="flex items-center justify-between text-[8px] font-mono text-white/20 uppercase tracking-tighter">
 <span>LATENCY: {channel.latency}</span>
 <span>UPTIME: {channel.uptime}</span>
 </div>
 <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
 <div className={`h-full ${
 channel.status === 'Healthy' ? 'bg-[#00ff88]' :
 channel.status === 'Degraded' ? 'bg-yellow-400' :
 'bg-red-400'
 } w-full opacity-30`} />
 </div>
 </button>
 ))}
 </div>

 <div className="pt-6 border-t border-white/5">
 <div className="p-4 bg-white/5 rounded-xl space-y-2">
 <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">System Load</p>
 <div className="flex items-end gap-1 h-8">
 {Array.from({ length: 12 }).map((_, i) => (
 <div key={`sys-load-${i}`} className="flex-1 bg-[#00ff88]/20 rounded-t-sm" style={{ height: `${30 + Math.random() * 70}%` }} />
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'Campaigns' && (
 <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Campaigns</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Multi-Channel Orchestration & Lifecycle Management</p>
 </div>
 <button 
 onClick={() => {
 setWizardStep(1);
 setIsWizardOpen(true);
 }}
 className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all"
 >
 Create Campaign
 </button>
 </header>

 <div className="grid grid-cols-1 gap-6">
 {marketingCampaigns.map((camp, i) => {
 const isExpanded = expandedCampaignId === camp.id;
 const campPosts = scheduledPosts.filter(p => p.campaignId === camp.id);
 const campJobs = publishingJobs.filter(j => j.campaignId === camp.id);
 
 return (
 <motion.div 
 key={camp.id} 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 className={`bg-[#111] border ${isExpanded ? 'border-[#00ff88]/50 shadow-[0_0_40px_rgba(0,255,136,0.1)]' : 'border-white/10 hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)]'} rounded-xl p-8 transition-all duration-300 group relative overflow-hidden cursor-pointer`}
 onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
 >
 <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
 <div className="absolute top-0 right-0 p-6 z-10">
 <span className={`text-[8px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border shadow-lg ${
 camp.status === 'Active' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
 camp.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
 'bg-white/5 text-white/40 border-white/10'
 }`}>
 {camp.status}
 </span>
 </div>

 <div className="flex flex-col lg:flex-row items-center gap-8">
 <div className="w-20 h-20 rounded-3xl bg-black border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#00ff88] transition-colors relative z-10 shadow-inner">
 <Megaphone size={32} />
 <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#00ff88] text-black flex items-center justify-center text-[10px] font-bold border-4 border-[#111] shadow-lg">
 {camp.linkedAssetIds.length}
 </div>
 </div>

 <div className="flex-1 space-y-4 text-center lg:text-left relative z-10">
 <div>
 <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter group-hover:text-[#00ff88] transition-colors">{camp.name}</h3>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{camp.description}</p>
 </div>
 <div className="flex flex-wrap justify-center lg:justify-start gap-2 items-center">
 {camp.channels.map(c => (
 <span key={c} className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-[8px] font-mono text-white/60 uppercase tracking-widest shadow-sm">{c}</span>
 ))}
 {camp.workflowNode && (
 <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[8px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1 shadow-sm">
 <Activity size={10} /> {camp.workflowNode}
 </span>
 )}
 </div>
 <div className="flex flex-wrap justify-center lg:justify-start gap-3">
 <button
 onClick={(e) => {
  e.stopPropagation();
  openCreativeStudio({
   mode: 'blueprint',
   campaignId: camp.id,
   productId: camp.productIds?.[0] ?? selectedProduct?.id ?? null,
   assetId: camp.linkedAssetIds?.[0] ?? null,
  });
 }}
 className="px-4 py-2 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88] text-[10px] font-bold uppercase tracking-widest hover:border-[#00ff88]/35 transition-all"
 >
 Open In Creative Studio
 </button>
 <button
 onClick={(e) => {
  e.stopPropagation();
  setSelectedAsset(camp.linkedAssetIds?.[0] ? marketingAssets.find((asset) => asset.id === camp.linkedAssetIds?.[0]) ?? null : null);
  setActiveMarketingSubModule('AssetLab');
 }}
 className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/70 text-[10px] font-bold uppercase tracking-widest hover:border-white/20 hover:text-white transition-all"
 >
 View Linked Assets
 </button>
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-12 relative z-10">
 <div className="space-y-1">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Owner</p>
 <p className="text-xs font-bold text-white uppercase">{camp.owner}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Timeline</p>
 <p className="text-xs font-bold text-white uppercase">{camp.startDate} — {camp.endDate}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Budget</p>
 <p className="text-xs font-bold text-[#00ff88] uppercase">{camp.budget}</p>
 </div>
 </div>

 <button className={`p-4 rounded-xl transition-all relative z-10 ${isExpanded ? 'bg-[#00ff88] text-black' : 'bg-white/5 text-white/20 hover:text-white hover:bg-[#00ff88] hover:text-black'}`}>
 <ChevronRight size={24} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
 </button>
 </div>

 {/* Expanded Lifecycle View */}
 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mt-8 pt-8 border-t border-white/10 relative z-10"
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Scheduled Posts */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
 <Calendar size={12} /> Scheduled Posts ({campPosts.length})
 </h4>
 <button 
 onClick={(e) => { e.stopPropagation(); setActiveMarketingSubModule('Calendar'); }}
 className="text-[10px] font-bold text-[#00ff88] uppercase hover:underline"
 >
 View Calendar
 </button>
 </div>
 <div className="space-y-2">
 {campPosts.length === 0 ? (
 <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">No posts scheduled</p>
 </div>
 ) : (
 campPosts.map(post => (
 <div key={post.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-2 h-2 rounded-full ${post.status === 'Published' ? 'bg-[#00ff88]' : post.status === 'Scheduled' ? 'bg-blue-400' : 'bg-white/20'}`} />
 <div>
 <p className="text-[10px] font-bold text-white uppercase">{post.title}</p>
 <p className="text-[8px] font-mono text-white/40">{post.date} @ {post.time} • {post.channel}</p>
 </div>
 </div>
 <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{post.status}</span>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Publishing Jobs */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
 <Activity size={12} /> Publishing Queue ({campJobs.length})
 </h4>
 <button 
 onClick={(e) => { e.stopPropagation(); setActiveMarketingSubModule('Publishing'); }}
 className="text-[10px] font-bold text-[#00ff88] uppercase hover:underline"
 >
 View Monitor
 </button>
 </div>
 <div className="space-y-2">
 {campJobs.length === 0 ? (
 <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">No active jobs</p>
 </div>
 ) : (
 campJobs.map(job => (
 <div key={job.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
 <div className="flex items-center gap-3">
 {job.status === 'Published' ? <CheckCircle2 size={14} className="text-[#00ff88]" /> :
 job.status === 'Failed' ? <AlertCircle size={14} className="text-red-400" /> :
 <RefreshCw size={14} className="text-blue-400 animate-spin" />}
 <div>
 <p className="text-[10px] font-bold text-white uppercase">{job.creativeName}</p>
 <p className="text-[8px] font-mono text-white/40">{job.channel} • {job.timestamp}</p>
 </div>
 </div>
 <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{job.status}</span>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </div>

 {/* Campaign Creation Wizard Modal */}
 <AnimatePresence>
 {isWizardOpen && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl"
 >
 <motion.div 
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 20 }}
 className="w-full max-w-5xl bg-[#121212] border border-white/10 rounded-[48px] overflow-hidden flex flex-col h-[80vh]"
 >
 {/* Wizard Header */}
 <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
 <div className="flex items-center gap-6">
 <div className="w-12 h-12 rounded-xl bg-[#00ff88] text-black flex items-center justify-center">
 <Plus size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter">New Campaign Wizard</h2>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Step {wizardStep} of 5 — {
 wizardStep === 1 ? 'Core Details' :
 wizardStep === 2 ? 'Product Selection' :
 wizardStep === 3 ? 'Channel Mapping' :
 wizardStep === 4 ? 'Creative Assets' :
 'Final Review'
 }</p>
 </div>
 </div>
 <button 
 onClick={() => setIsWizardOpen(false)}
 className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
 >
 <X size={20} />
 </button>
 </div>

 {/* Wizard Steps Progress */}
 <div className="px-10 py-6 bg-black/40 border-b border-white/5 flex items-center justify-between gap-4">
 {[1, 2, 3, 4, 5].map((step) => (
 <div key={step} className="flex-1 flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
 wizardStep >= step ? 'bg-[#00ff88] text-black' : 'bg-white/5 text-white/20 border border-white/10'
 }`}>
 {step}
 </div>
 <div className={`flex-1 h-1 rounded-full transition-all ${
 wizardStep > step ? 'bg-[#00ff88]' : 'bg-white/5'
 }`} />
 </div>
 ))}
 </div>

 {/* Wizard Content */}
 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
 {wizardStep === 1 && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl mx-auto">
 <div className="space-y-4">
 <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Campaign Name</label>
 <input 
 type="text"
 value={newCampaign.name}
 onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-xl font-serif font-bold text-white focus:border-[#00ff88] transition-all outline-none"
 placeholder="e.g. SUMMER_SOLSTICE_2024"
 />
 </div>
 <div className="space-y-4">
 <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
 <textarea 
 value={newCampaign.description}
 onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-sm font-mono text-white/60 focus:border-[#00ff88] transition-all outline-none h-32 resize-none"
 placeholder="Describe the campaign objectives..."
 />
 </div>
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-4">
 <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Start Date</label>
 <input 
 type="date"
 value={newCampaign.startDate}
 onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-xs font-mono text-white focus:border-[#00ff88] transition-all outline-none"
 />
 </div>
 <div className="space-y-4">
 <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">End Date</label>
 <input 
 type="date"
 value={newCampaign.endDate}
 onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-xs font-mono text-white focus:border-[#00ff88] transition-all outline-none"
 />
 </div>
 </div>
 </motion.div>
 )}

 {wizardStep === 2 && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
 {inventoryPortal.products.map((product) => (
 <button 
 key={product.id}
 onClick={() => {
 const current = newCampaign.productIds || [];
 const next = current.includes(product.id) 
 ? current.filter(id => id !== product.id)
 : [...current, product.id];
 setNewCampaign({...newCampaign, productIds: next});
 }}
 className={`p-6 rounded-3xl border transition-all text-left space-y-4 ${
 newCampaign.productIds?.includes(product.id) 
 ? 'bg-[#00ff88]/10 border-[#00ff88] ring-1 ring-[#00ff88]' 
 : 'bg-white/5 border-white/10 hover:border-white/20'
 }`}
 >
 <div className="aspect-square rounded-xl overflow-hidden bg-black">
 <img src={product.img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 </div>
 <div>
 <p className="text-[10px] font-bold text-white uppercase truncate">{product.name}</p>
 <p className="text-[8px] font-mono text-white/30 uppercase">{product.category}</p>
 </div>
 </button>
 ))}
 </div>
 </motion.div>
 )}

 {wizardStep === 3 && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl mx-auto">
 <div className="grid grid-cols-2 gap-4">
	 {(['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp', 'Pinterest'] as MarketingChannel[]).map((channel) => (
 <button 
 key={channel}
 onClick={() => {
 const current = newCampaign.channels || [];
 const next = current.includes(channel) 
 ? current.filter(c => c !== channel)
 : [...current, channel];
 setNewCampaign({...newCampaign, channels: next});
 }}
 className={`p-6 rounded-xl border transition-all flex items-center justify-between ${
 newCampaign.channels?.includes(channel) 
 ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' 
 : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
 }`}
 >
 <span className="text-xs font-bold uppercase tracking-widest">{channel}</span>
 {newCampaign.channels?.includes(channel) && <Check size={16} />}
 </button>
 ))}
 </div>
 </motion.div>
 )}

 {wizardStep === 4 && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
 {marketingAssets.map((asset) => (
 <button 
 key={asset.id}
 onClick={() => {
 const current = newCampaign.linkedAssetIds || [];
 const next = current.includes(asset.id) 
 ? current.filter(id => id !== asset.id)
 : [...current, asset.id];
 setNewCampaign({...newCampaign, linkedAssetIds: next});
 }}
 className={`p-4 rounded-3xl border transition-all text-left space-y-4 ${
 newCampaign.linkedAssetIds?.includes(asset.id) 
 ? 'bg-[#00ff88]/10 border-[#00ff88] ring-1 ring-[#00ff88]' 
 : 'bg-white/5 border-white/10 hover:border-white/20'
 }`}
 >
 <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
 <img src={asset.img} alt={asset.name} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
 <div className="absolute top-2 right-2">
 <span className="text-[8px] font-mono bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-white/60 uppercase">{asset.type}</span>
 </div>
 </div>
 <div>
 <p className="text-[10px] font-bold text-white uppercase truncate">{asset.name}</p>
 <p className="text-[8px] font-mono text-white/30 uppercase">{asset.id}</p>
 </div>
 </button>
 ))}
 </div>
 <div className="flex justify-center">
 <button
 type="button"
 onClick={() => setWizardStep(5)}
 className="px-8 py-4 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88] text-[10px] font-bold uppercase tracking-widest hover:border-[#00ff88]/35 transition-all"
 >
 Review And Launch Into Creative Studio
 </button>
 </div>
 </motion.div>
 )}

 {wizardStep === 5 && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-3xl mx-auto">
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-8">
 <div className="space-y-2">
 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Campaign Identity</p>
 <h4 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">{newCampaign.name || 'Untitled Campaign'}</h4>
 <p className="text-sm font-mono text-white/40">{newCampaign.description || 'No description provided.'}</p>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="p-4 bg-white/2 border border-white/5 rounded-xl">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Start</p>
 <p className="text-xs font-bold text-white uppercase">{newCampaign.startDate || 'Not set'}</p>
 </div>
 <div className="p-4 bg-white/2 border border-white/5 rounded-xl">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">End</p>
 <p className="text-xs font-bold text-white uppercase">{newCampaign.endDate || 'Not set'}</p>
 </div>
 </div>
 </div>
 <div className="space-y-8">
 <div className="space-y-4">
 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Target Channels</p>
 <div className="flex flex-wrap gap-2">
 {newCampaign.channels?.map(c => (
 <span key={c} className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg text-[8px] font-mono text-[#00ff88] uppercase tracking-widest">{c}</span>
 ))}
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Linked Resources</p>
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Box size={16} className="text-white/40" />
 <span className="text-xs font-bold text-white">{newCampaign.productIds?.length || 0} Products</span>
 </div>
 <div className="flex items-center gap-2">
 <Image size={16} className="text-white/40" />
 <span className="text-xs font-bold text-white">{newCampaign.linkedAssetIds?.length || 0} Assets</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </div>

 {/* Wizard Footer */}
 <div className="p-8 border-t border-white/5 bg-white/2 flex items-center justify-between">
 <button 
 onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
 disabled={wizardStep === 1}
 className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20"
 >
 Previous Step
 </button>
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setIsWizardOpen(false)}
 className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-all"
 >
 Cancel
 </button>
 {wizardStep < 5 ? (
 <button 
 onClick={() => setWizardStep(prev => Math.min(5, prev + 1))}
 className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all"
 >
 Next Step
 </button>
 ) : (
 <div className="flex items-center gap-4">
 <button 
 onClick={() => { void handleCreateCampaign(); }}
 className="px-10 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all"
 >
 Launch Campaign
 </button>
 <button 
 onClick={() => { void handleCreateCampaign({ openStudio: true }); }}
 className="px-10 py-4 border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88] font-bold rounded-xl text-[10px] uppercase tracking-widest hover:border-[#00ff88]/35 transition-all"
 >
 Launch + Open Creative Studio
 </button>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 )}

 {activeMarketingSubModule === 'Calendar' && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Calendar</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Temporal Planning & Publishing Schedule</p>
 <div className="mt-3 flex items-center gap-3">
 <span className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[9px] font-mono text-white/55 uppercase tracking-[0.22em]">
 {calendarTitle}
 </span>
 <span className="text-[9px] font-mono text-white/25 uppercase tracking-[0.22em]">
 {calendarView === 'Week' ? calendarWeekRangeLabel : 'MONTH GRID'}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
 {['Week', 'Month'].map((view) => (
 <button
 key={view}
 onClick={() => setCalendarView(view as 'Week' | 'Month')}
 className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
 calendarView === view ? 'bg-[#00ff88] text-black' : 'text-white/40 hover:text-white'
 }`}
 >
 {view}
 </button>
 ))}
 </div>
 <button
 onClick={() => {
  const seededCampaign = marketingCampaigns.find((campaign) => campaign.status === 'Active' || campaign.status === 'Scheduled') ?? marketingCampaigns[0] ?? null;
  openCalendarEntryWizard({
   entryType: 'Reminder',
   campaignId: seededCampaign?.id ?? null,
   assetId: seededCampaign?.linkedAssetIds?.[0] ?? null,
   scheduledFor: buildQuickScheduleTimestamp(calendarAnchorDate).slice(0, 16),
  });
 }}
 className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2"
 >
 <Plus size={16} /> New Entry
 </button>
 </div>
 </header>

 {calendarView === 'Month' ? (
 <div className="grid grid-cols-7 gap-4">
 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
 <div key={day} className="text-center text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">{day}</div>
 ))}
 {calendarMonthCells.map((cell, i) => {
  const posts = scheduledPosts.filter(p => p.date === cell.dateStr);
 
  return (
 <div key={`calendar-slot-${cell.dateStr}`} className={`min-h-[156px] bg-white/5 border border-white/10 rounded-2xl p-3 hover:border-[#00ff88]/20 transition-all relative group ${!cell.isCurrentMonth ? 'opacity-20 grayscale' : ''} ${cell.isToday ? 'ring-1 ring-[#00ff88]/30' : ''}`}>
 <span className={`text-[10px] font-mono ${cell.isToday ? 'text-[#00ff88]' : 'text-white/20'}`}>{cell.dayLabel}</span>
 <div className="mt-2 space-y-2">
 {posts.map(post => {
  const camp = marketingCampaigns.find(c => c.id === post.campaignId);
  const hasJob = (publishingJobsByPostId.get(post.id) ?? []).length > 0;
  return (
 <div
 key={post.id}
 id={`calendar-entry-${post.id}`}
 onClick={() => openCalendarEntrySource(post)}
 className={`p-2.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl group/post cursor-pointer hover:bg-[#00ff88]/18 hover:border-[#00ff88]/35 transition-all ${
 highlightedCalendarEntryId === post.id ? 'ring-2 ring-[#00ff88] shadow-[0_0_0_1px_rgba(0,255,136,0.35),0_18px_40px_-24px_rgba(0,255,136,0.55)]' : ''
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-[8px] font-bold text-[#00ff88] uppercase truncate">{post.entryType === 'Post' ? (post.channel ?? 'Post') : post.entryType}</span>
 <span className="text-[8px] font-mono text-white/40">{post.time}</span>
 </div>
 <p className="text-[10px] font-bold text-white uppercase leading-tight" style={clampTwoLineStyle}>{post.title}</p>
 {camp && (
 <p className="text-[8px] font-mono text-white/30 uppercase mt-1 flex items-center gap-1" style={clampTwoLineStyle}>
 <Megaphone size={8} /> {camp.name}
 </p>
 )}
 {post.workflowNode && (
 <p className="text-[8px] font-mono text-purple-400 uppercase mt-1 flex items-center gap-1" style={clampTwoLineStyle}>
 <Activity size={8} /> {post.workflowNode}
 </p>
 )}
 <div className="mt-2 flex flex-wrap gap-1.5">
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntrySource(post);
 }}
 className="px-1.5 py-1 rounded-md border border-white/10 bg-black/20 text-[7px] font-mono uppercase tracking-widest text-white/60 hover:text-white hover:border-[#00ff88]/30 transition-colors"
 >
 Source
 </button>
 {post.entryType === 'Post' && (
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryPublishing(post);
 }}
 className={`px-1.5 py-1 rounded-md border text-[7px] font-mono uppercase tracking-widest transition-colors ${
 hasJob
 ? 'border-blue-400/20 bg-blue-500/10 text-blue-300 hover:text-white'
 : 'border-white/10 bg-black/20 text-white/40 hover:text-white'
 }`}
 >
 Queue
 </button>
 )}
 {post.entryType === 'Post' && post.campaignId && (
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryAnalytics(post);
 }}
 className="px-1.5 py-1 rounded-md border border-purple-400/20 bg-purple-500/10 text-[7px] font-mono uppercase tracking-widest text-purple-300 hover:text-white transition-colors"
 >
 Analytics
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 {cell.isCurrentMonth && (
 <button onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryWizard({
  entryType: 'Reminder',
  scheduledFor: `${cell.dateStr}T09:00`,
 });
 }} className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#00ff88] hover:text-black transition-all">
 <Plus size={14} />
 </button>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="overflow-x-auto pb-2">
 <div className="grid min-w-[1360px] grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4">
 {calendarWeekDates.map((day) => {
  const posts = scheduledPosts.filter(p => p.date === day.dateStr);
  const isToday = day.isToday;

  return (
 <div key={day.dateStr} className="space-y-4">
 <div className="text-center space-y-2">
 <p className={`text-[10px] font-mono uppercase tracking-widest ${isToday ? 'text-[#00ff88]' : 'text-white/30'}`}>{day.weekdayLabel}</p>
 <p className={`text-3xl font-serif font-bold ${isToday ? 'text-[#00ff88]' : 'text-white'}`}>{day.dayLabel}</p>
 {isToday && <div className="w-1 h-1 bg-[#00ff88] rounded-full mx-auto" />}
 </div>
 
 <div className="space-y-3 min-h-[560px] bg-white/[0.02] border border-white/5 rounded-[22px] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
 {posts.map(post => {
 const linkedCampaign = marketingStudio.campaignsById[post.campaignId ?? ''] ?? marketingCampaigns.find((campaign) => campaign.id === post.campaignId) ?? null;
 const linkedAsset = findMarketingAssetById(post.assetId);
 const linkedJobs = publishingJobsByPostId.get(post.id) ?? [];
 const primaryJob = linkedJobs[0] ?? null;

 return (
 <div
 key={post.id}
 id={`calendar-entry-${post.id}`}
 onClick={() => openCalendarEntrySource(post)}
 className={`bg-white/[0.05] border border-white/10 rounded-[18px] p-4 space-y-3 hover:border-[#00ff88]/40 hover:bg-white/[0.06] transition-all group cursor-pointer ${
 highlightedCalendarEntryId === post.id ? 'ring-2 ring-[#00ff88] shadow-[0_0_0_1px_rgba(0,255,136,0.35),0_18px_40px_-24px_rgba(0,255,136,0.55)]' : ''
 }`}
 >
 <div className="flex items-center justify-between">
 <span className={`text-[7px] font-mono uppercase tracking-[0.24em] px-2 py-1 rounded whitespace-nowrap ${
 post.status === 'Published' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
 post.status === 'Draft' ? 'bg-white/10 text-white/40' :
 'bg-blue-500/10 text-blue-400'
 }`}>
 {post.status}
 </span>
 <span className="text-[9px] font-mono text-white/40">{post.time}</span>
 </div>
 
 <div className="space-y-1.5">
 <p className="text-[8px] font-mono text-[#00ff88] uppercase tracking-[0.22em]">{post.entryType === 'Post' ? (post.channel ?? 'Post') : post.entryType}</p>
 <h4 className="text-[13px] font-bold text-white uppercase leading-tight" style={clampThreeLineStyle}>{post.title}</h4>
 {linkedCampaign && (
 <p className="text-[8px] font-mono text-white/35 uppercase tracking-[0.2em] flex items-center gap-1" style={clampTwoLineStyle}>
 <Megaphone size={9} /> {linkedCampaign.name}
 </p>
 )}
 {post.workflowNode && (
 <p className="text-[8px] font-mono text-purple-400 uppercase flex items-center gap-1" style={clampTwoLineStyle}>
 <Activity size={10} /> {post.workflowNode}
 </p>
 )}
 {post.entryType === 'Post' && primaryJob && (
 <p className="text-[8px] font-mono text-blue-300 uppercase tracking-[0.2em] flex items-center gap-1">
 <ListOrdered size={10} /> {primaryJob.status}
 </p>
 )}
 </div>

 {linkedAsset && (
 <div className="h-16 rounded-xl overflow-hidden bg-black border border-white/5">
 <img src={linkedAsset.img ?? `https://picsum.photos/seed/${post.id}/400/225`} alt="Preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
 </div>
 )}

 <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntrySource(post);
 }}
 className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-[#00ff88]/30 transition-colors"
 >
 <ExternalLink size={10} /> Source
 </button>
 {linkedAsset && (
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryAsset(post);
 }}
 className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-[#00ff88]/30 transition-colors"
 >
 <Image size={10} /> Asset
 </button>
 )}
 {post.entryType === 'Post' && (
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryPublishing(post);
 }}
 className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] transition-colors ${
 primaryJob
 ? 'border-blue-400/20 bg-blue-500/10 text-blue-300 hover:text-white'
 : 'border-white/10 bg-black/20 text-white/50 hover:text-white'
 }`}
 >
 <ListOrdered size={10} /> Queue
 </button>
 )}
 {post.entryType === 'Post' && post.campaignId && (
 <button
 onClick={(event) => {
 event.stopPropagation();
 openCalendarEntryAnalytics(post);
 }}
 className="inline-flex items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-500/10 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-purple-300 hover:text-white transition-colors"
 >
 <BarChart3 size={10} /> Analytics
 </button>
 )}
 </div>
 </div>
 );
 })}
 <button onClick={() => {
 openCalendarEntryWizard({
  entryType: 'Reminder',
  scheduledFor: `${day.dateStr}T09:00`,
 });
 }} className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[10px] font-mono text-white/20 uppercase tracking-widest hover:border-[#00ff88]/20 hover:text-[#00ff88]/50 transition-all flex items-center justify-center gap-2">
 <Plus size={14} /> Add Slot
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </motion.div>
 )}

 <AnimatePresence>
 {isCalendarEntryWizardOpen && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
 >
 <motion.div
 initial={{ opacity: 0, y: 18, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.98 }}
 className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0b0f0d] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] overflow-hidden"
 >
 <div className="px-8 py-6 border-b border-white/8 flex items-start justify-between gap-6">
 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <span className="px-3 py-1.5 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/10 text-[9px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">
 New Calendar Entry
 </span>
 <span className="text-[9px] font-mono text-white/25 uppercase tracking-[0.22em]">
 Step {calendarEntryWizardStep} / 4
 </span>
 </div>
 <div>
 <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">Schedule Notes, Reminders, Or Posts</h2>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.24em]">Campaign publishing still comes from Campaigns and Creative Studio. This wizard is for calendar control and internal planning.</p>
 </div>
 </div>
 <button
 onClick={() => {
  setIsCalendarEntryWizardOpen(false);
  setCalendarEntryWizardStep(1);
 }}
 className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white transition-colors flex items-center justify-center"
 >
 <X size={18} />
 </button>
 </div>

 <div className="px-8 pt-6">
 <div className="grid grid-cols-4 gap-3">
 {['Type', 'Details', 'Links', 'Review'].map((label, index) => {
  const isActive = calendarEntryWizardStep === index + 1;
  const isComplete = calendarEntryWizardStep > index + 1;
  return (
   <div key={label} className={`rounded-xl border px-4 py-3 transition-colors ${isActive ? 'border-[#00ff88]/30 bg-[#00ff88]/10' : isComplete ? 'border-white/10 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02]'}`}>
    <div className="flex items-center justify-between">
     <span className={`text-[9px] font-mono uppercase tracking-[0.24em] ${isActive ? 'text-[#00ff88]' : 'text-white/35'}`}>{label}</span>
     {isComplete && <CheckCircle2 size={12} className="text-[#00ff88]" />}
    </div>
   </div>
  );
 })}
 </div>
 </div>

 <div className="px-8 py-8 min-h-[420px]">
 {calendarEntryWizardStep === 1 && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {[
  { type: 'Post' as const, label: 'Campaign Post', icon: Megaphone, copy: 'Manual scheduled post with channel, campaign, and asset context.' },
  { type: 'Reminder' as const, label: 'Reminder', icon: Bell, copy: 'Internal reminder for reviews, follow-ups, approvals, or launch timing.' },
  { type: 'Note' as const, label: 'Calendar Note', icon: ClipboardList, copy: 'Shared planning note to mark context, blockers, or preparation work.' },
 ].map((option) => (
  <button
   key={option.type}
   onClick={() => setCalendarEntryDraft((current) => ({
    ...current,
    entryType: option.type,
    assetId: option.type === 'Post' ? current.assetId : null,
   }))}
   className={`text-left rounded-[22px] border p-6 space-y-5 transition-all ${
    calendarEntryDraft.entryType === option.type
    ? 'border-[#00ff88]/30 bg-[#00ff88]/10 shadow-[0_22px_60px_-36px_rgba(0,255,136,0.45)]'
    : 'border-white/8 bg-white/[0.03] hover:border-white/15'
   }`}
  >
   <div className="flex items-center justify-between">
    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
      calendarEntryDraft.entryType === option.type ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/10 bg-black/20 text-white/55'
    }`}>
     <option.icon size={20} />
    </div>
    {calendarEntryDraft.entryType === option.type && <CheckCircle2 size={18} className="text-[#00ff88]" />}
   </div>
   <div className="space-y-2">
    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{option.label}</h3>
    <p className="text-sm text-white/55 leading-relaxed">{option.copy}</p>
   </div>
  </button>
 ))}
 </div>
 )}

 {calendarEntryWizardStep === 2 && (
 <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
  <div className="space-y-6">
   <div className="space-y-3">
    <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Entry Title</label>
    <input
     value={calendarEntryDraft.title}
     onChange={(event) => setCalendarEntryDraft((current) => ({ ...current, title: event.target.value }))}
     placeholder={calendarEntryDraft.entryType === 'Post' ? 'Luxury Obsidian Launch' : calendarEntryDraft.entryType === 'Reminder' ? 'Follow up on hero approval' : 'Content prep blocked by asset review'}
     className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/30"
    />
   </div>
   <div className="space-y-3">
    <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Description</label>
    <textarea
     value={calendarEntryDraft.description}
     onChange={(event) => setCalendarEntryDraft((current) => ({ ...current, description: event.target.value }))}
     rows={7}
     placeholder={calendarEntryDraft.entryType === 'Post' ? 'Optional publishing context or CTA notes.' : 'Add the internal context the team should see in the calendar.'}
     className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/30 resize-none"
    />
   </div>
  </div>
  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6 space-y-5">
   <p className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Entry Behavior</p>
   <div className="space-y-3">
    <div className="flex items-center justify-between text-sm text-white">
     <span>Type</span>
     <span className="text-[#00ff88] uppercase">{calendarEntryDraft.entryType}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Publishing Queue</span>
     <span>{calendarEntryDraft.entryType === 'Post' ? 'Available' : 'Not used'}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Campaign Link</span>
     <span>{calendarEntryDraft.campaignId ? 'Attached' : 'Optional'}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Asset Link</span>
     <span>{calendarEntryDraft.entryType === 'Post' ? 'Optional' : 'Hidden'}</span>
    </div>
   </div>
  </div>
 </div>
 )}

 {calendarEntryWizardStep === 3 && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div className="space-y-6">
   <div className="space-y-3">
    <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">When</label>
    <input
     type="datetime-local"
     value={calendarEntryDraft.scheduledFor}
     onChange={(event) => setCalendarEntryDraft((current) => ({ ...current, scheduledFor: event.target.value }))}
     className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
    />
   </div>
   <div className="space-y-3">
    <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Linked Campaign</label>
    <select
     value={calendarEntryDraft.campaignId ?? ''}
     onChange={(event) => {
      const campaignId = event.target.value || null;
      const linkedCampaign = marketingCampaigns.find((campaign) => campaign.id === campaignId) ?? null;
      setCalendarEntryDraft((current) => ({
       ...current,
       campaignId,
       assetId: current.entryType === 'Post' ? current.assetId ?? linkedCampaign?.linkedAssetIds?.[0] ?? null : null,
       channel: current.entryType === 'Post' ? linkedCampaign?.channels?.[0] ?? current.channel : current.channel,
      }));
     }}
     className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
    >
     <option value="">No campaign linked</option>
     {marketingCampaigns.map((campaign) => (
      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
     ))}
    </select>
   </div>
  </div>

  <div className="space-y-6">
   {calendarEntryDraft.entryType === 'Post' ? (
    <>
     <div className="space-y-3">
      <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Channel</label>
      <select
       value={calendarEntryDraft.channel}
       onChange={(event) => setCalendarEntryDraft((current) => ({ ...current, channel: event.target.value as MarketingChannel }))}
       className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
      >
       {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp', 'Pinterest'].map((channel) => (
        <option key={channel} value={channel}>{channel}</option>
       ))}
      </select>
     </div>

     <div className="space-y-3">
      <label className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Linked Asset</label>
      <select
       value={calendarEntryDraft.assetId ?? ''}
       onChange={(event) => setCalendarEntryDraft((current) => ({ ...current, assetId: event.target.value || null }))}
       className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
      >
       <option value="">No asset selected</option>
       {marketingAssets.map((asset) => (
        <option key={asset.id} value={asset.id}>{asset.name}</option>
       ))}
      </select>
     </div>
    </>
   ) : (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-6 space-y-3">
     <p className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Internal Calendar Item</p>
     <p className="text-sm text-white/60 leading-relaxed">
      Notes and reminders stay inside the BTS calendar. They do not create publishing jobs, but they can still be linked to a campaign for context.
     </p>
    </div>
   )}
  </div>
 </div>
 )}

 {calendarEntryWizardStep === 4 && (
 <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6 space-y-5">
   <div className="flex items-center justify-between">
    <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter">{calendarEntryDraft.title || 'Untitled Entry'}</h3>
    <span className="px-3 py-1 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/10 text-[9px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">
     {calendarEntryDraft.entryType}
    </span>
   </div>
   <div className="grid grid-cols-2 gap-4">
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
     <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.22em] mb-2">Schedule</p>
     <p className="text-sm text-white">{new Date(calendarEntryDraft.scheduledFor).toLocaleString('en-ZA')}</p>
    </div>
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
     <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.22em] mb-2">Campaign</p>
     <p className="text-sm text-white">{marketingCampaigns.find((campaign) => campaign.id === calendarEntryDraft.campaignId)?.name ?? 'Unlinked'}</p>
    </div>
   </div>
   {calendarEntryDraft.description && (
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
     <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.22em] mb-2">Description</p>
     <p className="text-sm text-white/70 leading-relaxed">{calendarEntryDraft.description}</p>
    </div>
   )}
  </div>
  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6 space-y-4">
   <p className="text-[10px] font-mono text-white/35 uppercase tracking-[0.24em]">Output Path</p>
   <div className="space-y-3">
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Calendar Visibility</span>
     <span>Immediate</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Publishing Queue</span>
     <span>{calendarEntryDraft.entryType === 'Post' ? 'Available after publish workflow' : 'Not created'}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Linked Asset</span>
     <span>{calendarEntryDraft.entryType === 'Post' ? (marketingAssets.find((asset) => asset.id === calendarEntryDraft.assetId)?.name ?? 'None') : 'Not used'}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-white/70">
     <span>Channel</span>
     <span>{calendarEntryDraft.entryType === 'Post' ? calendarEntryDraft.channel : 'Internal'}</span>
    </div>
   </div>
  </div>
 </div>
 )}
 </div>

 <div className="px-8 py-6 border-t border-white/8 bg-black/20 flex items-center justify-between">
 <button
 onClick={() => setCalendarEntryWizardStep((current) => Math.max(1, current - 1))}
 disabled={calendarEntryWizardStep === 1 || isCreatingCalendarEntry}
 className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-30"
 >
 Previous
 </button>
 <div className="flex items-center gap-4">
  <button
   onClick={() => {
    setIsCalendarEntryWizardOpen(false);
    setCalendarEntryWizardStep(1);
   }}
   className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
  >
   Cancel
  </button>
  {calendarEntryWizardStep < 4 ? (
   <button
    onClick={() => setCalendarEntryWizardStep((current) => Math.min(4, current + 1))}
    className="px-10 py-4 rounded-xl bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-colors"
   >
    Next
   </button>
  ) : (
   <button
    onClick={() => { void handleCreateCalendarEntry(); }}
    disabled={isCreatingCalendarEntry}
    className="px-10 py-4 rounded-xl bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-colors disabled:opacity-50"
   >
    {isCreatingCalendarEntry ? 'Creating...' : 'Create Entry'}
   </button>
  )}
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}

 {selectedCalendarEntry && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
 >
 <motion.div
 initial={{ opacity: 0, y: 18, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.98 }}
 className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-[#0b0f0d] overflow-hidden"
 >
 <div className="px-8 py-6 border-b border-white/8 flex items-start justify-between gap-6">
  <div className="space-y-3">
   <span className="px-3 py-1.5 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/10 text-[9px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">
    {selectedCalendarEntry.entryType}
   </span>
   <div>
    <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">{selectedCalendarEntry.title}</h2>
    <p className="text-[10px] font-mono text-white/35 uppercase tracking-[0.22em] mt-2">
     {new Date(`${selectedCalendarEntry.date}T${selectedCalendarEntry.time}`).toLocaleString('en-ZA')}
    </p>
   </div>
  </div>
  <button onClick={() => setSelectedCalendarEntry(null)} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white flex items-center justify-center">
   <X size={16} />
  </button>
 </div>
 <div className="px-8 py-8 space-y-6">
  {selectedCalendarEntry.description && (
   <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
    <p className="text-sm text-white/70 leading-relaxed">{selectedCalendarEntry.description}</p>
   </div>
  )}
  <div className="grid grid-cols-2 gap-4">
   <div className="rounded-xl border border-white/8 bg-black/20 p-4">
    <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.22em] mb-2">Campaign</p>
    <p className="text-sm text-white">{marketingCampaigns.find((campaign) => campaign.id === selectedCalendarEntry.campaignId)?.name ?? 'Unlinked'}</p>
   </div>
   <div className="rounded-xl border border-white/8 bg-black/20 p-4">
    <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.22em] mb-2">Channel</p>
    <p className="text-sm text-white">{selectedCalendarEntry.channel ?? 'Internal'}</p>
   </div>
  </div>
  <div className="flex flex-wrap gap-3">
   {selectedCalendarEntry.campaignId && (
    <button
     onClick={() => {
      openCalendarEntrySource(selectedCalendarEntry);
      setSelectedCalendarEntry(null);
     }}
     className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors"
    >
     Open Source
    </button>
   )}
   {selectedCalendarEntry.assetId && (
    <button
     onClick={() => {
      openCalendarEntryAsset(selectedCalendarEntry);
      setSelectedCalendarEntry(null);
     }}
     className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors"
    >
     Open Asset
    </button>
   )}
  </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>


 {activeMarketingSubModule === 'Analytics' && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Analytics</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Performance Attribution & Growth Metrics</p>
 </div>
 <div className="flex gap-4">
 <button onClick={handleExportAnalyticsReport} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">Export Report</button>
 <button onClick={() => { void handleOpenAnalyticsLiveView(); }} className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all">Live View</button>
 </div>
 </header>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
 {analyticsKpis.map((kpi, i) => {
 const iconMap = {
  leads: Users,
  quotes: FileText,
  cac: CreditCard,
  roas: BarChart3,
 };
 const colorMap = {
  leads: 'text-white',
  quotes: 'text-[#00ff88]',
  cac: 'text-blue-400',
  roas: 'text-purple-400',
 };
 const Icon = iconMap[kpi.kind];
 const color = colorMap[kpi.kind];
 return (
 <motion.button 
 type="button"
 onClick={() => openAnalyticsKpi(kpi)}
 key={kpi.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 className="bg-[#111] border border-white/10 rounded-xl p-8 space-y-6 relative overflow-hidden group hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 shadow-xl text-left"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className={`p-3 rounded-xl bg-black border border-white/5 shadow-inner ${color}`}>
 <Icon size={24} />
 </div>
 <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border shadow-sm ${kpi.trend.startsWith('+') ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
 {kpi.trend}
 </span>
 </div>
 <div>
 <p className="text-4xl font-serif font-bold text-white tracking-tighter mb-1 group-hover:scale-105 group-hover:text-[#00ff88] transition-all origin-left duration-500">{kpi.value}</p>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{kpi.label}</p>
 </div>
 <p className="mt-6 text-[8px] font-mono text-white/20 uppercase tracking-[0.24em] group-hover:text-[#00ff88]/70 transition-colors">Open Source</p>
 </div>
 </motion.button>
 );
 })}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Trend Panel */}
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="lg:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group shadow-2xl hover:border-[#00ff88]/20 transition-all duration-500"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-12">
 <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Conversion Trend</h3>
 <span className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/20">Click Bars To Inspect Source</span>
 <div className="flex gap-8">
 <div className="flex items-center gap-3">
 <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]" />
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Leads</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Quotes</span>
 </div>
 </div>
 </div>
 <div className="h-80 flex items-end gap-3 px-4">
 {analyticsTrend.map((point, i) => {
 return (
 <button
 type="button"
 key={`hourly-stat-${point.label}`}
 onClick={() => openAnalyticsTrendPoint(point)}
 title={`${point.label}: ${point.leads} leads, ${point.quotes} quotes`}
 className="flex-1 flex flex-col gap-1.5 group/bar focus:outline-none"
 >
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${Math.max(8, (point.quotes / analyticsTrendMaxQuotes) * 100)}%` }}
 transition={{ delay: i * 0.02, type: 'spring', damping: 15 }}
 className="w-full bg-blue-400/20 rounded-t-sm group-hover/bar:bg-blue-400/40 transition-colors shadow-inner"
 />
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${Math.max(8, (point.leads / analyticsTrendMaxLeads) * 100)}%` }}
 transition={{ delay: i * 0.02 + 0.1, type: 'spring', damping: 15 }}
 className="w-full bg-[#00ff88]/40 rounded-t-sm group-hover/bar:bg-[#00ff88]/60 transition-colors shadow-inner"
 />
 </button>
 );
 })}
 </div>
 <div className="flex justify-between mt-10 px-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
 {analyticsTrend.filter((_, index, items) => index === 0 || index === Math.floor(items.length / 3) || index === Math.floor((items.length / 3) * 2) || index === items.length - 1).map((point) => (
 <span key={`trend-label-${point.label}`}>{point.label}</span>
 ))}
 </div>
 </div>
 </motion.div>

 {/* Attribution Panel */}
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-[#00ff88]/20 transition-all duration-500 shadow-2xl"
 >
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
 <div className="mb-8 relative z-10 flex items-center justify-between gap-4">
 <h3 className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-[#00ff88] transition-colors">Channel Attribution</h3>
 <span className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/20">Open Source Buckets</span>
 </div>
 <div className="space-y-8 relative z-10">
 {analyticsChannelAttribution.map((channel, i) => (
 <button
 type="button"
 key={channel.name}
 onClick={() => openAnalyticsChannelAttribution(channel)}
 className="w-full text-left space-y-3 group/channel"
 >
 <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
 <span className="text-white/40 group-hover/channel:text-white transition-colors">{channel.name}</span>
 <span className="text-white group-hover/channel:text-[#00ff88] transition-colors">{channel.value}%</span>
 </div>
 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${channel.value}%` }}
 transition={{ delay: 0.5 + (i * 0.1), type: 'spring', damping: 20 }}
 className={`h-full ${channel.color === 'blue' ? 'bg-blue-400' : channel.color === 'red' ? 'bg-red-400' : channel.color === 'green' ? 'bg-[#00ff88]' : 'bg-purple-400'} shadow-[0_0_10px_currentColor]`}
 />
 </div>
 </button>
 ))}
 </div>
 <button
 type="button"
 onClick={openAnalyticsTopAsset}
 className="mt-12 w-full p-6 bg-black border border-white/10 rounded-xl space-y-4 shadow-inner relative overflow-hidden group/top-asset hover:border-[#00ff88]/20 transition-colors text-left"
 >
 <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent opacity-0 group-hover/top-asset:opacity-100 transition-opacity" />
 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60 relative z-10">Top Performing Asset</h4>
 <div className="flex items-center gap-4 relative z-10">
 <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/10 shadow-md">
 <img src={analyticsTopAsset?.imageUrl ?? 'https://picsum.photos/seed/slate1/100/100'} alt="top asset" className="w-full h-full object-cover opacity-60 group-hover/top-asset:opacity-100 transition-opacity group-hover/top-asset:scale-110 duration-500" referrerPolicy="no-referrer" />
 </div>
 <div>
 <p className="text-xs font-bold text-white uppercase group-hover/top-asset:text-[#00ff88] transition-colors">{analyticsTopAsset?.name ?? 'No Top Asset'}</p>
 <p className="text-[8px] font-mono text-[#00ff88] uppercase">{analyticsTopAsset?.quotesGenerated ?? 0} Quotes Generated</p>
 </div>
 </div>
 <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/20 relative z-10 group-hover/top-asset:text-[#00ff88]/70 transition-colors">Open Asset Source</p>
 </button>
 </motion.div>
 </div>

 {/* Campaign Performance Table */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:border-[#00ff88]/20 transition-all duration-500"
 >
 <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
 <h3 className="text-xs font-bold uppercase tracking-widest text-white">Campaign Performance</h3>
 <button 
 onClick={() => setActiveMarketingSubModule('Campaigns')}
 className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline"
 >
 View All Campaigns
 </button>
 </div>
 <table className="w-full text-left">
 <thead>
 <tr className="bg-black/50">
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Campaign</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">Published</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">Leads</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">Quotes</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">Conv. Rate</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">Spend</th>
 <th className="px-8 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-right">ROAS</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {campaignPerformance.map((campaign, i) => {
 const publishedCount = publishingJobs.filter(j => j.campaignId === campaign.id && j.status === 'Published').length;
 return (
 <motion.tr 
 key={campaign.id} 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.05 }}
 className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
 onClick={() => {
 setExpandedCampaignId(campaign.id);
 setActiveMarketingSubModule('Campaigns');
 }}
 >
 <td className="px-8 py-6">
 <div className="space-y-1">
 <p className="text-xs font-bold text-white uppercase group-hover:text-[#00ff88] transition-colors">{campaign.name}</p>
 <div className="flex items-center gap-2">
 <p className="text-[8px] font-mono text-white/30 uppercase">{campaign.id}</p>
 {campaign.workflowNode && (
 <p className="text-[8px] font-mono text-purple-400 uppercase flex items-center gap-1">
 <Activity size={8} /> {campaign.workflowNode}
 </p>
 )}
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <span className="text-xs font-mono text-white/60 group-hover:text-[#00ff88] transition-colors">{publishedCount} Posts</span>
 </td>
 <td className="px-8 py-6 text-center text-xs font-mono text-white/60">{campaign.leads}</td>
 <td className="px-8 py-6 text-center text-xs font-mono text-white/60">{campaign.quotes}</td>
 <td className="px-8 py-6 text-center">
 <span className="text-xs font-mono text-[#00ff88]">{campaign.conversion}</span>
 </td>
 <td className="px-8 py-6 text-center text-xs font-mono text-white/60">{campaign.spend}</td>
 <td className="px-8 py-6 text-right">
 <span className="text-xs font-mono font-bold text-white group-hover:text-[#00ff88] transition-colors">{campaign.roas}</span>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>
 </motion.div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'CommunityFeed' && (
   <MarketingCommunityFeed
    posts={marketingStudio.communityPosts}
    onOpenCampaign={openCommunityPostCampaign}
    onOpenAsset={openCommunityPostAsset}
    onOpenAnalytics={openCommunityPostAnalytics}
    onOpenHistory={openCommunityPostHistory}
    onOpenChannel={openCommunityPostChannel}
    onLikePost={likeCommunityFeedPost}
    onCommentPost={commentOnCommunityFeedPost}
    internalLikeActorKey={communityLikeActor.key}
   />
 )}

 {activeMarketingSubModule === 'ContentStudio' && (
   <MarketingContentStudio
    assets={marketingStudio.assets}
    campaigns={marketingStudio.campaigns}
    contentPosts={marketingStudio.contentPosts}
    isSaving={marketingStudio.isSaving}
    onCreateContentPost={marketingStudio.createContentPost}
   />
 )}

 </div>
 </div>
 </div>
 </PortalSectionErrorBoundary>
 )}

	  {activeModule === 'Finance' && (
	    <FinanceModule
	      onCreateEntry={() => {
	        setActiveModule('Map');
	        toast.message('Finance ledger entries are created from live workflow actions such as quotes, invoices, payments, and procurement.');
	      }}
        preferredSubModule={preferredFinanceSubModule}
        preferredRecordId={preferredFinanceRecordId}
        onOpenProduct={openFinanceProduct}
        onOpenCustomer={openFinanceCustomer}
        onOpenSupplier={openFinanceSupplier}
        onOpenWorkflow={openFinanceWorkflow}
	    />
	  )}

{/* Detail Panel (Slide-out) */}
 <AnimatePresence>
 {isDetailPanelOpen && (selectedNode || selectedEdge) && (
 <>
 <motion.div
 key="backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsDetailPanelOpen(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
 />
 <motion.div
 key="panel"
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="absolute top-0 right-0 h-full w-[450px] bg-[#0a0a0a] border-l border-white/10 z-[70] p-8 overflow-y-auto"
 >
 <div className="flex items-center justify-between mb-12">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
 {selectedNode ? <Settings size={24} /> : <Share2 size={24} />}
 </div>
 <div>
 <h2 className="text-2xl font-serif font-bold tracking-tighter uppercase">
 {selectedNode ? 'Edit Node' : 'Edit Connection'}
 </h2>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
 {selectedNode ? 'Configure Automation Triggers' : 'Define Workflow Logic'}
 </p>
 </div>
 </div>
 <button onClick={() => setIsDetailPanelOpen(false)} className="text-white/30 hover:text-white transition-colors">
 <X size={24} />
 </button>
 </div>

 <div className="space-y-10">
 {selectedNode && (
 <>
 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Group</label>
 <div className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">{selectedNode.data.category as string}</div>
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Name</label>
 <input
 type="text"
 value={selectedNode.data.label as string}
 onChange={(e) => {
 const newLabel = e.target.value;
 setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
 }}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors"
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Purpose</label>
 <textarea
 value={selectedNode.data.purpose as string || ''}
 onChange={(e) => {
 const newPurpose = e.target.value;
 setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, purpose: newPurpose } } : n));
 }}
 className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none"
 placeholder="Describe the purpose of this step..."
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Workflow & Automation Logic</label>
 <textarea
 value={selectedNode.data.logic as string || ''}
 onChange={(e) => {
 const newLogic = e.target.value;
 setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, logic: newLogic } } : n));
 }}
 className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-white/80 focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none"
 placeholder="Define triggers, conditions, or actions..."
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Mock Metadata</label>
 <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Status</span>
 <span className="text-[10px] font-mono text-[#00ff88]">Active</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Connections</span>
 <span className="text-[10px] font-mono text-white/60">3 Active</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Last Sync</span>
 <span className="text-[10px] font-mono text-white/60">Just now</span>
 </div>
 </div>
 </div>

 <button 
 onClick={deleteNode}
 className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
 >
 <Trash2 size={14} /> Delete Node
 </button>
 </>
 )}

 {selectedEdge && (
 <>
 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Label</label>
 <input
 type="text"
 value={selectedEdge.label as string || ''}
 onChange={(e) => {
 const newLabel = e.target.value;
 setEdges(eds => eds.map(edge => edge.id === selectedEdge.id ? { ...edge, label: newLabel } : edge));
 }}
 className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors"
 placeholder="Connection Label (e.g., Triage)"
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Workflow & Automation Logic</label>
 <textarea
 value={selectedEdge.data?.logic as string || ''}
 onChange={(e) => {
 const newLogic = e.target.value;
 setEdges(eds => eds.map(edge => edge.id === selectedEdge.id ? { ...edge, data: { ...edge.data, logic: newLogic } } : edge));
 }}
 className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-white/80 focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none"
 placeholder="Define triggers, conditions, or actions..."
 />
 </div>

 <button 
 onClick={deleteEdge}
 className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
 >
 <Trash2 size={14} /> Delete Connection
 </button>
 </>
 )}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 {/* Master Prompt Modal */}
 <AnimatePresence>
 {isMasterPromptOpen && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-8">
 <motion.div
 key="backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsMasterPromptOpen(false)}
 className="absolute inset-0 bg-black/80 backdrop-blur-md"
 />
 <motion.div
 key="modal"
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.9, opacity: 0 }}
 className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
 >
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
 <Terminal size={20} />
 </div>
 <h2 className="text-2xl font-serif font-bold tracking-tighter uppercase">Master Prompt Export</h2>
 </div>
 <button onClick={() => setIsMasterPromptOpen(false)} className="text-white/30 hover:text-white transition-colors">
 <ArrowLeft size={24} className="rotate-180" />
 </button>
 </div>

 <p className="text-xs text-white/40 uppercase tracking-widest mb-6 leading-relaxed">
 This utility parses the visual map state and generates a structured system prompt for backend LLM execution.
 </p>

 <div className="bg-black/40 border border-white/5 rounded-xl p-6 mb-8">
 <pre className="text-[10px] font-mono text-[#00ff88]/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
 {generateMasterPrompt()}
 </pre>
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => {
 navigator.clipboard.writeText(generateMasterPrompt());
 const toast = document.createElement('div');
 toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-purple-500 text-white font-bold rounded-full text-[10px] uppercase tracking-widest shadow-2xl';
 toast.innerText = 'Prompt Copied to Clipboard';
 document.body.appendChild(toast);
 setTimeout(() => toast.remove(), 3000);
 }}
 className="flex-1 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
 >
 Copy to Clipboard
 </button>
 <button 
 onClick={() => setIsMasterPromptOpen(false)}
 className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
 >
 Close
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 {/* Asset Detail Overlay */}
 <AnimatePresence>
 {selectedAsset && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
 onClick={() => setSelectedAsset(null)}
 >
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Visual Preview */}
 <div className="lg:w-1/2 bg-black flex items-center justify-center relative group overflow-hidden">
 {selectedAsset.type === 'Video' ? (
 <video
 src={selectedAsset.img}
 className="w-full h-full object-contain"
 controls
 playsInline
 preload="metadata"
 autoPlay
 muted
 loop
 />
 ) : (
 <img src={selectedAsset.img} alt={selectedAsset.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
 )}
 <div className="absolute top-8 left-8 flex gap-4">
 <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-white/60 uppercase tracking-widest flex items-center gap-2">
 {selectedAsset.type === '3D Asset' || selectedAsset.type === 'Model' ? <Box size={14} /> : selectedAsset.type === 'Video' ? <Video size={14} /> : <Image size={14} />}
 {selectedAsset.type}
 </div>
 <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-white/60 uppercase tracking-widest">
 {selectedAsset.size}
 </div>
 </div>
 <div className="absolute bottom-8 right-8 flex gap-4">
 {selectedAsset.protectionLevel === 'Protected Original' ? (
 <div className="flex items-center gap-4 bg-black/80 backdrop-blur-md border border-red-500/30 p-2 rounded-xl pr-6 shadow-2xl">
 <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
 <Lock size={20} />
 </div>
 <div>
 <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Internal Original</p>
 <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Direct download restricted</p>
 </div>
 </div>
 ) : (
 <button onClick={() => window.open(selectedAsset.img, '_blank', 'noopener,noreferrer')} className="px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
 <Download size={16} /> {selectedAsset.type === 'Video' ? 'Open Media' : `Download ${selectedAsset.protectionLevel === 'Publishable Variant' ? 'for Publishing' : 'Variant'}`}
 </button>
 )}
 <button
 onClick={() => {
  openCreativeStudio({
   mode: selectedAsset.type === 'Image' ? 'cutout' : 'blueprint',
   assetId: selectedAsset.id,
   productId: selectedAsset.productId ?? selectedProduct?.id ?? null,
  });
  setSelectedAsset(null);
 }}
 className="px-8 py-4 bg-[#00ff88] text-black rounded-xl hover:bg-[#00cc6e] transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
 >
 <Wand2 size={16} /> Open in Creative Studio
 </button>
 </div>
 </div>

 {/* Metadata & Controls */}
 <div className="lg:w-1/2 p-8 overflow-y-auto custom-scrollbar space-y-8">
 <header className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-3 mb-4">
 <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 ${selectedAsset.protectionLevel === 'Protected Original' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : selectedAsset.protectionLevel === 'Publishable Variant' ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
 {selectedAsset.protectionLevel === 'Protected Original' ? <Lock size={12} /> : selectedAsset.protectionLevel === 'Publishable Variant' ? <Share size={12} /> : <Layers size={12} />}
 {selectedAsset.protectionLevel}
 </span>
 <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{selectedAsset.id}</span>
 </div>
 {isEditingSelectedAsset ? (
 <div className="mb-4 space-y-3">
 <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30">Asset Name</label>
 <input
 value={selectedAssetNameDraft}
 onChange={(event) => setSelectedAssetNameDraft(event.target.value)}
 className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-2xl font-serif font-bold uppercase tracking-tighter text-white outline-none transition-all focus:border-[#00ff88]/30"
 placeholder="Asset name"
 />
 </div>
 ) : (
 <h2 className="text-4xl font-serif font-bold text-white uppercase tracking-tighter leading-none mb-4">{selectedAsset.name}</h2>
 )}
 <div className="flex flex-wrap gap-2">
 {selectedAsset.usage.map(u => (
 <span key={u} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white/60 uppercase tracking-widest">{u}</span>
 ))}
 </div>
 </div>
 <button onClick={() => setSelectedAsset(null)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
 <X size={24} />
 </button>
 </header>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">System Linkage</h3>
 <div className="space-y-3">
 {selectedAsset.workflowNode && (
 <button
 onClick={() => openAssetWorkflowNode(selectedAsset)}
 className="w-full p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between group hover:border-purple-500/40 transition-all text-left"
 >
 <div className="flex items-center gap-3">
 <Activity size={16} className="text-purple-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Workflow Node</span>
 <span className="text-[8px] font-mono text-purple-400">{selectedAsset.workflowNode}</span>
 </div>
 </div>
 <ArrowUpRight size={14} className="text-white/20 group-hover:text-purple-300 transition-colors" />
 </button>
 )}
 <button
 onClick={() => openAssetLinkedProduct(selectedAsset)}
 disabled={selectedAssetLinkedProducts.length === 0}
 className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all text-left ${
  selectedAssetLinkedProducts.length === 0
   ? 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
   : 'bg-white/5 border border-white/5 hover:border-[#00ff88]/20 cursor-pointer'
 }`}
 >
 <div className="flex items-center gap-3">
 <ShoppingBag size={16} className="text-amber-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Linked Products</span>
 <span className="text-[8px] font-mono text-white/30">
 {selectedAssetLinkedProducts.length === 0
  ? 'No linked products'
  : `${selectedAssetLinkedProducts.length} Products Connected${selectedAssetLinkedProducts[0] ? ` • ${selectedAssetLinkedProducts[0].name}` : ''}`}
 </span>
 </div>
 </div>
 <ArrowUpRight size={14} className="text-white/20 group-hover:text-[#00ff88]" />
 </button>
 <button
 onClick={() => openAssetLinkedCampaign(selectedAsset)}
 disabled={selectedAssetLinkedCampaigns.length === 0}
 className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all text-left ${
  selectedAssetLinkedCampaigns.length === 0
   ? 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
   : 'bg-white/5 border border-white/5 hover:border-pink-500/30 cursor-pointer'
 }`}
 >
 <div className="flex items-center gap-3">
 <Megaphone size={16} className="text-pink-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Linked Campaigns</span>
 <span className="text-[8px] font-mono text-white/30">
 {selectedAssetLinkedCampaigns.length === 0
  ? 'No linked campaigns'
  : `${selectedAssetLinkedCampaigns.length} Campaigns Connected${selectedAssetLinkedCampaigns[0] ? ` • ${selectedAssetLinkedCampaigns[0].name}` : ''}`}
 </span>
 </div>
 </div>
 <ArrowUpRight size={14} className="text-white/20 group-hover:text-pink-400" />
 </button>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Status & Readiness</h3>
 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-full ${
 selectedAsset.status === 'Approved' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
 selectedAsset.status === 'Review' ? 'bg-orange-500/10 text-orange-400' :
 'bg-white/5 text-white/20'
 }`}>
 {selectedAsset.status === 'Approved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
 </div>
 <span className="text-sm font-bold text-white uppercase tracking-tighter">{selectedAsset.status}</span>
 </div>
 {selectedAsset.is3DReady && (
 <div className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
 <Box size={12} /> 3D Ready
 </div>
 )}
 </div>
 
 {selectedAsset.completeness !== undefined && (
 <div className="space-y-2">
 <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
 <span className="text-white/40">Asset Completeness</span>
 <span className={selectedAsset.completeness === 100 ? 'text-[#00ff88]' : 'text-amber-400'}>{selectedAsset.completeness}%</span>
 </div>
 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
 <div 
 className={`h-full rounded-full ${selectedAsset.completeness === 100 ? 'bg-[#00ff88]' : 'bg-amber-400'}`} 
 style={{ width: `${selectedAsset.completeness}%` }} 
 />
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {selectedAsset.pipeline && (
 <div className="space-y-6">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">3D Asset Pipeline</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'Source Uploaded', status: selectedAsset.pipeline.sourceUploaded },
 { label: 'Texture Ready', status: selectedAsset.pipeline.textureReady },
 { label: 'Preview Attached', status: selectedAsset.pipeline.previewAttached },
 { label: 'Model Reference', status: selectedAsset.pipeline.modelReferenceAttached },
].map((step) => (
 <div key={step.label} className={`p-4 rounded-xl border ${step.status ? 'bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]' : 'bg-white/5 border-white/10 text-white/20'}`}>
 <div className="flex items-center justify-between mb-2">
 {step.status ? <Check size={12} /> : <Clock size={12} />}
 </div>
 <p className="text-[8px] font-mono uppercase tracking-widest leading-tight">{step.label}</p>
 </div>
 ))}
 </div>
 <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
 <Activity size={20} className={selectedAsset.pipeline.conversionStatus === 'Processing' ? 'text-[#00ff88] animate-spin' : 'text-white/20'} />
 </div>
 <div>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Conversion Status</p>
 <p className="text-sm font-bold text-white uppercase">{selectedAsset.pipeline.conversionStatus}</p>
 </div>
 </div>
 <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
 Re-Process
 </button>
 </div>
 </div>
 )}

 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Usage Tags</h3>
 <div className="flex flex-wrap gap-2">
 {(isEditingSelectedAsset ? selectedAssetTagsDraft : selectedAsset.tags).map(tag => (
 isEditingSelectedAsset ? (
 <button
 key={tag}
 onClick={() => handleRemoveSelectedAssetTag(tag)}
 className="px-4 py-2 bg-black/40 border border-[#00ff88]/20 rounded-xl text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:border-red-400/30 hover:text-red-300 transition-all flex items-center gap-2"
 >
 #{tag} <X size={10} />
 </button>
 ) : (
 <button
 key={tag}
 onClick={() => filterAssetTag(tag)}
 className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-white/60 uppercase tracking-widest hover:border-[#00ff88]/20 hover:text-[#00ff88] transition-all"
 >
 #{tag}
 </button>
 )
 ))}
 {isEditingSelectedAsset && (
 <div className="flex flex-wrap items-center gap-2 w-full pt-2">
 <input
 value={selectedAssetTagInput}
 onChange={(event) => setSelectedAssetTagInput(event.target.value)}
 onKeyDown={(event) => {
  if (event.key === 'Enter') {
   event.preventDefault();
   handleAddSelectedAssetTag();
  }
 }}
 className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-all focus:border-[#00ff88]/30"
 placeholder="Add tag"
 />
 <button
 onClick={handleAddSelectedAssetTag}
 className="px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:bg-[#00ff88]/15 transition-all"
 >
 Add Tag
 </button>
 </div>
 )}
 <button
 onClick={() => {
  setActiveModule('Marketing');
  setActiveMarketingSubModule('AssetLab');
  setSelectedAsset(null);
 }}
 className="px-4 py-2 bg-white/5 border border-white/10 border-dashed rounded-xl text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-all"
 >
 Open Asset Lab
 </button>
 </div>
 </div>

 <div className="pt-12 border-t border-white/5 flex items-center justify-between">
 <div className="space-y-3">
 {selectedAssetFeedback && (
 <p className={`text-[10px] font-mono uppercase tracking-widest ${
  selectedAssetFeedback.toLowerCase().includes('failed') || selectedAssetFeedback.toLowerCase().includes('cannot')
   ? 'text-red-400'
   : 'text-[#00ff88]'
 }`}>
 {selectedAssetFeedback}
 </p>
 )}
 <div className="flex gap-4">
 <button
 onClick={handleArchiveSelectedAsset}
 disabled={isMutatingSelectedAsset}
 className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Archive Asset
 </button>
 <button
 onClick={handleDuplicateSelectedAsset}
 disabled={isMutatingSelectedAsset}
 className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Duplicate
 </button>
 {isEditingSelectedAsset && (
 <button
 onClick={() => {
  setIsEditingSelectedAsset(false);
  setSelectedAssetNameDraft(selectedAsset.name);
  setSelectedAssetTagsDraft(selectedAsset.tags);
  setSelectedAssetTagInput('');
  setSelectedAssetFeedback('Asset editing cancelled.');
 }}
 disabled={isMutatingSelectedAsset}
 className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Cancel
 </button>
 )}
 </div>
 </div>
 <button
 onClick={handleUpdateSelectedAssetMetadata}
 disabled={isMutatingSelectedAsset}
 className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isMutatingSelectedAsset ? 'Working...' : isEditingSelectedAsset ? 'Save Asset Changes' : 'Edit Asset'}
 </button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Generate Variant Modal */}
 <AnimatePresence>
 {isGeneratingVariant && selectedAsset && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
 onClick={() => setIsGeneratingVariant(false)}
 >
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 >
 <header className="p-8 border-b border-white/5 flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter leading-none mb-2">Generate Variant</h2>
 <div className="flex items-center gap-3">
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Source: {selectedAsset.name}</p>
 <span className="text-[10px] text-white/20">•</span>
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Step {variantWizardStep} of 3</p>
 </div>
 </div>
 <button onClick={() => { setIsGeneratingVariant(false); setVariantWizardStep(1); }} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
 <X size={24} />
 </button>
 </header>
 
 <div className="p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-8">
 <div className="lg:w-1/2 space-y-8">
 {variantWizardStep === 1 && (
 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">1. Background Processing</h3>
 <div 
 onClick={() => setVariantSettings(s => ({ ...s, transparentBg: !s.transparentBg }))}
 className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${variantSettings.transparentBg ? 'bg-[#00ff88]/5 border-[#00ff88]/30' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
 >
 <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${variantSettings.transparentBg ? 'border-[#00ff88]/50 bg-[#00ff88]/20 text-[#00ff88]' : 'border-white/20 text-transparent'}`}>
 <Check size={14} />
 </div>
 <div>
 <p className={`text-sm font-bold uppercase ${variantSettings.transparentBg ? 'text-[#00ff88]' : 'text-white'}`}>Transparent Background</p>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">AI-powered background removal</p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">2. Channel Size Preset</h3>
 <div className="grid grid-cols-2 gap-4">
 {[
 { id: 'Original', label: 'Original Size', desc: 'Keep source dimensions' },
 { id: '1080x1080', label: '1080x1080', desc: 'Instagram Square' },
 { id: '1080x1920', label: '1080x1920', desc: 'Story / Reel' },
 { id: '1200x630', label: '1200x630', desc: 'Web Hero / Social' }
].map(size => (
 <div 
 key={size.id} 
 onClick={() => setVariantSettings(s => ({ ...s, channelSize: size.id }))}
 className={`p-4 border rounded-xl cursor-pointer transition-all ${variantSettings.channelSize === size.id ? 'bg-[#00ff88]/5 border-[#00ff88]/30 text-[#00ff88]' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
 >
 <p className="text-xs font-bold uppercase tracking-widest mb-1">{size.label}</p>
 <p className="text-[9px] font-mono opacity-60 uppercase">{size.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 )}

 {variantWizardStep === 2 && (
 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">3. Watermark Profile</h3>
 <div className="grid grid-cols-2 gap-4">
 {['None', 'Standard BTS', 'Confidential', 'Draft'].map(profile => (
 <div 
 key={profile} 
 onClick={() => setVariantSettings(s => ({ ...s, watermarkProfile: profile }))}
 className={`p-4 border rounded-xl cursor-pointer transition-all ${variantSettings.watermarkProfile === profile ? 'bg-[#00ff88]/5 border-[#00ff88]/30 text-[#00ff88]' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
 >
 <p className="text-xs font-bold uppercase tracking-widest text-center">{profile}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">4. Usage Purpose</h3>
 <div className="grid grid-cols-2 gap-4">
 {['Publishable Variant', 'Gallery', 'Campaign', 'Social'].map(usage => (
 <div 
 key={usage} 
 onClick={() => setVariantSettings(s => ({ ...s, usagePurpose: usage }))}
 className={`p-4 border rounded-xl cursor-pointer transition-all ${variantSettings.usagePurpose === usage ? 'bg-[#00ff88]/5 border-[#00ff88]/30 text-[#00ff88]' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
 >
 <p className="text-xs font-bold uppercase tracking-widest text-center">{usage}</p>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 )}

 {variantWizardStep === 3 && (
 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
 <div className="space-y-4">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Variant Summary</h3>
 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
 <div className="flex items-center justify-between pb-4 border-b border-white/5">
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Source Asset</span>
 <span className="text-xs font-bold text-white uppercase">{selectedAsset.name}</span>
 </div>
 <div className="flex items-center justify-between pb-4 border-b border-white/5">
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Background</span>
 <span className="text-xs font-bold text-white uppercase">{variantSettings.transparentBg ? 'Transparent (AI Removed)' : 'Original'}</span>
 </div>
 <div className="flex items-center justify-between pb-4 border-b border-white/5">
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Dimensions</span>
 <span className="text-xs font-bold text-white uppercase">{variantSettings.channelSize}</span>
 </div>
 <div className="flex items-center justify-between pb-4 border-b border-white/5">
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Watermark</span>
 <span className="text-xs font-bold text-white uppercase">{variantSettings.watermarkProfile}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Usage Type</span>
 <span className="text-xs font-bold text-[#00ff88] uppercase">{variantSettings.usagePurpose}</span>
 </div>
 </div>
 </div>
 <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
 <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
 <Layers size={16} />
 </div>
 <div>
 <p className="text-xs font-bold text-blue-400 uppercase mb-1">Non-Destructive Generation</p>
 <p className="text-[10px] font-mono text-white/60 leading-relaxed">This will create a new Managed Variant. The Protected Original will remain untouched and secured in the Asset Lab.</p>
 </div>
 </div>
 </motion.div>
 )}
 </div>

 <div className="lg:w-1/2 bg-black rounded-3xl border border-white/5 overflow-hidden relative flex items-center justify-center">
 {selectedAsset.type === 'Video' ? (
 <video
 src={selectedAsset.img}
 className={`w-full h-full object-contain transition-all duration-500 ${variantSettings.transparentBg ? 'opacity-90' : 'opacity-60'}`}
 controls
 playsInline
 preload="metadata"
 muted
 loop
 autoPlay
 />
 ) : (
 <img 
 src={selectedAsset.img} 
 alt="Preview" 
 className={`w-full h-full object-contain transition-all duration-500 ${variantSettings.transparentBg ? 'opacity-90 mix-blend-screen' : 'opacity-50'}`} 
 referrerPolicy="no-referrer" 
 />
 )}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <div className="text-center bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10">
 <Wand2 size={32} className="mx-auto mb-3 text-[#00ff88] opacity-80" />
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Live Preview</p>
 <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest mt-2">
 {variantSettings.channelSize} • {variantSettings.watermarkProfile}
 </p>
 </div>
 </div>
 {/* Mock Watermark Overlay */}
 {variantSettings.watermarkProfile !== 'None' && (
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
 <div className="rotate-[-30deg] text-4xl font-bold text-white uppercase tracking-[0.5em] mix-blend-overlay">
 {variantSettings.watermarkProfile}
 </div>
 </div>
 )}
 </div>
 </div>

 <footer className="p-8 border-t border-white/5 flex justify-between items-center">
 <div className="flex gap-2">
 {[1, 2, 3].map(step => (
 <div key={step} className={`w-12 h-1.5 rounded-full transition-all ${variantWizardStep >= step ? 'bg-[#00ff88]' : 'bg-white/10'}`} />
 ))}
 </div>
 <div className="flex gap-4">
 {variantWizardStep > 1 && (
 <button onClick={() => setVariantWizardStep(s => s - 1)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
 Back
 </button>
 )}
 {variantWizardStep < 3 ? (
 <button onClick={() => setVariantWizardStep(s => s + 1)} className="px-8 py-4 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
 Continue
 </button>
 ) : (
 <button onClick={() => { void handleGenerateMarketingVariant(); }} className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2">
 <Wand2 size={16} /> Generate & Save
 </button>
 )}
 </div>
 </footer>
 </motion.div>
 </motion.div>
 )}

 {/* Inventory Wizards */}
 <AddProductWizard 
   isOpen={isAddProductWizardOpen} 
   onClose={() => setIsAddProductWizardOpen(false)} 
   suppliers={inventoryPortal.suppliers.map((supplier) => ({
     id: supplier.id,
     name: supplier.name,
     status: supplier.status,
     leadTime: supplier.leadTime,
   }))}
   assetLibrary={marketingAssets}
   onUploadAssetToLibrary={handleCreateAssetLabAsset}
   onCreateProduct={inventoryPortal.createProduct}
 />
 <ImportPriceListWizard 
   isOpen={isImportPriceListOpen} 
   onClose={() => setIsImportPriceListOpen(false)} 
   onImportPriceList={inventoryPortal.importPriceList}
 />
 </AnimatePresence>
 </main>
 </div>
 );
}
