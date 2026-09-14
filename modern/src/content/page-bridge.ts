import type { BridgeRequest, BridgeResponse, WhatsAppAction } from '../core/whatsapp/protocol';
import type { ChatSummary, Contact, Label, WhatsAppProfile } from '../core/types';

const SOURCE = 'whaflash-modern' as const;
const REQUEST_TYPE = 'WHATSAPP_REQUEST' as const;
const RESPONSE_TYPE = 'WHATSAPP_RESPONSE' as const;

export interface WhatsAppRuntimeProvider {
  listChats(): Promise<ChatSummary[]>;
  getContact(id: string): Promise<Contact | null>;
  markChatRead(id: string): Promise<void>;
  getProfile(): Promise<WhatsAppProfile>;
  listLabels(): Promise<Label[]>;
  downloadMedia(messageId: string): Promise<unknown>;
}

declare global { interface Window { __WHAFLASH_WPP__?: WhatsAppRuntimeProvider; } }

export function installPageBridge(): void {
  window.addEventListener('message', async (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data as Partial<BridgeRequest> | undefined;
    if (data?.source !== SOURCE || data.type !== REQUEST_TYPE) return;
    const nonce = document.documentElement.dataset.whaflashBridgeNonce;
    if (!nonce || data.nonce !== nonce || !data.requestId || !data.action) return;

    try {
      const result = await dispatch(data.action as WhatsAppAction, data.payload);
      respond({ source: SOURCE, type: RESPONSE_TYPE, requestId: data.requestId, action: data.action as WhatsAppAction, nonce, result });
    } catch (error) {
      respond({ source: SOURCE, type: RESPONSE_TYPE, requestId: data.requestId, action: data.action as WhatsAppAction, nonce, error: error instanceof Error ? error.message : 'WhatsApp runtime error' });
    }
  });
}

async function dispatch(action: WhatsAppAction, payload: unknown): Promise<unknown> {
  const provider = window.__WHAFLASH_WPP__;
  if (!provider) throw new Error('WhatsApp runtime provider is not ready');
  switch (action) {
    case 'chats.list': return provider.listChats();
    case 'contacts.get': return provider.getContact((payload as { id: string }).id);
    case 'chats.markRead': return provider.markChatRead((payload as { id: string }).id);
    case 'profile.get': return provider.getProfile();
    case 'labels.list': return provider.listLabels();
    case 'media.download': return provider.downloadMedia((payload as { messageId: string }).messageId);
  }
}

function respond(response: BridgeResponse): void { window.postMessage(response, window.location.origin); }

installPageBridge();
