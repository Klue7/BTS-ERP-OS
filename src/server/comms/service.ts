import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import type {
  AssignCommsConversationInput,
  CommsActionStatus,
  CommsActionType,
  CommsAttachmentSummary,
  CommsChannelSummary,
  CommsConnectionStatus,
  CommsConversationCategory,
  CommsConversationPriority,
  CommsConversationStatus,
  CommsExternalIdentitySummary,
  CommsLinkedCustomerSummary,
  CommsMessageDirection,
  CommsMessageStatus,
  CommsMessageSummary,
  CommsPortalInviteSummary,
  CommsProvider,
  CommsStudioSnapshot,
  CommsWorkflowActionInput,
  CreateCommsCustomerInput,
  CustomerPortalInviteStatus,
  InboundCommsMessageInput,
  LinkCommsCustomerInput,
  SendCommsReplyInput,
} from '../../comms/contracts.ts';
import { emitCommsEvent } from './events.ts';
import { recordWorkflowEvent } from '../workflows/ledger.ts';

const providerToDb: Record<CommsProvider, string> = {
  WhatsApp: 'WHATSAPP',
  Email: 'EMAIL',
  Facebook: 'FACEBOOK',
  Instagram: 'INSTAGRAM',
  LinkedIn: 'LINKEDIN',
  Pinterest: 'PINTEREST',
  TikTok: 'TIKTOK',
  Web: 'WEB',
  Internal: 'INTERNAL',
};

const dbProviderToLabel: Record<string, CommsProvider> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  PINTEREST: 'Pinterest',
  TIKTOK: 'TikTok',
  WEB: 'Web',
  INTERNAL: 'Internal',
};

const dbConnectionStatusToLabel: Record<string, CommsConnectionStatus> = {
  CONNECTED: 'Connected',
  DEGRADED: 'Degraded',
  DISCONNECTED: 'Disconnected',
  SIMULATED: 'Simulated',
};

const dbConversationStatusToLabel: Record<string, CommsConversationStatus> = {
  OPEN: 'Open',
  RESOLVED: 'Resolved',
  FLAGGED: 'Flagged',
  ARCHIVED: 'Archived',
};

const conversationStatusToDb: Record<CommsConversationStatus, string> = {
  Open: 'OPEN',
  Resolved: 'RESOLVED',
  Flagged: 'FLAGGED',
  Archived: 'ARCHIVED',
};

const dbCategoryToLabel: Record<string, CommsConversationCategory> = {
  LEAD: 'Lead',
  SUPPORT: 'Support',
  QUOTE: 'Quote',
  PAYMENT: 'Payment',
  DELIVERY: 'Delivery',
  GENERAL: 'General',
};

const categoryToDb: Record<CommsConversationCategory, string> = {
  Lead: 'LEAD',
  Support: 'SUPPORT',
  Quote: 'QUOTE',
  Payment: 'PAYMENT',
  Delivery: 'DELIVERY',
  General: 'GENERAL',
};

const dbPriorityToLabel: Record<string, CommsConversationPriority> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const priorityToDb: Record<CommsConversationPriority, string> = {
  Low: 'LOW',
  Normal: 'NORMAL',
  High: 'HIGH',
  Critical: 'CRITICAL',
};

const dbMessageDirectionToLabel: Record<string, CommsMessageDirection> = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  INTERNAL: 'Internal',
};

const messageDirectionToDb: Record<CommsMessageDirection, string> = {
  Inbound: 'INBOUND',
  Outbound: 'OUTBOUND',
  Internal: 'INTERNAL',
};

const dbMessageStatusToLabel: Record<string, CommsMessageStatus> = {
  RECEIVED: 'Received',
  SENT: 'Sent',
  QUEUED: 'Queued',
  FAILED: 'Failed',
  READ: 'Read',
};

const messageStatusToDb: Record<CommsMessageStatus, string> = {
  Received: 'RECEIVED',
  Sent: 'SENT',
  Queued: 'QUEUED',
  Failed: 'FAILED',
  Read: 'READ',
};

const dbActionTypeToLabel: Record<string, CommsActionType> = {
  LINK_CUSTOMER: 'Link Customer',
  CREATE_LEAD: 'Create Lead',
  CONVERT_QUOTE: 'Convert Quote',
  CREATE_TASK: 'Create Task',
  REQUEST_INFO: 'Request Info',
  SUPPORT_ISSUE: 'Support Issue',
  RESOLVE: 'Resolve',
  ASSIGN: 'Assign',
  TAG: 'Tag',
};

const actionTypeToDb: Record<CommsActionType, string> = {
  'Link Customer': 'LINK_CUSTOMER',
  'Create Lead': 'CREATE_LEAD',
  'Convert Quote': 'CONVERT_QUOTE',
  'Create Task': 'CREATE_TASK',
  'Request Info': 'REQUEST_INFO',
  'Support Issue': 'SUPPORT_ISSUE',
  Resolve: 'RESOLVE',
  Assign: 'ASSIGN',
  Tag: 'TAG',
};

