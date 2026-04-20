export type CommsProvider =
  | 'WhatsApp'
  | 'Email'
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'Pinterest'
  | 'TikTok'
  | 'Web'
  | 'Internal';

export type CommsConnectionStatus = 'Connected' | 'Degraded' | 'Disconnected' | 'Simulated';
export type CommsConversationStatus = 'Open' | 'Resolved' | 'Flagged' | 'Archived';
export type CommsConversationCategory = 'Lead' | 'Support' | 'Quote' | 'Payment' | 'Delivery' | 'General';
export type CommsConversationPriority = 'Low' | 'Normal' | 'High' | 'Critical';
export type CommsMessageDirection = 'Inbound' | 'Outbound' | 'Internal';
export type CommsMessageStatus = 'Received' | 'Sent' | 'Queued' | 'Failed' | 'Read';
export type CommsActionType =
  | 'Link Customer'
  | 'Create Lead'
  | 'Convert Quote'
  | 'Create Task'
  | 'Request Info'
  | 'Support Issue'
  | 'Resolve'
  | 'Assign'
  | 'Tag';
export type CommsActionStatus = 'Open' | 'Completed' | 'Failed';
export type CustomerPortalInviteStatus = 'Provisional' | 'Ready' | 'Invite Sent' | 'Verified' | 'Disabled';

export interface CommsChannelSummary {
  provider: CommsProvider;
  label: string;
  status: CommsConnectionStatus;
  count: number;
  unreadCount: number;
  lastSyncedAt?: string | null;
  syncError?: string | null;
}

export interface CommsExternalIdentitySummary {
  id: string;
  provider: CommsProvider;
  externalUserId: string;
  displayName?: string | null;
  handle?: string | null;
  email?: string | null;
  phone?: string | null;
  confidenceScore: number;
  isVerified: boolean;
}

export interface CommsLinkedCustomerSummary {
  id: string;
  customerKey: string;
  name: string;
  customerType?: string | null;
  stage?: string | null;
  email?: string | null;
  phone?: string | null;
  matchState: 'Verified' | 'High Confidence' | 'Provisional' | 'Unlinked';
}

export interface CommsPortalInviteSummary {
  id: string;
  status: CustomerPortalInviteStatus;
  portalPath: string;
  email?: string | null;
  phone?: string | null;
  lastSentAt?: string | null;
}

export type CommsAttachmentKind = 'image' | 'video' | 'model' | 'document' | 'other';

export interface CommsAttachmentSummary {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  kind: CommsAttachmentKind;
  storagePath?: string | null;
  sha256?: string | null;
}

export interface CommsMessageSummary {
  id: string;
  direction: CommsMessageDirection;
  status: CommsMessageStatus;
  senderRole: string;
  senderName: string;
  body: string;
  occurredAt: string;
  externalMessageId?: string | null;
  attachments: CommsAttachmentSummary[];
}

export interface CommsActionSummary {
  id: string;
  actionType: CommsActionType;
  status: CommsActionStatus;
  label: string;
  actorLabel?: string | null;
  occurredAt: string;
}

export interface CommsConversationSummary {
  id: string;
  conversationKey: string;
  provider: CommsProvider;
  externalThreadId?: string | null;
  customerName: string;
  subject?: string | null;
  status: CommsConversationStatus;
  category: CommsConversationCategory;
  priority: CommsConversationPriority;
  assignedTo?: string | null;
  sourceUrl?: string | null;
  lastMessage?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  linkedCustomer?: CommsLinkedCustomerSummary | null;
  externalIdentity?: CommsExternalIdentitySummary | null;
  portalInvite?: CommsPortalInviteSummary | null;
  messages: CommsMessageSummary[];
  actions: CommsActionSummary[];
  readinessIssues: string[];
}

export interface CommsInboxCounts {
  all: number;
  unread: number;
  assignedToMe: number;
  resolved: number;
  flagged: number;
}

export interface CommsCustomerReadinessSummary {
  address: boolean;
  accessChecklist: boolean;
  vatDetails: boolean;
  contactChannel: boolean;
}

export interface CommsCustomerSummary {
  id: string;
  customerKey: string;
  name: string;
  customerType?: string | null;
  stage?: string | null;
  email?: string | null;
  phone?: string | null;
  lastActivityAt?: string | null;
  conversationCount: number;
  unreadCount: number;
  linkedQuotes: number;
  linkedOrders: number;
  portalStatus?: CustomerPortalInviteStatus | null;
  firstTouchProvider?: CommsProvider | null;
  externalIdentities: CommsExternalIdentitySummary[];
  readiness: CommsCustomerReadinessSummary;
  blockers: string[];
}

export interface CommsRecentInteractionSummary {
  id: string;
  customerKey?: string | null;
  customerName: string;
  action: string;
  channel: CommsProvider;
  occurredAt: string;
  status: 'Pending' | 'Success' | 'Warning' | 'Info';
  conversationId: string;
}

export interface CommsReadinessIssueSummary {
  id: string;
  label: string;
  count: number;
  color: 'red' | 'amber' | 'blue' | 'purple';
  customerKeys: string[];
}

export interface CommsCrmOverviewSummary {
  customers: CommsCustomerSummary[];
  recentInteractions: CommsRecentInteractionSummary[];
  readinessIssues: CommsReadinessIssueSummary[];
  metrics: {
    totalCustomers: number;
    activeLeads: number;
    conversionRatePct: number;
    overdueFollowUps: number;
  };
}

export interface CommsStudioSnapshot {
  lastUpdatedAt: string;
  counts: CommsInboxCounts;
  channels: CommsChannelSummary[];
  conversations: CommsConversationSummary[];
  crm: CommsCrmOverviewSummary;
}

export interface SendCommsReplyInput {
  body: string;
  actorLabel?: string;
  attachments?: CommsAttachmentSummary[];
}

export interface InboundCommsMessageInput {
  provider: CommsProvider;
  externalThreadId?: string;
  externalUserId: string;
  displayName?: string;
  handle?: string;
  email?: string;
  phone?: string;
  body: string;
  externalMessageId?: string;
  occurredAt?: string;
  category?: CommsConversationCategory;
  sourceUrl?: string;
  attachments?: CommsAttachmentSummary[];
}

export interface LinkCommsCustomerInput {
  customerKey?: string;
  actorLabel?: string;
}

export interface CreateCommsCustomerInput {
  name: string;
  customerType?: string;
  stage?: string;
  email?: string;
  phone?: string;
  actorLabel?: string;
}

export interface AssignCommsConversationInput {
  assignedTo: string;
  actorLabel?: string;
}

export interface CommsWorkflowActionInput {
  actorLabel?: string;
  note?: string;
}
