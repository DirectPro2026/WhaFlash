import React from 'react';
import { createRoot } from 'react-dom/client';
import { useCrmStore } from '../storage/crmStore';
import './styles.css';

function Dashboard() {
  const contacts = useCrmStore((state) => state.contacts);
  const load = useCrmStore((state) => state.load);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <main className="app">
      <header>
        <div>
          <strong>WhaFlash</strong>
          <span>CRM moderno para WhatsApp</span>
        </div>
        <button type="button">Novo contato</button>
      </header>
      <section className="grid">
        <article><small>Contatos</small><b>{contacts.length}</b></article>
        <article><small>Funil</small><b>4 etapas</b></article>
        <article><small>Status</small><b>Conectando</b></article>
      </section>
      <section className="panel">
        <h2>Contatos recentes</h2>
        {contacts.length === 0 ? <p>Nenhum contato sincronizado ainda.</p> : contacts.map((contact) => (
          <div className="contact" key={contact.id}>
            <span>{contact.name}</span><small>{contact.phone}</small>
          </div>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
