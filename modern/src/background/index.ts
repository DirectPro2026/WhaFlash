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
  const response: ExtensionResponse = { requestId: message.requestId, ok: true };

  if (message.type === 'PING') {
    sendResponse({ ...response, data: { version: chrome.runtime.getManifest().version } });
    return true;
  }

  sendResponse(response);
  return true;
});
