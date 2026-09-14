import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncWhatsAppContacts } from '../core/crm/contactSync';
import { whatsappApi } from '../messaging/whatsappClient';
import { useCrmStore } from '../storage/crmStore';
import { Kanban } from './Kanban';
import type { ChatSummary } from '../core/types';
import './styles.css';

export function App() {
  const contacts = useCrmStore((s) => s.contacts);
  const stages = useCrmStore((s) => s.stages);
  const load = useCrmStore((s) => s.load);
  const upsertContact = useCrmStore((s) => s.upsertContact);
  const moveContact = useCrmStore((s) => s.moveContact);
  const selectContact = useCrmStore((s) => s.selectContact);
  const selectedContactId = useCrmStore((s) => s.selectedContactId);
  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [ready, setReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const [error, setError] = React.useState<string>();

  React.useEffect(() => { void load(); void refresh(); }, [load]);
  async function refresh() {
    setBusy(true); setError(undefined);
    try { const status = await whatsappApi.getRuntimeStatus(); setReady(status.ready); if (status.ready) setChats(await whatsappApi.listChats()); }
    catch (e) { setReady(false); setError(e instanceof Error ? e.message : 'WhatsApp Web indisponível.'); }
    finally { setBusy(false); }
  }
  async function sync() {
    setBusy(true); setError(undefined);
    try { const r = await syncWhatsAppContacts({ getChats: whatsappApi.listChats, getContact: whatsappApi.getContact }, { upsertContact }); setMessage(`${r.synced} contato(s) sincronizado(s).`); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha na sincronização.'); }
    finally { setBusy(false); }
  }
  const selected = contacts.find((c) => c.id === selectedContactId);
  return <main className="app">
    <header><div><strong>WhaFlash</strong><span>CRM moderno para WhatsApp</span></div><div className="actions"><button onClick={() => void refresh()} disabled={busy}>{busy ? 'Processando…' : 'Atualizar'}</button><button onClick={() => void sync()} disabled={busy || !ready}>Sincronizar contatos</button></div></header>
    <section className="grid"><article><small>Contatos</small><b>{contacts.length}</b></article><article><small>Conversas</small><b>{chats.length}</b></article><article><small>Status</small><b>{ready ? 'Conectado' : 'Aguardando'}</b></article></section>
    {error && <div className="error">{error}</div>}{message && <div className="success">{message}</div>}
    <Kanban contacts={contacts} stages={stages} onSelect={selectContact} onMove={(id, stageId) => { moveContact(id, stageId); setMessage('Contato movido no funil.'); }} />
    {selected && <section className="panel selected-summary"><h2>{selected.name}</h2><p>{selected.phone || 'Sem telefone'}</p><strong>{(selected.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></section>}
    <section className="panel"><h2>Conversas recentes</h2>{chats.length === 0 ? <p>{ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p> : chats.map((chat) => <div className="contact" key={chat.id}><span>{chat.name}</span><small>{chat.unreadCount} não lidas</small></div>)}</section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
