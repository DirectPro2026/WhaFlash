import type { ExtensionMessage, ExtensionResponse } from '../messaging/protocol';

const WHATSAPP_URL = 'https://web.whatsapp.com/*';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({ 'whaflash.installedAt': Date.now() });
});

void chrome.alarms.create('license-refresh', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'license-refresh') return;
  void notifyWhatsAppTabs();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (!message || typeof message.requestId !== 'string') return false;

  if (message.type === 'WHATSAPP_REQUEST') {
    if (sender.tab?.url && !sender.tab.url.startsWith('https://web.whatsapp.com/')) return false;
    void forwardWhatsAppRequest(message).then(sendResponse).catch((error) => {
      sendResponse({ requestId: message.requestId, ok: false, error: error instanceof Error ? error.message : 'WhatsApp request failed' });
    });
    return true;
  }

  const response: ExtensionResponse = { requestId: message.requestId, ok: true };
  if (message.type === 'PING') {
    sendResponse({ ...response, data: { version: chrome.runtime.getManifest().version } });
    return true;
  }

  sendResponse(response);
  return true;
});

async function notifyWhatsAppTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: WHATSAPP_URL });
  await Promise.all(tabs.filter((tab) => typeof tab.id === 'number').map(async (tab) => {
    try {
      await chrome.tabs.sendMessage(tab.id!, { type: 'LICENSE_STATUS', requestId: crypto.randomUUID() });
    } catch {
      // A tab can disappear or its content script can be unavailable during navigation.
    }
  }));
}

async function forwardWhatsAppRequest(message: ExtensionMessage): Promise<ExtensionResponse> {
  const tabs = await chrome.tabs.query({ url: WHATSAPP_URL, active: true, lastFocusedWindow: true });
  const candidates = tabs.length ? tabs : await chrome.tabs.query({ url: WHATSAPP_URL });
  const tab = candidates
    .filter((item) => typeof item.id === 'number')
    .sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)))[0];
  if (!tab?.id) throw new Error('WhatsApp Web is not open');

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'WHATSAPP_REQUEST',
      requestId: message.requestId,
      action: message.action,
      payload: message.payload,
    });
    return { requestId: message.requestId, ok: Boolean(response?.ok), data: response?.result, error: response?.error };
  } catch {
    throw new Error('WhatsApp Web is still loading or the content bridge is unavailable');
  }
}
