import React from 'react';
import { createRoot } from 'react-dom/client';
import { useCrmStore } from '../storage/crmStore';
import { whatsappApi } from '../messaging/whatsappClient';
import type { ChatSummary } from '../core/types';
import './styles.css';

function Dashboard() {
  const contacts = useCrmStore((state) => state.contacts);
  const load = useCrmStore((state) => state.load);
  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [runtime, setRuntime] = React.useState<{ ready: boolean; provider: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { void load(); }, [load]);

  async function refreshWhatsApp() {
    setBusy(true);
    setError(null);
    try {
      const status = await whatsappApi.getRuntimeStatus();
      setRuntime(status);
      if (!status.ready) return;
      setChats(await whatsappApi.listChats());
    } catch (reason) {
      setRuntime(null);
      setError(reason instanceof Error ? reason.message : 'Não foi possível acessar o WhatsApp Web.');
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => { void refreshWhatsApp(); }, []);

  return (
    <main className="app">
      <header>
        <div>
          <strong>WhaFlash</strong>
          <span>CRM moderno para WhatsApp</span>
        </div>
        <button type="button" onClick={() => void refreshWhatsApp()} disabled={busy}>
          {busy ? 'Sincronizando…' : 'Sincronizar'}
        </button>
      </header>

      <section className="grid">
        <article><small>Contatos</small><b>{contacts.length}</b></article>
        <article><small>Conversas</small><b>{chats.length}</b></article>
        <article><small>Status</small><b>{runtime?.ready ? 'Conectado' : 'Aguardando'}</b></article>
      </section>

      {error && <div className="error" role="alert">{error}</div>}

      <section className="panel">
        <h2>Conversas recentes</h2>
        {chats.length === 0 ? (
          <p>{runtime?.ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p>
        ) : chats.map((chat) => (
          <div className="contact" key={chat.id}>
            <span>{chat.name}</span><small>{chat.unreadCount} não lidas</small>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Contatos CRM</h2>
        {contacts.length === 0 ? <p>Nenhum contato sincronizado ainda.</p> : contacts.map((contact) => (
          <div className="contact" key={contact.id}>
            <span>{contact.name}</span><small>{contact.phone ?? 'Sem telefone'}</small>
          </div>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
