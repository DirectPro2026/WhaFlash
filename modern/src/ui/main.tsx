import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncWhatsAppContacts } from '../core/crm/contactSync';
import { whatsappApi } from '../messaging/whatsappClient';
import { useCrmStore } from '../storage/crmStore';
import type { ChatSummary } from '../core/types';
import type { Contact } from '../types/crm';
import './styles.css';

type Stage = { id: string; name: string; position: number };

type ContactEditorProps = {
  contact: Contact;
  stages: Stage[];
  onSave: (patch: Partial<Omit<Contact, 'id' | 'updatedAt'>>) => void;
};

function ContactEditor({ contact, stages, onSave }: ContactEditorProps) {
  const [draft, setDraft] = React.useState(contact);
  React.useEffect(() => setDraft(contact), [contact.id, contact.updatedAt]);

  function update<K extends keyof Contact>(key: K, value: Contact[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave({
      name: draft.name.trim() || contact.name,
      phone: draft.phone.trim(),
      email: draft.email?.trim() || undefined,
      city: draft.city?.trim() || undefined,
      state: draft.state?.trim() || undefined,
      company: draft.company?.trim() || undefined,
      job: draft.job?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      labels: draft.labels,
      value: typeof draft.value === 'number' && Number.isFinite(draft.value) ? Math.max(0, draft.value) : undefined,
      stageId: draft.stageId || undefined,
    });
  }
  function addLabel(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const input = event.currentTarget;
    const label = input.value.trim();
    if (label && !draft.labels.includes(label)) update('labels', [...draft.labels, label]);
    input.value = '';
  }
  function removeLabel(label: string) { update('labels', draft.labels.filter((item) => item !== label)); }

  return <form className="editor" onSubmit={submit}>
    <div className="editor-header"><div><h2>Ficha do contato</h2><small>Edite os dados comerciais e salve no CRM.</small></div><button type="submit">Salvar alterações</button></div>
    <div className="form-grid">
      <label>Nome<input value={draft.name} onChange={(e) => update('name', e.target.value)} required /></label>
      <label>Telefone<input value={draft.phone} onChange={(e) => update('phone', e.target.value)} /></label>
      <label>E-mail<input type="email" value={draft.email ?? ''} onChange={(e) => update('email', e.target.value)} /></label>
      <label>Empresa<input value={draft.company ?? ''} onChange={(e) => update('company', e.target.value)} /></label>
      <label>Cargo<input value={draft.job ?? ''} onChange={(e) => update('job', e.target.value)} /></label>
      <label>Cidade<input value={draft.city ?? ''} onChange={(e) => update('city', e.target.value)} /></label>
      <label>Estado<input value={draft.state ?? ''} onChange={(e) => update('state', e.target.value)} /></label>
      <label>Estágio<select value={draft.stageId ?? ''} onChange={(e) => update('stageId', e.target.value || undefined)}><option value="">Sem estágio</option>{stages.slice().sort((a, b) => a.position - b.position).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
      <label>Valor (R$)<input type="number" min="0" step="0.01" value={draft.value ?? ''} onChange={(e) => update('value', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
    </div>
    <label>Etiquetas<input placeholder="Digite uma etiqueta e pressione Enter" onKeyDown={addLabel} /><span className="tags">{draft.labels.map((label) => <button type="button" className="tag" key={label} onClick={() => removeLabel(label)} title="Remover etiqueta">{label} ×</button>)}</span></label>
    <label>Notas<textarea rows={5} value={draft.notes ?? ''} onChange={(e) => update('notes', e.target.value)} placeholder="Observações importantes sobre este contato..." /></label>
  </form>;
}

function Dashboard() {
  const contacts = useCrmStore((state) => state.contacts);
  const stages = useCrmStore((state) => state.stages);
  const load = useCrmStore((state) => state.load);
  const upsertContact = useCrmStore((state) => state.upsertContact);
  const updateContact = useCrmStore((state) => state.updateContact);
  const selectContact = useCrmStore((state) => state.selectContact);
  const selectedContactId = useCrmStore((state) => state.selectedContactId);
  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [runtime, setRuntime] = React.useState<{ ready: boolean; provider: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { void load(); }, [load]);
  async function refreshWhatsApp() { setBusy(true); setError(null); setSyncMessage(null); try { const status = await whatsappApi.getRuntimeStatus(); setRuntime(status); if (status.ready) setChats(await whatsappApi.listChats()); } catch (reason) { setRuntime(null); setError(reason instanceof Error ? reason.message : 'Não foi possível acessar o WhatsApp Web.'); } finally { setBusy(false); } }
  async function syncContacts() { setBusy(true); setError(null); setSyncMessage(null); try { const report = await syncWhatsAppContacts({ getChats: whatsappApi.listChats, getContact: whatsappApi.getContact }, { upsertContact }); setSyncMessage(`${report.synced} contato(s) sincronizado(s). ${report.skippedGroups} grupo(s) ignorado(s).`); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao sincronizar contatos.'); } finally { setBusy(false); } }
  React.useEffect(() => { void refreshWhatsApp(); }, []);
  const selected = contacts.find((contact) => contact.id === selectedContactId);

  return <main className="app">
    <header><div><strong>WhaFlash</strong><span>CRM moderno para WhatsApp</span></div><div className="actions"><button type="button" onClick={() => void refreshWhatsApp()} disabled={busy}>{busy ? 'Processando…' : 'Atualizar'}</button><button type="button" onClick={() => void syncContacts()} disabled={busy || !runtime?.ready}>Sincronizar contatos</button></div></header>
    <section className="grid"><article><small>Contatos</small><b>{contacts.length}</b></article><article><small>Conversas</small><b>{chats.length}</b></article><article><small>Status</small><b>{runtime?.ready ? 'Conectado' : 'Aguardando'}</b></article></section>
    {error && <div className="error" role="alert">{error}</div>}{syncMessage && <div className="success" role="status">{syncMessage}</div>}
    <section className="panel"><h2>Conversas recentes</h2>{chats.length === 0 ? <p>{runtime?.ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p> : chats.map((chat) => <div className="contact" key={chat.id}><span>{chat.name}</span><small>{chat.unreadCount} não lidas</small></div>)}</section>
    <section className="panel"><h2>Contatos CRM</h2>{contacts.length === 0 ? <p>Nenhum contato sincronizado ainda.</p> : contacts.map((contact) => <button className={`contact contact-button${selectedContactId === contact.id ? ' selected' : ''}`} type="button" key={contact.id} onClick={() => selectContact(contact.id)}><span><b>{contact.name}</b>{contact.stageId && <small>{stages.find((stage) => stage.id === contact.stageId)?.name ?? 'Sem estágio'}</small>}</span><small>{contact.phone || 'Sem telefone'}</small></button>)}</section>
    {selected && <section className="panel"><ContactEditor contact={selected} stages={stages} onSave={(patch) => { updateContact(selected.id, patch); setSyncMessage('Ficha do contato salva.'); }} /></section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
