import { WhatsAppWebAdapter } from '../core/whatsapp/adapter';
import type { WhatsAppAction, WhatsAppActionPayloads, WhatsAppActionResults } from '../core/whatsapp/protocol';

const nonce = crypto.randomUUID();
document.documentElement.dataset.whaflashBridgeNonce = nonce;

const adapter = new WhatsAppWebAdapter({ nonce });
adapter.setReady(true);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'WHATSAPP_REQUEST') return false;
  const action = message.action as WhatsAppAction;
  const payload = message.payload as WhatsAppActionPayloads[typeof action];

  void execute(action, payload)
    .then((result) => sendResponse({ ok: true, requestId: message.requestId, result }))
    .catch((error) => sendResponse({ ok: false, requestId: message.requestId, error: error instanceof Error ? error.message : 'WhatsApp request failed' }));

  return true;
});

window.dispatchEvent(new CustomEvent('whaflash-modern-ready', { detail: { adapter } }));
console.info('[WhaFlash Modern] content layer initialized');

async function execute<A extends WhatsAppAction>(action: A, payload: WhatsAppActionPayloads[A]): Promise<WhatsAppActionResults[A]> {
  switch (action) {
    case 'chats.list': return adapter.getChats() as Promise<WhatsAppActionResults[A]>;
    case 'contacts.get': return adapter.getContact(payload.id) as Promise<WhatsAppActionResults[A]>;
    case 'chats.markRead': return adapter.markChatRead(payload.id) as Promise<WhatsAppActionResults[A]>;
    case 'profile.get': return adapter.getProfile() as Promise<WhatsAppActionResults[A]>;
    case 'labels.list': return adapter.getLabels() as Promise<WhatsAppActionResults[A]>;
    case 'media.download': return adapter.downloadMedia(payload.messageId) as Promise<WhatsAppActionResults[A]>;
  }
}
