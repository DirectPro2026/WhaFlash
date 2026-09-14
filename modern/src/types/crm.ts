export type ContactId = string;

export interface Contact {
  id: ContactId;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  company?: string;
  job?: string;
  notes?: string;
  labels: string[];
  value?: number;
  stageId?: string;
  updatedAt: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
}

export interface CrmState {
  contacts: Contact[];
  stages: PipelineStage[];
  selectedContactId?: ContactId;
}
