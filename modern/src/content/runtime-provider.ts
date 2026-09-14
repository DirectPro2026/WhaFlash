import type { ChatSummary, Contact, Label, WhatsAppProfile } from '../core/types';

/**
 * Adapter boundary for WhatsApp Web's volatile internal runtime.
 *
 * The provider deliberately uses feature detection. No CRM code depends on
 * WhatsApp's private object graph; changes are isolated here.
 */
export interface WppRuntime {
  providerName(): string;
  isReady(): boolean;
  listChats(): Promise<ChatSummary[]>;
  getContact(id: string): Promise<Contact | null>;
  markChatRead(id: string): Promise<void>;
  getProfile(): Promise<WhatsAppProfile>;
  listLabels(): Promise<Label[]>;
  downloadMedia(messageId: string): Promise<unknown>;
}

type WppLike = {
  chat?: {
    list?: () => Promise<unknown[]> | unknown[];
    markIsRead?: (id: string) => Promise<void> | void;
    downloadMedia?: (messageId: string) => Promise<unknown> | unknown;
  };
  contact?: { get?: (id: string) => Promise<unknown> | unknown };
  profile?: { getMyProfileName?: () => Promise<string | null> | string | null };
  conn?: { getMyUserId?: () => Promise<unknown> | unknown };
  labels?: { getAllLabels?: () => Promise<unknown[]> | unknown[] };
};

declare global {
  interface Window {
    WPP?: WppLike;
  }
}

export function createWhatsAppRuntime(): WppRuntime {
  const wpp = window.WPP;
  if (!wpp?.chat?.list) return createUnavailableRuntime();

  return {
    providerName: () => 'WPP-compatible',
    isReady: () => Boolean(wpp.chat?.list),
    listChats: async () => normalizeChats(await wpp.chat!.list!()),
    getContact: async (id) => normalizeContact(await wpp.contact?.get?.(id)),
    markChatRead: async (id) => { await wpp.chat?.markIsRead?.(id); },
    getProfile: async () => ({
      name: (await wpp.profile?.getMyProfileName?.()) ?? null,
      userId: normalizeUserId(await wpp.conn?.getMyUserId?.()),
    }),
    listLabels: async () => normalizeLabels(await wpp.labels?.getAllLabels?.()),
    downloadMedia: async (messageId) => wpp.chat?.downloadMedia?.(messageId),
  };
}

export function createUnavailableRuntime(): WppRuntime {
  const unavailable = async (): Promise<never> => {
    throw new Error('WhatsApp runtime is not available');
  };

  return {
    providerName: () => 'unavailable',
    isReady: () => false,
    listChats: unavailable,
    getContact: unavailable,
    markChatRead: unavailable,
    getProfile: unavailable,
    listLabels: unavailable,
    downloadMedia: unavailable,
  };
}

function normalizeChats(value: unknown): ChatSummary[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = asRecord(item);
    return {
      id: stringValue(row.id) ?? `chat-${index}`,
      name: stringValue(row.name) ?? stringValue(row.formattedTitle) ?? 'Sem nome',
      unreadCount: numberValue(row.unreadCount) ?? numberValue(row.unread) ?? 0,
      isGroup: Boolean(row.isGroup),
      isArchived: Boolean(row.archived ?? row.isArchived),
      timestamp: numberValue(row.timestamp),
      avatarUrl: stringValue(row.avatarUrl),
    };
  });
}

function normalizeContact(value: unknown): Contact | null {
  if (!value || typeof value !== 'object') return null;
  const row = asRecord(value);
  const id = stringValue(row.id);
  if (!id) return null;
  const labels = Array.isArray(row.labels) ? row.labels.map((label) => stringValue(asRecord(label).id) ?? stringValue(label)).filter(Boolean) as string[] : [];
  return {
    id,
    name: stringValue(row.name) ?? stringValue(row.pushname) ?? 'Sem nome',
    phone: stringValue(row.phone) ?? stringValue(row.number),
    labels,
  };
}

function normalizeLabels(value: unknown): Label[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = asRecord(item);
    return {
      id: stringValue(row.id) ?? `label-${index}`,
      name: stringValue(row.name) ?? 'Sem nome',
      color: stringValue(row.color),
    };
  });
}

function normalizeUserId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  const row = asRecord(value);
  return stringValue(row._serialized) ?? stringValue(row.user) ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
