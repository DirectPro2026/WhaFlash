import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncWhatsAppContacts } from '../core/crm/contactSync';
import { downloadContactsCsv } from '../core/crm/exportCsv';
import { filterContacts } from '../core/crm/pipeline';
import { whatsappApi } from '../messaging/whatsappClient';
import { useCrmStore } from '../storage/crmStore';
import { Kanban } from './Kanban';
import { ContactEditor } from './ContactEditor';
import type { ChatSummary, Label, WhatsAppProfile } from '../core/types';
import './styles.css';

export function App() {
  const contacts = useCrmStore((s) => s.contacts);
  const stages = useCrmStore((s) => s.stages);
  const load = useCrmStore((s) => s.load);
  const upsertContact = useCrmStore((s) => s.upsertContact);
  const updateContact = useCrmStore((s) => s.updateContact);
  const moveContact = useCrmStore((s) => s.moveContact);
  const selectContact = useCrmStore((s) => s.selectContact);
  const selectedContactId = useCrmStore((s) => s.selectedContactId);
  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [profile, setProfile] = React.useState<WhatsAppProfile | null>(null);
  const [ready, setReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [message, setMessage] = React.useState<string>();
  const [error, setError] = React.useState<string>();

  React.useEffect(() => { void load(); void refresh(); }, [load]);

  async function refresh() {
    setBusy(true); setError(undefined); setMessage(undefined);
    try {
      const status = await whatsappApi.getRuntimeStatus();
      setReady(status.ready);
      if (!status.ready) {
        setChats([]); setLabels([]); setProfile(null);
        return;
      }
      const [nextChats, nextLabels, nextProfile] = await Promise.all([
        whatsappApi.listChats(),
        whatsappApi.listLabels(),
        whatsappApi.getProfile()
      ]);
      setChats(nextChats);
      setLabels(nextLabels);
      setProfile(nextProfile);
    } catch (e) {
      setReady(false);
      setError(e instanceof Error ? e.message : 'WhatsApp Web indisponível.');
    } finally { setBusy(false); }
  }

  async function sync() {
    setBusy(true); setError(undefined); setMessage(undefined);
    try {
      const report = await syncWhatsAppContacts(
        { getChats: whatsappApi.listChats, getContact: whatsappApi.getContact },
        { upsertContact }
      );
      setMessage(`${report.synced} contato(s) sincronizado(s); ${report.skippedGroups} grupo(s) ignorado(s).`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha na sincronização.'); }
    finally { setBusy(false); }
  }

  async function markRead(chat: ChatSummary) {
    try {
      await whatsappApi.markChatRead(chat.id);
      setChats((current) => current.map((item) => item.id === chat.id ? { ...item, unreadCount: 0 } : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível marcar a conversa como lida.');
    }
  }

  function exportContacts() {
    downloadContactsCsv(contacts);
    setMessage(`${contacts.length} contato(s) exportado(s) em CSV.`);
  }

  const visibleContacts = React.useMemo(() => filterContacts(contacts, query), [contacts, query]);
  const selected = contacts.find((c) => c.id === selectedContactId);
  const totalValue = contacts.reduce((sum, contact) => sum + (contact.value ?? 0), 0);
  const labelNames = React.useMemo(() => new Map(labels.map((label) => [label.id, label.name])), [labels]);

  return <main className="app">
    <header>
      <div><strong>WhaFlash</strong><span>CRM moderno para WhatsApp</span></div>
      <div className="actions">
        <button onClick={() => void refresh()} disabled={busy}>{busy ? 'Processando…' : 'Atualizar'}</button>
        <button onClick={() => void sync()} disabled={busy || !ready}>Sincronizar contatos</button>
        <button className="ghost" onClick={exportContacts} disabled={!contacts.length}>Exportar CSV</button>
      </div>
    </header>

    <section className="grid">
      <article><small>Contatos</small><b>{contacts.length}</b></article>
      <article><small>Conversas</small><b>{chats.length}</b></article>
      <article><small>Valor no funil</small><b>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></article>
    </section>

    {error && <div className="error" role="alert">{error}</div>}
    {message && <div className="success" role="status">{message}</div>}

    <section className="panel connection">
      <div><small>WhatsApp conectado</small><strong>{ready ? (profile?.name || 'Sessão ativa') : 'Aguardando WhatsApp Web'}</strong></div>
      <span>{ready ? `${labels.length} etiqueta(s) disponível(is)` : 'Abra web.whatsapp.com para conectar'}</span>
    </section>

    <section className="panel search-panel">
      <label className="search-field">
        <span>Pesquisar contatos</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, telefone, empresa, etiqueta…" />
      </label>
      {query && <small>{visibleContacts.length} resultado(s) para “{query}”.</small>}
    </section>

    <Kanban
      contacts={visibleContacts}
      stages={stages}
      onSelect={selectContact}
      onMove={(id, stageId) => { moveContact(id, stageId); setMessage('Contato movido no funil.'); }}
      labelNames={labelNames}
    />

    {selected && <ContactEditor
      contact={selected}
      onClose={() => selectContact(undefined)}
      onSave={(patch) => { updateContact(selected.id, patch); setMessage('Contato atualizado.'); }}
    />}

    <section className="panel">
      <div className="section-heading"><div><h2>Conversas recentes</h2><small>Dados vindos do WhatsApp Web conectado.</small></div></div>
      {chats.length === 0
        ? <p>{ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p>
        : chats.slice(0, 20).map((chat) => <div className="contact-row" key={chat.id}>
            <button className="contact" onClick={() => selectContact(chat.id)}>
              <span>{chat.name}</span><small>{chat.unreadCount} não lidas</small>
            </button>
            {chat.unreadCount > 0 && <button className="ghost compact" onClick={() => void markRead(chat)}>Marcar lida</button>}
          </div>)}
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
