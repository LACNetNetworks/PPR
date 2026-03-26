import 'server-only'
import { ServerApiClient } from './api'
import { transformApiOrganization, transformApiPhase, transformApiProject, transformApiTask, transformApiUser } from './api-mappers'
import { cookies } from 'next/headers'
import type {
  Project,
  Organization,
  Phase,
  ApiPhase,
  EnumsResponse,
  ApiResponse,
  ApiProject,
  Task,
  ApiTask,
  User,
  Evidence,
} from '@/types/api'

/**
 * Server-side API services
 * Use these functions in server components and server actions
 */

function extractUsersArray(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }

  if (!input || typeof input !== 'object') {
    return []
  }

  const container = input as Record<string, unknown>
  const directCandidates = [container.data, container.members, container.users, container.items, container.results]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    }
  }

  for (const candidate of directCandidates) {
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>
      const nestedCandidates = [nested.data, nested.members, nested.users, nested.items, nested.results]

      for (const nestedCandidate of nestedCandidates) {
        if (Array.isArray(nestedCandidate)) {
          return nestedCandidate.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        }
      }
    }
  }

  return []
}

async function getServerAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('kc_token')?.value
}

async function getServerApiClient(token?: string) {
  const resolvedToken = token ?? (await getServerAuthToken())
  return new ServerApiClient(resolvedToken)
}

/**
 * Fetch all projects (server-side)
 * Authentication is optional for now but ready to be implemented
 * 
 * @param token - Optional authentication token (will be required in the future)
 */
export async function fetchProjects(token?: string): Promise<Project[]> {
  const api = await getServerApiClient(token)
  const response = await api.get<ApiResponse<ApiProject[]>>('/projects')

  // Extract data array and transform projects
  if (response && response.data && Array.isArray(response.data)) {
    return response.data.map(transformApiProject)
  }

  // Fallback: return empty array if response structure is unexpected
  return []
}

/**
 * Fetch a single project by ID (server-side)
 * Backend returns: { project: ApiProject, token_balance: string }
 */
export async function fetchProject(id: string, token?: string): Promise<Project> {
  const api = await getServerApiClient(token)
  const response = await api.get<ApiResponse<{ project: ApiProject; token_balance: string }>>(`/projects/${id}`)

  // Extract data and transform project
  // Backend response.data has structure: { project: {...}, token_balance: string }
  if (response && response.data) {
    const { project: apiProject, token_balance } = response.data
    // Merge token_balance into the project before transforming
    const projectWithBalance = { ...apiProject, token_balance }
    return transformApiProject(projectWithBalance)
  }

  throw new Error('Project not found')
}

/**
 * Fetch all organizations (server-side)
 */
export async function fetchOrganizations(token?: string): Promise<Organization[]> {
  const api = await getServerApiClient(token)
  const response = await api.get<unknown>('/organizations')

  const extractArray = (input: unknown): Record<string, unknown>[] => {
    if (Array.isArray(input)) {
      return input.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    }

    if (!input || typeof input !== 'object') {
      return []
    }

    const container = input as Record<string, unknown>
    const directCandidates = [container.data, container.organizations, container.items, container.results]

    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      }
    }

    if (container.data && typeof container.data === 'object') {
      const nested = container.data as Record<string, unknown>
      const nestedCandidates = [nested.data, nested.organizations, nested.items, nested.results]

      for (const candidate of nestedCandidates) {
        if (Array.isArray(candidate)) {
          return candidate.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        }
      }
    }

    return []
  }

  const rawOrganizations = extractArray(response)

  if (!Array.isArray(rawOrganizations)) {
    return []
  }

  return rawOrganizations
    .map(transformApiOrganization)
    .filter((organization): organization is Organization => organization !== null)
}

/**
 * Fetch a single organization by ID (server-side)
 */
export async function fetchOrganization(id: string, token?: string): Promise<Organization> {
  const api = await getServerApiClient(token)
  return api.get<Organization>(`/organizations/${id}`)
}

/**
 * Fetch all phases with optional limit (server-side)
 */
export async function fetchStages(limit?: number, token?: string): Promise<Phase[]> {
  const api = await getServerApiClient(token)
  const query = limit ? `?limit=${limit}` : ''
  return api.get<Phase[]>(`/phases${query}`)
}

/**
 * Fetch stages for a specific project (server-side)
 */
