import type {
  OffboardingStatus,
  OffboardingReason,
  ChecklistItemType,
  ChecklistStatus,
  EquipmentStatus,
} from '../constants/state-machines';

export interface OffboardingWorkflow {
  id: string;
  contractorId: string;
  organizationId: string;
  initiatedBy: string;
  reason: OffboardingReason;
  effectiveDate: string;
  status: OffboardingStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OffboardingWorkflowDetail extends OffboardingWorkflow {
  contractorName: string;
  initiatedByName: string;
  checklistItems: OffboardingChecklistItem[];
  equipment: Equipment[];
}

export interface OffboardingChecklistItem {
  id: string;
  workflowId: string;
  itemType: ChecklistItemType;
  status: ChecklistStatus;
  completedBy: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  contractorId: string;
  organizationId: string;
  description: string;
  serialNumber: string | null;
  assignedAt: string;
  returnRequestedAt: string | null;
  returnedAt: string | null;
  status: EquipmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
