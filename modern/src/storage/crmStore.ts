import { create } from 'zustand';
import type { Contact, CrmState } from '../types/crm';

const initialState: CrmState = {
  contacts: [],
  stages: [
    { id: 'new', name: 'Novos', position: 0 },
    { id: 'qualified', name: 'Qualificados', position: 1 },
    { id: 'proposal', name: 'Proposta', position: 2 },
    { id: 'won', name: 'Ganhos', position: 3 }
  ]
};

interface CrmStore extends CrmState {
  upsertContact: (contact: Contact) => void;
  selectContact: (id?: string) => void;
  load: () => Promise<void>;
  persist: () => Promise<void>;
}

const STORAGE_KEY = 'whaflash.crm';

export const useCrmStore = create<CrmStore>((set, get) => ({
  ...initialState,
  upsertContact: (contact) => {
    set((state) => {
      const exists = state.contacts.some((item) => item.id === contact.id);
      return { contacts: exists ? state.contacts.map((item) => item.id === contact.id ? contact : item) : [...state.contacts, contact] };
    });
    void get().persist();
  },
  selectContact: (id) => set({ selectedContactId: id }),
  load: async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result[STORAGE_KEY] as Partial<CrmState> | undefined;
    if (saved) set({ ...initialState, ...saved });
  },
  persist: async () => {
    const { contacts, stages, selectedContactId } = get();
    await chrome.storage.local.set({ [STORAGE_KEY]: { contacts, stages, selectedContactId } });
  }
}));