export async function fetchProjectStages(
  projectId: string,
  token?: string
): Promise<Phase[]> {
  const api = await getServerApiClient(token)
  const response = await api.get<ApiResponse<ApiPhase[]>>(`/projects/${projectId}/phases`)

  // Extract data array and transform phases
  let phases: Phase[] = []
  if (response && response.data && Array.isArray(response.data)) {
    phases = response.data.map(transformApiPhase)
  }

  // Fetch evidences and link them to phases
  try {
    const evidences = await fetchProjectEvidences(projectId, token)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[fetchProjectStages][server] evidences response:', {
        projectId,
        count: evidences.length,
        sample: evidences[0],
      })
    }

    // Create a map of evidences by all known phase ID shapes
    const evidencesByPhase = new Map<string, Evidence[]>()

    const normalizeId = (value: unknown): string | null => {
      if (value === null || value === undefined) return null
      const normalized = String(value).trim()
      return normalized.length > 0 ? normalized : null
    }

    const pushEvidenceForKey = (key: unknown, evidence: Evidence) => {
      const normalizedKey = normalizeId(key)
      if (!normalizedKey) return
      if (!evidencesByPhase.has(normalizedKey)) {
        evidencesByPhase.set(normalizedKey, [])
      }
      evidencesByPhase.get(normalizedKey)!.push(evidence)
    }

    const extractPhaseIdFromEvidence = (evidence: Evidence): string | null => {
      const evidenceRecord = evidence as Evidence & Record<string, unknown>
      const rawCandidates: unknown[] = [
        evidence.file_name,
        evidenceRecord.fileName,
        evidence.name,
        evidence.uri,
        evidence.fileUrl,
        evidenceRecord.file_url,
      ]

      for (const candidate of rawCandidates) {
        const normalizedCandidate = normalizeId(candidate)
        if (!normalizedCandidate) continue

        const baseName = normalizedCandidate.split('/').pop() || normalizedCandidate
        const withoutUuid = baseName.replace(
          /-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          ''
        )
        const tokens = withoutUuid.split('-').map((token) => token.trim()).filter(Boolean)
        const phaseToken = tokens.find((token) => /^(pha|pp|phase)_[a-z0-9_]+$/i.test(token))
        if (phaseToken) {
          return phaseToken
        }
      }

      return null
    }

    evidences.forEach((evidence) => {
      const evidenceRecord = evidence as Evidence & Record<string, unknown>
      ;[
        evidence.id_phase_project,
        evidence.phaseId,
        evidenceRecord.id_phase,
        evidenceRecord.phase_id,
        extractPhaseIdFromEvidence(evidence),
      ].forEach((key) => pushEvidenceForKey(key, evidence))
    })

    const parseEvidenceDate = (evidence: Evidence): number => {
      const evidenceRecord = evidence as Evidence & Record<string, unknown>
      const rawDate =
        evidence.uploadedAt ||
        evidence.created_at ||
        (evidenceRecord.updated_at as string | undefined) ||
        (evidenceRecord.date_uploaded as string | undefined)
      if (!rawDate) return 0
      const parsed = Date.parse(String(rawDate))
      return Number.isNaN(parsed) ? 0 : parsed
    }

    const dedupeEvidences = (items: Evidence[]): Evidence[] => {
      const seen = new Set<string>()
      return items.filter((evidence, index) => {
        const evidenceRecord = evidence as Evidence & Record<string, unknown>
        const fallbackId = `${normalizeId(evidence.hash || evidence.tx_hash || evidence.txHash) || 'no-hash'}:${
          normalizeId(evidence.fileUrl || evidence.uri || evidenceRecord.file_url) || 'no-file'
        }:${normalizeId(evidence.created_at || evidence.uploadedAt || evidenceRecord.updated_at) || String(index)}`

        const identity =
          normalizeId(evidence.id) ||
          normalizeId(evidence.id_evidence) ||
          normalizeId(evidenceRecord.evidence_id) ||
          fallbackId

        if (seen.has(identity)) return false
        seen.add(identity)
        return true
      })
    }

    // Link evidence data to phases
    phases = phases.map((phase) => {
      const phaseRecord = phase as Phase & Record<string, unknown>
      const phaseEvidences = dedupeEvidences(
        [
          phase.idPhaseProject,
          phase.idPhase,
          phase.id,
          phaseRecord.id_phase_project,
          phaseRecord.id_phase,
          phaseRecord.phase_id,
        ].flatMap((key) => {
          const normalizedKey = normalizeId(key)
          return normalizedKey ? evidencesByPhase.get(normalizedKey) || [] : []
        })
      )

      if (phaseEvidences.length > 0) {
        const sortedByDate = [...phaseEvidences].sort((a, b) => parseEvidenceDate(b) - parseEvidenceDate(a))
        const preferredEvidence =
          sortedByDate.find((evidence) => evidence.hash || evidence.tx_hash || evidence.txHash) || sortedByDate[0]
        const preferredRecord = preferredEvidence as Evidence & Record<string, unknown>
        const evidenceHash = preferredEvidence.hash || preferredEvidence.tx_hash || preferredEvidence.txHash

        return {
          ...phase,
          hash: evidenceHash,
          txHash: evidenceHash,
          tx_hash: evidenceHash,
          fileUrl: preferredEvidence.fileUrl || preferredEvidence.uri || preferredRecord.file_url,
          uri: preferredEvidence.uri || preferredEvidence.fileUrl || preferredRecord.file_url,
          // Store all evidences if needed
          evidences: phaseEvidences,
        }
      }
      return phase
    })
  } catch (error) {
    // If fetching evidences fails, continue with phases only
    console.warn('Failed to fetch evidences for phases:', error)
  }

  return phases
}

