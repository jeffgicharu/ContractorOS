import { SEED_ORG_ID } from './organizations';
import { SEED_ADMIN_ID } from './users';

const JOHN_CONTRACTOR_ID = '33333333-3333-3333-3333-333333333301';

// Equipment for John Smith
export const equipment = [
  {
    id: '88888888-8888-8888-8888-888888888801',
    contractorId: JOHN_CONTRACTOR_ID,
    organizationId: SEED_ORG_ID,
    description: 'MacBook Pro 16" M3',
    serialNumber: 'C02G12345678',
    status: 'assigned' as const,
  },
  {
    id: '88888888-8888-8888-8888-888888888802',
    contractorId: JOHN_CONTRACTOR_ID,
    organizationId: SEED_ORG_ID,
    description: 'Dell UltraSharp 27" Monitor',
    serialNumber: 'D27U-2024-001',
    status: 'assigned' as const,
  },
  {
    id: '88888888-8888-8888-8888-888888888803',
    contractorId: JOHN_CONTRACTOR_ID,
    organizationId: SEED_ORG_ID,
    description: 'Office Access Badge',
    serialNumber: 'BADGE-0042',
    status: 'assigned' as const,
  },
];

// Offboarding workflow for John Smith (in_progress)
export const SEED_WORKFLOW_ID = '99999999-9999-9999-9999-999999999901';

export const offboardingWorkflow = {
  id: SEED_WORKFLOW_ID,
  contractorId: JOHN_CONTRACTOR_ID,
  organizationId: SEED_ORG_ID,
  initiatedBy: SEED_ADMIN_ID,
  reason: 'project_completed' as const,
  effectiveDate: '2026-03-15',
  status: 'in_progress' as const,
  notes: 'Project Alpha completed, transitioning to internal team.',
};

// Checklist items with mixed statuses
export const checklistItems = [
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'revoke_system_access' as const,
    status: 'completed' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'revoke_code_repo_access' as const,
    status: 'completed' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'revoke_communication_tools' as const,
    status: 'completed' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'retrieve_equipment' as const,
    status: 'pending' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'process_final_invoice' as const,
    status: 'pending' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'archive_documents' as const,
    status: 'pending' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'freeze_tax_data' as const,
    status: 'pending' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'exit_interview' as const,
    status: 'skipped' as const,
  },
  {
    workflowId: SEED_WORKFLOW_ID,
    itemType: 'remove_from_tools' as const,
    status: 'pending' as const,
  },
];
