import { WhatsAppWebAdapter } from '../core/whatsapp/adapter';

const nonce = crypto.randomUUID();
document.documentElement.dataset.whaflashBridgeNonce = nonce;

const adapter = new WhatsAppWebAdapter({ nonce });
adapter.setReady(true);

window.dispatchEvent(new CustomEvent('whaflash-modern-ready', { detail: { adapter } }));

console.info('[WhaFlash Modern] content layer initialized');