const dbActionStatusToLabel: Record<string, CommsActionStatus> = {
  OPEN: 'Open',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const actionStatusToDb: Record<CommsActionStatus, string> = {
  Open: 'OPEN',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
};

const dbPortalInviteStatusToLabel: Record<string, CustomerPortalInviteStatus> = {
  PROVISIONAL: 'Provisional',
  READY: 'Ready',
  INVITE_SENT: 'Invite Sent',
  VERIFIED: 'Verified',
  DISABLED: 'Disabled',
};

const conversationArgs = {
  include: {
    customer: true,
    externalIdentity: true,
    channelConnection: true,
    portalInvites: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
    messages: {
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
      take: 40,
    },
    actions: {
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    },
  },
  orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
} satisfies Prisma.CommsConversationFindManyArgs;

type CommsConversationRecord = Prisma.CommsConversationGetPayload<typeof conversationArgs>;

const crmCustomerArgs = {
  include: {
    commsExternalIdentities: {
      orderBy: [{ isVerified: 'desc' }, { lastSeenAt: 'desc' }],
    },
    commsConversations: {
      include: {
        portalInvites: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    },
    customerPortalInvites: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
    documents: {
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    },
  },
  orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
} satisfies Prisma.CustomerProfileFindManyArgs;

type CrmCustomerRecord = Prisma.CustomerProfileGetPayload<typeof crmCustomerArgs>;
type DbClient = typeof prisma | Prisma.TransactionClient;

function key(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value?: string | null) {
  const cleaned = value?.replace(/[^\d+]/g, '').trim();
  return cleaned || null;
}

function classifyMessage(body: string, fallback: CommsConversationCategory = 'General'): CommsConversationCategory {
  const normalized = body.toLowerCase();
  if (/\b(quote|price|sample|cost|estimate)\b/.test(normalized)) return 'Quote';
  if (/\b(delivery|ship|courier|eta|address)\b/.test(normalized)) return 'Delivery';
  if (/\b(pay|paid|invoice|deposit|balance)\b/.test(normalized)) return 'Payment';
  if (/\b(issue|problem|broken|complaint|support)\b/.test(normalized)) return 'Support';
  if (/\b(ad|instagram|facebook|lead|interested|looking)\b/.test(normalized)) return 'Lead';
  return fallback;
}

function labelFromProvider(value: string): CommsProvider {
  return dbProviderToLabel[value] ?? 'Internal';
}

function customerMatchState(customer: CommsConversationRecord['customer'], identity: CommsConversationRecord['externalIdentity']): CommsLinkedCustomerSummary['matchState'] {
  if (!customer) return 'Unlinked';
  if (identity?.isVerified) return 'Verified';
  if ((identity?.confidenceScore ?? 0) >= 80) return 'High Confidence';
  return 'Provisional';
}

function readinessIssuesForConversation(record: CommsConversationRecord) {
  const issues: string[] = [];
  const customer = record.customer;
  const identity = record.externalIdentity;
  const invite = record.portalInvites[0] ?? null;

  if (!customer) {
    issues.push('Customer not linked');
  }
  if (!customer?.email && !identity?.email) {
    issues.push('Email missing');
  }
  if (!customer?.phone && !identity?.phone) {
    issues.push('Phone missing');
  }
  if (invite?.status === 'PROVISIONAL') {
    issues.push('Portal profile provisional');
  }
  if (record.category === 'DELIVERY') {
    issues.push('Confirm delivery address');
  }
  if (record.category === 'QUOTE') {
    issues.push('Confirm quote scope');
  }

  return issues;
}

async function ensureCustomerRequestConversation(
  customerId: string,
  client: DbClient = prisma,
) {
  const customer = await client.customerProfile.findUnique({
    where: { id: customerId },
    include: {
      commsConversations: {
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      },
      commsExternalIdentities: {
        orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!customer) {
    throw new Error('Customer was not found.');
  }

  const existingConversation = customer.commsConversations[0] ?? null;
  if (existingConversation) {
    return existingConversation;
  }

  const preferredProvider: CommsProvider = customer.email
    ? 'Email'
    : customer.phone
      ? 'WhatsApp'
      : 'Internal';
  const provider = providerToDb[preferredProvider];
  const preferredIdentity = customer.commsExternalIdentities.find((identity) => identity.provider === provider) ?? customer.commsExternalIdentities[0] ?? null;
  const channel = await client.commsChannelConnection.findFirst({
    where: { provider: provider as never },
    orderBy: { updatedAt: 'desc' },
  });

  const conversation = await client.commsConversation.create({
    data: {
      conversationKey: key('COMM'),
      provider: provider as never,
      externalThreadId: `crm-request-${customer.id}`,
      channelConnectionId: channel?.id ?? null,
      externalIdentityId: preferredIdentity?.id ?? null,
      customerId: customer.id,
      customerName: customer.name,
      subject: 'CRM information request',
      category: categoryToDb.General as never,
      priority: priorityToDb.Normal as never,
      lastMessage: 'Customer information request prepared from CRM readiness workflow.',
      lastMessageAt: new Date(),
      unreadCount: 0,
      metadata: {
        source: 'CRM_CUSTOMER_DRAWER',
        workflow: 'REQUEST_INFO',
      },
    },
  });

  await ensurePortalInvite({
    customerId: customer.id,
    conversationId: conversation.id,
    email: customer.email,
    phone: customer.phone,
    status: customer.email || customer.phone ? 'Ready' : 'Provisional',
  }, client);

  return conversation;
}

function normalizeAttachments(value: unknown): CommsAttachmentSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((attachment): CommsAttachmentSummary[] => {
    if (!attachment || typeof attachment !== 'object') {
      return [];
    }

    const record = attachment as Record<string, unknown>;
    const fileName = typeof record.fileName === 'string' ? record.fileName : typeof record.name === 'string' ? record.name : 'Attachment';
    const mimeType = typeof record.mimeType === 'string' ? record.mimeType : 'application/octet-stream';
    const url = typeof record.url === 'string' ? record.url : null;
    if (!url) {
      return [];
    }

    const kind = record.kind === 'image' || record.kind === 'video' || record.kind === 'model' || record.kind === 'document' || record.kind === 'other'
      ? record.kind
      : mimeType.startsWith('image/')
        ? 'image'
        : mimeType.startsWith('video/')
          ? 'video'
          : mimeType.includes('pdf') || mimeType.startsWith('application/')
            ? 'document'
            : 'other';

    return [{
      id: typeof record.id === 'string' ? record.id : key('CATT'),
      fileName,
      mimeType,
      size: typeof record.size === 'number' ? record.size : 0,
      url,
      kind,
      storagePath: typeof record.storagePath === 'string' ? record.storagePath : null,
      sha256: typeof record.sha256 === 'string' ? record.sha256 : null,
    }];
  });
}

function mapMessage(record: CommsConversationRecord['messages'][number]): CommsMessageSummary {
  return {
    id: record.id,
    direction: dbMessageDirectionToLabel[record.direction] ?? 'Inbound',
    status: dbMessageStatusToLabel[record.status] ?? 'Received',
    senderRole: record.senderRole,
    senderName: record.senderName,
    body: record.body,
    occurredAt: record.occurredAt.toISOString(),
    externalMessageId: record.externalMessageId,
    attachments: normalizeAttachments(record.attachments),
  };
}

function mapAction(record: CommsConversationRecord['actions'][number]) {
  return {
    id: record.id,
    actionType: dbActionTypeToLabel[record.actionType] ?? 'Create Task',
    status: dbActionStatusToLabel[record.status] ?? 'Open',
    label: record.label,
    actorLabel: record.actorLabel,
    occurredAt: record.occurredAt.toISOString(),
  };
}

function mapIdentity(identity: CommsConversationRecord['externalIdentity']): CommsExternalIdentitySummary | null {
  if (!identity) return null;
  return {
    id: identity.id,
    provider: labelFromProvider(identity.provider),
    externalUserId: identity.externalUserId,
    displayName: identity.displayName,
    handle: identity.handle,
    email: identity.email,
    phone: identity.phone,
    confidenceScore: identity.confidenceScore,
    isVerified: identity.isVerified,
  };
}

function mapCustomerIdentity(identity: CrmCustomerRecord['commsExternalIdentities'][number]): CommsExternalIdentitySummary {
  return {
    id: identity.id,
    provider: labelFromProvider(identity.provider),
    externalUserId: identity.externalUserId,
    displayName: identity.displayName,
    handle: identity.handle,
    email: identity.email,
    phone: identity.phone,
    confidenceScore: identity.confidenceScore,
    isVerified: identity.isVerified,
  };
}

function mapLinkedCustomer(record: CommsConversationRecord): CommsLinkedCustomerSummary | null {
  if (!record.customer) return null;
  return {
    id: record.customer.id,
    customerKey: record.customer.customerKey,
    name: record.customer.name,
    customerType: record.customer.customerType,
    stage: record.customer.stage,
    email: record.customer.email,
    phone: record.customer.phone,
    matchState: customerMatchState(record.customer, record.externalIdentity),
  };
}

function customerReadiness(customer: CrmCustomerRecord) {
  const latestInvite = customer.customerPortalInvites[0] ?? customer.commsConversations.find((conversation) => conversation.portalInvites[0])?.portalInvites[0] ?? null;
  const hasQuoteScope = customer.documents.some((document) => document.documentType === 'CUSTOMER_QUOTE' || document.documentType === 'CUSTOMER_ORDER');
  const hasDeliveryConversation = customer.commsConversations.some((conversation) => conversation.category === 'DELIVERY');
  const hasChannel = Boolean(customer.email || customer.phone || customer.commsExternalIdentities.length > 0);

  const readiness = {
    address: hasDeliveryConversation ? false : hasQuoteScope || customer.stage === 'Won',
    accessChecklist: customer.stage === 'Won' || customer.documents.some((document) => document.documentType === 'DELIVERY_NOTE' || document.documentType === 'PROOF_OF_DELIVERY'),
    vatDetails: customer.customerType !== 'Trade' || customer.documents.some((document) => document.documentType === 'CUSTOMER_INVOICE' || document.documentType === 'CUSTOMER_ORDER'),
    contactChannel: hasChannel,
  };

  const blockers: string[] = [];
  if (!readiness.address) blockers.push('Missing Delivery Address');
  if (!readiness.accessChecklist) blockers.push('Missing Access Checklist');
  if (!readiness.vatDetails) blockers.push('Missing VAT Details');
  if (!readiness.contactChannel) blockers.push('Missing Contact Channel');
  if (latestInvite?.status === 'PROVISIONAL') blockers.push('Portal Profile Provisional');

  return {
    readiness,
    blockers,
    portalStatus: latestInvite ? dbPortalInviteStatusToLabel[latestInvite.status] ?? 'Provisional' : null,
  };
}

function mapCrmCustomer(customer: CrmCustomerRecord): CommsStudioSnapshot['crm']['customers'][number] {
  const latestConversation = customer.commsConversations[0] ?? null;
  const firstConversation = customer.commsConversations[customer.commsConversations.length - 1] ?? null;
  const { readiness, blockers, portalStatus } = customerReadiness(customer);
  const linkedQuotes = customer.documents.filter((document) => document.documentType === 'CUSTOMER_QUOTE').length;
  const linkedOrders = customer.documents.filter((document) => document.documentType === 'CUSTOMER_ORDER').length;

  return {
    id: customer.id,
    customerKey: customer.customerKey,
    name: customer.name,
    customerType: customer.customerType,
    stage: customer.stage,
    email: customer.email,
    phone: customer.phone,
    lastActivityAt: latestConversation?.lastMessageAt.toISOString() ?? customer.updatedAt.toISOString(),
    conversationCount: customer.commsConversations.length,
    unreadCount: customer.commsConversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    linkedQuotes,
    linkedOrders,
    portalStatus,
    firstTouchProvider: firstConversation ? labelFromProvider(firstConversation.provider) : null,
    externalIdentities: customer.commsExternalIdentities.map(mapCustomerIdentity),
    readiness,
    blockers,
  };
}

function buildReadinessIssues(customers: CommsStudioSnapshot['crm']['customers']): CommsStudioSnapshot['crm']['readinessIssues'] {
  const issueDefinitions: Array<{ id: string; label: string; color: 'red' | 'amber' | 'blue' | 'purple'; matches: (customer: CommsStudioSnapshot['crm']['customers'][number]) => boolean }> = [
    { id: 'missing-delivery-addresses', label: 'Missing Delivery Addresses', color: 'red', matches: (customer) => !customer.readiness.address },
    { id: 'pending-vat-verifications', label: 'Pending VAT Verifications', color: 'amber', matches: (customer) => !customer.readiness.vatDetails },
    { id: 'access-checklists-needed', label: 'Access Checklists Needed', color: 'blue', matches: (customer) => !customer.readiness.accessChecklist },
    { id: 'unlinked-lead-sources', label: 'Provisional Lead Sources', color: 'purple', matches: (customer) => customer.portalStatus === 'Provisional' || customer.externalIdentities.some((identity) => !identity.isVerified) },
  ];

  return issueDefinitions.map((issue) => {
    const matches = customers.filter(issue.matches);
    return {
      id: issue.id,
      label: issue.label,
      count: matches.length,
      color: issue.color,
      customerKeys: matches.map((customer) => customer.customerKey),
    };
  });
}

function buildRecentInteractions(conversations: CommsConversationRecord[]): CommsStudioSnapshot['crm']['recentInteractions'] {
  return conversations.slice(0, 8).map((conversation) => ({
    id: `${conversation.id}-latest`,
    customerKey: conversation.customer?.customerKey ?? null,
    customerName: conversation.customerName,
    action: conversation.category === 'QUOTE'
      ? 'Quote Requested'
      : conversation.category === 'DELIVERY'
        ? 'Delivery Follow-up'
        : conversation.category === 'PAYMENT'
          ? 'Payment Follow-up'
          : conversation.category === 'SUPPORT'
            ? 'Support Ticket'
            : conversation.category === 'LEAD'
              ? 'Lead Captured'
              : 'Message Received',
    channel: labelFromProvider(conversation.provider),
    occurredAt: conversation.lastMessageAt.toISOString(),
    status: conversation.status === 'RESOLVED'
      ? 'Success'
      : conversation.priority === 'HIGH' || conversation.priority === 'CRITICAL'
        ? 'Warning'
        : conversation.unreadCount > 0
          ? 'Pending'
          : 'Info',
    conversationId: conversation.id,
  }));
}

function buildCrmOverview(customers: CrmCustomerRecord[], conversations: CommsConversationRecord[]): CommsStudioSnapshot['crm'] {
  const mappedCustomers = customers.map(mapCrmCustomer);
  const activeLeads = mappedCustomers.filter((customer) => customer.stage !== 'Won' && customer.stage !== 'Lost').length;
  const convertedCustomers = mappedCustomers.filter((customer) => customer.stage === 'Won' || customer.linkedOrders > 0).length;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const overdueFollowUps = conversations.filter((conversation) => (
    conversation.status === 'OPEN'
    && conversation.unreadCount > 0
    && conversation.lastMessageAt.getTime() < dayAgo
  )).length;

  return {
    customers: mappedCustomers,
    recentInteractions: buildRecentInteractions(conversations),
    readinessIssues: buildReadinessIssues(mappedCustomers),
    metrics: {
      totalCustomers: mappedCustomers.length,
      activeLeads,
      conversionRatePct: mappedCustomers.length ? Math.round((convertedCustomers / mappedCustomers.length) * 1000) / 10 : 0,
      overdueFollowUps,
    },
  };
}

function mapPortalInvite(record: CommsConversationRecord): CommsPortalInviteSummary | null {
  const invite = record.portalInvites[0] ?? null;
  if (!invite) return null;
  return {
    id: invite.id,
    status: dbPortalInviteStatusToLabel[invite.status] ?? 'Provisional',
    portalPath: invite.portalPath,
    email: invite.email,
    phone: invite.phone,
    lastSentAt: invite.lastSentAt?.toISOString() ?? null,
  };
}

function mapConversation(record: CommsConversationRecord) {
  return {
    id: record.id,
    conversationKey: record.conversationKey,
    provider: labelFromProvider(record.provider),
    externalThreadId: record.externalThreadId,
    customerName: record.customerName,
    subject: record.subject,
    status: dbConversationStatusToLabel[record.status] ?? 'Open',
    category: dbCategoryToLabel[record.category] ?? 'General',
    priority: dbPriorityToLabel[record.priority] ?? 'Normal',
    assignedTo: record.assignedTo,
    sourceUrl: record.sourceUrl,
    lastMessage: record.lastMessage,
    lastMessageAt: record.lastMessageAt.toISOString(),
    unreadCount: record.unreadCount,
    linkedCustomer: mapLinkedCustomer(record),
    externalIdentity: mapIdentity(record.externalIdentity),
    portalInvite: mapPortalInvite(record),
    messages: record.messages.map(mapMessage),
    actions: record.actions.map(mapAction),
    readinessIssues: readinessIssuesForConversation(record),
  };
}

async function ensureChannelConnections(client: DbClient = prisma) {
  const channels: Array<{ provider: CommsProvider; label: string; status: CommsConnectionStatus }> = [
    { provider: 'WhatsApp', label: 'WhatsApp Business', status: 'Simulated' },
    { provider: 'Email', label: 'Outlook / Gmail', status: 'Simulated' },
    { provider: 'Facebook', label: 'Facebook Inbox', status: 'Simulated' },
    { provider: 'Instagram', label: 'Instagram DMs', status: 'Simulated' },
    { provider: 'TikTok', label: 'TikTok DMs', status: 'Simulated' },
    { provider: 'LinkedIn', label: 'LinkedIn Messages', status: 'Simulated' },
    { provider: 'Pinterest', label: 'Pinterest Inbox', status: 'Simulated' },
    { provider: 'Web', label: 'Website Forms', status: 'Simulated' },
  ];

  for (const channel of channels) {
    await client.commsChannelConnection.upsert({
      where: { connectionKey: `COMM_CH_${providerToDb[channel.provider]}` },
      update: {
        label: channel.label,
        provider: providerToDb[channel.provider] as never,
        status: channel.status.toUpperCase() as never,
      },
      create: {
        connectionKey: `COMM_CH_${providerToDb[channel.provider]}`,
        label: channel.label,
        provider: providerToDb[channel.provider] as never,
        status: channel.status.toUpperCase() as never,
      },
    });
  }
}

async function upsertCustomer(input: { key: string; name: string; customerType?: string; stage?: string; email?: string; phone?: string }, client: DbClient = prisma) {
  return client.customerProfile.upsert({
    where: { customerKey: input.key },
    update: {
      name: input.name,
      customerType: input.customerType ?? null,
      stage: input.stage ?? 'Lead',
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
    create: {
      customerKey: input.key,
      name: input.name,
      customerType: input.customerType ?? null,
      stage: input.stage ?? 'Lead',
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
}

async function ensurePortalInvite(input: { customerId: string; conversationId?: string | null; email?: string | null; phone?: string | null; status?: CustomerPortalInviteStatus }, client: DbClient = prisma) {
  const existing = await client.customerPortalInvite.findFirst({
    where: {
      customerId: input.customerId,
      sourceConversationId: input.conversationId ?? null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return client.customerPortalInvite.update({
      where: { id: existing.id },
      data: {
        email: input.email ?? existing.email,
        phone: input.phone ?? existing.phone,
        status: input.status ? input.status.toUpperCase().replace(/ /g, '_') as never : existing.status,
      },
    });
  }

  return client.customerPortalInvite.create({
    data: {
      inviteKey: key('CPI'),
      customerId: input.customerId,
      sourceConversationId: input.conversationId ?? null,
      status: (input.status ?? 'Provisional').toUpperCase().replace(/ /g, '_') as never,
      portalPath: '/portal',
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
}

async function findOrCreateCustomerForIdentity(input: InboundCommsMessageInput, client: DbClient = prisma) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const provider = providerToDb[input.provider];

  const existingIdentity = await client.commsExternalIdentity.findUnique({
    where: {
      provider_externalUserId: {
        provider: provider as never,
        externalUserId: input.externalUserId,
      },
    },
    include: { customer: true },
  });

  if (existingIdentity?.customer) {
    const enrichedCustomer = await client.customerProfile.update({
      where: { id: existingIdentity.customer.id },
      data: {
        email: existingIdentity.customer.email ?? email,
        phone: existingIdentity.customer.phone ?? phone,
        name: existingIdentity.customer.name === 'New Channel Lead'
          ? input.displayName?.trim() || input.handle?.trim() || existingIdentity.customer.name
          : existingIdentity.customer.name,
      },
    });

    return {
      customer: enrichedCustomer,
      identity: await client.commsExternalIdentity.update({
        where: { id: existingIdentity.id },
        data: {
          displayName: input.displayName ?? existingIdentity.displayName,
          handle: input.handle ?? existingIdentity.handle,
          email: email ?? existingIdentity.email,
          phone: phone ?? existingIdentity.phone,
          lastSeenAt: new Date(),
        },
      }),
      confidenceScore: existingIdentity.confidenceScore,
      isNewCustomer: false,
    };
  }

  const matchedCustomer = email || phone
    ? await client.customerProfile.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      })
    : null;

  const customer = matchedCustomer
    ? await client.customerProfile.update({
        where: { id: matchedCustomer.id },
        data: {
          email: matchedCustomer.email ?? email,
          phone: matchedCustomer.phone ?? phone,
        },
      })
    : await client.customerProfile.create({
        data: {
          customerKey: key('CUST_COMMS'),
          name: input.displayName?.trim() || input.handle?.trim() || email || phone || 'New Channel Lead',
          customerType: 'Retail',
          stage: 'Lead',
          email,
          phone,
        },
      });

  const confidenceScore = matchedCustomer ? 92 : 45;
  const identity = await client.commsExternalIdentity.upsert({
    where: {
      provider_externalUserId: {
        provider: provider as never,
        externalUserId: input.externalUserId,
      },
    },
    update: {
      customerId: customer.id,
      displayName: input.displayName ?? null,
      handle: input.handle ?? null,
      email,
      phone,
      confidenceScore,
      isVerified: Boolean(matchedCustomer),
      lastSeenAt: new Date(),
    },
    create: {
      provider: provider as never,
      externalUserId: input.externalUserId,
      customerId: customer.id,
      displayName: input.displayName ?? null,
      handle: input.handle ?? null,
      email,
      phone,
      confidenceScore,
      isVerified: Boolean(matchedCustomer),
      rawProfile: {
        provider: input.provider,
        handle: input.handle ?? null,
      },
    },
  });

  return { customer, identity, confidenceScore, isNewCustomer: !matchedCustomer };
}

async function seedConversation(input: {
  customerKey: string;
  customerName: string;
  customerType: string;
  stage: string;
  email?: string;
  phone?: string;
  provider: CommsProvider;
  externalUserId: string;
  externalThreadId: string;
  subject: string;
  category: CommsConversationCategory;
  priority?: CommsConversationPriority;
  messages: Array<{ direction: CommsMessageDirection; senderName: string; body: string; minutesAgo: number }>;
}) {
  const provider = providerToDb[input.provider];
  const channel = await prisma.commsChannelConnection.findUnique({ where: { connectionKey: `COMM_CH_${provider}` } });
  const customer = await upsertCustomer({
    key: input.customerKey,
    name: input.customerName,
    customerType: input.customerType,
    stage: input.stage,
    email: input.email,
    phone: input.phone,
  });

  const identity = await prisma.commsExternalIdentity.upsert({
    where: {
      provider_externalUserId: {
        provider: provider as never,
        externalUserId: input.externalUserId,
      },
    },
    update: {
      customerId: customer.id,
      displayName: input.customerName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      confidenceScore: 96,
      isVerified: true,
      lastSeenAt: new Date(),
    },
    create: {
      provider: provider as never,
      externalUserId: input.externalUserId,
      customerId: customer.id,
      displayName: input.customerName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      confidenceScore: 96,
      isVerified: true,
    },
  });

  const lastMessage = input.messages[input.messages.length - 1];
  const conversation = await prisma.commsConversation.create({
    data: {
      conversationKey: key('COMM'),
      provider: provider as never,
      externalThreadId: input.externalThreadId,
      channelConnectionId: channel?.id ?? null,
      externalIdentityId: identity.id,
      customerId: customer.id,
      customerName: input.customerName,
      subject: input.subject,
      status: 'OPEN',
      category: categoryToDb[input.category] as never,
      priority: priorityToDb[input.priority ?? 'Normal'] as never,
      lastMessage: lastMessage.body,
      lastMessageAt: new Date(Date.now() - lastMessage.minutesAgo * 60_000),
      unreadCount: input.messages.filter((message) => message.direction === 'Inbound').length,
      metadata: {
        source: 'INTERNAL_SIMULATOR',
      },
    },
  });

  await ensurePortalInvite({
    customerId: customer.id,
    conversationId: conversation.id,
    email: input.email ?? null,
    phone: input.phone ?? null,
    status: input.email || input.phone ? 'Ready' : 'Provisional',
  });

  for (const message of input.messages) {
    await prisma.commsMessage.create({
      data: {
        messageKey: key('CMSG'),
        conversationId: conversation.id,
        direction: messageDirectionToDb[message.direction] as never,
        status: message.direction === 'Outbound' ? 'SENT' : 'RECEIVED',
        senderRole: message.direction === 'Outbound' ? 'Agent' : 'Customer',
        senderName: message.senderName,
        body: message.body,
        occurredAt: new Date(Date.now() - message.minutesAgo * 60_000),
      },
    });
  }
}

async function ensureCommsSeeded() {
  await ensureChannelConnections();

  const conversationCount = await prisma.commsConversation.count();
  if (conversationCount > 0) {
    return;
  }

  await seedConversation({
    customerKey: 'CUST_001',
    customerName: 'John Doe',
    customerType: 'Retail',
    stage: 'Lead',
    email: 'john@example.com',
    phone: '+44 7700 900001',
    provider: 'WhatsApp',
    externalUserId: 'wa_john_doe',
    externalThreadId: 'wa_thread_john_doe',
    subject: 'Sample request',
    category: 'Quote',
    messages: [
      { direction: 'Inbound', senderName: 'John Doe', body: 'Can I get a sample of the Midnight Obsidian?', minutesAgo: 68 },
    ],
  });

  await seedConversation({
    customerKey: 'CUST_002',
    customerName: 'Sarah Smith',
    customerType: 'Trade',
    stage: 'Quote Sent',
    email: 'sarah@designbuild.com',
    phone: '+44 7700 900002',
    provider: 'Email',
    externalUserId: 'email_sarah_smith',
    externalThreadId: 'email_thread_sarah_delivery',
    subject: 'Delivery date adjustment',
    category: 'Delivery',
    priority: 'High',
    messages: [
      { direction: 'Inbound', senderName: 'Sarah Smith', body: 'The quote looks good, but we need to adjust the delivery date.', minutesAgo: 155 },
      { direction: 'Outbound', senderName: 'Rikus Klue', body: 'I can help with that. Please send the preferred site date and access window.', minutesAgo: 145 },
    ],
  });

  await seedConversation({
    customerKey: 'CUST_004',
    customerName: 'Rachel Zane',
    customerType: 'Retail',
    stage: 'Lead',
    email: 'rachel@example.com',
    phone: '+44 7700 900004',
    provider: 'Instagram',
    externalUserId: 'ig_rachel_zane',
    externalThreadId: 'ig_thread_rachel_lead',
    subject: 'Instagram ad lead',
    category: 'Lead',
    messages: [
      { direction: 'Inbound', senderName: 'Rachel Zane', body: 'Hi, I saw your ad on Instagram. Do you ship to London?', minutesAgo: 1380 },
      { direction: 'Outbound', senderName: 'Rikus Klue', body: 'Hi Rachel. We can help with national delivery. Which product are you considering?', minutesAgo: 1375 },
      { direction: 'Inbound', senderName: 'Rachel Zane', body: 'I like the cladding tiles. Can you quote a feature wall?', minutesAgo: 120 },
    ],
  });

  await seedConversation({
    customerKey: 'CUST_COMMS_THABO',
    customerName: 'Thabo Mokoena',
    customerType: 'Retail',
    stage: 'Lead',
    provider: 'TikTok',
    externalUserId: 'tt_thabo_m',
    externalThreadId: 'tt_thread_thabo_visualizer',
    subject: 'TikTok visualizer inquiry',
    category: 'Lead',
    priority: 'Normal',
    messages: [
      { direction: 'Inbound', senderName: 'Thabo Mokoena', body: 'Can you show these tiles in my lounge wall?', minutesAgo: 35 },
    ],
  });
}

export async function getCommsStudioSnapshot(): Promise<CommsStudioSnapshot> {
  await ensureCommsSeeded();

  const [connections, conversations, customers] = await Promise.all([
    prisma.commsChannelConnection.findMany({ orderBy: [{ provider: 'asc' }] }),
    prisma.commsConversation.findMany(conversationArgs),
    prisma.customerProfile.findMany(crmCustomerArgs),
  ]);

  const mappedConversations = conversations.map(mapConversation);
  const channels: CommsChannelSummary[] = connections.map((connection) => {
    const provider = labelFromProvider(connection.provider);
    const providerConversations = conversations.filter((conversation) => conversation.provider === connection.provider);
    return {
      provider,
      label: connection.label,
      status: dbConnectionStatusToLabel[connection.status] ?? 'Simulated',
      count: providerConversations.length,
      unreadCount: providerConversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
      syncError: connection.syncError,
    };
  });

  return {
    lastUpdatedAt: new Date().toISOString(),
    counts: {
      all: conversations.length,
      unread: conversations.filter((conversation) => conversation.unreadCount > 0).length,
      assignedToMe: conversations.filter((conversation) => conversation.assignedTo === 'Rikus Klue' || conversation.assignedTo === 'Owner').length,
      resolved: conversations.filter((conversation) => conversation.status === 'RESOLVED').length,
      flagged: conversations.filter((conversation) => conversation.status === 'FLAGGED').length,
    },
    channels,
    conversations: mappedConversations,
    crm: buildCrmOverview(customers, conversations),
  };
}

async function createAction(client: DbClient, conversationId: string, actionType: CommsActionType, label: string, input: CommsWorkflowActionInput = {}) {
  return client.commsAction.create({
    data: {
      actionKey: key('CACT'),
      conversationId,
      actionType: actionTypeToDb[actionType] as never,
      status: actionStatusToDb['Completed'] as never,
      label,
      actorLabel: input.actorLabel ?? 'Owner',
      payload: input.note ? { note: input.note } : undefined,
    },
  });
}

export async function sendReply(conversationId: string, input: SendCommsReplyInput) {
  const body = input.body.trim();
  const attachments = normalizeAttachments(input.attachments);
  if (!body && attachments.length === 0) {
    throw new Error('Reply body or attachment is required.');
  }
  const messageBody = body || `Sent ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}.`;

  await prisma.$transaction(async (tx) => {
    await tx.commsMessage.create({
      data: {
        messageKey: key('CMSG'),
        conversationId,
        direction: messageDirectionToDb.Outbound as never,
        status: messageStatusToDb.Sent as never,
        senderRole: 'Agent',
        senderName: input.actorLabel ?? 'Owner',
        body: messageBody,
        attachments: attachments.length ? attachments as never : undefined,
        metadata: {
          bridge: 'INTERNAL_SIMULATOR',
        },
      },
    });

    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: messageBody,
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
    });
  });

  emitCommsEvent({ type: 'comms.message.sent', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function resolveConversation(conversationId: string, input: CommsWorkflowActionInput = {}) {
  await prisma.$transaction(async (tx) => {
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        status: conversationStatusToDb.Resolved as never,
        unreadCount: 0,
      },
    });
    await createAction(tx, conversationId, 'Resolve', 'Conversation resolved', input);
  });

  emitCommsEvent({ type: 'comms.conversation.resolved', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function assignConversation(conversationId: string, input: AssignCommsConversationInput) {
  if (!input.assignedTo.trim()) {
    throw new Error('Assigned operator is required.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: { assignedTo: input.assignedTo.trim() },
    });
    await createAction(tx, conversationId, 'Assign', `Assigned to ${input.assignedTo.trim()}`, input);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function linkCustomer(conversationId: string, input: LinkCommsCustomerInput = {}) {
  const conversation = await prisma.commsConversation.findUnique({
    where: { id: conversationId },
    include: { externalIdentity: true, customer: true },
  });
  if (!conversation) {
    throw new Error('Conversation was not found.');
  }

  const customer = input.customerKey
    ? await prisma.customerProfile.findUnique({ where: { customerKey: input.customerKey } })
    : conversation.customer;

  if (!customer) {
    throw new Error('No matching customer was found for this conversation.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        customerId: customer.id,
        customerName: customer.name,
      },
    });

    if (conversation.externalIdentity) {
      await tx.commsExternalIdentity.update({
        where: { id: conversation.externalIdentity.id },
        data: {
          customerId: customer.id,
          confidenceScore: 100,
          isVerified: true,
        },
      });
    }

    await ensurePortalInvite({
      customerId: customer.id,
      conversationId,
      email: customer.email,
      phone: customer.phone,
      status: customer.email || customer.phone ? 'Ready' : 'Provisional',
    }, tx);
    await createAction(tx, conversationId, 'Link Customer', `Linked customer ${customer.customerKey}`, input);
  });

  emitCommsEvent({ type: 'comms.customer.linked', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function createLead(conversationId: string, input: CommsWorkflowActionInput = {}) {
  const conversation = await prisma.commsConversation.findUnique({
    where: { id: conversationId },
    include: { externalIdentity: true, customer: true },
  });
  if (!conversation) {
    throw new Error('Conversation was not found.');
  }

  await prisma.$transaction(async (tx) => {
    let customerId = conversation.customerId;
    let customerKeyForEvent = conversation.customer?.customerKey ?? null;
    if (!customerId) {
      const customer = await tx.customerProfile.create({
        data: {
          customerKey: key('CUST_COMMS'),
          name: conversation.customerName,
          customerType: 'Retail',
          stage: 'Lead',
          email: conversation.externalIdentity?.email ?? null,
          phone: conversation.externalIdentity?.phone ?? null,
        },
      });
      customerId = customer.id;
      customerKeyForEvent = customer.customerKey;
    } else {
      const customer = await tx.customerProfile.update({
        where: { id: customerId },
        data: { stage: 'Lead' },
      });
      customerKeyForEvent = customer.customerKey;
    }

    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        customerId,
        category: categoryToDb.Lead as never,
      },
    });
    await ensurePortalInvite({
      customerId,
      conversationId,
      email: conversation.externalIdentity?.email ?? conversation.customer?.email,
      phone: conversation.externalIdentity?.phone ?? conversation.customer?.phone,
      status: conversation.externalIdentity?.email || conversation.externalIdentity?.phone ? 'Ready' : 'Provisional',
    }, tx);
    await createAction(tx, conversationId, 'Create Lead', 'Lead captured from comms conversation', input);
    await recordWorkflowEvent({
      eventKey: `conversation:${conversationId}:customer.qualified:${customerKeyForEvent ?? customerId}`,
      workflowId: `conversation:${conversationId}`,
      type: 'customer.qualified',
      label: `Lead profile captured from conversation ${conversation.conversationKey}.`,
      sourceModule: 'CRM',
      occurredAt: new Date(),
      subject: {
        conversationId,
        customerKey: customerKeyForEvent,
      },
      statusFrom: conversation.customerId ? null : 'New',
      statusTo: 'Lead',
      sourceRecordId: customerKeyForEvent ?? customerId,
    }, tx);
  });

  emitCommsEvent({ type: 'comms.lead.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function createManualCustomer(input: CreateCommsCustomerInput) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  let createdCustomerId = '';

  if (!name) {
    throw new Error('Customer name is required.');
  }

  await prisma.$transaction(async (tx) => {
    const matchedCustomer = email || phone
      ? await tx.customerProfile.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
        })
      : null;

    const customer = matchedCustomer
      ? await tx.customerProfile.update({
          where: { id: matchedCustomer.id },
          data: {
            name: matchedCustomer.name === 'New Channel Lead' ? name : matchedCustomer.name,
            customerType: input.customerType ?? matchedCustomer.customerType,
            stage: input.stage ?? matchedCustomer.stage,
            email: matchedCustomer.email ?? email,
            phone: matchedCustomer.phone ?? phone,
          },
        })
      : await tx.customerProfile.create({
          data: {
            customerKey: key('CUST_MANUAL'),
            name,
            customerType: input.customerType ?? 'Retail',
            stage: input.stage ?? 'Lead',
            email,
            phone,
          },
        });

    createdCustomerId = customer.id;

    await ensurePortalInvite({
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      status: customer.email || customer.phone ? 'Ready' : 'Provisional',
    }, tx);
    await recordWorkflowEvent({
      eventKey: `customer:${customer.customerKey}:customer.qualified:manual`,
      workflowId: `customer:${customer.customerKey}`,
      type: 'customer.qualified',
      label: `Customer ${customer.customerKey} created from manual CRM intake.`,
      sourceModule: 'CRM',
      occurredAt: new Date(),
      subject: {
        customerKey: customer.customerKey,
      },
      statusFrom: matchedCustomer ? matchedCustomer.stage : 'New',
      statusTo: customer.stage,
      sourceRecordId: customer.customerKey,
      payload: {
        actorLabel: input.actorLabel ?? 'CRM Manual Intake',
      },
    }, tx);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: createdCustomerId || name });
  return getCommsStudioSnapshot();
}

export async function requestInfo(conversationId: string, input: CommsWorkflowActionInput = {}) {
  const note = input.note?.trim() || 'Please send your email, phone number, delivery address, and wall/floor measurements so we can complete your BTS profile.';

  await prisma.$transaction(async (tx) => {
    await tx.commsMessage.create({
      data: {
        messageKey: key('CMSG'),
        conversationId,
        direction: messageDirectionToDb.Outbound as never,
        status: messageStatusToDb.Sent as never,
        senderRole: 'Agent',
        senderName: input.actorLabel ?? 'Owner',
        body: note,
        metadata: { template: 'REQUEST_PROFILE_INFO', bridge: 'INTERNAL_SIMULATOR' },
      },
    });
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: note,
        lastMessageAt: new Date(),
      },
    });
    await createAction(tx, conversationId, 'Request Info', 'Requested missing customer profile details', input);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function requestCustomerInfo(customerId: string, input: CommsWorkflowActionInput = {}) {
  const conversation = await prisma.$transaction(async (tx) => (
    ensureCustomerRequestConversation(customerId, tx)
  ));

  return requestInfo(conversation.id, input);
}

export async function createTask(conversationId: string, input: CommsWorkflowActionInput = {}) {
  await prisma.$transaction(async (tx) => {
    await createAction(tx, conversationId, 'Create Task', input.note?.trim() || 'Follow-up task created from conversation', input);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function createSupportIssue(conversationId: string, input: CommsWorkflowActionInput = {}) {
  await prisma.$transaction(async (tx) => {
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        category: categoryToDb.Support as never,
        priority: priorityToDb.High as never,
        status: conversationStatusToDb.Flagged as never,
      },
    });
    await createAction(tx, conversationId, 'Support Issue', 'Support issue flagged from conversation', input);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function convertQuote(conversationId: string, input: CommsWorkflowActionInput = {}) {
  await prisma.$transaction(async (tx) => {
    await tx.commsConversation.update({
      where: { id: conversationId },
      data: {
        category: categoryToDb.Quote as never,
        priority: priorityToDb.High as never,
      },
    });
    await createAction(tx, conversationId, 'Convert Quote', 'Quote conversion requested from conversation', input);
  });

  emitCommsEvent({ type: 'comms.action.created', entityId: conversationId });
  return getCommsStudioSnapshot();
}

export async function ingestInboundMessage(providerParam: string, input: InboundCommsMessageInput) {
  const providerLabel = Object.keys(providerToDb).find((label) => label.toLowerCase() === providerParam.toLowerCase()) as CommsProvider | undefined;
  const provider = providerLabel ?? input.provider;
  const normalizedInput: InboundCommsMessageInput = {
    ...input,
    provider,
    category: input.category ?? classifyMessage(input.body),
  };
  const attachments = normalizeAttachments(normalizedInput.attachments);
  const inboundBody = normalizedInput.body.trim() || (attachments.length ? `Received ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}.` : '');
  if (!inboundBody) {
    throw new Error('Inbound message body or attachment is required.');
  }

  await ensureChannelConnections();

  const result = await prisma.$transaction(async (tx) => {
    const identityMatch = await findOrCreateCustomerForIdentity(normalizedInput, tx);
    const providerKey = providerToDb[provider];
    const externalThreadId = normalizedInput.externalThreadId ?? `${providerKey}_${normalizedInput.externalUserId}`;
    const channel = await tx.commsChannelConnection.findUnique({ where: { connectionKey: `COMM_CH_${providerKey}` } });
    const existingConversation = await tx.commsConversation.findUnique({
      where: {
        provider_externalThreadId: {
          provider: providerKey as never,
          externalThreadId,
        },
      },
    });

    const conversation = existingConversation
      ? await tx.commsConversation.update({
          where: { id: existingConversation.id },
          data: {
            customerId: identityMatch.customer.id,
            externalIdentityId: identityMatch.identity.id,
            customerName: identityMatch.customer.name,
            category: categoryToDb[normalizedInput.category ?? 'General'] as never,
            lastMessage: inboundBody,
            lastMessageAt: normalizedInput.occurredAt ? new Date(normalizedInput.occurredAt) : new Date(),
            unreadCount: { increment: 1 },
          },
        })
      : await tx.commsConversation.create({
          data: {
            conversationKey: key('COMM'),
            provider: providerKey as never,
            externalThreadId,
            channelConnectionId: channel?.id ?? null,
            externalIdentityId: identityMatch.identity.id,
            customerId: identityMatch.customer.id,
            customerName: identityMatch.customer.name,
            subject: normalizedInput.category ?? 'Inbound message',
            category: categoryToDb[normalizedInput.category ?? 'General'] as never,
            priority: priorityToDb.Normal as never,
            sourceUrl: normalizedInput.sourceUrl ?? null,
            lastMessage: inboundBody,
            lastMessageAt: normalizedInput.occurredAt ? new Date(normalizedInput.occurredAt) : new Date(),
            unreadCount: 1,
            metadata: { source: 'INBOUND_BRIDGE', confidenceScore: identityMatch.confidenceScore },
          },
        });

    const message = await tx.commsMessage.create({
      data: {
        messageKey: key('CMSG'),
        conversationId: conversation.id,
        direction: messageDirectionToDb.Inbound as never,
        status: messageStatusToDb.Received as never,
        senderRole: 'Customer',
        senderName: normalizedInput.displayName ?? identityMatch.customer.name,
        body: inboundBody,
        externalMessageId: normalizedInput.externalMessageId ?? null,
        attachments: attachments.length ? attachments as never : undefined,
        occurredAt: normalizedInput.occurredAt ? new Date(normalizedInput.occurredAt) : new Date(),
      },
    });

    await ensurePortalInvite({
      customerId: identityMatch.customer.id,
      conversationId: conversation.id,
      email: identityMatch.customer.email,
      phone: identityMatch.customer.phone,
      status: identityMatch.isNewCustomer ? 'Provisional' : 'Ready',
    }, tx);
    await recordWorkflowEvent({
      eventKey: `conversation:${conversation.id}:conversation.received:${normalizedInput.externalMessageId ?? message.messageKey}`,
      workflowId: `conversation:${conversation.id}`,
      type: 'conversation.received',
      label: `${provider} message received from ${identityMatch.customer.name}: ${inboundBody}`,
      sourceModule: 'Comms',
      occurredAt: normalizedInput.occurredAt ? new Date(normalizedInput.occurredAt) : new Date(),
      subject: {
        conversationId: conversation.id,
        customerKey: identityMatch.customer.customerKey,
      },
      statusFrom: existingConversation ? 'Open' : 'New',
      statusTo: normalizedInput.category ?? 'General',
      sourceRecordId: conversation.conversationKey,
      payload: {
        provider,
        externalThreadId,
        attachmentCount: attachments.length,
      },
    }, tx);

    return conversation;
  });

  emitCommsEvent({ type: 'comms.message.received', entityId: result.id });
  return getCommsStudioSnapshot();
}
