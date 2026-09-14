import { create } from 'zustand';
import type { Contact, CrmState, PipelineStage } from '../types/crm';

const initialStages: PipelineStage[] = [
  { id: 'new', name: 'Novos', position: 0 },
  { id: 'qualified', name: 'Qualificados', position: 1 },
  { id: 'proposal', name: 'Proposta', position: 2 },
  { id: 'won', name: 'Ganhos', position: 3 }
];

const initialState: CrmState = { contacts: [], stages: initialStages };
const STORAGE_KEY = 'whaflash.crm';
const STORAGE_VERSION = 1;

interface PersistedCrmState {
  version: number;
  contacts: Contact[];
  stages: PipelineStage[];
  selectedContactId?: string;
}

interface CrmStore extends CrmState {
  upsertContact: (contact: Contact) => void;
  updateContact: (id: string, patch: Partial<Omit<Contact, 'id' | 'updatedAt'>>) => void;
  moveContact: (id: string, stageId: string) => void;
  selectContact: (id?: string) => void;
  load: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useCrmStore = create<CrmStore>((set, get) => ({
  ...initialState,
  upsertContact: (incoming) => {
    set((state) => {
      const existing = state.contacts.find((item) => item.id === incoming.id);
      if (existing) {
        const merged: Contact = {
          ...existing,
          ...incoming,
          stageId: incoming.stageId ?? existing.stageId ?? state.stages[0]?.id,
          value: incoming.value ?? existing.value,
          updatedAt: Date.now()
        };
        return { contacts: state.contacts.map((item) => item.id === incoming.id ? merged : item) };
      }
      return {
        contacts: [...state.contacts, { ...incoming, stageId: incoming.stageId ?? state.stages[0]?.id, updatedAt: Date.now() }]
      };
    });
    void get().persist();
  },
  updateContact: (id, patch) => {
    set((state) => ({
      contacts: state.contacts.map((contact) => contact.id === id
        ? { ...contact, ...patch, updatedAt: Date.now() }
        : contact)
    }));
    void get().persist();
  },
  moveContact: (id, stageId) => {
    set((state) => ({
      contacts: state.contacts.map((contact) => contact.id === id
        ? { ...contact, stageId: stageId || undefined, updatedAt: Date.now() }
        : contact)
    }));
    void get().persist();
  },
  selectContact: (id) => set({ selectedContactId: id }),
  load: async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const parsed = parsePersistedState(result[STORAGE_KEY]);
    if (!parsed) return;
    const stageIds = new Set(parsed.stages.map((stage) => stage.id));
    const contacts = parsed.contacts.map((contact) => ({
      ...contact,
      labels: Array.isArray(contact.labels) ? contact.labels.filter((label): label is string => typeof label === 'string') : [],
      stageId: contact.stageId && stageIds.has(contact.stageId) ? contact.stageId : parsed.stages[0]?.id,
      updatedAt: Number.isFinite(contact.updatedAt) ? contact.updatedAt : Date.now()
    }));
    const selectedContactId = parsed.selectedContactId && contacts.some((contact) => contact.id === parsed.selectedContactId)
      ? parsed.selectedContactId
      : undefined;
    set({ contacts, stages: parsed.stages, selectedContactId });
  },
  persist: async () => {
    const { contacts, stages, selectedContactId } = get();
    const payload: PersistedCrmState = {
      version: STORAGE_VERSION,
      contacts,
      stages,
      selectedContactId
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: payload });
  }
}));

function parsePersistedState(value: unknown): PersistedCrmState | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const rawContacts = Array.isArray(row.contacts) ? row.contacts : [];
  const rawStages = Array.isArray(row.stages) ? row.stages : initialStages;
  const stages = rawStages
    .map(normalizeStage)
    .filter((stage): stage is PipelineStage => stage !== null)
    .sort((a, b) => a.position - b.position);
  const safeStages = stages.length ? stages : initialStages;
  const contacts = rawContacts
    .map(normalizeContact)
    .filter((contact): contact is Contact => contact !== null);
  const selectedContactId = typeof row.selectedContactId === 'string' ? row.selectedContactId : undefined;
  return { version: typeof row.version === 'number' ? row.version : 0, contacts, stages: safeStages, selectedContactId };
}

function normalizeStage(value: unknown): PipelineStage | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
  return { id: row.id, name: row.name, position: typeof row.position === 'number' && Number.isFinite(row.position) ? row.position : 0 };
}

function normalizeContact(value: unknown): Contact | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
  return {
    id: row.id,
    name: row.name,
    phone: typeof row.phone === 'string' ? row.phone : '',
    email: typeof row.email === 'string' ? row.email : undefined,
    city: typeof row.city === 'string' ? row.city : undefined,
    state: typeof row.state === 'string' ? row.state : undefined,
    company: typeof row.company === 'string' ? row.company : undefined,
    job: typeof row.job === 'string' ? row.job : undefined,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
    labels: Array.isArray(row.labels) ? row.labels.filter((label): label is string => typeof label === 'string') : [],
    value: typeof row.value === 'number' && Number.isFinite(row.value) ? row.value : undefined,
    stageId: typeof row.stageId === 'string' ? row.stageId : undefined,
    updatedAt: typeof row.updatedAt === 'number' && Number.isFinite(row.updatedAt) ? row.updatedAt : Date.now()
  };
}
