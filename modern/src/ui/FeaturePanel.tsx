import React from 'react';
import { useFeatureStore } from '../storage/featureStore';
import type { FeatureId } from '../types/features';

type Props = { feature: FeatureId; contacts: Array<{ id: string; name: string }>; onNotice: (text: string) => void };

export function FeaturePanel({ feature, contacts, onNotice }: Props) {
  const s = useFeatureStore();
  const [text, setText] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [price, setPrice] = React.useState('');

  if (feature === 'settings') return <section className="panel feature-panel"><h2>Configurações</h2><div className="setting-row"><div><strong>Modo Premium de desenvolvimento</strong><small>Ativa todos os módulos da implementação própria para testes. Não altera a licença da extensão original.</small></div><button onClick={() => { s.setPremiumDevMode(!s.premiumDevMode); onNotice(s.premiumDevMode ? 'Modo Premium de desenvolvimento ativado.' : 'Modo Premium de desenvolvimento desativado.'); }}>{s.premiumDevMode ? 'ATIVO' : 'DESATIVADO'}</button></div><div className="feature-grid"><Info title="Arquitetura" value="Modular / TypeScript"/><Info title="Armazenamento" value="Chrome local"/><Info title="WhatsApp" value="Bridge isolada"/></div></section>;

  if (feature === 'inbox') return <section className="panel feature-panel"><h2>Inbox</h2><p>Central de atendimento preparada para receber conversas do WhatsApp Web.</p><div className="feature-grid"><Info title="Conversas" value="Use Atualizar no painel"/><Info title="Leitura" value="Marcar como lida"/><Info title="Contatos" value={`${contacts.length}`} /></div></section>;
  if (feature === 'contacts') return <section className="panel feature-panel"><h2>Contatos</h2><p>Cadastro, pesquisa e edição dos dados do cliente estão no funil abaixo.</p><div className="feature-grid"><Info title="Contatos cadastrados" value={`${contacts.length}`}/><Info title="Campos" value="Nome, telefone, empresa, notas e valor"/></div></section>;
  if (feature === 'pipeline') return <section className="panel feature-panel"><h2>Funil de vendas</h2><p>Arraste os cards entre etapas ou altere a etapa diretamente no card.</p></section>;
  if (feature === 'tools') return <section className="panel feature-panel"><h2>Ferramentas</h2><div className="tool-list"><Tool title="Tradutor" text="Base preparada para integração de tradução."/><Tool title="Transcrição de áudio" text="Base preparada para integração de transcrição."/><Tool title="Mídia" text="Use a ponte do WhatsApp para download de mídia."/></div></section>;
  if (feature === 'status') return <section className="panel feature-panel"><h2>Status</h2><p>Área para gerenciamento de publicações e acompanhamento de status do WhatsApp.</p></section>;

  if (feature === 'quickReplies') return <section className="panel feature-panel"><h2>Respostas rápidas</h2><div className="inline-form"><input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)}/><input placeholder="Texto da resposta" value={text} onChange={e => setText(e.target.value)}/><button onClick={() => { if (!title || !text) return; s.addQuickReply({ title, text, enabled: true }); setTitle(''); setText(''); onNotice('Resposta rápida criada.'); }}>Adicionar</button></div><List>{s.quickReplies.map(x => <Row key={x.id} title={x.title} detail={x.text} action={<button className="ghost compact" onClick={() => s.removeQuickReply(x.id)}>Excluir</button>}/>)}</List></section>;

  if (feature === 'reminders') return <section className="panel feature-panel"><h2>Lembretes</h2><div className="inline-form"><input placeholder="Título do lembrete" value={title} onChange={e => setTitle(e.target.value)}/><button onClick={() => { if (!title) return; s.addReminder({ title, dueAt: Date.now() + 86400000, done: false }); setTitle(''); onNotice('Lembrete criado para amanhã.'); }}>Criar para amanhã</button></div><List>{s.reminders.map(x => <Row key={x.id} title={x.title} detail={x.done ? 'Concluído' : new Date(x.dueAt).toLocaleString('pt-BR')} action={<button className="ghost compact" onClick={() => s.toggleReminder(x.id)}>{x.done ? 'Reabrir' : 'Concluir'}</button>}/>)}</List></section>;

  if (feature === 'followUp') return <section className="panel feature-panel"><h2>Follow-up</h2><div className="inline-form"><input placeholder="Mensagem" value={text} onChange={e => setText(e.target.value)}/><button onClick={() => { if (!text) return; s.addFollowUp({ title: 'Follow-up', message: text, dueAt: Date.now() + 86400000, status: 'pending' }); setText(''); onNotice('Follow-up criado para amanhã.'); }}>Agendar</button></div><List>{s.followUps.map(x => <Row key={x.id} title={x.title} detail={`${x.message} · ${new Date(x.dueAt).toLocaleString('pt-BR')}`} action={<button className="ghost compact" onClick={() => s.cancelFollowUp(x.id)}>Cancelar</button>}/>)}</List></section>;

  if (feature === 'appointments') return <section className="panel feature-panel"><h2>Agendamentos</h2><div className="inline-form"><input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)}/><button onClick={() => { if (!title) return; s.addAppointment({ title, startAt: Date.now() + 86400000, status: 'scheduled' }); setTitle(''); onNotice('Agendamento criado para amanhã.'); }}>Agendar</button></div><List>{s.appointments.map(x => <Row key={x.id} title={x.title} detail={new Date(x.startAt).toLocaleString('pt-BR')} />)}</List></section>;

  if (feature === 'automation') return <section className="panel feature-panel"><h2>Automações</h2><div className="inline-form"><input placeholder="Nome da automação" value={title} onChange={e => setTitle(e.target.value)}/><button onClick={() => { if (!title) return; s.addAutomation({ name: title, trigger: 'mensagem recebida', action: 'criar tarefa', enabled: true }); setTitle(''); onNotice('Automação criada.'); }}>Criar</button></div><List>{s.automations.map(x => <Row key={x.id} title={x.name} detail={`${x.trigger} → ${x.action}`} action={<button className="ghost compact" onClick={() => s.toggleAutomation(x.id)}>{x.enabled ? 'Ativa' : 'Inativa'}</button>}/>)}</List></section>;

  if (feature === 'products') return <section className="panel feature-panel"><h2>Produtos</h2><div className="inline-form"><input placeholder="Produto" value={title} onChange={e => setTitle(e.target.value)}/><input placeholder="Preço" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)}/><button onClick={() => { const n = Number(price.replace(',', '.')); if (!title || !Number.isFinite(n)) return; s.addProduct({ name: title, price: n, active: true }); setTitle(''); setPrice(''); onNotice('Produto criado.'); }}>Adicionar</button></div><List>{s.products.map(x => <Row key={x.id} title={x.name} detail={x.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/>)}</List></section>;

  if (feature === 'orders') return <section className="panel feature-panel"><h2>Pedidos</h2><p>Crie pedidos a partir do catálogo de produtos na próxima etapa de integração.</p><List>{s.orders.map(x => <Row key={x.id} title={`Pedido ${x.id.slice(0, 8)}`} detail={x.status}/>)}</List></section>;

  if (feature === 'webhooks') return <section className="panel feature-panel"><h2>Webhooks</h2><div className="inline-form"><input placeholder="Nome" value={title} onChange={e => setTitle(e.target.value)}/><input placeholder="URL HTTPS" value={url} onChange={e => setUrl(e.target.value)}/><button onClick={() => { if (!title || !url.startsWith('https://')) return; s.addWebhook({ name: title, url, event: 'messages', enabled: true }); setTitle(''); setUrl(''); onNotice('Webhook criado.'); }}>Adicionar</button></div><List>{s.webhooks.map(x => <Row key={x.id} title={x.name} detail={`${x.event} · ${x.url}`} action={<button className="ghost compact" onClick={() => s.toggleWebhook(x.id)}>{x.enabled ? 'Ativo' : 'Inativo'}</button>}/>)}</List></section>;

  return null;
}

function List({ children }: { children: React.ReactNode }) { return <div className="feature-list">{children}</div>; }
function Row({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) { return <div className="feature-row"><div><strong>{title}</strong>{detail && <small>{detail}</small>}</div>{action}</div>; }
function Info({ title, value }: { title: string; value: string }) { return <article><small>{title}</small><b>{value}</b></article>; }
function Tool({ title, text }: { title: string; text: string }) { return <div className="feature-row"><div><strong>{title}</strong><small>{text}</small></div><span className="badge">Pronto</span></div>; }
