/**
 * Enums and Constants
 * All enum mappings organized in a single place
 */

// Country/Region options
export const COUNTRY_REGION_OPTIONS = [
  'Regional',
  'Argentina',
  'Bahamas',
  'Barbados',
  'Belice',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Guyana',
  'Haití',
  'Honduras',
  'Jamaica',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'Suriname',
  'Trinidad y Tobago',
  'Uruguay',
  'Venezuela'
] as const

// ============================================================================
// Project Enums
// ============================================================================

// Project Types
export const PROJECT_TYPES = [
  { key: 'EDUCATION', value: 'education' },
  { key: 'TECNOLOGY', value: 'tecnology' },
  { key: 'SOCIAL', value: 'social' },
  { key: 'INFRASTRUCTURE', value: 'infrastructure' },
  { key: 'ENERGY', value: 'energy' },
  { key: 'AGRICULTURE', value: 'agriculture' }
] as const

// Project Status (for projects)
export const PROJECT_STATUS = [
  { key: 'PENDING', value: 'pending' },
  { key: 'IN_PROGRESS', value: 'inprogress' },
  { key: 'CLOSED', value: 'closed' },
  { key: 'CANCELED', value: 'canceled' }
] as const

// ============================================================================
// Phase/Stage Enums
// ============================================================================

// Phase Project Status (for stages/phases - includes COMPLETED)
export const PHASE_PROJECT_STATUS = [
  { key: 'PENDING', value: 'pending' },
  { key: 'IN_PROGRESS', value: 'inprogress' },
  { key: 'CLOSED', value: 'closed' },
  { key: 'CANCELED', value: 'canceled' },
  { key: 'COMPLETED', value: 'completed' }
] as const

// Phase Project Task Status (for tasks within phases)
export const PHASE_PROJECT_TASK_STATUS = [
  { key: 'PENDING', value: 'pending' },
  { key: 'IN_PROGRESS', value: 'inprogress' },
  { key: 'CLOSED', value: 'closed' },
  { key: 'CANCELED', value: 'canceled' }
] as const

// ============================================================================
// Audit Enums
// ============================================================================

// Audit Status
export const AUDIT_STATUS = [
  { key: 'PLANNED', value: 'planned' },
  { key: 'IN_COORDINATION', value: 'in_coordination' },
  { key: 'IN_PROGRESS', value: 'in_progress' },
  { key: 'EVALUATION', value: 'evaluation' },
  { key: 'REVISION', value: 'revision' },
  { key: 'FINALIZED', value: 'finalized' },
  { key: 'FOLLOW_UP', value: 'follow_up' }
] as const

// ============================================================================
// Evidence Enums
// ============================================================================

// Evidence Status
export const EVIDENCE_STATUS = [
  { key: 'CREATED', value: 'created' },
  { key: 'AUDITED', value: 'audited' },
  { key: 'REJECTED', value: 'rejected' },
  { key: 'EMPTY', value: 'empty' }
] as const

