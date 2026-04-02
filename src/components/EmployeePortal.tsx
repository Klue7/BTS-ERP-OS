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
  PinOff
} from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';
import { CRMProjectsTenders } from './CRMProjectsTenders';
import { MarketingCommunityFeed } from './MarketingCommunityFeed';
import { useInventoryPortalData } from '../inventory/useInventoryPortalData';
import type { InventoryDashboardSnapshot } from '../inventory/contracts';

// --- Types & Interfaces ---

type AssetStatus = 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
type AssetUsage = 'Hero' | 'Gallery' | 'Installation' | 'Detail' | 'Campaign' | '3D Ready' | 'Model' | 'Render' | 'Publishable Variant';
type AssetType = 'Image' | 'Video' | '3D Asset' | '3D Render' | 'Model';
type ProtectionLevel = 'Protected Original' | 'Managed Variant' | 'Publishable Variant';

// --- CRM & Comms Types ---
type CRMSubModule = 'Dashboard' | 'Queue' | 'Pipeline' | 'Directory' | 'ProjectsTenders' | 'Automations';
type CommsChannel = 'Email' | 'WhatsApp' | 'Meta' | 'TikTok' | 'Web';
type CustomerStage = 'Lead' | 'Qualified' | 'Quote Sent' | 'Awaiting Response' | 'Negotiation' | 'Won' | 'Lost' | 'Follow-up';

// --- Finance Types ---
type FinanceSubModule = 'Overview' | 'Receivables' | 'Payables' | 'Margin' | 'Exceptions';

interface FinanceRecord {
  id: string;
  orderId: string;
  customerName: string;
  type: 'Receivable' | 'Payable';
  category: 'Invoice' | 'Payment' | 'PO' | 'Supplier Invoice' | 'Logistics' | 'Credit' | 'Adjustment';
  status: 'Draft' | 'Issued' | 'Partial' | 'Paid' | 'Overdue' | 'Committed' | 'Pending' | 'Ready' | 'Disputed' | 'Mismatch' | 'Flagged';
  amount: number;
  balance: number;
  dueDate: string;
  issueDate: string;
  margin?: {
    sellingValue: number;
    productCost: number;
    logisticsCost: number;
    otherCosts: number;
    projectedMargin: number;
    realizedMargin: number;
    status: 'Healthy' | 'At Risk' | 'Negative';
  };
  exceptions?: string[];
  workflowNode?: string;
}

interface Customer {
  id: string;
  name: string;
  type: 'Trade' | 'Retail' | 'Architect';
  email: string;
  phone: string;
  stage: CustomerStage;
  lastActivity: string;
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
 usage: AssetUsage[];
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
 workflowNode?: 'asset.uploaded' | 'variant.generated' | 'creative.approved';
 pipeline?: {
 sourceUploaded: boolean;
 textureReady: boolean;
 previewAttached: boolean;
 modelReferenceAttached: boolean;
 conversionStatus: 'Pending' | 'Processing' | 'Complete' | 'Failed';
 };
 watermarkProfile?: string;
 backgroundTransparent?: boolean;
}

interface MarketingTemplate {
 id: string;
 name: string;
 description: string;
 type: 'Product Card' | 'Collection Highlight' | 'Quote CTA';
 thumbnail: string;
 blueprint: string;
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
 channels: string[];
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
 blueprint: '1:1 Image | Bottom-Left Overlay | Price Badge | Primary CTA'
 },
 {
 id: 'TMP_002',
 name: 'Collection Highlight',
 description: 'Grid-based layout for showcasing multiple products in a series.',
 type: 'Collection Highlight',
 thumbnail: 'https://picsum.photos/seed/tmp2/400/300',
 blueprint: '2x2 Grid | Central Header | Shared Texture Background'
 },
 {
 id: 'TMP_003',
 name: 'Quote CTA',
 description: 'Minimalist layout focusing on customer testimonials and direct action.',
 type: 'Quote CTA',
 thumbnail: 'https://picsum.photos/seed/tmp3/400/300',
 blueprint: 'Full-bleed Texture | Centered Serif Quote | Floating CTA'
 }
];

interface ScheduledPost {
 id: string;
 title: string;
 channel: string;
 time: string;
 date: string;
 status: 'Scheduled' | 'Published' | 'Failed' | 'Draft';
 assetId?: string;
 campaignId?: string;
 workflowNode?: 'post.scheduled';
}

const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
 { id: 'POST_001', title: 'Spring Hero IG', channel: 'Instagram', time: '14:00', date: '2026-03-27', status: 'Scheduled', assetId: 'AST_001', campaignId: 'CMP_001', workflowNode: 'post.scheduled' },
 { id: 'POST_002', title: 'Slate Promo FB', channel: 'Facebook', time: '12:30', date: '2026-03-27', status: 'Scheduled', assetId: 'AST_002', campaignId: 'CMP_001', workflowNode: 'post.scheduled' },
 { id: 'POST_003', title: 'Catalog Sync WA', channel: 'WhatsApp', time: '09:00', date: '2026-03-28', status: 'Published', campaignId: 'CMP_001' },
 { id: 'POST_004', title: 'TikTok Trend #1', channel: 'TikTok', time: '10:00', date: '2026-03-30', status: 'Scheduled', campaignId: 'CMP_002' },
 { id: 'POST_005', title: 'LinkedIn B2B', channel: 'LinkedIn', time: '11:00', date: '2026-03-31', status: 'Draft', campaignId: 'CMP_002' },
];

type PublishingStatus = 'Queued' | 'Publishing' | 'Published' | 'Failed' | 'Retrying';

interface PublishingJob {
 id: string;
 creativeName: string;
 channel: string;
 status: PublishingStatus;
 timestamp: string;
 progress?: number;
 error?: string;
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
 name: string;
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
  role: 'hero' | 'gallery' | 'face_texture' | 'detail_texture' | 'installation' | 'cutout' | 'quote_render' | 'marketing_variant' | '3d_texture_set' | 'model_reference';
  url: string;
  status: 'Ready' | 'Pending' | 'Missing';
  type: 'Image' | 'Video' | '3D Asset';
}

interface Vendor {
  id: string;
  name: string;
  logo: string;
  status: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
  type: 'Manufacturer' | 'Distributor' | 'Wholesaler';
  capabilities: string[];
  region: string;
  leadTime: string;
  productCount: number;
  rating: number;
  blocker?: string;
  contacts: {
    department: string;
    name: string;
    email: string;
    phone: string;
    preferredChannel?: 'Email' | 'Phone' | 'WhatsApp' | 'Portal';
    notes?: string;
  }[];
  terms: {
    payment: string;
    delivery: string;
    moq: string;
    currency: string;
    incoterms: string;
  };
  performance: {
    onTimeDelivery: number;
    qualityScore: number;
    returnRate: number;
    priceCompetitiveness: number;
  };
  workflowMilestones: {
    onboarded: boolean;
    linkedToProducts: boolean;
    poIssued: boolean;
    dispatchReady: boolean;
    claimsVerified: boolean;
  };
  orders: {
    id: string;
    date: string;
    status: 'Draft' | 'Sent' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
    amount: number;
    type: 'PO' | 'POD';
  }[];
  history: {
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
}

interface Product {
  id: string;
  recordId?: string;
  name: string;
  sku: string;
  category: string;
  productType?: string;
  status: 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
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
  media: ProductMedia[];
  specs: Record<string, string>;
  history: { date: string; action: string; user: string }[];
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

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'VND_001',
    name: 'Global Tiles Co.',
    logo: 'https://picsum.photos/seed/globaltiles/100/100',
    status: 'Active',
    type: 'Manufacturer',
    capabilities: ['Ceramic', 'Porcelain', 'Large Format'],
    region: 'Italy / Emilia-Romagna',
    leadTime: '4-6 Weeks',
    productCount: 142,
    rating: 4.8,
    contacts: [
      { department: 'Sales', name: 'Marco Rossi', email: 'marco@globaltiles.it', phone: '+39 0536 123456', preferredChannel: 'Email', notes: 'Primary account manager' },
      { department: 'Accounts', name: 'Giulia Conti', email: 'accounts@globaltiles.it', phone: '+39 0536 112233', preferredChannel: 'Email', notes: 'Invoicing and statements' },
      { department: 'Dispatch', name: 'Luca Bianchi', email: 'logistics@globaltiles.it', phone: '+39 0536 654321', preferredChannel: 'Phone', notes: 'Warehouse and shipping coordination' },
      { department: 'POD/Claims', name: 'Elena Ferrari', email: 'claims@globaltiles.it', phone: '+39 0536 445566', preferredChannel: 'Portal', notes: 'Damage reports and POD requests' },
      { department: 'Management', name: 'Roberto Mancini', email: 'r.mancini@globaltiles.it', phone: '+39 0536 778899', preferredChannel: 'Email', notes: 'Escalations only' }
    ],
    terms: { payment: 'Net 60', delivery: 'FOB Genoa', moq: '1 Pallet', currency: 'EUR', incoterms: 'FOB' },
    performance: { onTimeDelivery: 94, qualityScore: 98, returnRate: 1.2, priceCompetitiveness: 85 },
    workflowMilestones: {
      onboarded: true,
      linkedToProducts: true,
      poIssued: true,
      dispatchReady: true,
      claimsVerified: true
    },
    orders: [
      { id: 'PO-2024-001', date: '2024-03-15', status: 'Shipped', amount: 12450.00, type: 'PO' },
      { id: 'POD-2024-001', date: '2024-03-20', status: 'Delivered', amount: 12450.00, type: 'POD' },
      { id: 'PO-2024-042', date: '2024-03-25', status: 'Confirmed', amount: 8900.00, type: 'PO' }
    ],
    history: [
      { date: '2024-03-20', action: 'Price List Updated', user: 'System', details: 'Updated 142 SKU prices' },
      { date: '2024-03-10', action: 'Terms Renegotiated', user: 'Marcus Thorne', details: 'Payment terms changed from Net 30 to Net 60' },
      { date: '2024-02-15', action: 'Quality Audit Passed', user: 'Quality Team', details: 'Score: 98/100' }
    ]
  },
  {
    id: 'VND_002',
    name: 'Brick Masters Ltd.',
    logo: 'https://picsum.photos/seed/brickmasters/100/100',
    status: 'Restocking',
    type: 'Manufacturer',
    capabilities: ['Reclaimed Brick', 'Handmade Brick', 'Slips'],
    region: 'UK / Midlands',
    leadTime: '2-3 Weeks',
    productCount: 45,
    rating: 4.5,
    blocker: 'Production Delay on Red Blends',
    contacts: [
      { department: 'Sales', name: 'Sarah Jenkins', email: 'sarah@brickmasters.co.uk', phone: '+44 121 987 6543', preferredChannel: 'Phone', notes: 'Direct line' },
      { department: 'Accounts', name: 'Tom Baker', email: 'finance@brickmasters.co.uk', phone: '+44 121 987 6544', preferredChannel: 'Email' },
      { department: 'Dispatch', name: 'Mick Miller', email: 'dispatch@brickmasters.co.uk', phone: '+44 121 987 6545', preferredChannel: 'WhatsApp', notes: 'Best for quick updates' }
    ],
    terms: { payment: 'Net 30', delivery: 'DDP London', moq: '5 Pallets', currency: 'GBP', incoterms: 'DDP' },
    performance: { onTimeDelivery: 88, qualityScore: 92, returnRate: 2.5, priceCompetitiveness: 78 },
    workflowMilestones: {
      onboarded: true,
      linkedToProducts: true,
      poIssued: true,
      dispatchReady: false,
      claimsVerified: true
    },
    orders: [
      { id: 'PO-2024-012', date: '2024-03-10', status: 'Delivered', amount: 4500.00, type: 'PO' }
    ],
    history: [
      { date: '2024-03-22', action: 'Status Changed to Restocking', user: 'System', details: 'Inventory below threshold' }
    ]
  },
  {
    id: 'VND_003',
    name: 'Ceramic Solutions',
    logo: 'https://picsum.photos/seed/ceramicsolutions/100/100',
    status: 'Active',
    type: 'Distributor',
    capabilities: ['Mosaics', 'Feature Tiles', 'Grout'],
    region: 'Spain / Castellón',
    leadTime: '1-2 Weeks',
    productCount: 310,
    rating: 4.9,
    contacts: [
      { department: 'Accounts', name: 'Elena Garcia', email: 'accounts@ceramicsol.es', phone: '+34 964 112233' }
    ],
    terms: { payment: 'Net 45', delivery: 'EXW Castellón', moq: 'No MOQ', currency: 'EUR', incoterms: 'EXW' },
    performance: { onTimeDelivery: 99, qualityScore: 99, returnRate: 0.5, priceCompetitiveness: 92 },
    workflowMilestones: {
      onboarded: true,
      linkedToProducts: true,
      poIssued: true,
      dispatchReady: true,
      claimsVerified: true
    },
    orders: [
      { id: 'PO-2024-005', date: '2024-03-01', status: 'Delivered', amount: 2100.00, type: 'PO' }
    ],
    history: [
      { date: '2024-03-05', action: 'New Catalog Imported', user: 'Elena Garcia', details: 'Added 45 new mosaic SKUs' }
    ]
  },
  {
    id: 'VND_004',
    name: 'Stone & Clay Inc.',
    logo: 'https://picsum.photos/seed/stoneclay/100/100',
    status: 'Delayed',
    type: 'Wholesaler',
    capabilities: ['Natural Stone', 'Terracotta', 'Paving'],
    region: 'Turkey / Izmir',
    leadTime: '8-10 Weeks',
    productCount: 88,
    rating: 3.8,
    blocker: 'Customs Clearance Hold',
    contacts: [
      { department: 'Export', name: 'Ahmet Yilmaz', email: 'export@stoneclay.com.tr', phone: '+90 232 444 5566' }
    ],
    terms: { payment: '30% Deposit, 70% BL', delivery: 'CIF Felixstowe', moq: '1 Container', currency: 'USD', incoterms: 'CIF' },
    performance: { onTimeDelivery: 72, qualityScore: 85, returnRate: 4.2, priceCompetitiveness: 95 },
    workflowMilestones: {
      onboarded: true,
      linkedToProducts: true,
      poIssued: true,
      dispatchReady: false,
      claimsVerified: false
    },
    orders: [
      { id: 'PO-2024-002', date: '2024-02-15', status: 'Shipped', amount: 35000.00, type: 'PO' }
    ],
    history: [
      { date: '2024-03-18', action: 'Shipment Delayed', user: 'System', details: 'Vessel delayed at port' }
    ]
  },
  {
    id: 'VND_005',
    name: 'Nordic Minimal',
    logo: 'https://picsum.photos/seed/nordic/100/100',
    status: 'Onboarding',
    type: 'Manufacturer',
    capabilities: ['Concrete Look', 'Terrazzo', 'Large Format'],
    region: 'Denmark / Copenhagen',
    leadTime: 'TBD',
    productCount: 0,
    rating: 0,
    blocker: 'Awaiting Tax Documents',
    contacts: [
      { department: 'Onboarding', name: 'Lars Nielsen', email: 'lars@nordicminimal.dk', phone: '+45 33 11 22 33' }
    ],
    terms: { payment: 'TBD', delivery: 'TBD', moq: 'TBD', currency: 'EUR', incoterms: 'TBD' },
    performance: { onTimeDelivery: 0, qualityScore: 0, returnRate: 0, priceCompetitiveness: 0 },
    workflowMilestones: {
      onboarded: true,
      linkedToProducts: false,
      poIssued: false,
      dispatchReady: false,
      claimsVerified: false
    },
    orders: [],
    history: [
      { date: '2024-03-25', action: 'Onboarding Started', user: 'Marcus Thorne', details: 'Initial contact made' }
    ]
  }
];

