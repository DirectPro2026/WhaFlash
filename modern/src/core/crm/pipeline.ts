import type { Contact, PipelineStage } from '../../types/crm';

export interface StageMetrics {
  count: number;
  value: number;
}

export function getStageMetrics(contacts: Contact[], stages: PipelineStage[]): Record<string, StageMetrics> {
  return stages.reduce<Record<string, StageMetrics>>((metrics, stage) => {
    metrics[stage.id] = { count: 0, value: 0 };
    return metrics;
  }, {});
}

export function calculateStageMetrics(contacts: Contact[], stages: PipelineStage[]): Record<string, StageMetrics> {
  const metrics = getStageMetrics(contacts, stages);
  for (const contact of contacts) {
    if (!contact.stageId || !metrics[contact.stageId]) continue;
    metrics[contact.stageId].count += 1;
    metrics[contact.stageId].value += contact.value ?? 0;
  }
  return metrics;
}

export function filterContacts(contacts: Contact[], query: string): Contact[] {
  const normalized = query.trim().toLocaleLowerCase('pt-BR');
  if (!normalized) return contacts;
  return contacts.filter((contact) => [
    contact.name,
    contact.phone,
    contact.email,
    contact.company,
    contact.job,
    contact.city,
    contact.state,
    ...contact.labels
  ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalized)));
}
