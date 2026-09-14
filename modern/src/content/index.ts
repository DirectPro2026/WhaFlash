import { WhatsAppWebAdapter } from '../core/whatsapp/adapter';
import type { WhatsAppAction } from '../core/whatsapp/protocol';

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

async function execute(action: WhatsAppAction, payload: unknown): Promise<unknown> {
  switch (action) {
    case 'runtime.status':
      return adapter.requestStatus();
    case 'chats.list':
      return adapter.getChats();
    case 'contacts.get':
      return adapter.getContact(readId(payload));
    case 'chats.markRead':
      return adapter.markChatRead(readId(payload));
    case 'profile.get':
      return adapter.getProfile();
    case 'labels.list':
      return adapter.getLabels();
    case 'media.download':
      return adapter.downloadMedia(readId(payload, 'messageId'));
  }
}

function readId(payload: unknown, key = 'id'): string {
  if (!payload || typeof payload !== 'object') throw new Error(`Invalid payload: ${key}`);
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid payload: ${key}`);
  return value;
}
