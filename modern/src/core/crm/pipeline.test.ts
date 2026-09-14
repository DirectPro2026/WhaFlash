import { describe, expect, it } from 'vitest';
import { calculateStageMetrics, filterContacts } from './pipeline';
import type { Contact, PipelineStage } from '../../types/crm';

const stages: PipelineStage[] = [
  { id: 'new', name: 'Novos', position: 0 },
  { id: 'won', name: 'Ganhos', position: 1 }
];

const contacts: Contact[] = [
  { id: '1', name: 'Ana', phone: '55119999', labels: ['quente'], value: 100, stageId: 'new', updatedAt: 1 },
  { id: '2', name: 'Bruno', phone: '55228888', company: 'Acme', labels: ['cliente'], value: 250, stageId: 'won', updatedAt: 1 },
  { id: '3', name: 'Carla', phone: '55337777', labels: [], value: 50, updatedAt: 1 }
];

describe('CRM pipeline', () => {
  it('calculates count and value per stage', () => {
    expect(calculateStageMetrics(contacts, stages)).toEqual({
      new: { count: 1, value: 100 },
      won: { count: 1, value: 250 }
    });
  });

  it('filters contacts across searchable fields', () => {
    expect(filterContacts(contacts, 'acme').map((contact) => contact.id)).toEqual(['2']);
    expect(filterContacts(contacts, 'QUENTE').map((contact) => contact.id)).toEqual(['1']);
    expect(filterContacts(contacts, '').length).toBe(3);
  });
});
