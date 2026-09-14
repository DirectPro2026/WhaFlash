import { BrowserWhatsAppAdapter } from './whatsappAdapter';

const adapter = new BrowserWhatsAppAdapter();

void adapter.listChats().then((chats) => {
  window.dispatchEvent(new CustomEvent('whaflash:ready', { detail: { chatCount: chats.length } }));
});

console.info('[WhaFlash] modern content layer initialized');
