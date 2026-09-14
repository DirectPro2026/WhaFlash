export type FeatureId =
  | 'inbox'
  | 'contacts'
  | 'pipeline'
  | 'quickReplies'
  | 'reminders'
  | 'followUp'
  | 'appointments'
  | 'automation'
  | 'orders'
  | 'products'
  | 'webhooks'
  | 'status'
  | 'tools'
  | 'settings';

export interface QuickReply { id: string; title: string; text: string; shortcut?: string; enabled: boolean; }
export interface Reminder { id: string; contactId?: string; title: string; dueAt: number; done: boolean; }
export interface FollowUp { id: string; contactId?: string; title: string; message: string; dueAt: number; status: 'pending' | 'sent' | 'cancelled'; }
export interface Appointment { id: string; contactId?: string; title: string; startAt: number; endAt?: number; notes?: string; status: 'scheduled' | 'done' | 'cancelled'; }
export interface Automation { id: string; name: string; trigger: string; action: string; enabled: boolean; }
export interface Product { id: string; name: string; price: number; sku?: string; active: boolean; }
export interface Order { id: string; contactId?: string; items: Array<{ productId: string; quantity: number; price: number }>; status: 'draft' | 'open' | 'paid' | 'cancelled'; createdAt: number; }
export interface Webhook { id: string; name: string; url: string; event: string; enabled: boolean; }

export interface FeatureState {
  quickReplies: QuickReply[];
  reminders: Reminder[];
  followUps: FollowUp[];
  appointments: Appointment[];
  automations: Automation[];
  products: Product[];
  orders: Order[];
  webhooks: Webhook[];
  premiumDevMode: boolean;
}
