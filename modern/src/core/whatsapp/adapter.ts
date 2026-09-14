import type { ChatId, ChatSummary, Contact, ContactId, Label, WhatsAppAdapter, WhatsAppProfile } from '../types';
import type { BridgeResponse, WhatsAppAction, WhatsAppActionPayloads, WhatsAppActionResults } from './protocol';

const SOURCE = 'whaflash-modern' as const;
const REQUEST_TYPE = 'WHATSAPP_REQUEST' as const;
const RESPONSE_TYPE = 'WHATSAPP_RESPONSE' as const;

export class WhatsAppWebAdapter implements WhatsAppAdapter {
  private ready = false;
  private readonly timeoutMs: number;
  private readonly nonce: string;

  constructor(options: { timeoutMs?: number; nonce?: string } = {}) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.nonce = options.nonce ?? readBridgeNonce();
  }

  setReady(value: boolean): void { this.ready = value; }
  isReady(): boolean { return this.ready; }

  requestStatus(): Promise<WhatsAppActionResults['runtime.status']> {
    return this.request('runtime.status', {});
  }
  getChats(): Promise<ChatSummary[]> { return this.request('chats.list', {}); }
  getContact(id: ContactId): Promise<Contact | null> { return this.request('contacts.get', { id }); }
  markChatRead(id: ChatId): Promise<void> { return this.request('chats.markRead', { id }); }
  getProfile(): Promise<WhatsAppProfile> { return this.request('profile.get', {}); }
  getLabels(): Promise<Label[]> { return this.request('labels.list', {}); }
  downloadMedia(messageId: string): Promise<unknown> { return this.request('media.download', { messageId }); }

  private request<A extends WhatsAppAction>(action: A, payload: WhatsAppActionPayloads[A]): Promise<WhatsAppActionResults[A]> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const listener = (event: MessageEvent) => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        const data = event.data as Partial<BridgeResponse<A>> | undefined;
        if (data?.source !== SOURCE || data.type !== RESPONSE_TYPE || data.requestId !== requestId || data.action !== action || data.nonce !== this.nonce) return;
        window.removeEventListener('message', listener);
        window.clearTimeout(timer);
        if (data.error) reject(new Error(data.error));
        else resolve(data.result as WhatsAppActionResults[A]);
      };
      const timer = window.setTimeout(() => {
        window.removeEventListener('message', listener);
        reject(new Error(`Timeout waiting for WhatsApp action: ${action}`));
      }, this.timeoutMs);
      window.addEventListener('message', listener);
      window.postMessage({ source: SOURCE, type: REQUEST_TYPE, requestId, action, payload, nonce: this.nonce }, window.location.origin);
    });
  }
}

function readBridgeNonce(): string {
  const value = document.documentElement.dataset.whaflashBridgeNonce;
  if (!value) throw new Error('WhaFlash bridge nonce is not initialized');
  return value;
}
