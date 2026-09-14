import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncWhatsAppContacts } from '../core/crm/contactSync';
import { downloadContactsCsv } from '../core/crm/exportCsv';
import { filterContacts } from '../core/crm/pipeline';
import { whatsappApi } from '../messaging/whatsappClient';
import { useCrmStore } from '../storage/crmStore';
import { useFeatureStore } from '../storage/featureStore';
import { Kanban } from './Kanban';
import { ContactEditor } from './ContactEditor';
import { FeaturePanel } from './FeaturePanel';
import type { ChatSummary, Label, WhatsAppProfile } from '../core/types';
import type { FeatureId } from '../types/features';
import './styles.css';

const navigation: Array<{ id: FeatureId; label: string; icon: string }> = [
  { id: 'inbox', label: 'Inbox', icon: '▣' }, { id: 'contacts', label: 'Contatos', icon: '♙' },
  { id: 'pipeline', label: 'Funil de vendas', icon: '▥' }, { id: 'quickReplies', label: 'Respostas rápidas', icon: '↗' },
  { id: 'reminders', label: 'Lembretes', icon: '◷' }, { id: 'followUp', label: 'Follow-up', icon: '↻' },
  { id: 'appointments', label: 'Agendamentos', icon: '◫' }, { id: 'automation', label: 'Automações', icon: '⚡' },
  { id: 'orders', label: 'Pedidos', icon: '▤' }, { id: 'products', label: 'Produtos', icon: '◇' },
  { id: 'webhooks', label: 'Webhooks', icon: '⇄' }, { id: 'status', label: 'Status', icon: '◉' },
  { id: 'tools', label: 'Ferramentas', icon: '⚙' }, { id: 'settings', label: 'Configurações', icon: '☰' }
];

export function App() {
  const contacts = useCrmStore(s => s.contacts), stages = useCrmStore(s => s.stages), load = useCrmStore(s => s.load);
  const upsertContact = useCrmStore(s => s.upsertContact), updateContact = useCrmStore(s => s.updateContact), moveContact = useCrmStore(s => s.moveContact), selectContact = useCrmStore(s => s.selectContact), selectedContactId = useCrmStore(s => s.selectedContactId);
  const featureLoad = useFeatureStore(s => s.load), premiumDevMode = useFeatureStore(s => s.premiumDevMode);
  const [feature, setFeature] = React.useState<FeatureId>('inbox');
  const [chats, setChats] = React.useState<ChatSummary[]>([]), [labels, setLabels] = React.useState<Label[]>([]), [profile, setProfile] = React.useState<WhatsAppProfile | null>(null);
  const [ready, setReady] = React.useState(false), [busy, setBusy] = React.useState(false), [query, setQuery] = React.useState('');
  const [message, setMessage] = React.useState<string>(), [error, setError] = React.useState<string>();

  React.useEffect(() => { void load(); void featureLoad(); void refresh(); }, [load, featureLoad]);
  async function refresh() { setBusy(true); setError(undefined); try { const status = await whatsappApi.getRuntimeStatus(); setReady(status.ready); if (!status.ready) { setChats([]); setLabels([]); setProfile(null); return; } const [c, l, p] = await Promise.all([whatsappApi.listChats(), whatsappApi.listLabels(), whatsappApi.getProfile()]); setChats(c); setLabels(l); setProfile(p); } catch (e) { setReady(false); setError(e instanceof Error ? e.message : 'WhatsApp Web indisponível.'); } finally { setBusy(false); } }
  async function sync() { setBusy(true); setError(undefined); try { const report = await syncWhatsAppContacts({ getChats: whatsappApi.listChats, getContact: whatsappApi.getContact }, { upsertContact }); setMessage(`${report.synced} contato(s) sincronizado(s); ${report.skippedGroups} grupo(s) ignorado(s).`); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Falha na sincronização.'); } finally { setBusy(false); } }
  async function markRead(chat: ChatSummary) { try { await whatsappApi.markChatRead(chat.id); setChats(current => current.map(item => item.id === chat.id ? { ...item, unreadCount: 0 } : item)); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível marcar a conversa como lida.'); } }
  const visibleContacts = React.useMemo(() => filterContacts(contacts, query), [contacts, query]);
  const selected = contacts.find(c => c.id === selectedContactId), totalValue = contacts.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const labelNames = React.useMemo(() => new Map(labels.map(l => [l.id, l.name])), [labels]);

  return <main className="workspace">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">W</div><div><strong>WhaFlash</strong><small>CRM para WhatsApp</small></div></div><div className="connection-mini"><span className={ready ? 'dot online' : 'dot'}></span>{ready ? (profile?.name || 'WhatsApp conectado') : 'Aguardando WhatsApp'}</div><nav>{navigation.map(item => <button key={item.id} className={feature === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setFeature(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav><div className="sidebar-bottom"><span className={premiumDevMode ? 'premium-badge on' : 'premium-badge'}>PREMIUM {premiumDevMode ? 'ON' : 'OFF'}</span><small>Modo de desenvolvimento</small></div></aside>
    <section className="main-content"><header className="topbar"><div><h1>{navigation.find(x => x.id === feature)?.label}</h1><span>{ready ? 'Sessão do WhatsApp Web ativa' : 'Abra o WhatsApp Web para conectar'}</span></div><div className="actions"><button onClick={() => void refresh()} disabled={busy}>{busy ? 'Atualizando…' : 'Atualizar'}</button><button onClick={() => void sync()} disabled={busy || !ready}>Sincronizar</button><button className="ghost" onClick={() => { downloadContactsCsv(contacts); setMessage(`${contacts.length} contato(s) exportado(s).`); }} disabled={!contacts.length}>Exportar CSV</button></div></header>
      {error && <div className="error" role="alert">{error}</div>}{message && <div className="success" role="status">{message}</div>}
      {feature !== 'pipeline' && <FeaturePanel feature={feature} contacts={contacts.map(c => ({ id: c.id, name: c.name }))} onNotice={setMessage} />}
      {feature === 'pipeline' && <><section className="metric-grid"><article><small>Contatos</small><b>{contacts.length}</b></article><article><small>Conversas</small><b>{chats.length}</b></article><article><small>Valor no funil</small><b>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></article></section><section className="panel search-panel"><label className="search-field"><span>Pesquisar contatos</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, telefone, empresa, etiqueta…" /></label></section><Kanban contacts={visibleContacts} stages={stages} onSelect={selectContact} onMove={(id, stageId) => { moveContact(id, stageId); setMessage('Contato movido no funil.'); }} labelNames={labelNames}/>{selected && <ContactEditor contact={selected} onClose={() => selectContact(undefined)} onSave={patch => { updateContact(selected.id, patch); setMessage('Contato atualizado.'); }}/>}</>}
      {feature === 'inbox' && <section className="panel"><div className="section-heading"><div><h2>Conversas recentes</h2><small>Dados vindos do WhatsApp Web conectado.</small></div></div>{chats.length === 0 ? <p>{ready ? 'Nenhuma conversa retornada.' : 'Abra o WhatsApp Web para conectar.'}</p> : chats.slice(0, 30).map(chat => <div className="contact-row" key={chat.id}><button className="contact" onClick={() => selectContact(chat.id)}><span>{chat.name}</span><small>{chat.unreadCount} não lidas</small></button>{chat.unreadCount > 0 && <button className="ghost compact" onClick={() => void markRead(chat)}>Marcar lida</button>}</div>)}</section>}
    </section></main>;
}

createRoot(document.getElementById('root')!).render(<App />);
