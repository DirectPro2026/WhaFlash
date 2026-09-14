import { WhatsAppWebAdapter } from '../core/whatsapp/adapter';
import type { WhatsAppAction, WhatsAppActionPayloads } from '../core/whatsapp/protocol';

const nonce = crypto.randomUUID();
document.documentElement.dataset.whaflashBridgeNonce = nonce;

const adapter = new WhatsAppWebAdapter({ nonce });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'WHATSAPP_REQUEST') return false;
  const action = message.action as WhatsAppAction;

  void execute(action, message.payload)
    .then((result) => sendResponse({ ok: true, requestId: message.requestId, result }))
    .catch((error) => sendResponse({ ok: false, requestId: message.requestId, error: error instanceof Error ? error.message : 'WhatsApp request failed' }));

  return true;
});

async function execute<A extends WhatsAppAction>(action: A, payload: WhatsAppActionPayloads[A]): Promise<unknown> {
  if (action === 'runtime.status') {
    return adapter.requestStatus();
  }
  adapter.setReady(true);
  switch (action) {
    case 'chats.list': return adapter.getChats();
    case 'contacts.get': return adapter.getContact(payload.id);
    case 'chats.markRead': return adapter.markChatRead(payload.id);
    case 'profile.get': return adapter.getProfile();
    case 'labels.list': return adapter.getLabels();
    case 'media.download': return adapter.downloadMedia(payload.messageId);
  }
}
