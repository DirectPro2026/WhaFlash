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
    case 'runtime.status': return adapter.requestStatus();
    case 'chats.list': return adapter.getChats();
    case 'contacts.get': return adapter.getContact(readId(payload));
    case 'chats.markRead': return adapter.markChatRead(readId(payload));
    case 'profile.get': return adapter.getProfile();
    case 'labels.list': return adapter.getLabels();
    case 'media.download': return adapter.downloadMedia(readId(payload, 'messageId'));
  }
}

function readId(payload: unknown, key = 'id'): string {
  if (!payload || typeof payload !== 'object') throw new Error(`Invalid payload: ${key}`);
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid payload: ${key}`);
  return value;
}

function mountWhaFlashPanel(): void {
  if (document.getElementById('whaflash-modern-host')) return;

  const host = document.createElement('div');
  host.id = 'whaflash-modern-host';
  Object.assign(host.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    zIndex: '2147483647',
    fontFamily: 'Arial, sans-serif'
  });

  const shadow = host.attachShadow({ mode: 'closed' });
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'WhaFlash';
  Object.assign(button.style, {
    border: '0',
    borderRadius: '999px',
    padding: '13px 20px',
    background: '#111827',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(0,0,0,.25)'
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    display: 'none',
    position: 'fixed',
    right: '18px',
    bottom: '70px',
    width: 'min(760px, calc(100vw - 36px))',
    height: 'min(760px, calc(100vh - 100px))',
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 18px 60px rgba(0,0,0,.30)',
    border: '1px solid rgba(0,0,0,.12)'
  });

  const iframe = document.createElement('iframe');
  iframe.title = 'WhaFlash CRM';
  iframe.src = chrome.runtime.getURL('index.html');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: '0',
    display: 'block',
    background: '#f8fafc'
  });

  button.addEventListener('click', () => {
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    button.textContent = open ? 'WhaFlash' : 'Fechar WhaFlash';
  });

  panel.appendChild(iframe);
  shadow.append(button, panel);
  document.documentElement.appendChild(host);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWhaFlashPanel, { once: true });
} else {
  mountWhaFlashPanel();
}