const MOCK_FINANCE_RECORDS: FinanceRecord[] = [
  {
    id: 'INV_2026_001',
    orderId: 'ORD_4421',
    customerName: 'Mike Ross',
    type: 'Receivable',
    category: 'Invoice',
    status: 'Overdue',
    amount: 5400.00,
    balance: 5400.00,
    dueDate: '2026-03-20',
    issueDate: '2026-03-06',
    margin: {
      sellingValue: 5400.00,
      productCost: 3200.00,
      logisticsCost: 450.00,
      otherCosts: 100.00,
      projectedMargin: 1650.00,
      realizedMargin: 0,
      status: 'Healthy'
    },
    exceptions: ['Overdue Payment'],
    workflowNode: 'payment.mismatch'
  },
  {
    id: 'INV_2026_002',
    orderId: 'ORD_5512',
    customerName: 'Katrina Bennett',
    type: 'Receivable',
    category: 'Invoice',
    status: 'Partial',
    amount: 12450.00,
    balance: 6225.00,
    dueDate: '2026-04-10',
    issueDate: '2026-03-25',
    margin: {
      sellingValue: 12450.00,
      productCost: 8100.00,
      logisticsCost: 1200.00,
      otherCosts: 250.00,
      projectedMargin: 2900.00,
      realizedMargin: 1450.00,
      status: 'Healthy'
    }
  },
  {
    id: 'PO_2026_042',
    orderId: 'ORD_4421',
    customerName: 'Ceramic Solutions SL',
    type: 'Payable',
    category: 'PO',
    status: 'Committed',
    amount: 3200.00,
    balance: 3200.00,
    dueDate: '2026-04-15',
    issueDate: '2026-03-25',
    workflowNode: 'po.issued'
  },
  {
    id: 'LOG_2026_012',
    orderId: 'ORD_4421',
    customerName: 'Global Logistics',
    type: 'Payable',
    category: 'Logistics',
    status: 'Pending',
    amount: 450.00,
    balance: 450.00,
    dueDate: '2026-04-20',
    issueDate: '2026-03-26',
    exceptions: ['Missing Logistics Invoice'],
    workflowNode: 'logistics.cost.confirmed'
  },
  {
    id: 'INV_2026_003',
    orderId: 'ORD_9928',
    customerName: 'Sarah Smith',
    type: 'Receivable',
    category: 'Invoice',
    status: 'Paid',
    amount: 2100.00,
    balance: 0,
    dueDate: '2026-03-25',
    issueDate: '2026-03-11',
    margin: {
      sellingValue: 2100.00,
      productCost: 1800.00,
      logisticsCost: 400.00,
      otherCosts: 50.00,
      projectedMargin: -150.00,
      realizedMargin: -150.00,
      status: 'Negative'
    },
    exceptions: ['Negative Margin'],
    workflowNode: 'margin.threshold.breached'
  },
  {
    id: 'INV_2026_004',
    orderId: 'ORD_1122',
    customerName: 'James Wilson',
    type: 'Receivable',
    category: 'Invoice',
    status: 'Mismatch',
    amount: 4500.00,
    balance: 4500.00,
    dueDate: '2026-04-01',
    issueDate: '2026-03-15',
    exceptions: ['Payment Mismatch'],
    workflowNode: 'payment.mismatch'
  },
  {
    id: 'PO_2026_045',
    orderId: 'ORD_5512',
    customerName: 'Italian Stone Co',
    type: 'Payable',
    category: 'PO',
    status: 'Flagged',
    amount: 8100.00,
    balance: 8100.00,
    dueDate: '2026-04-10',
    issueDate: '2026-03-20',
    exceptions: ['Missing Supplier Invoice'],
    workflowNode: 'po.issued'
  },
  {
    id: 'INV_2026_005',
    orderId: 'ORD_3344',
    customerName: 'Emily Davis',
    type: 'Receivable',
    category: 'Credit',
    status: 'Pending',
    amount: 250.00,
    balance: 250.00,
    dueDate: '2026-04-05',
    issueDate: '2026-03-28',
    exceptions: ['Credit Note Needed'],
    workflowNode: 'credit.requested'
  }
];

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

  const categories = ['All', 'Brick', 'Tile', 'Luxury', 'Stone', 'Paver'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory || p.productType === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-white tracking-tight">Product Catalog</h2>
          <p className="text-sm text-white/40 mt-1">Manage your deterministic product data and media assets.</p>
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
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-white/40">Stock: <span className={product.stock < product.minStock ? 'text-rose-400' : 'text-white/60'}>{product.stock} units</span></span>
                  <span className="text-sm font-medium text-white">£{product.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff88]" style={{ width: `${product.catalogHealth}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{product.catalogHealth}% Health</span>
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
  isOpen, 
  onClose,
  activeTab,
  onTabChange,
  onManageAssets
}: { 
  product: Product | null, 
  isOpen: boolean, 
  onClose: () => void,
  activeTab: string,
  onTabChange: (tab: string) => void,
  onManageAssets: () => void
}) => {
  if (!product) return null;

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
                  onClick={onManageAssets}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all flex items-center gap-2"
                >
                  <Image size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Assets</span>
                </button>
                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all">
                  <Edit size={18} />
                </button>
                <button className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all">
                  Publish to Store
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
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Stock Level</p>
                      <p className={`text-2xl font-medium ${product.stock < product.minStock ? 'text-rose-400' : 'text-white'}`}>{product.stock}</p>
                      <p className="text-[10px] text-white/20 mt-1">Min: {product.minStock}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Unit Price</p>
                      <p className="text-2xl font-medium text-white">£{product.price.toFixed(2)}</p>
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
                        { label: 'High-Res Hero Image', ready: product.assetReadiness >= 25 },
                        { label: 'Technical Specifications', ready: true },
                        { label: '3D Model (PBR)', ready: product.threedReadiness === 100 },
                        { label: 'Marketing Copy', ready: product.marketingReadiness >= 50 },
                        { label: 'Installation Gallery', ready: product.assetReadiness >= 75 },
                        { label: 'Supplier Linkage', ready: product.suppliersCount > 0 },
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
                    <p className="text-sm text-white/60 leading-relaxed">
                      A premium {product.category.toLowerCase()} product designed for high-end architectural applications. 
                      Crafted from {product.specs.Material.toLowerCase()} with a {product.specs.Finish.toLowerCase()} finish, 
                      this item represents the pinnacle of BTS quality standards.
                    </p>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                    <Settings size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Module Under Construction</h3>
                    <p className="text-sm text-white/40 mt-1 max-w-xs">We are currently building the {activeTab} surface for the Inventory OS.</p>
                  </div>
                </div>
              )}
            </div>
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
 data: { label: 'Meta Ads Manager', category: 'DEMAND', icon: Share2, logic: 'IF lead_captured THEN trigger_webhook(n8n_flow_01)' } 
 },
 { 
 id: 'whatsapp', 
 type: 'businessStep', 
 position: { x: 50, y: 200 }, 
 data: { label: 'WhatsApp API', category: 'DEMAND', icon: Phone, logic: 'IF incoming_msg THEN parse_intent(gpt-4) -> route_to(comms)' } 
 },
 { 
 id: 'tiktok', 
 type: 'businessStep', 
 position: { x: 50, y: 300 }, 
 data: { label: 'TikTok Shop Sync', category: 'DEMAND', icon: Globe, logic: 'IF order_placed THEN sync_inventory -> create_draft_order' } 
 },
 { 
 id: 'email', 
 type: 'businessStep', 
 position: { x: 50, y: 400 }, 
 data: { label: 'Outlook / Gmail', category: 'DEMAND', icon: Mail, logic: 'IF inquiry_received THEN extract_contact -> push_to_crm' } 
 },

 // --- Marketing Subsystem (Workflow Nodes) ---
 { 
 id: 'mkt_assets', 
 type: 'businessStep', 
 position: { x: 400, y: -100 }, 
 data: { label: 'Asset Lab (AI)', category: 'MARKETING', icon: Image, logic: 'IF new_inventory_data THEN generate_creative_variants(gemini-2.5-flash-image)' } 
 },
 { 
 id: 'mkt_templates', 
 type: 'businessStep', 
 position: { x: 700, y: -100 }, 
 data: { label: 'Template Engine', category: 'MARKETING', icon: LayoutDashboard, logic: 'IF asset_approved THEN apply_brand_blueprint -> generate_final_render' } 
 },
 { 
 id: 'mkt_campaigns', 
 type: 'businessStep', 
 position: { x: 1000, y: -100 }, 
 data: { label: 'Campaign Engine', category: 'MARKETING', icon: Megaphone, logic: 'IF campaign_triggered THEN assemble_payload -> notify_scheduler' } 
 },
 { 
 id: 'mkt_calendar', 
 type: 'businessStep', 
 position: { x: 1300, y: -100 }, 
 data: { label: 'Calendar Scheduler', category: 'MARKETING', icon: Calendar, logic: 'IF payload_received THEN find_optimal_slot -> lock_schedule' } 
 },
 { 
 id: 'mkt_publishing', 
 type: 'businessStep', 
 position: { x: 1600, y: -100 }, 
 data: { label: 'Publishing Queue', category: 'MARKETING', icon: ListOrdered, logic: 'IF schedule_reached THEN execute_publish -> verify_live_status' } 
 },
 { 
 id: 'mkt_connectors', 
 type: 'businessStep', 
 position: { x: 1900, y: -100 }, 
 data: { label: 'Channel Connectors', category: 'MARKETING', icon: Link, logic: 'IF publish_ready THEN push_to_api(meta|tiktok|wa) -> return_tracking_id' } 
 },
 { 
 id: 'mkt_analytics', 
 type: 'businessStep', 
 position: { x: 2200, y: -100 }, 
 data: { label: 'Marketing Analytics', category: 'MARKETING', icon: BarChart3, logic: 'IF post_live THEN track_engagement -> update_roas_model' } 
 },

 // --- Core Operations ---
 { 
 id: 'comms', 
 type: 'businessStep', 
 position: { x: 400, y: 250 }, 
 data: { label: 'Neural Comms Hub', category: 'HUB', icon: MessageSquare, logic: 'CENTRAL_TRIAGE: Aggregate all streams -> Assign Agent' } 
 },
 { 
 id: 'sales', 
 type: 'businessStep', 
 position: { x: 700, y: 250 }, 
 data: { label: 'Sales Engine (ERP)', category: 'SALES', icon: FileText, logic: 'IF quote_accepted THEN trigger_payment_link(stripe) -> PUSH_DATA(mkt_assets)' } 
 },
 { 
 id: 'supply', 
 type: 'businessStep', 
 position: { x: 1000, y: 250 }, 
 data: { label: 'Supply Chain PO', category: 'SUPPLY', icon: Box, logic: 'IF payment_success THEN auto_generate_po -> notify_vendor' } 
 },
 { 
 id: 'logistics', 
 type: 'businessStep', 
 position: { x: 1300, y: 250 }, 
 data: { label: 'Logistics OS', category: 'LOGISTICS', icon: Truck, logic: 'IF po_confirmed THEN book_delivery(truck_os) -> send_tracking' } 
 },
 { 
 id: 'fulfillment', 
 type: 'businessStep', 
 position: { x: 1600, y: 250 }, 
 data: { label: 'Fulfillment POD', category: 'SUPPORT', icon: CheckCircle2, logic: 'IF pod_signed THEN finalize_invoice -> archive_order' } 
 },
 { 
 id: 'marketing_ai', 
 type: 'businessStep', 
 position: { x: 1900, y: 150 }, 
 data: { label: 'Post-Sale Marketing', category: 'MARKETING', icon: Megaphone, logic: 'POST_SALE: Trigger review_request -> Update LTV' } 
 },
 { 
 id: 'finance', 
 type: 'businessStep', 
 position: { x: 1900, y: 350 }, 
 data: { label: 'Finance Ledger', category: 'HUB', icon: BarChart3, logic: 'RECONCILIATION: Sync all transactions -> Xero/Quickbooks' } 
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

const AddProductWizard = ({
  isOpen,
  onClose,
  onCreateProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: (input: {
    name: string;
    sku: string;
    productType: string;
    commercialCategory: string;
    description: string;
    sellPrice?: number;
    unit?: string;
    dimensions?: string;
    weightKg?: number;
    reorderPoint?: number;
    initialStock?: number;
  }) => Promise<void>;
}) => {
  const [step, setStep] = useState(1);
  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    category: 'Brick',
    description: '',
    price: '',
    unit: 'm2',
    supplier: '',
    dimensions: '',
    weight: '',
    stockLevel: 0,
    minStock: 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setSubmitError(null);
    setIsSubmitting(false);
    setProductData({
      name: '',
      sku: '',
      category: 'Brick',
      description: '',
      price: '',
      unit: 'm2',
      supplier: '',
      dimensions: '',
      weight: '',
      stockLevel: 0,
      minStock: 100,
    });
  }, [isOpen]);

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
          className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Product Wizard</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Add New Product</h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex h-1 bg-white/5">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`flex-1 transition-all duration-500 ${s <= step ? 'bg-blue-400' : 'bg-transparent'}`} 
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-10 min-h-[400px]">
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
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">SKU / Reference</label>
                    <input 
                      type="text" 
                      value={productData.sku}
                      onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="BTS-BRK-001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category</label>
                  <select 
                    value={productData.category}
                    onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                  >
                    <option value="Brick">Brick</option>
                    <option value="Tile">Tile</option>
                    <option value="Paver">Paver</option>
                    <option value="Stone">Stone</option>
                  </select>
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
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Base Price (£)</label>
                    <input 
                      type="text" 
                      value={productData.price}
                      onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Unit</label>
                    <select 
                      value={productData.unit}
                      onChange={(e) => setProductData({ ...productData, unit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                    >
                      <option value="m2">Per m2</option>
                      <option value="piece">Per Piece</option>
                      <option value="pallet">Per Pallet</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Dimensions</label>
                    <input 
                      type="text" 
                      value={productData.dimensions}
                      onChange={(e) => setProductData({ ...productData, dimensions: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. 215 x 102.5 x 65mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Weight (kg)</label>
                    <input 
                      type="text" 
                      value={productData.weight}
                      onChange={(e) => setProductData({ ...productData, weight: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. 2.4"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="bg-blue-400/5 border border-blue-400/10 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-blue-400/10 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-4 border border-blue-400/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-white uppercase tracking-tight">Ready to Initialize</h3>
                  <p className="text-sm text-white/40 mt-2">The product will be created with placeholder asset slots. You can upload media and 3D models in the next step.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Stock</div>
                    <div className="text-lg font-bold text-white">0</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-lg font-bold text-blue-400">DRAFT</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                    <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Health</div>
                    <div className="text-lg font-bold text-amber-400">0%</div>
                  </div>
                </div>
                {submitError && (
                  <p className="text-xs text-red-400 text-center">{submitError}</p>
                )}
              </motion.div>
            )}
          </div>

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
                  if (step < 3) {
                    setStep(step + 1);
                    return;
                  }

                  setIsSubmitting(true);
                  setSubmitError(null);

                  try {
                    await onCreateProduct({
                      name: productData.name,
                      sku: productData.sku,
                      productType: productData.category,
                      commercialCategory: productData.category === 'Stone' ? 'Luxury' : 'Premium',
                      description: productData.description,
                      sellPrice: productData.price ? Number(productData.price) : undefined,
                      unit: productData.unit,
                      dimensions: productData.dimensions || undefined,
                      weightKg: productData.weight ? Number(productData.weight) : undefined,
                      reorderPoint: productData.minStock,
                      initialStock: productData.stockLevel,
                    });
                    onClose();
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : 'Failed to create product.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]"
              >
                {isSubmitting ? 'Creating...' : step === 3 ? 'Create Product' : 'Next Step'}
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
  onImportPriceList: (input: {
    fileName: string;
    sourceType: 'csv' | 'xlsx' | 'json' | 'manual';
    rows: {
      sku: string;
      name: string;
      productType: string;
      commercialCategory: string;
      collection?: string;
      description?: string;
      sellPrice?: number;
      unitCost?: number;
      currency?: string;
      unit?: string;
      tags?: string[];
    }[];
  }) => Promise<unknown>;
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

        const productType = String(
          normalized.producttype ??
            normalized.product_type ??
            normalized.category ??
            'Brick',
        ).trim() || 'Brick';

        const commercialCategory = String(
          normalized.commercialcategory ??
            normalized.commercial_category ??
            (productType === 'Stone' ? 'Luxury' : 'Premium'),
        ).trim() || (productType === 'Stone' ? 'Luxury' : 'Premium');

        const tagsValue = normalized.tags;
        const tags = Array.isArray(tagsValue)
          ? tagsValue.map((value) => String(value))
          : typeof tagsValue === 'string'
          ? tagsValue.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined;

        const sellPriceValue = normalized.sellprice ?? normalized.sell_price ?? normalized.price;
        const unitCostValue = normalized.unitcost ?? normalized.unit_cost ?? normalized.cost;

        return {
          sku: String(normalized.sku ?? '').trim(),
          name: String(normalized.name ?? '').trim(),
          productType,
          commercialCategory,
          collection: String(normalized.collection ?? normalized.range ?? '').trim() || undefined,
          description: String(normalized.description ?? '').trim() || undefined,
          sellPrice: sellPriceValue !== undefined && sellPriceValue !== '' ? Number(sellPriceValue) : undefined,
          unitCost: unitCostValue !== undefined && unitCostValue !== '' ? Number(unitCostValue) : undefined,
          currency: String(normalized.currency ?? 'GBP').trim() || 'GBP',
          unit: String(normalized.unit ?? 'm2').trim() || 'm2',
          tags,
        };
      })
      .filter((row) => row.sku && row.name);
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
      let rows: {
        sku: string;
        name: string;
        productType: string;
        commercialCategory: string;
        collection?: string;
        description?: string;
        sellPrice?: number;
        unitCost?: number;
        currency?: string;
        unit?: string;
        tags?: string[];
      }[] = [];

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
                  <p className="text-sm text-white/40 mt-2">Support for .csv, .xlsx, and .json formats.</p>
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

const ManageAssetsWizard = ({
  isOpen,
  onClose,
  product,
  assets,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  assets: Asset[];
}) => {
  if (!isOpen || !product) return null;

  const storageUsedMb = assets.reduce((total, asset) => {
    const numericValue = Number.parseFloat(asset.size.replace(/[^0-9.]/g, ''));
    return total + (Number.isFinite(numericValue) ? numericValue : 0);
  }, 0);

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
          className="w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Image size={12} className="text-blue-400" />
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Asset Management</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">{product.name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 h-[500px]">
            <div className="col-span-1 border-r border-white/5 p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Asset Roles</h3>
              <div className="space-y-2">
                {['Hero Image', 'Gallery', 'Installation', 'Detail/Texture', '3D Model', 'PBR Material'].map((role) => (
                  <button key={role} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-400/30 transition-all text-left group">
                    <span className="text-xs font-medium text-white/60 group-hover:text-white">{role}</span>
                    <Plus size={14} className="text-white/20 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="col-span-2 p-8 overflow-y-auto custom-scrollbar bg-black/20">
              <div className="grid grid-cols-2 gap-6">
                {assets.map((asset) => (
                  <div key={asset.id} className="group relative aspect-square bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-blue-400/50 transition-all">
                    <img src={asset.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white uppercase tracking-widest">{asset.name}</span>
                        <div className="flex gap-2">
                          <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Edit size={12} /></button>
                          <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"><X size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="aspect-square bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-white/20 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-400/5 transition-all group">
                  <Plus size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Upload Asset</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Storage Used</span>
                <span className="text-xs font-mono text-white/60 uppercase tracking-widest">{storageUsedMb.toFixed(1)} MB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Asset Count</span>
                <span className="text-xs font-mono text-white/60 uppercase tracking-widest">{assets.length} / 12</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Inventory3DAssets = ({
  products,
  dashboard,
  onProductClick,
}: {
  products: Product[];
  dashboard: InventoryDashboardSnapshot | null;
  onProductClick: (product: Product) => void;
}) => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-medium text-white tracking-tight uppercase">3D Asset Pipeline</h2>
          <p className="text-sm text-white/40 mt-1">Manage PBR materials, 3D models, and digital twins for the immersive storefront.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Global 3D Readiness</span>
            <span className="text-xl font-mono text-blue-400 font-bold">{dashboard?.summary.globalThreedReadiness.toFixed(1) ?? '0.0'}%</span>
          </div>
          <button className="px-6 py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]">
            Batch Process Renders
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div 
            key={product.id}
            onClick={() => onProductClick(product)}
            className="group bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-400/30 transition-all cursor-pointer"
          >
            <div className="aspect-video relative overflow-hidden bg-white/5">
              <img 
                src={product.img} 
                alt={product.name}
                className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 group-hover:text-blue-400 group-hover:scale-110 transition-all">
                  <Box size={20} />
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${
                  product.threedReadiness === 100 ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' :
                  product.threedReadiness > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {product.threedReadiness === 100 ? 'Ready' : product.threedReadiness > 0 ? 'In Progress' : 'Missing'}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{product.name}</h3>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{product.sku}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-white/60">{product.threedReadiness}%</div>
                  <div className="w-16 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${product.threedReadiness}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'PBR', status: product.threedReadiness > 50 },
                  { label: 'Model', status: product.threedReadiness > 80 },
                  { label: 'Renders', status: product.threedReadiness === 100 },
                ].map(asset => (
                  <div key={asset.label} className={`p-2 rounded-lg border text-center transition-colors ${
                    asset.status ? 'bg-blue-400/5 border-blue-400/20 text-blue-400' : 'bg-white/5 border-white/5 text-white/20'
                  }`}>
                    <div className="text-[8px] font-bold uppercase tracking-widest">{asset.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InventoryInsights = ({
  dashboard,
  products,
}: {
  dashboard: InventoryDashboardSnapshot | null;
  products: Product[];
}) => {
  const velocitySeries = dashboard?.velocitySeries ?? [];
  const categoryDistribution = dashboard?.categoryDistribution ?? [];
  const assetRoi = dashboard?.assetRoi;
  const topPerformers = dashboard?.topPerformers ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-2xl font-medium text-white tracking-tight uppercase">Inventory Insights</h2>
        <p className="text-sm text-white/40 mt-1">Predictive stock analytics and asset performance metrics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest">Stock Velocity vs Demand</h3>
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
            <div className="h-64 flex items-end gap-2">
              {velocitySeries.map((series, i) => (
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
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Asset ROI Metrics</h3>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">3D Conversion Lift</div>
                  <div className="text-2xl font-bold text-[#00ff88]">+{assetRoi?.conversionLift.toFixed(1) ?? '0.0'}%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">Sample Request Rate</div>
                  <div className="text-2xl font-bold text-blue-400">{assetRoi?.sampleRequestRate.toFixed(1) ?? '0.0'}%</div>
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
              <h3 className="text-xs font-bold uppercase tracking-widest">AI Stock Predictor</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-6">Based on the live stock ledger and supplier lead times, we predict a stock-out risk for <span className="text-white font-bold">{dashboard?.lowStockAlerts[0]?.id ?? products[0]?.id ?? 'N/A'}</span> in the next replenishment cycle.</p>
            <button className="w-full py-3 bg-blue-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-300 transition-all">
              Auto-Replenish
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
  if (!record) return null;

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

const CRMDashboard = ({ onResolveAll }: { onResolveAll?: () => void }) => {
  const [isResolving, setIsResolving] = useState(false);
  const metrics = [
    { label: 'Total Customers', value: '1,284', trend: '+12%', icon: Users, color: 'text-[#00ff88]' },
    { label: 'Active Leads', value: '42', trend: '+5%', icon: Zap, color: 'text-amber-400' },
    { label: 'Conversion Rate', value: '18.4%', trend: '+2.1%', icon: BarChart3, color: 'text-blue-400' },
    { label: 'Overdue Follow-ups', value: '8', trend: '-2', icon: Clock, color: 'text-red-400' },
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
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download size={14} /> Export Data
          </button>
          <button className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <UserPlus size={14} /> Add Customer
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((stat) => (
          <div key={stat.label} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-[#00ff88]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 bg-white/5 rounded-xl ${stat.color} group-hover:bg-[#00ff88] group-hover:text-black transition-all`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-mono ${stat.trend.startsWith('+') ? 'text-[#00ff88]' : 'text-red-400'}`}>{stat.trend}</span>
            </div>
            <div className="text-4xl font-bold font-mono tracking-tighter mb-2 relative z-10">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 relative z-10">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Interactions</h3>
            <button className="text-[10px] text-[#00ff88] uppercase tracking-widest hover:underline font-bold">View History</button>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { customer: 'John Doe', action: 'Quote Requested', time: '2 mins ago', status: 'Pending' },
              { customer: 'Sarah Smith', action: 'Order Confirmed', time: '15 mins ago', status: 'Success' },
              { customer: 'Mike Ross', action: 'Support Ticket', time: '1 hour ago', status: 'Warning' },
              { customer: 'Rachel Zane', action: 'Lead Captured', time: '3 hours ago', status: 'Info' },
            ].map((item, i) => (
              <div key={i} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-sm font-bold border border-white/10 group-hover:border-[#00ff88]/30 transition-all">
                    {item.customer.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-[#00ff88] transition-colors">{item.customer}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{item.action}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-white/20 mb-2">{item.time}</div>
                  <div className={`inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    item.status === 'Success' ? 'bg-[#00ff88]/5 text-[#00ff88] border-[#00ff88]/10' :
                    item.status === 'Warning' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' :
                    item.status === 'Pending' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                    'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      item.status === 'Success' ? 'bg-[#00ff88]' :
                      item.status === 'Warning' ? 'bg-amber-400' :
                      item.status === 'Pending' ? 'bg-blue-400' :
                      'bg-white/40'
                    }`} />
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 flex flex-col relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Zap size={160} className="text-[#00ff88]" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8">Readiness Issues</h3>
          <div className="space-y-8 flex-1">
            {[
              { label: 'Missing Delivery Addresses', count: 12, color: 'bg-red-500' },
              { label: 'Pending VAT Verifications', count: 5, color: 'bg-amber-500' },
              { label: 'Access Checklists Needed', count: 8, color: 'bg-blue-500' },
              { label: 'Unlinked Lead Sources', count: 3, color: 'bg-purple-500' },
            ].map((issue) => (
              <div key={issue.label} className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-white/40">{issue.label}</span>
                  <span className="text-white font-mono">{issue.count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${issue.color} opacity-40`} style={{ width: `${(issue.count / 15) * 100}%` }} />
                </div>
              </div>
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

const CRMQueue = ({ onCustomerClick }: { onCustomerClick: (customer: Customer) => void }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const categories = [
    { id: 'All', label: 'All Tasks', icon: ListTodo, count: 18 },
    { id: 'Overdue', label: 'Overdue', icon: AlertCircle, count: 5, color: 'text-red-500' },
    { id: 'Due Today', label: 'Due Today', icon: Clock, count: 7, color: 'text-amber-400' },
    { id: 'Missing Info', label: 'Missing Info', icon: AlertTriangle, count: 8, color: 'text-blue-400' },
    { id: 'Quote Waiting', label: 'Quote Waiting', icon: FileText, count: 4, color: 'text-purple-400' },
    { id: 'Payment Follow-up', label: 'Payment Follow-up', icon: DollarSign, count: 3, color: 'text-[#00ff88]' },
    { id: 'Delivery Follow-up', label: 'Delivery Follow-up', icon: Truck, count: 2, color: 'text-cyan-400' },
  ];

  const queueItems = [
    { id: 'Q_001', customer: 'John Doe', type: 'Missing Access Checklist', priority: 'High', due: 'Overdue', detail: 'Access checklist required for delivery to London SE1', category: 'Missing Info' },
    { id: 'Q_002', customer: 'Sarah Smith', type: 'Quote Follow-up', priority: 'Medium', due: 'Today', detail: 'Follow up on Quote #QT-9928 sent 3 days ago', category: 'Quote Waiting' },
    { id: 'Q_003', customer: 'Rachel Zane', type: 'Missing Delivery Address', priority: 'High', due: 'Overdue', detail: 'Delivery address not confirmed for pending order', category: 'Missing Info' },
    { id: 'Q_004', customer: 'Mike Ross', type: 'Payment Follow-up', priority: 'High', due: 'Today', detail: 'Final balance payment for Order #ORD-4421', category: 'Payment Follow-up' },
    { id: 'Q_005', customer: 'Harvey Specter', type: 'Missing VAT Details', priority: 'Medium', due: 'Tomorrow', detail: 'VAT exemption certificate required for Trade account', category: 'Missing Info' },
    { id: 'Q_006', customer: 'Donna Paulsen', type: 'Delivery Follow-up', priority: 'Low', due: 'Today', detail: 'Confirm delivery window for tomorrow morning', category: 'Delivery Follow-up' },
    { id: 'Q_007', customer: 'Louis Litt', type: 'Missing Contact Channel', priority: 'High', due: 'Today', detail: 'Preferred contact method not set for high-value lead', category: 'Missing Info' },
    { id: 'Q_008', customer: 'Jessica Pearson', type: 'Quote Follow-up', priority: 'High', due: 'Overdue', detail: 'Large commercial quote #QT-1002 pending response', category: 'Quote Waiting' },
    { id: 'Q_009', customer: 'Robert Zane', type: 'Missing VAT Details', priority: 'Medium', due: 'Today', detail: 'Verify VAT status for architectural firm registration', category: 'Missing Info' },
    { id: 'Q_010', customer: 'Katrina Bennett', type: 'Payment Follow-up', priority: 'Medium', due: 'Today', detail: 'Deposit required for custom slab order #ORD-5512', category: 'Payment Follow-up' },
    { id: 'Q_011', customer: 'Alex Williams', type: 'Missing Access Checklist', priority: 'Low', due: 'Tomorrow', detail: 'Site access details needed for residential project', category: 'Missing Info' },
    { id: 'Q_012', customer: 'Samantha Wheeler', type: 'Delivery Follow-up', priority: 'High', due: 'Overdue', detail: 'Delivery delayed due to site access issues. Action required.', category: 'Delivery Follow-up' },
  ];

  const filteredItems = activeCategory === 'All' 
    ? queueItems 
    : queueItems.filter(item => item.category === activeCategory || item.due === activeCategory);

  const handleCustomerClick = (name: string) => {
    const customer = MOCK_CUSTOMERS.find(c => c.name === name);
    if (customer) onCustomerClick(customer);
  };

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
              className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.02] transition-colors group flex items-center gap-8 shadow-xl"
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
                    onClick={() => handleCustomerClick(item.customer)}
                    className="text-sm font-bold text-white truncate group-hover:text-[#00ff88] transition-colors cursor-pointer"
                  >
                    {item.customer}
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

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-4 py-2 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]/20 transition-all">
                  Resolve
                </button>
                <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all">
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

const CRMPipeline = ({ onCustomerClick }: { onCustomerClick: (customer: Customer) => void }) => {
  const stages: CustomerStage[] = ['Lead', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];
  
  return (
    <div className="h-full flex flex-col space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Sales Pipeline</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Revenue Flow Monitor</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-[#00ff88] tracking-tighter">$142,500</div>
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
                  {MOCK_CUSTOMERS.filter(c => c.stage === stage).length}
                </span>
              </div>
              <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
            </div>
            
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-3 overflow-y-auto custom-scrollbar">
              {MOCK_CUSTOMERS.filter(c => c.stage === stage).map((customer) => (
                <div 
                  key={customer.id} 
                  onClick={() => onCustomerClick(customer)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 hover:border-[#00ff88]/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-bold text-white group-hover:text-[#00ff88] transition-colors">{customer.name}</div>
                    <div className="text-[8px] font-mono text-white/30">{customer.lastActivity}</div>
                  </div>
                  <div className="text-[10px] text-white/40 mb-4">{customer.type}</div>
                  
                  {/* Readiness Dots */}
                  <div className="flex gap-1 mb-4">
                    {Object.entries(customer.readiness).map(([key, val]) => (
                      <div key={key} className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-[#00ff88]' : 'bg-red-500/50'}`} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[8px] font-bold">
                          {i === 1 ? 'Q' : 'O'}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-[#00ff88] font-bold">$12,400</div>
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

const CRMDirectory = ({ onCustomerClick }: { onCustomerClick: (customer: Customer) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<CustomerStage | 'All'>('All');
  
  const stages: (CustomerStage | 'All')[] = ['All', 'Lead', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];

  const filteredCustomers = MOCK_CUSTOMERS.filter(customer => {
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
          <button className="px-6 py-3 bg-[#0f0f0f] border border-white/5 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-2">
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
                      <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all">
                        <Mail size={16} />
                      </button>
                      <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all">
                        <Phone size={16} />
                      </button>
                      <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all">
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

const CRMAutomations = () => {
  const automations = [
    { 
      id: 'auto_001', 
      name: 'New Lead Welcome', 
      description: 'Triggered when a new lead is captured. Sends welcome email and assigns to sales.', 
      status: 'Active', 
      trigger: 'Lead Created', 
      lastRun: '2 mins ago',
      icon: Zap,
      color: 'text-[#00ff88]'
    },
    { 
      id: 'auto_002', 
      name: 'Sample Follow-up', 
      description: 'Triggered 48h after sample delivery. Checks for feedback and quote readiness.', 
      status: 'Active', 
      trigger: 'Sample Delivered', 
      lastRun: '1 hour ago',
      icon: Clock,
      color: 'text-amber-400'
    },
    { 
      id: 'auto_003', 
      name: 'Dormant Lead Re-engagement', 
      description: 'Triggered after 14 days of inactivity. Sends personalized re-engagement offer.', 
      status: 'Paused', 
      trigger: 'Inactivity > 14d', 
      lastRun: '3 days ago',
      icon: RefreshCw,
      color: 'text-blue-400'
    },
    { 
      id: 'auto_004', 
      name: 'Quote Expiry Alert', 
      description: 'Triggered 24h before quote expiry. Notifies customer and account manager.', 
      status: 'Active', 
      trigger: 'Quote Expiry - 24h', 
      lastRun: '15 mins ago',
      icon: AlertCircle,
      color: 'text-red-400'
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Workflow Automations</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Deterministic Relationship Logic</p>
        </div>
        <button className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
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

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Trigger</div>
                <div className="text-[10px] font-bold text-white truncate">{auto.trigger}</div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Last Run</div>
                <div className="text-[10px] font-mono text-white/60">{auto.lastRun}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                Edit Logic
              </button>
              <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
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
                
                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
                    <Link size={16} className="text-white/40 group-hover:text-[#00ff88]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Link Customer</span>
                  </button>
                  <button className="p-3 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] hover:border-[#00ff88]/30 transition-all group">
                    <UserPlus size={16} className="text-white/40 group-hover:text-[#00ff88]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white text-center">Create Lead</span>
                  </button>
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

const CustomerDetailDrawer = ({ customer, isOpen, onClose }: { customer: Customer, isOpen: boolean, onClose: () => void }) => {
  const [activeSection, setActiveSection] = useState<string>('Overview');

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
                <button className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
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
                        { label: 'Total Quotes', value: customer.linkedQuotes, icon: FileText },
                        { label: 'Total Orders', value: customer.linkedOrders, icon: Box },
                        { label: 'Lifetime Value', value: '$12,450', icon: BarChart3 },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                          <stat.icon size={18} className="text-[#00ff88] mb-4" />
                          <div className="text-2xl font-bold font-mono tracking-tighter mb-1">{stat.value}</div>
                          <div className="text-[10px] uppercase tracking-widest text-white/30">{stat.label}</div>
                        </div>
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
                      {Object.entries(customer.readiness).map(([key, val]) => (
                        <div key={key} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${val ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                              {val ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                          <button className={`text-[10px] font-bold uppercase tracking-widest ${val ? 'text-white/20' : 'text-[#00ff88] hover:underline'}`}>
                            {val ? 'Verified' : 'Request Info'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'Quotes' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Linked Quotes</h3>
                      <button className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">+ New Quote</button>
                    </div>
                    <div className="space-y-3">
                      {MOCK_FINANCE_RECORDS.filter(r => r.customerName === customer.name && r.category === 'Invoice').map((quote) => (
                        <div key={quote.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white mb-1">{quote.orderId}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/30">{quote.issueDate} • {quote.status}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-white">£{quote.amount.toLocaleString()}</div>
                            <button className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline mt-1">View PDF</button>
                          </div>
                        </div>
                      ))}
                      {MOCK_FINANCE_RECORDS.filter(r => r.customerName === customer.name && r.category === 'Invoice').length === 0 && (
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
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total: {customer.linkedOrders}</div>
                    </div>
                    <div className="space-y-3">
                      {MOCK_FINANCE_RECORDS.filter(r => r.customerName === customer.name && r.status === 'Paid').map((order) => (
                        <div key={order.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#00ff88] transition-colors">
                              <Box size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white mb-1">{order.orderId}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/30">Completed • {order.dueDate}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-[#00ff88]">£{order.amount.toLocaleString()}</div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mt-1">Fully Paid</div>
                          </div>
                        </div>
                      ))}
                      {MOCK_FINANCE_RECORDS.filter(r => r.customerName === customer.name && r.status === 'Paid').length === 0 && (
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
                      {MOCK_COMMS_THREADS.filter(t => t.customerName === customer.name).map((thread) => (
                        <div key={thread.id} className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl hover:border-white/20 transition-all group cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">{thread.channel}</span>
                              <span className="text-[10px] font-mono text-white/20">{thread.timestamp}</span>
                            </div>
                            <ChevronRight size={14} className="text-white/20 group-hover:text-[#00ff88] transition-colors" />
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed line-clamp-2 italic">"{thread.lastMessage}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {['Notes', 'History'].includes(activeSection) && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/10 mb-6 border border-white/5">
                      {sections.find(s => s.id === activeSection)?.icon && React.createElement(sections.find(s => s.id === activeSection)!.icon, { size: 32 })}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white mb-2 uppercase tracking-tighter">{activeSection} Data</h3>
                    <p className="text-xs text-white/30 max-w-xs leading-relaxed">Detailed {activeSection.toLowerCase()} records for this customer will be displayed here.</p>
                  </div>
                )}
              </main>
            </div>
          </motion.div>
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

function EmployeePortalContent() {
  const [activeModule, setActiveModule] = useState<'Map' | 'Customers' | 'Suppliers' | 'Inventory' | 'Marketing' | 'Comms' | 'Finance'>('Inventory');
  const [activeCRMSubModule, setActiveCRMSubModule] = useState<CRMSubModule>('Dashboard');
  const [activeInventorySubModule, setActiveInventorySubModule] = useState<'Overview' | 'Catalog' | '3DAssets' | 'Insights'>('Overview');
  const [activeMarketingSubModule, setActiveMarketingSubModule] = useState<'Dashboard' | 'AssetLab' | 'Templates' | 'CreativeGenerator' | 'Campaigns' | 'Calendar' | 'Publishing' | 'Analytics' | 'CommunityFeed'>('Dashboard');
  const [activeVendorSubModule, setActiveVendorSubModule] = useState<'Overview' | 'Directory'>('Overview');
  const [activeFinanceSubModule, setActiveFinanceSubModule] = useState<FinanceSubModule>('Overview');
  const [selectedFinanceRecord, setSelectedFinanceRecord] = useState<FinanceRecord | null>(null);
  const [isFinanceDetailOpen, setIsFinanceDetailOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<CommsThread | null>(MOCK_COMMS_THREADS[0]);
  
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);
  const [isVendorOnboardingOpen, setIsVendorOnboardingOpen] = useState(false);
  const [isInventoryDetailOpen, setIsInventoryDetailOpen] = useState(false);
  const [inventoryDetailTab, setInventoryDetailTab] = useState<'Overview' | 'Specs' | 'Media' | '3D' | 'Marketing' | 'Pricing' | 'Suppliers' | 'Health' | 'History'>('Overview');
  const [isAddProductWizardOpen, setIsAddProductWizardOpen] = useState(false);
  const [isEditProductWizardOpen, setIsEditProductWizardOpen] = useState(false);
  const [isImportPriceListOpen, setIsImportPriceListOpen] = useState(false);
  const [isManageAssetsOpen, setIsManageAssetsOpen] = useState(false);
  const { setIsLoggedIn, setUserRole, setIsViewingPortal } = useVisualLab();
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [activeActionWizard, setActiveActionWizard] = useState<{type: string, nodeId: string, nodeLabel: string} | null>(null);
  const inventoryPortal = useInventoryPortalData();

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

  const selectedInventoryAssets = useMemo(
    () => (selectedInventoryProduct ? inventoryPortal.assetsByProductId[selectedInventoryProduct.id] ?? [] : []),
    [inventoryPortal.assetsByProductId, selectedInventoryProduct],
  );

  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isMasterPromptOpen, setIsMasterPromptOpen] = useState(false);
 const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
 const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
 const [variantWizardStep, setVariantWizardStep] = useState(1);
 const [variantSettings, setVariantSettings] = useState({
 transparentBg: false,
 watermarkProfile: 'Standard BTS',
 usagePurpose: 'Publishable Variant',
 channelSize: 'Original'
 });
 const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
 const [selectedProduct, setSelectedProduct] = useState<any>(BTS_PRODUCTS[0]);
 const [generatorCopy, setGeneratorCopy] = useState('Premium materials for modern architectural visions.');
 const [isRendering, setIsRendering] = useState(false);
 const [isWizardOpen, setIsWizardOpen] = useState(false);
 const [wizardStep, setWizardStep] = useState(1);
 const [calendarView, setCalendarView] = useState<'Week' | 'Month'>('Week');
 const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(MOCK_SCHEDULED_POSTS);
 const [publishingJobs, setPublishingJobs] = useState<PublishingJob[]>(MOCK_PUBLISHING_JOBS);
 const [channelHealth, setChannelHealth] = useState<ChannelHealth[]>(MOCK_CHANNEL_HEALTH);
 const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
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
 const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
 const [nodeSearch, setNodeSearch] = useState('');
 const [pinnedNodes, setPinnedNodes] = useState<string[]>([]);
 const [systemLogs, setSystemLogs] = useState<{ id: string; text: string; time: string }[]>([]);
 const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
 
 const canvasRef = useRef<HTMLDivElement>(null);
 const libraryRef = useRef<HTMLDivElement>(null);

 const NODE_GROUPS = [
  { 
  group: 'Core',
  nodes: [
  { label: 'Hub Node', icon: Database, category: 'HUB', color: 'text-blue-400', desc: 'Central data orchestrator' },
  { label: 'Demand Source', icon: Share2, category: 'DEMAND', color: 'text-[#00ff88]', desc: 'Inbound enquiry trigger' },
  { label: 'System Sync', icon: RefreshCw, category: 'CORE', color: 'text-indigo-400', desc: 'Real-time state synchronization' },
  ]
  },
  {
  group: 'Operations',
  nodes: [
  { label: 'Sales Step', icon: FileText, category: 'SALES', color: 'text-emerald-400', desc: 'Quote & conversion logic' },
  { label: 'Supply Step', icon: Box, category: 'SUPPLY', color: 'text-amber-400', desc: 'Inventory & procurement' },
  { label: 'Logistics Step', icon: Truck, category: 'LOGISTICS', color: 'text-cyan-400', desc: 'Delivery & fulfillment' },
  { label: 'Support Step', icon: CheckCircle2, category: 'SUPPORT', color: 'text-purple-400', desc: 'Post-purchase workflow' },
  { label: 'Quality Check', icon: ShieldCheck, category: 'OPS', color: 'text-teal-400', desc: 'Standardized inspection gate' },
  ]
  },
  {
  group: 'Marketing',
  nodes: [
  { label: 'Asset Lab', icon: Image, category: 'MARKETING', color: 'text-pink-400', desc: 'Media asset management' },
  { label: 'Creative Gen', icon: Wand2, category: 'MARKETING', color: 'text-purple-400', desc: 'AI visual generation' },
  { label: 'Campaign Engine', icon: Megaphone, category: 'MARKETING', color: 'text-pink-500', desc: 'Multi-channel orchestration' },
  { label: 'Analytics Node', icon: BarChart3, category: 'MARKETING', color: 'text-blue-400', desc: 'Performance tracking' },
  { label: 'Channel Sync', icon: Link, category: 'MARKETING', color: 'text-emerald-400', desc: 'External API connector' },
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

 // Simulate System Logs
 useEffect(() => {
 const logs = [
"CAPTURED: FB_LEAD_ID_8829 -> ROUTING: COMMS_HUB",
"INCOMING: WHATSAPP_MSG -> STATUS: QUEUED_FOR_TRIAGE",
"SYNC_SUCCESS: TIKTOK_ORDER_#9921 -> MODULE: SALES_ENGINE",
"GENERATE: QUOTE_PDF_CUST_A -> TRIGGER: MANUAL_ACTION",
"DISPATCH: PO_#4421 -> VENDOR: GLOBAL_TILES_CO",
"BOOKED: LOGISTICS_WAYBILL_772 -> CARRIER: TRUCK_OS",
"UPDATE: FULFILLMENT_STATUS -> VALUE: OUT_FOR_DELIVERY",
"LEDGER_ENTRY: REVENUE_+$1,200 -> MODULE: FINANCE_HUB",
"ATTRIBUTION: CAMPAIGN_FB_ADS_01 -> SOURCE: META_PIXEL",
];

 const interval = setInterval(() => {
 const randomLog = logs[Math.floor(Math.random() * logs.length)];
 setSystemLogs(prev => [{
 id: Math.random().toString(36).substr(2, 9),
 text: randomLog,
 time: new Date().toLocaleTimeString('en-GB', { hour12: false })
 }, ...prev].slice(0, 8));
 }, 2500);

 return () => clearInterval(interval);
 }, []);

 const onConnect = useCallback(
 (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00ff88', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff88' } }, eds)),
 [setEdges]
 );

 const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
 setSelectedNode(node);
 setSelectedEdge(null);
 setIsDetailPanelOpen(true);
 }, []);

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
 <span className="text-[10px] uppercase tracking-widest text-white/30">Total Revenue</span>
 <BarChart3 size={12} className="text-[#00ff88]" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">$125,237</div>
 </div>
 
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Stock Units</span>
 <Box size={12} className="text-amber-400" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">8,420</div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase tracking-widest text-white/30">Active Workflows</span>
 <Zap size={12} className="text-blue-400" />
 </div>
 <div className="text-2xl font-bold font-mono tracking-tighter">{nodes.length}</div>
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
 <span className="text-[8px] font-mono text-white/20 uppercase">Last Sync: 16:25:48</span>
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
    <CommsCentre 
      selectedThread={selectedThread}
      onThreadSelect={setSelectedThread}
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
            {activeCRMSubModule === 'Dashboard' && <CRMDashboard onResolveAll={() => {}} />}
            {activeCRMSubModule === 'Queue' && <CRMQueue onCustomerClick={(c) => { setSelectedCustomer(c); setIsCustomerDetailOpen(true); }} />}
            {activeCRMSubModule === 'Pipeline' && <CRMPipeline onCustomerClick={(c) => { setSelectedCustomer(c); setIsCustomerDetailOpen(true); }} />}
            {activeCRMSubModule === 'Directory' && (
              <CRMDirectory 
                onCustomerClick={(customer) => {
                  setSelectedCustomer(customer);
                  setIsCustomerDetailOpen(true);
                }}
              />
            )}
            {activeCRMSubModule === 'ProjectsTenders' && <CRMProjectsTenders />}
            {activeCRMSubModule === 'Automations' && <CRMAutomations />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )}

  {activeModule === 'Suppliers' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'Directory', label: 'Directory', icon: Building2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveVendorSubModule(item.id as any)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeVendorSubModule === item.id ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 border border-transparent'}`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>
      {/* Vendor Sub-Nav (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase tracking-tight">Vendor Portal</h2>
          <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-1">Supply Chain OS</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'Directory', label: 'Directory', icon: Building2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveVendorSubModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeVendorSubModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} className={activeVendorSubModule === item.id ? 'text-[#00ff88]' : ''} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Vendor Main Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVendorSubModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeVendorSubModule === 'Overview' && <VendorOverview onAddVendor={() => setIsVendorOnboardingOpen(true)} />}
            {activeVendorSubModule === 'Directory' && (
              <VendorDirectory 
                onVendorClick={(vendor) => {
                  setSelectedVendor(vendor);
                  setIsVendorDetailOpen(true);
                }} 
                onAddVendor={() => setIsVendorOnboardingOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Vendor Detail Drawer */}
        <AnimatePresence>
          {isVendorDetailOpen && selectedVendor && (
            <VendorDetailDrawer 
              vendor={selectedVendor} 
              isOpen={isVendorDetailOpen}
              onClose={() => setIsVendorDetailOpen(false)} 
            />
          )}
        </AnimatePresence>
        
        {/* Vendor Onboarding Wizard */}
        <AnimatePresence>
          {isVendorOnboardingOpen && (
            <VendorOnboardingWizard 
              isOpen={isVendorOnboardingOpen} 
              onClose={() => setIsVendorOnboardingOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )}

  {activeModule === 'Inventory' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'Catalog', label: 'Catalog', icon: Package },
          { id: '3DAssets', label: '3D Assets', icon: Box },
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
            { id: '3DAssets', label: '3D Assets', icon: Box },
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
              <header>
                <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Inventory Overview</h1>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Stock Control & Asset Health Monitoring</p>
              </header>

	              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
	                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
	                  <div className="flex items-center justify-between mb-8">
	                    <h3 className="text-xs font-bold uppercase tracking-widest">Low Stock Alerts</h3>
	                    <div className="flex items-center gap-2 text-red-400 text-[10px] uppercase tracking-widest font-bold">
	                      <AlertCircle size={14} /> {inventoryPortal.dashboard?.summary.lowStockCount ?? 0} Items Critical
	                    </div>
	                  </div>
	                  <div className="space-y-4">
	                    {(inventoryPortal.dashboard?.lowStockAlerts ?? []).map((item) => (
	                      <div key={item.name} className="flex items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
	                        <div className="flex-1">
	                          <div className="text-sm font-bold mb-1">{item.name}</div>
	                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
	                            <div 
                              className={`h-full ${item.status === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} 
                              style={{ width: `${(item.stock / item.min) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold">{item.stock} / {item.min}</div>
                          <div className={`text-[8px] uppercase tracking-widest font-bold ${item.status === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>{item.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

	                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
	                  <div className="flex items-center justify-between mb-8">
	                    <h3 className="text-xs font-bold uppercase tracking-widest">Marketing Asset Health</h3>
	                    <div className="flex items-center gap-2 text-[#00ff88] text-[10px] uppercase tracking-widest font-bold">
	                      <CheckCircle2 size={14} /> {Math.round(inventoryPortal.dashboard?.summary.globalAssetReadiness ?? 0)}% Coverage
	                    </div>
	                  </div>
	                  <div className="space-y-4">
	                    {(inventoryPortal.dashboard?.assetCoverage ?? []).map((item) => (
	                      <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-3">
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
                      </div>
                    ))}
                  </div>
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
	
	          {activeInventorySubModule === '3DAssets' && (
	            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
	              <Inventory3DAssets 
	                products={inventoryPortal.products}
	                dashboard={inventoryPortal.dashboard}
	                onProductClick={(product) => {
	                  setSelectedInventoryProduct(product);
	                  setIsInventoryDetailOpen(true);
	                }}
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
      <CustomerDetailDrawer 
        isOpen={isCustomerDetailOpen} 
        onClose={() => setIsCustomerDetailOpen(false)} 
        customer={selectedCustomer} 
      />
	      <InventoryDetailDrawer 
	        product={selectedInventoryProduct}
	        isOpen={isInventoryDetailOpen}
	        onClose={() => setIsInventoryDetailOpen(false)}
	        activeTab={inventoryDetailTab}
        onTabChange={(tab) => setInventoryDetailTab(tab as any)}
        onManageAssets={() => setIsManageAssetsOpen(true)}
      />
    </div>
  )}

  {activeModule === 'Marketing' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'AssetLab', label: 'Asset Lab', icon: Image },
          { id: 'Templates', label: 'Templates', icon: FileText },
          { id: 'CreativeGenerator', label: 'Creative Gen', icon: Wand2 },
          { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'Calendar', label: 'Calendar', icon: Calendar },
          { id: 'Publishing', label: 'Publishing', icon: ListOrdered },
          { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'CommunityFeed', label: 'Community Feed', icon: Users },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveMarketingSubModule(sub.id as any)}
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
 { id: 'CreativeGenerator', label: 'Creative Gen', icon: Wand2 },
 { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
 { id: 'Calendar', label: 'Calendar', icon: Calendar },
 { id: 'Publishing', label: 'Publishing', icon: ListOrdered },
 { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
 { id: 'CommunityFeed', label: 'Community Feed', icon: Users },
].map((sub) => {
 const Icon = sub.icon;
 const isActive = activeMarketingSubModule === sub.id;
 return (
 <button
 key={sub.id}
 onClick={() => setActiveMarketingSubModule(sub.id as any)}
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
 {[
 { label: 'Active Campaigns', value: '12', trend: '+2', icon: Megaphone, color: 'text-blue-400' },
 { label: 'Pending Renders', value: '48', trend: 'High', icon: Wand2, color: 'text-purple-400' },
 { label: 'Total Reach', value: '1.2M', trend: '+12%', icon: Users, color: 'text-[#00ff88]' },
 { label: 'Conversion', value: '3.8%', trend: '+0.4%', icon: Activity, color: 'text-pink-400' },
].map((stat, i) => (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 className="bg-[#111] border border-white/10 rounded-xl p-6 hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 group relative overflow-hidden shadow-xl"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-xl bg-black border border-white/5 shadow-inner ${stat.color}`}>
 <stat.icon size={20} />
 </div>
 <span className="text-[10px] font-mono text-[#00ff88] px-2 py-1 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 shadow-sm">{stat.trend}</span>
 </div>
 <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/60 transition-colors">{stat.label}</h3>
 <p className="text-3xl font-bold text-white tracking-tighter group-hover:text-[#00ff88] transition-colors">{stat.value}</p>
 </div>
 </motion.div>
 ))}
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
 <button className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline">View All</button>
 </div>
 <div className="space-y-6">
 {[
 { name: 'Spring Collection Launch', status: 'Active', progress: 75, color: 'bg-[#00ff88]', id: 'CMP_001' },
 { name: 'Retargeting: High Value', status: 'Active', progress: 42, color: 'bg-blue-400', id: 'CMP_002' },
 { name: 'Influencer Seeding', status: 'Draft', progress: 10, color: 'bg-white/20', id: 'CMP_003' },
].map((camp, i) => (
 <motion.div 
 key={camp.name} 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.2 + (i * 0.1) }}
 className="p-8 bg-black border border-white/5 rounded-xl hover:border-[#00ff88]/20 transition-all group/item relative overflow-hidden shadow-inner"
 >
 <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className="space-y-1">
 <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest opacity-60 group-hover/item:opacity-100 transition-opacity">{camp.id}</span>
 <h4 className="text-xl font-serif font-bold text-white uppercase tracking-tight group-hover/item:text-[#00ff88] transition-colors">{camp.name}</h4>
 </div>
 <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${camp.status === 'Active' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
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
 className={`h-full ${camp.color} shadow-[0_0_15px_currentColor]`}
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
 <button className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline">Open Lab</button>
 </div>
 <div className="grid grid-cols-2 gap-6">
 {[
 { label: 'Total Assets', value: '1,240', color: 'text-white' },
 { label: '3D Readiness', value: '85%', color: 'text-[#00ff88]' },
 { label: 'Active Renders', value: '12', color: 'text-purple-400' },
 { label: 'New Variants', value: '4', color: 'text-blue-400' },
].map((stat, i) => (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.3 + (i * 0.05) }}
 className="p-8 bg-black border border-white/5 rounded-xl hover:border-[#00ff88]/20 transition-all group/stat relative overflow-hidden shadow-inner"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <p className={`text-4xl font-serif font-bold mb-2 ${stat.color} group-hover/stat:scale-110 group-hover/stat:text-[#00ff88] transition-all origin-left duration-500`}>{stat.value}</p>
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
 <button className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2">
 <Plus size={16} /> Upload Asset
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
 {MOCK_ASSETS
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
 <img src={asset.img} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" referrerPolicy="no-referrer" />
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
 <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
 <Plus size={16} /> New Blueprint
 </button>
 </header>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {MOCK_TEMPLATES.map((template, i) => (
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
 <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-[#00ff88] uppercase tracking-widest shadow-lg">
 {template.type}
 </div>
 </div>
 </div>
 <h3 className="text-xl font-serif font-bold text-white uppercase tracking-tighter mb-2 group-hover:text-[#00ff88] transition-colors relative z-10">{template.name}</h3>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed mb-6 flex-1 relative z-10">{template.description}</p>
 
 <div className="p-4 bg-black/40 border border-white/5 rounded-xl mb-8 relative z-10 shadow-inner">
 <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-2">Deterministic Blueprint</p>
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">{template.blueprint}</p>
 </div>

 <button 
 onClick={() => {
 setSelectedTemplate(template);
 setActiveMarketingSubModule('CreativeGenerator');
 }}
 className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] transition-all relative z-10"
 >
 Use Template
 </button>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {activeMarketingSubModule === 'CreativeGenerator' && (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
 <header className="mb-12 flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Creative Generator</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Deterministic Asset Synthesis</p>
 </div>
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setActiveMarketingSubModule('Templates')}
 className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all"
 >
 Change Template
 </button>
 <button 
 onClick={() => {
 setIsRendering(true);
 setTimeout(() => {
 setIsRendering(false);
 setSystemLogs(prev => [{ id: Date.now().toString(), text: `RENDER_COMPLETE: ${selectedTemplate?.name} generated for ${selectedProduct?.name}`, time: new Date().toLocaleTimeString() }, ...prev]);
 }, 2000);
 }}
 disabled={isRendering}
 className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all disabled:opacity-50"
 >
 {isRendering ? 'RENDERING...' : 'SAVE & RENDER'}
 </button>
 </div>
 </header>

 <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
 {/* Left Side: Source Product Mapping */}
 <div className="bg-white/5 border border-white/10 rounded-3xl p-8 overflow-y-auto custom-scrollbar space-y-8">
 <section className="space-y-6">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Source Product Mapping</h3>
 <div className="grid grid-cols-2 gap-4">
 {BTS_PRODUCTS.map((product) => (
 <button 
 key={product.id}
 onClick={() => setSelectedProduct(product)}
 className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${selectedProduct?.id === product.id ? 'bg-[#00ff88]/10 border-[#00ff88]/50 ring-1 ring-[#00ff88]/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
 >
 <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black">
 <img src={product.img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-bold text-white uppercase truncate">{product.name}</p>
 <p className="text-[8px] font-mono text-white/30 uppercase">{product.id}</p>
 </div>
 </button>
 ))}
 </div>
 </section>

 <section className="space-y-6">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Template Blueprint: {selectedTemplate?.name || 'Standard Product Card'}</h3>
 <div className="space-y-4">
 <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-6">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono text-white/40 uppercase">Layout Logic</span>
 <span className="text-[10px] font-mono text-[#00ff88] uppercase">Deterministic</span>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <span className="text-[10px] font-bold text-white uppercase">Image Aspect</span>
 <span className="text-[10px] font-mono text-white/40 uppercase">1:1 Square</span>
 </div>
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <span className="text-[10px] font-bold text-white uppercase">Overlay Position</span>
 <span className="text-[10px] font-mono text-white/40 uppercase">Bottom Left</span>
 </div>
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <span className="text-[10px] font-bold text-white uppercase">Typography</span>
 <span className="text-[10px] font-mono text-white/40 uppercase">Serif Display</span>
 </div>
 </div>
 </div>
 </div>
 </section>

 <section className="space-y-6">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Variant Settings</h3>
 <div className="space-y-4">
 <div 
 onClick={() => setVariantSettings(s => ({ ...s, transparentBg: !s.transparentBg }))}
 className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:border-[#00ff88]/20 transition-all"
 >
 <div>
 <span className={`text-[10px] font-bold uppercase block mb-1 ${variantSettings.transparentBg ? 'text-[#00ff88]' : 'text-white'}`}>Transparent Background</span>
 <span className="text-[8px] font-mono text-white/40 uppercase">AI Subject Isolation</span>
 </div>
 <div className={`w-8 h-4 rounded-full relative transition-colors ${variantSettings.transparentBg ? 'bg-[#00ff88]' : 'bg-white/10'}`}>
 <div className={`w-4 h-4 bg-white rounded-full absolute shadow-md transition-all ${variantSettings.transparentBg ? 'right-0' : 'left-0'}`}></div>
 </div>
 </div>
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <div>
 <span className="text-[10px] font-bold text-white uppercase block mb-1">Channel Size</span>
 <span className="text-[8px] font-mono text-white/40 uppercase">Dimensions</span>
 </div>
 <select 
 value={variantSettings.channelSize}
 onChange={(e) => setVariantSettings(s => ({ ...s, channelSize: e.target.value }))}
 className="bg-black border border-white/10 rounded-lg text-[10px] font-mono text-white/60 p-2 uppercase tracking-widest outline-none focus:border-[#00ff88]/50 transition-colors"
 >
 <option value="Original">Original Size</option>
 <option value="1080x1080">1080x1080 (Square)</option>
 <option value="1080x1920">1080x1920 (Story)</option>
 <option value="1200x630">1200x630 (Web Hero)</option>
 </select>
 </div>
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <div>
 <span className="text-[10px] font-bold text-white uppercase block mb-1">Watermark Profile</span>
 <span className="text-[8px] font-mono text-white/40 uppercase">Protection Level</span>
 </div>
 <select 
 value={variantSettings.watermarkProfile}
 onChange={(e) => setVariantSettings(s => ({ ...s, watermarkProfile: e.target.value }))}
 className="bg-black border border-white/10 rounded-lg text-[10px] font-mono text-white/60 p-2 uppercase tracking-widest outline-none focus:border-[#00ff88]/50 transition-colors"
 >
 <option value="None">None</option>
 <option value="Standard BTS">Standard BTS</option>
 <option value="Confidential">Confidential</option>
 <option value="Draft">Draft</option>
 </select>
 </div>
 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
 <div>
 <span className="text-[10px] font-bold text-white uppercase block mb-1">Usage Purpose</span>
 <span className="text-[8px] font-mono text-white/40 uppercase">Asset Role</span>
 </div>
 <select 
 value={variantSettings.usagePurpose}
 onChange={(e) => setVariantSettings(s => ({ ...s, usagePurpose: e.target.value }))}
 className="bg-black border border-white/10 rounded-lg text-[10px] font-mono text-white/60 p-2 uppercase tracking-widest outline-none focus:border-[#00ff88]/50 transition-colors"
 >
 <option value="Publishable Variant">Publishable Variant</option>
 <option value="Campaign">Campaign</option>
 <option value="Gallery">Gallery</option>
 <option value="Social">Social</option>
 </select>
 </div>
 </div>
 </section>

 <section className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">AI Copy Assistant (Secondary)</h3>
 <button className="text-[8px] font-mono text-[#00ff88] uppercase tracking-widest hover:underline">Regenerate</button>
 </div>
 <textarea 
 value={generatorCopy}
 onChange={(e) => setGeneratorCopy(e.target.value)}
 className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-6 text-sm font-mono text-white/80 focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none"
 placeholder="Enter or generate copy..."
 />
 </section>
 </div>

 {/* Right Side: Live Preview */}
 <div className="flex flex-col gap-6">
 <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30">Live Deterministic Preview</h3>
 <div className="flex-1 bg-black rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center p-8">
 {/* Mock Render Area */}
 <div className="relative w-full aspect-square max-w-md shadow-2xl overflow-hidden rounded-xl bg-[#0a0a0a]">
 <img 
 src={selectedProduct?.img} 
 alt="Preview" 
 className="w-full h-full object-cover opacity-80"
 referrerPolicy="no-referrer"
 />
 
 {/* Deterministic Overlays based on Template */}
 {(!selectedTemplate || selectedTemplate.type === 'Product Card') && (
 <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
 <div className="flex items-end justify-between">
 <div className="max-w-[70%]">
 <h4 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter leading-none mb-2">{selectedProduct?.name}</h4>
 <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest leading-relaxed">{generatorCopy}</p>
 </div>
 <div className="text-right">
 <div className="px-3 py-1 bg-[#00ff88] text-black text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">
 {selectedProduct?.price}
 </div>
 <div className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Brick Tile Shop</div>
 </div>
 </div>
 </div>
 )}

 {selectedTemplate?.type === 'Collection Highlight' && (
 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
 <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
 <div className="relative z-10">
 <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-[0.4em] mb-4 block">New Collection</span>
 <h4 className="text-4xl font-serif font-bold text-white uppercase tracking-tighter leading-none mb-6">{selectedProduct?.category} Series</h4>
 <p className="text-xs font-mono text-white/60 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">{generatorCopy}</p>
 <div className="mt-8 flex gap-2 justify-center">
 {[1, 2, 3].map(i => (
 <div key={`coll-thumb-${i}`} className="w-12 h-12 rounded-lg border border-white/20 overflow-hidden">
 <img src={`https://picsum.photos/seed/coll${i}/100/100`} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {selectedTemplate?.type === 'Quote CTA' && (
 <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
 <div className="absolute inset-0 bg-black/60" />
 <div className="relative z-10 space-y-8">
 <Quote size={40} className="text-[#00ff88] mx-auto opacity-50" />
 <h4 className="text-2xl font-serif italic text-white leading-tight">"{generatorCopy}"</h4>
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-white uppercase tracking-widest">Architectural Digest</p>
 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Review: {selectedProduct?.name}</p>
 </div>
 <button className="px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl">
 Explore Series
 </button>
 </div>
 </div>
 )}

 {/* Scanline / Technical Overlay */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
 </div>

 {/* Render Progress Overlay */}
 <AnimatePresence>
 {isRendering && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6"
 >
 <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: '100%' }}
 transition={{ duration: 2 }}
 className="h-full bg-[#00ff88]"
 />
 </div>
 <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-[0.5em] animate-pulse">Rendering Deterministic Asset...</p>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
 <Monitor size={20} />
 </div>
 <div>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Preview Mode</p>
 <p className="text-xs font-bold text-white uppercase">1080x1080 (1:1)</p>
 </div>
 </div>
 <div className="flex gap-2">
 {['1:1', '9:16', '16:9'].map(ratio => (
 <button key={ratio} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono text-white/60 uppercase hover:border-[#00ff88]/50 transition-all">
 {ratio}
 </button>
 ))}
 </div>
 </div>
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
 setIsRefreshingQueue(true);
 setTimeout(() => setIsRefreshingQueue(false), 1500);
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
 { label: 'Total Jobs', value: publishingJobs.length, icon: Activity, color: 'text-white' },
 { label: 'Publishing', value: publishingJobs.filter(j => j.status === 'Publishing' || j.status === 'Retrying').length, icon: Zap, color: 'text-blue-400' },
 { label: 'Failed', value: publishingJobs.filter(j => j.status === 'Failed').length, icon: AlertCircle, color: 'text-red-400' },
 { label: 'Completed', value: publishingJobs.filter(j => j.status === 'Published').length, icon: CheckCircle2, color: 'text-[#00ff88]' },
].map((stat, i) => (
 <motion.div 
 key={stat.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 className="bg-[#111] border border-white/10 rounded-xl p-8 space-y-6 relative overflow-hidden group hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 shadow-xl"
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
 {publishingJobs.map((job, i) => (
 <motion.tr 
 key={job.id} 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.05 }}
 className="hover:bg-white/[0.02] transition-colors group relative"
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
 <Megaphone size={10} /> {MOCK_CAMPAIGNS.find(c => c.id === job.campaignId)?.name}
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
 ))}
 </tbody>
 </table>
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
 <div key={channel.name} className="space-y-3">
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
 </div>
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
 {MOCK_CAMPAIGNS.map((camp, i) => {
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
 {BTS_PRODUCTS.map((product) => (
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
 {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp', 'Pinterest'].map((channel) => (
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
 {MOCK_ASSETS.map((asset) => (
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
 <button 
 onClick={() => {
 setSystemLogs(prev => [{ id: Date.now().toString(), text: `CAMPAIGN_CREATED: ${newCampaign.name}`, time: new Date().toLocaleTimeString() }, ...prev]);
 setIsWizardOpen(false);
 }}
 className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all"
 >
 Launch Campaign
 </button>
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
 <button className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2">
 <Plus size={16} /> Schedule Post
 </button>
 </div>
 </header>

 {calendarView === 'Month' ? (
 <div className="grid grid-cols-7 gap-4">
 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
 <div key={day} className="text-center text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">{day}</div>
 ))}
 {Array.from({ length: 35 }).map((_, i) => {
 const day = i - 2; // Offset for March 2026 (starts on Sunday, but let's just mock it)
 const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
 const posts = scheduledPosts.filter(p => p.date === dateStr);
 
 return (
 <div key={`calendar-slot-${i}`} className={`min-h-[140px] bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#00ff88]/20 transition-all relative group ${day < 1 || day > 31 ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
 <span className="text-[10px] font-mono text-white/20">{day > 0 && day <= 31 ? day : ''}</span>
 <div className="mt-2 space-y-2">
 {posts.map(post => {
 const camp = MOCK_CAMPAIGNS.find(c => c.id === post.campaignId);
 return (
 <div key={post.id} className="p-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg group/post cursor-pointer hover:bg-[#00ff88]/20 transition-all">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[8px] font-bold text-[#00ff88] uppercase truncate">{post.channel}</span>
 <span className="text-[8px] font-mono text-white/40">{post.time}</span>
 </div>
 <p className="text-[10px] font-bold text-white uppercase truncate">{post.title}</p>
 {camp && (
 <p className="text-[8px] font-mono text-white/30 uppercase truncate mt-1 flex items-center gap-1">
 <Megaphone size={8} /> {camp.name}
 </p>
 )}
 {post.workflowNode && (
 <p className="text-[8px] font-mono text-purple-400 uppercase truncate mt-1 flex items-center gap-1">
 <Activity size={8} /> {post.workflowNode}
 </p>
 )}
 </div>
 );
 })}
 </div>
 {day > 0 && day <= 31 && (
 <button className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#00ff88] hover:text-black transition-all">
 <Plus size={14} />
 </button>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="grid grid-cols-7 gap-6">
 {['Mon 23', 'Tue 24', 'Wed 25', 'Thu 26', 'Fri 27', 'Sat 28', 'Sun 29'].map((day, idx) => {
 const dateStr = `2026-03-${23 + idx}`;
 const posts = scheduledPosts.filter(p => p.date === dateStr);
 const isToday = dateStr === '2026-03-25';

 return (
 <div key={day} className="space-y-6">
 <div className="text-center space-y-2">
 <p className={`text-[10px] font-mono uppercase tracking-widest ${isToday ? 'text-[#00ff88]' : 'text-white/30'}`}>{day.split(' ')[0]}</p>
 <p className={`text-3xl font-serif font-bold ${isToday ? 'text-[#00ff88]' : 'text-white'}`}>{day.split(' ')[1]}</p>
 {isToday && <div className="w-1 h-1 bg-[#00ff88] rounded-full mx-auto" />}
 </div>
 
 <div className="space-y-4 min-h-[600px] bg-white/[0.02] border border-white/5 rounded-xl p-4">
 {posts.map(post => (
 <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 hover:border-[#00ff88]/50 transition-all group cursor-pointer">
 <div className="flex items-center justify-between">
 <span className={`text-[8px] font-mono uppercase tracking-widest px-2 py-1 rounded ${
 post.status === 'Published' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
 post.status === 'Draft' ? 'bg-white/10 text-white/40' :
 'bg-blue-500/10 text-blue-400'
 }`}>
 {post.status}
 </span>
 <span className="text-[10px] font-mono text-white/40">{post.time}</span>
 </div>
 
 <div className="space-y-1">
 <p className="text-[8px] font-mono text-[#00ff88] uppercase tracking-widest">{post.channel}</p>
 <h4 className="text-sm font-bold text-white uppercase leading-tight">{post.title}</h4>
 {post.workflowNode && (
 <p className="text-[8px] font-mono text-purple-400 uppercase mt-2 flex items-center gap-1">
 <Activity size={10} /> {post.workflowNode}
 </p>
 )}
 </div>

 {post.assetId && (
 <div className="aspect-video rounded-lg overflow-hidden bg-black border border-white/5">
 <img src={`https://picsum.photos/seed/${post.id}/400/225`} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
 </div>
 )}

 <div className="flex items-center justify-between pt-4 border-t border-white/5">
 <div className="flex -space-x-2">
 {[1, 2].map(i => (
 <div key={`avatar-${i}`} className="w-6 h-6 rounded-full border-2 border-[#121212] bg-white/10 overflow-hidden">
 <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 </div>
 ))}
 </div>
 <button className="text-white/20 hover:text-white transition-colors">
 <MoreVertical size={14} />
 </button>
 </div>
 </div>
 ))}
 <button className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[10px] font-mono text-white/20 uppercase tracking-widest hover:border-[#00ff88]/20 hover:text-[#00ff88]/50 transition-all flex items-center justify-center gap-2">
 <Plus size={14} /> Add Slot
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </motion.div>
 )}


 {activeMarketingSubModule === 'Analytics' && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
 <header className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-serif font-bold tracking-tighter text-white uppercase mb-2">Analytics</h1>
 <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Performance Attribution & Growth Metrics</p>
 </div>
 <div className="flex gap-4">
 <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">Export Report</button>
 <button className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all">Live View</button>
 </div>
 </header>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
 {[
 { label: 'Total Leads', value: '728', trend: '+12.5%', icon: Users, color: 'text-white' },
 { label: 'Quote Conversion', value: '31.2%', trend: '+4.2%', icon: FileText, color: 'text-[#00ff88]' },
 { label: 'Avg. CAC', value: '$42.50', trend: '-8.1%', icon: CreditCard, color: 'text-blue-400' },
 { label: 'ROAS', value: '4.1x', trend: '+0.5x', icon: BarChart3, color: 'text-purple-400' },
].map((kpi, i) => (
 <motion.div 
 key={kpi.label} 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.05 }}
 className="bg-[#111] border border-white/10 rounded-xl p-8 space-y-6 relative overflow-hidden group hover:border-[#00ff88]/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)] transition-all duration-300 shadow-xl"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className={`p-3 rounded-xl bg-black border border-white/5 shadow-inner ${kpi.color}`}>
 <kpi.icon size={24} />
 </div>
 <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border shadow-sm ${kpi.trend.startsWith('+') ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
 {kpi.trend}
 </span>
 </div>
 <div>
 <p className="text-4xl font-serif font-bold text-white tracking-tighter mb-1 group-hover:scale-105 group-hover:text-[#00ff88] transition-all origin-left duration-500">{kpi.value}</p>
 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{kpi.label}</p>
 </div>
 </div>
 </motion.div>
 ))}
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
 {Array.from({ length: 24 }).map((_, i) => (
 <div key={`hourly-stat-${i}`} className="flex-1 flex flex-col gap-1.5 group/bar">
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${20 + Math.random() * 60}%` }}
 transition={{ delay: i * 0.02, type: 'spring', damping: 15 }}
 className="w-full bg-blue-400/20 rounded-t-sm group-hover/bar:bg-blue-400/40 transition-colors shadow-inner"
 />
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${10 + Math.random() * 40}%` }}
 transition={{ delay: i * 0.02 + 0.1, type: 'spring', damping: 15 }}
 className="w-full bg-[#00ff88]/40 rounded-t-sm group-hover/bar:bg-[#00ff88]/60 transition-colors shadow-inner"
 />
 </div>
 ))}
 </div>
 <div className="flex justify-between mt-10 px-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
 <span>01 Mar</span>
 <span>08 Mar</span>
 <span>15 Mar</span>
 <span>22 Mar</span>
 <span>Today</span>
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
 <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-8 relative z-10 group-hover:text-[#00ff88] transition-colors">Channel Attribution</h3>
 <div className="space-y-8 relative z-10">
 {[
 { name: 'Instagram Ads', value: 45, color: 'bg-blue-400' },
 { name: 'Google Search', value: 28, color: 'bg-red-400' },
 { name: 'Direct Traffic', value: 15, color: 'bg-[#00ff88]' },
 { name: 'Email Marketing', value: 12, color: 'bg-purple-400' },
].map((channel, i) => (
 <div key={channel.name} className="space-y-3 group/channel">
 <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
 <span className="text-white/40 group-hover/channel:text-white transition-colors">{channel.name}</span>
 <span className="text-white group-hover/channel:text-[#00ff88] transition-colors">{channel.value}%</span>
 </div>
 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${channel.value}%` }}
 transition={{ delay: 0.5 + (i * 0.1), type: 'spring', damping: 20 }}
 className={`h-full ${channel.color} shadow-[0_0_10px_currentColor]`}
 />
 </div>
 </div>
 ))}
 </div>
 <div className="mt-12 p-6 bg-black border border-white/10 rounded-xl space-y-4 shadow-inner relative overflow-hidden group/top-asset hover:border-[#00ff88]/20 transition-colors">
 <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent opacity-0 group-hover/top-asset:opacity-100 transition-opacity" />
 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60 relative z-10">Top Performing Asset</h4>
 <div className="flex items-center gap-4 relative z-10">
 <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/10 shadow-md">
 <img src="https://picsum.photos/seed/slate1/100/100" alt="top asset" className="w-full h-full object-cover opacity-60 group-hover/top-asset:opacity-100 transition-opacity group-hover/top-asset:scale-110 duration-500" referrerPolicy="no-referrer" />
 </div>
 <div>
 <p className="text-xs font-bold text-white uppercase group-hover/top-asset:text-[#00ff88] transition-colors">Slate Grey Hero</p>
 <p className="text-[8px] font-mono text-[#00ff88] uppercase">128 Quotes Generated</p>
 </div>
 </div>
 </div>
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
 {MOCK_CAMPAIGN_PERFORMANCE.map((campaign, i) => {
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
   <MarketingCommunityFeed />
 )}

 </div>
 </div>
 </div>
 )}

  {activeModule === 'Finance' && (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex overflow-x-auto py-4 px-8 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
        {[
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'Receivables', label: 'Receivables', icon: DollarSign },
          { id: 'Payables', label: 'Payables', icon: CreditCard },
          { id: 'Margin', label: 'Margin Analysis', icon: BarChart3 },
          { id: 'Exceptions', label: 'Exceptions', icon: AlertTriangle },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFinanceSubModule(item.id as any)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeFinanceSubModule === item.id ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/40 border border-transparent'}`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>
      {/* Finance Sub-Navigation (Desktop) */}
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
          <button
            key={item.id}
            onClick={() => setActiveFinanceSubModule(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              activeFinanceSubModule === item.id 
                ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' 
                : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <item.icon size={18} className={activeFinanceSubModule === item.id ? 'text-[#00ff88]' : 'text-white/20 group-hover:text-white/60'} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-white/5">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-2">System Health</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Deterministic</span>
          </div>
        </div>
      </div>
    </div>

    {/* Finance Content Area */}
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
      <div className="p-12 max-w-7xl mx-auto">
        {activeFinanceSubModule === 'Overview' && <FinanceOverview onSelectRecord={(record) => { setSelectedFinanceRecord(record); setIsFinanceDetailOpen(true); }} />}
        {activeFinanceSubModule === 'Receivables' && <FinanceReceivables onSelectRecord={(record) => { setSelectedFinanceRecord(record); setIsFinanceDetailOpen(true); }} />}
        {activeFinanceSubModule === 'Payables' && <FinancePayables onSelectRecord={(record) => { setSelectedFinanceRecord(record); setIsFinanceDetailOpen(true); }} />}
        {activeFinanceSubModule === 'Margin' && <FinanceMargin onSelectRecord={(record) => { setSelectedFinanceRecord(record); setIsFinanceDetailOpen(true); }} />}
        {activeFinanceSubModule === 'Exceptions' && <FinanceExceptions onSelectRecord={(record) => { setSelectedFinanceRecord(record); setIsFinanceDetailOpen(true); }} />}
      </div>
    </div>
  </div>
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
 <img src={selectedAsset.img} alt={selectedAsset.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
 <button className="px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
 <Download size={16} /> Download {selectedAsset.protectionLevel === 'Publishable Variant' ? 'for Publishing' : 'Variant'}
 </button>
 )}
 <button onClick={() => setIsGeneratingVariant(true)} className="px-8 py-4 bg-[#00ff88] text-black rounded-xl hover:bg-[#00cc6e] transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
 <Wand2 size={16} /> Generate Variant
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
 <h2 className="text-4xl font-serif font-bold text-white uppercase tracking-tighter leading-none mb-4">{selectedAsset.name}</h2>
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
 <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between group hover:border-purple-500/40 transition-all cursor-default">
 <div className="flex items-center gap-3">
 <Activity size={16} className="text-purple-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Workflow Node</span>
 <span className="text-[8px] font-mono text-purple-400">{selectedAsset.workflowNode}</span>
 </div>
 </div>
 </div>
 )}
 <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-[#00ff88]/20 transition-all cursor-pointer">
 <div className="flex items-center gap-3">
 <ShoppingBag size={16} className="text-amber-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Linked Products</span>
 <span className="text-[8px] font-mono text-white/30">{selectedAsset.linkedProductIds?.length || (selectedAsset.productId ? 1 : 0)} Products Connected</span>
 </div>
 </div>
 <ArrowUpRight size={14} className="text-white/20 group-hover:text-[#00ff88]" />
 </div>
 <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-pink-500/30 transition-all cursor-pointer">
 <div className="flex items-center gap-3">
 <Megaphone size={16} className="text-pink-400" />
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-white uppercase">Linked Campaigns</span>
 <span className="text-[8px] font-mono text-white/30">{selectedAsset.linkedCampaignIds?.length || (selectedAsset.campaignId ? 1 : 0)} Campaigns Connected</span>
 </div>
 </div>
 <ArrowUpRight size={14} className="text-white/20 group-hover:text-pink-400" />
 </div>
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
 {selectedAsset.tags.map(tag => (
 <span key={tag} className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-white/60 uppercase tracking-widest hover:border-[#00ff88]/20 transition-all cursor-default">
 #{tag}
 </span>
 ))}
 <button className="px-4 py-2 bg-white/5 border border-white/10 border-dashed rounded-xl text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-all">
 + Add Tag
 </button>
 </div>
 </div>

 <div className="pt-12 border-t border-white/5 flex items-center justify-between">
 <div className="flex gap-4">
 <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
 Archive Asset
 </button>
 <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
 Duplicate
 </button>
 </div>
 <button className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all">
 Update Metadata
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
 <img 
 src={selectedAsset.img} 
 alt="Preview" 
 className={`w-full h-full object-contain transition-all duration-500 ${variantSettings.transparentBg ? 'opacity-90 mix-blend-screen' : 'opacity-50'}`} 
 referrerPolicy="no-referrer" 
 />
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
 <button onClick={() => { setIsGeneratingVariant(false); setVariantWizardStep(1); }} className="px-12 py-4 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2">
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
   onCreateProduct={inventoryPortal.createProduct}
 />
 <ImportPriceListWizard 
   isOpen={isImportPriceListOpen} 
   onClose={() => setIsImportPriceListOpen(false)} 
   onImportPriceList={inventoryPortal.importPriceList}
 />
 <ManageAssetsWizard 
   isOpen={isManageAssetsOpen} 
   onClose={() => setIsManageAssetsOpen(false)}
   product={selectedInventoryProduct}
   assets={selectedInventoryAssets}
 />
 <FinanceDetailDrawer 
   record={selectedFinanceRecord} 
   isOpen={isFinanceDetailOpen} 
   onClose={() => setIsFinanceDetailOpen(false)} 
 />
 </AnimatePresence>
 </main>
 </div>
 );
}
