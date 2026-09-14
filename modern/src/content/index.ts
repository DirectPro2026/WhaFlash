import { WhatsAppWebAdapter } from '../core/whatsapp/adapter';
import type { WhatsAppAction } from '../core/whatsapp/protocol';
import { createWhatsAppRuntime } from './runtime-provider';

const nonce = crypto.randomUUID();
document.documentElement.dataset.whaflashBridgeNonce = nonce;

const adapter = new WhatsAppWebAdapter({ nonce });
adapter.setReady(true);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'WHATSAPP_REQUEST') return false;
  const action = message.action as WhatsAppAction;

  void execute(action, message.payload)
    .then((result) => sendResponse({ ok: true, requestId: message.requestId, result }))
    .catch((error) => sendResponse({ ok: false, requestId: message.requestId, error: error instanceof Error ? error.message : 'WhatsApp request failed' }));

  return true;
});

// The provider is resolved after the page has had a chance to initialize WPP.
// It is kept behind the adapter boundary so WhatsApp changes remain localized.
window.setTimeout(() => {
  const runtime = createWhatsAppRuntime();
  window.__WHAFLASH_WPP__ = runtime;
  window.dispatchEvent(new CustomEvent('whaflash-modern-ready'));
  console.info('[WhaFlash Modern] content layer initialized:', runtime.providerName());
}, 500);

async function execute(action: WhatsAppAction, payload: unknown): Promise<unknown> {
  switch (action) {
    case 'runtime.status': {
      const runtime = window.__WHAFLASH_WPP__;
      return runtime
        ? { ready: runtime.isReady(), provider: runtime.providerName() }
        : { ready: false, provider: 'initializing' };
    }
    case 'chats.list': return getRuntime().listChats();
    case 'contacts.get': return getRuntime().getContact(readId(payload));
    case 'chats.markRead': return getRuntime().markChatRead(readId(payload));
    case 'profile.get': return getRuntime().getProfile();
    case 'labels.list': return getRuntime().listLabels();
    case 'media.download': return getRuntime().downloadMedia(readId(payload, 'messageId'));
    default: throw new Error(`Unsupported WhatsApp action: ${String(action)}`);
  }
}

function getRuntime() {
  const runtime = window.__WHAFLASH_WPP__;
  if (!runtime) throw new Error('WhatsApp runtime is initializing');
  return runtime;
}

function readId(payload: unknown, key = 'id'): string {
  if (!payload || typeof payload !== 'object') throw new Error(`Invalid payload: ${key}`);
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string' || !value) throw new Error(`Invalid payload: ${key}`);
  return value;
}
