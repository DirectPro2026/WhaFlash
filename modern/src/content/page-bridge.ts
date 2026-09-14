import type { BridgeRequest, BridgeResponse, WhatsAppAction } from '../core/whatsapp/protocol';
import { createUnavailableRuntime, type WppRuntime } from './runtime-provider';

const SOURCE = 'whaflash-modern' as const;
const REQUEST_TYPE = 'WHATSAPP_REQUEST' as const;
const RESPONSE_TYPE = 'WHATSAPP_RESPONSE' as const;

let runtime: WppRuntime = createUnavailableRuntime();

declare global {
  interface Window {
    __WHAFLASH_WPP__?: WppRuntime;
  }
}

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

  window.__WHAFLASH_WPP__ = runtime;
}

async function dispatch(action: WhatsAppAction, payload: unknown): Promise<unknown> {
  switch (action) {
    case 'runtime.status': return { ready: runtime.isReady(), provider: runtime.providerName() };
    case 'chats.list': return runtime.listChats();
    case 'contacts.get': return runtime.getContact(readId(payload));
    case 'chats.markRead': return runtime.markChatRead(readId(payload));
    case 'profile.get': return runtime.getProfile();
    case 'labels.list': return runtime.listLabels();
    case 'media.download': return runtime.downloadMedia(readId(payload, 'messageId'));
  }
}

function readId(payload: unknown, key = 'id'): string {
  if (!payload || typeof payload !== 'object') throw new Error(`Invalid payload: ${key}`);
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string' || !value) throw new Error(`Invalid payload: ${key}`);
  return value;
}

function respond(response: BridgeResponse): void {
  window.postMessage(response, window.location.origin);
}

installPageBridge();
