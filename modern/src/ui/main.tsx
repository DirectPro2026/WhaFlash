import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncWhatsAppContacts } from '../core/crm/contactSync';
import { whatsappApi } from '../messaging/whatsappClient';
import { useCrmStore } from '../storage/crmStore';
import type { ChatSummary } from '../core/types';
import './styles.css';

function Dashboard() {
  const contacts = useCrmStore((state) => state.contacts);
  const load = useCrmStore((state) => state.load);
  const upsertContact = useCrmStore((state) => state.upsertContact);
  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [runtime, setRuntime] = React.useState<{ ready: boolean; provider: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { void load(); }, [load]);

  async function refreshWhatsApp() {
    setBusy(true); setError(null); setSyncMessage(null);
    try {
      const status = await whatsappApi.getRuntimeStatus();
      setRuntime(status);
      if (!status.ready) return;
      setChats(await whatsappApi.listChats());
    } catch (reason) {
      setRuntime(null);
      setError(reason instanceof Error ? reason.message : 'Não foi possível acessar o WhatsApp Web.');
    } finally { setBusy(false); }
  }

  async function syncContacts() {
    setBusy(true); setError(null); setSyncMessage(null);
    try {
      const report = await syncWhatsAppContacts(
        { getChats: whatsappApi.listChats, getContact: whatsappApi.getContact },
        { upsertContact },
      );
      setSyncMessage(`${report.synced} contato(s) sincronizado(s). ${report.skippedGroups} grupo(s) ignorado(s).`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao sincronizar contatos.');
    } finally { setBusy(false); }
  }

  React.useEffect(() => { void refreshWhatsApp(); }, []);

  return (
    <main className="app">
      <header>
        <div><strong>WhaFlash</strong><span>CRM moderno para WhatsApp</span></div>
        <div className="actions">
          <button type="button" onClick={() => void refreshWhatsApp()} disabled={busy}>{busy ? 'Processando…' : 'Atualizar'}</button>
          <button type="button" onClick={() => void syncContacts()} disabled={busy || !runtime?.ready}>Sincronizar contatos</button>
        </div>
      </header>
      <section className="grid">
        <article><small>Contatos</small><b>{contacts.length}</b></article>
        <article><small>Conversas</small><b>{chats.length}</b></article>
        <article><small>Status</small><b>{runtime?.ready ? 'Conectado' : 'Aguardando'}</b></article>
      </section>
      {error && <div className="error" role="alert">{error}</div>}
      {syncMessage && <div className="success" role="status">{syncMessage}</div>}
      <section className="panel"><h2>Conversas recentes</h2>
        {chats.length === 0 ? <p>{runtime?.ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p> : chats.map((chat) => <div className="contact" key={chat.id}><span>{chat.name}</span><small>{chat.unreadCount} não lidas</small></div>)}
      </section>
      <section className="panel"><h2>Contatos CRM</h2>
        {contacts.length === 0 ? <p>Nenhum contato sincronizado ainda.</p> : contacts.map((contact) => <div className="contact" key={contact.id}><span>{contact.name}</span><small>{contact.phone || 'Sem telefone'}</small></div>)}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
