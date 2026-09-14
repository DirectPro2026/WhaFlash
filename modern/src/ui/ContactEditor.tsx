import React from 'react';
import type { Contact } from '../types/crm';

interface Props {
  contact: Contact;
  onSave: (patch: Partial<Omit<Contact, 'id' | 'updatedAt'>>) => void;
  onClose: () => void;
}

export function ContactEditor({ contact, onSave, onClose }: Props) {
  const [draft, setDraft] = React.useState(() => ({
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? '',
    city: contact.city ?? '',
    state: contact.state ?? '',
    company: contact.company ?? '',
    job: contact.job ?? '',
    notes: contact.notes ?? '',
    value: String(contact.value ?? 0),
    labels: contact.labels.join(', ')
  }));

  function field(key: keyof typeof draft) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((current) => ({ ...current, [key]: event.target.value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(draft.value.replace(',', '.'));
    onSave({
      name: draft.name.trim() || contact.name,
      phone: draft.phone.trim(),
      email: draft.email.trim() || undefined,
      city: draft.city.trim() || undefined,
      state: draft.state.trim() || undefined,
      company: draft.company.trim() || undefined,
      job: draft.job.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      value: Number.isFinite(value) ? value : 0,
      labels: draft.labels.split(',').map((label) => label.trim()).filter(Boolean)
    });
  }

  return <aside className="panel editor" aria-label="Editar contato">
    <div className="editor-heading">
      <div><small>Contato</small><h2>{contact.name}</h2></div>
      <button type="button" className="ghost" onClick={onClose}>Fechar</button>
    </div>
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>Nome<input value={draft.name} onChange={field('name')} /></label>
        <label>Telefone<input value={draft.phone} onChange={field('phone')} /></label>
        <label>E-mail<input type="email" value={draft.email} onChange={field('email')} /></label>
        <label>Empresa<input value={draft.company} onChange={field('company')} /></label>
        <label>Cargo<input value={draft.job} onChange={field('job')} /></label>
        <label>Valor<input inputMode="decimal" value={draft.value} onChange={field('value')} /></label>
        <label>Cidade<input value={draft.city} onChange={field('city')} /></label>
        <label>Estado<input value={draft.state} onChange={field('state')} /></label>
      </div>
      <label>Etiquetas<input value={draft.labels} onChange={field('labels')} placeholder="cliente, quente, retorno" /></label>
      <label>Observações<textarea rows={4} value={draft.notes} onChange={field('notes')} /></label>
      <div className="editor-actions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button type="submit">Salvar contato</button></div>
    </form>
  </aside>;
}
