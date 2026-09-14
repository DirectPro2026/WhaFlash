import { create } from 'zustand';
import type { FeatureState, QuickReply, Reminder, FollowUp, Appointment, Automation, Product, Order, Webhook } from '../types/features';

const KEY = 'whaflash.features.v1';
const uid = () => crypto.randomUUID();

const defaults: FeatureState = {
  quickReplies: [], reminders: [], followUps: [], appointments: [], automations: [], products: [], orders: [], webhooks: [], premiumDevMode: false
};

interface FeatureActions {
  load(): Promise<void>;
  setPremiumDevMode(enabled: boolean): void;
  addQuickReply(input: Omit<QuickReply, 'id'>): void;
  removeQuickReply(id: string): void;
  addReminder(input: Omit<Reminder, 'id'>): void;
  toggleReminder(id: string): void;
  addFollowUp(input: Omit<FollowUp, 'id'>): void;
  cancelFollowUp(id: string): void;
  addAppointment(input: Omit<Appointment, 'id'>): void;
  addAutomation(input: Omit<Automation, 'id'>): void;
  toggleAutomation(id: string): void;
  addProduct(input: Omit<Product, 'id'>): void;
  addOrder(input: Omit<Order, 'id'>): void;
  addWebhook(input: Omit<Webhook, 'id'>): void;
  toggleWebhook(id: string): void;
}

export const useFeatureStore = create<FeatureState & FeatureActions>((set, get) => ({
  ...defaults,
  async load() {
    const result = await chrome.storage.local.get(KEY);
    const saved = result[KEY] as Partial<FeatureState> | undefined;
    if (!saved) return;
    set({ ...defaults, ...saved });
  },
  setPremiumDevMode(enabled) { set({ premiumDevMode: enabled }); void persist({ ...get(), premiumDevMode: enabled }); },
  addQuickReply(input) { set(s => ({ quickReplies: [...s.quickReplies, { ...input, id: uid() }] })); void persist(get()); },
  removeQuickReply(id) { set(s => ({ quickReplies: s.quickReplies.filter(x => x.id !== id) })); void persist(get()); },
  addReminder(input) { set(s => ({ reminders: [...s.reminders, { ...input, id: uid() }] })); void persist(get()); },
  toggleReminder(id) { set(s => ({ reminders: s.reminders.map(x => x.id === id ? { ...x, done: !x.done } : x) })); void persist(get()); },
  addFollowUp(input) { set(s => ({ followUps: [...s.followUps, { ...input, id: uid() }] })); void persist(get()); },
  cancelFollowUp(id) { set(s => ({ followUps: s.followUps.map(x => x.id === id ? { ...x, status: 'cancelled' } : x) })); void persist(get()); },
  addAppointment(input) { set(s => ({ appointments: [...s.appointments, { ...input, id: uid() }] })); void persist(get()); },
  addAutomation(input) { set(s => ({ automations: [...s.automations, { ...input, id: uid() }] })); void persist(get()); },
  toggleAutomation(id) { set(s => ({ automations: s.automations.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x) })); void persist(get()); },
  addProduct(input) { set(s => ({ products: [...s.products, { ...input, id: uid() }] })); void persist(get()); },
  addOrder(input) { set(s => ({ orders: [...s.orders, { ...input, id: uid() }] })); void persist(get()); },
  addWebhook(input) { set(s => ({ webhooks: [...s.webhooks, { ...input, id: uid() }] })); void persist(get()); },
  toggleWebhook(id) { set(s => ({ webhooks: s.webhooks.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x) })); void persist(get()); }
}));

async function persist(state: FeatureState): Promise<void> {
  await chrome.storage.local.set({ [KEY]: {
    quickReplies: state.quickReplies, reminders: state.reminders, followUps: state.followUps,
    appointments: state.appointments, automations: state.automations, products: state.products,
    orders: state.orders, webhooks: state.webhooks, premiumDevMode: state.premiumDevMode
  }});
}
