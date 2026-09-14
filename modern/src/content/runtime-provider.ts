import type { ChatSummary, Contact, Label, WhatsAppProfile } from '../core/types';

/**
 * Adapter boundary for WhatsApp Web's volatile internal runtime.
 *
 * The implementation is intentionally separate from the CRM/UI. When the
 * WhatsApp runtime changes, only this provider should need maintenance.
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
