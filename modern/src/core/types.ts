export type ChatId = string;
export type ContactId = string;
export type LabelId = string;

export interface ChatSummary {
  id: ChatId;
  name: string;
  unreadCount: number;
  isGroup: boolean;
  isArchived: boolean;
  timestamp?: number;
  avatarUrl?: string;
}

export interface Contact {
  id: ContactId;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  labels: LabelId[];
}

export interface Label {
  id: LabelId;
  name: string;
  color?: string;
}

export interface WhatsAppProfile {
  name: string | null;
  userId: string | null;
}

export interface WhatsAppAdapter {
  isReady(): boolean;
  getChats(): Promise<ChatSummary[]>;
  getContact(id: ContactId): Promise<Contact | null>;
  markChatRead(id: ChatId): Promise<void>;
  getProfile(): Promise<WhatsAppProfile>;
  getLabels(): Promise<Label[]>;
  downloadMedia(messageId: string): Promise<unknown>;
}
