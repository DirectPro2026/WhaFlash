import type { ExtensionMessage, ExtensionResponse } from '../messaging/protocol';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({ 'whaflash.installedAt': Date.now() });
});

chrome.alarms.create('license-refresh', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'license-refresh') return;
  void chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) void chrome.tabs.sendMessage(tab.id, { type: 'LICENSE_STATUS', requestId: crypto.randomUUID() });
    }
  });
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'WHATSAPP_REQUEST') {
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

async function forwardWhatsAppRequest(message: ExtensionMessage): Promise<ExtensionResponse> {
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*', active: true, lastFocusedWindow: true });
  const tab = tabs.find((item) => typeof item.id === 'number');
  if (!tab?.id) throw new Error('WhatsApp Web is not open in the active window');

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: 'WHATSAPP_REQUEST',
    requestId: message.requestId,
    action: message.action,
    payload: message.payload,
  });

  return { requestId: message.requestId, ok: Boolean(response?.ok), data: response?.result, error: response?.error };
}
