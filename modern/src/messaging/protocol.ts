export type MessageType =
  | 'PING'
  | 'GET_CHATS'
  | 'GET_CONTACT'
  | 'SYNC_CONTACT'
  | 'OPEN_CHAT'
  | 'LICENSE_STATUS';

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  requestId: string;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  requestId: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export function requestId(): string {
  return crypto.randomUUID();
}