/**
 * Fetch enums (server-side)
 */
export async function fetchEnums(token?: string): Promise<EnumsResponse> {
  const api = await getServerApiClient(token)
  return api.get<EnumsResponse>('/enums')
}

/**
 * Create a new project (server-side)
 * 
 * @param projectData - Project data to create
 * @param token - Optional authentication token (will be required in the future)
 */
export async function createProject(
  projectData: {
    name_project: string
    description?: string
    id_organization?: string
    type_project?: string
    [key: string]: unknown
  },
  token?: string
): Promise<Project> {
  const api = await getServerApiClient(token)
  const response = await api.post<ApiResponse<ApiProject>>('/projects', projectData)

  // Extract data and transform project
  if (response && response.data) {
    return transformApiProject(response.data)
  }

  throw new Error('Failed to create project')
}

/**
 * Update an existing project (server-side)
 * 
 * @param projectId - ID of the project to update
 * @param projectData - Project data to update
 * @param token - Optional authentication token (will be required in the future)
 */
export async function updateProject(
  projectId: string,
  projectData: {
    name_project: string
    description?: string
    id_organization?: string
    type_project?: string
    [key: string]: unknown
  },
  token?: string
): Promise<Project> {
  const api = await getServerApiClient(token)
  const response = await api.put<ApiResponse<ApiProject>>(`/projects/${projectId}`, projectData)

  // Extract data and transform project
  if (response && response.data) {
    return transformApiProject(response.data)
  }

  throw new Error('Failed to update project')
}

/**
 * Fetch tasks for a specific phase (server-side)
 * @deprecated Use fetchProjectPhaseTasks instead
 */
export async function fetchPhaseTasks(
  phaseId: string,
  token?: string
): Promise<Task[]> {
  const api = await getServerApiClient(token)
  const response = await api.get<ApiResponse<ApiTask[]>>(`/phases/${phaseId}/tasks`)

  // Extract data array and transform tasks
  if (response && response.data && Array.isArray(response.data)) {
    return response.data.map(transformApiTask)
  }

  // Fallback: return empty array if response structure is unexpected
  return []
}

/**
 * Fetch tasks for a specific project phase (server-side)
 * Uses the endpoint: /projects/{projectId}/phases/{phaseProjectId}/tasks
 */
export async function fetchProjectPhaseTasks(
  projectId: string,
  phaseProjectId: string,
  token?: string
): Promise<Task[]> {
  const api = await getServerApiClient(token)
  const response = await api.get<ApiResponse<ApiTask[]>>(`/projects/${projectId}/phases/${phaseProjectId}/tasks`)

  // Extract data array and transform tasks
  if (response && response.data && Array.isArray(response.data)) {
    return response.data.map(transformApiTask)
  }

  // Fallback: return empty array if response structure is unexpected
  return []
}

/**
 * Fetch users (members) for a specific project (server-side)
 * Uses the /projects/{projectId}/members endpoint
 */
export async function fetchProjectUsers(
  projectId: string,
  token?: string
): Promise<User[]> {
  const api = await getServerApiClient(token)
  try {
    const membersResponse = await api.get<unknown>(`/projects/${projectId}/members`)
    const members = extractUsersArray(membersResponse)

    if (members.length > 0) {
      return members.map(transformApiUser)
    }
  } catch (error) {
    console.warn('Failed to fetch project members from /members endpoint:', error)
  }

  try {
    const usersResponse = await api.get<unknown>(`/projects/${projectId}/users`)
    const users = extractUsersArray(usersResponse)

    if (users.length > 0) {
      return users.map(transformApiUser)
    }
  } catch (error) {
    console.warn('Failed to fetch project members from /users endpoint:', error)
  }

  return []
}

/**
 * Fetch evidences for a specific project (server-side)
 */
export async function fetchProjectEvidences(
  projectId: string,
  token?: string
): Promise<Evidence[]> {
  const api = await getServerApiClient(token)
  try {
    const response = await api.get<ApiResponse<Evidence[]>>(`/evidences/project/${projectId}`)

    // Extract data array
    if (response && response.data && Array.isArray(response.data)) {
      return response.data
    }

    // Fallback: return empty array if response structure is unexpected
    return []
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array
    console.warn('Failed to fetch project evidences:', error)
    return []
  }
}

/**
 * Fetch all evidences (server-side)
 */
export async function fetchEvidences(token?: string): Promise<Evidence[]> {
  const api = await getServerApiClient(token)
  try {
    const response = await api.get<ApiResponse<Evidence[]>>('/evidences')

    // Extract data array
    if (response && response.data && Array.isArray(response.data)) {
      return response.data
    }

    // Fallback: return empty array if response structure is unexpected
    return []
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array
    console.warn('Failed to fetch evidences:', error)
    return []
  }
}
