export interface WhatsAppChat {
  id: string;
  name?: string;
  phone?: string;
  unreadCount?: number;
}

export interface WhatsAppAdapter {
  listChats(): Promise<WhatsAppChat[]>;
  openChat(chatId: string): Promise<void>;
  getContactProfile(chatId: string): Promise<Partial<WhatsAppChat>>;
}

/**
 * Adapter boundary for WhatsApp Web internals.
 *
 * The implementation is intentionally isolated because WhatsApp Web's
 * internal modules/selectors can change independently of the CRM domain.
 */
export class BrowserWhatsAppAdapter implements WhatsAppAdapter {
  async listChats(): Promise<WhatsAppChat[]> {
    // Phase 1: DOM-safe adapter. WPP/Webpack integration will be added here
    // behind a versioned interface rather than spread throughout the app.
    return [];
  }

  async openChat(chatId: string): Promise<void> {
    const event = new CustomEvent('whaflash:open-chat', { detail: { chatId } });
    window.dispatchEvent(event);
  }

  async getContactProfile(_chatId: string): Promise<Partial<WhatsAppChat>> {
    return {};
  }
}
