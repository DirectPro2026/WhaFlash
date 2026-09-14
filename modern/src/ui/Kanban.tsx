import React from 'react';
import type { Contact, PipelineStage } from '../types/crm';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  contacts: Contact[];
  stages: PipelineStage[];
  onSelect: (id: string) => void;
  onMove: (id: string, stageId: string) => void;
}

export function Kanban({ contacts, stages, onSelect, onMove }: Props) {
  const ordered = stages.slice().sort((a, b) => a.position - b.position);
  const columns = ordered.map((stage) => ({ stage, items: contacts.filter((c) => c.stageId === stage.id) }));
  const unassigned = contacts.filter((c) => !c.stageId);

  return <section className="panel funnel">
    <div className="section-heading"><div><h2>Funil de vendas</h2><small>Arraste cartões entre etapas ou use o seletor.</small></div><strong>{money(contacts.reduce((sum, c) => sum + (c.value ?? 0), 0))}</strong></div>
    <div className="kanban">
      {columns.map(({ stage, items }) => <KanbanColumn key={stage.id} stage={stage} items={items} stages={ordered} onSelect={onSelect} onMove={onMove} />)}
      {unassigned.length > 0 && <KanbanColumn stage={{ id: '', name: 'Sem estágio', position: 999 }} items={unassigned} stages={ordered} onSelect={onSelect} onMove={onMove} unassigned />}
    </div>
  </section>;
}

function KanbanColumn({ stage, items, stages, onSelect, onMove, unassigned = false }: { stage: PipelineStage; items: Contact[]; stages: PipelineStage[]; onSelect: (id: string) => void; onMove: (id: string, stageId: string) => void; unassigned?: boolean }) {
  const total = items.reduce((sum, c) => sum + (c.value ?? 0), 0);
  return <div className={`kanban-column${unassigned ? ' unassigned' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); if (id && stage.id) onMove(id, stage.id); }}>
    <div className="column-header"><span><b>{stage.name}</b><small>{items.length} contato(s)</small></span><strong>{money(total)}</strong></div>
    <div className="kanban-cards">{items.map((contact) => <article className="kanban-card" draggable key={contact.id} onDragStart={(e) => e.dataTransfer.setData('text/plain', contact.id)} onClick={() => onSelect(contact.id)}>
      <b>{contact.name}</b><small>{contact.phone || 'Sem telefone'}</small>
      {contact.labels.length > 0 && <div className="tags">{contact.labels.slice(0, 3).map((label) => <span className="tag" key={label}>{label}</span>)}</div>}
      <strong>{money(contact.value ?? 0)}</strong>
      <select value={contact.stageId ?? ''} onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(contact.id, e.target.value)}><option value="">Sem estágio</option>{stages.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select>
    </article>)}</div>
  </div>;
}
