'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApiClient } from '@/lib/api-services'
import { transformApiTask } from '@/lib/api-mappers'
import { PROJECT_STATUS } from '@/types/enums'
import type { ApiProject, ApiResponse, ApiTask, Project, Phase } from '@/types/api'
import { Heading } from '@/components/heading'
import { useToast } from '@/components/toast'
import ProgressBar from './progress-bar'
import {
  TagIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/16/solid'

interface ProjectDetailsHeaderProps {
  project: Project
  stages?: Phase[]
  hideTotalContributed?: boolean
  enableStatusEdit?: boolean
}

const PROJECT_COMPLETED_STATUSES = new Set(['closed', 'completed'])
const STAGE_CLOSED_STATUSES = new Set(['closed', 'completed'])
const TASK_CLOSED_STATUSES = new Set(['closed', 'completed'])

function normalizeStatus(status: string | undefined): string {
  return (status || 'pending').toLowerCase()
}

function formatStatusLabel(status: string | undefined): string {
  const normalized = normalizeStatus(status)
  if (normalized === 'inprogress') return 'In Progress'
  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusBadgeClass(status: string | undefined): string {
  const normalized = normalizeStatus(status)
  if (normalized === 'inprogress') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  if (normalized === 'closed' || normalized === 'completed') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  if (normalized === 'canceled') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
  if (normalized === 'pending') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
  return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
}

/**
 * Format date helper
 */
function formatDate(dateString: string): string {
  if (dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Format currency helper
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Project Details Header Component
 * Displays project information and progress bar based on phase completion status
 */
export function ProjectDetailsHeader({
  project,
  stages = [],
  hideTotalContributed = false,
  enableStatusEdit = false,
}: ProjectDetailsHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [projectStatus, setProjectStatus] = useState(normalizeStatus(project.status))
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const api = useApiClient()
  const router = useRouter()
  const { success: showSuccess, warning: showWarning, error: showError } = useToast()

  // Calculate phase counts
  const totalStages = stages.length
  const completedStages = stages.filter((phase) => phase.status === 'completed').length

  // Calculate progress based on completed stages / total stages
  const progress =
    totalStages === 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((completedStages / totalStages) * 100)))

  const showProgress = stages.length > 0

  // Extract project data fields
  const typeProject = (project.type_project as string) || 'N/A'
  const dateStart = (project.date_start as string) || 'N/A'
  const dateEnd = (project.date_end as string) || 'N/A'
  const idOrganization = (project.id_organization as string) || 'N/A'
  const countryRegion = (project.country_region as string) || 'N/A'
  // Prefer token_balance (real-time from blockchain) over total_contributed_amount (static from DB)
  const tokenBalanceStr = project.token_balance as string | undefined
  const totalContributedAmount = tokenBalanceStr
    ? parseFloat(tokenBalanceStr)
    : (project.total_contributed_amount as number) || 0
  const projectId = String(project.id || '').trim()

  const updatePayloadBase = {
    name_project: String(((project as { name_project?: string }).name_project || project.name || '')).trim(),
    description: (project.description as string) || undefined,
    id_organization:
      (project.organizationId as string) ||
      ((project as { id_organization?: string }).id_organization as string) ||
      undefined,
    type_project:
      ((project as { typeProject?: string }).typeProject as string) ||
      ((project as { type_project?: string }).type_project as string) ||
      undefined,
    date_start:
      ((project as { dateStart?: string }).dateStart as string) ||
      ((project as { date_start?: string }).date_start as string) ||
      undefined,
    date_end:
      ((project as { dateEnd?: string }).dateEnd as string) ||
      ((project as { date_end?: string }).date_end as string) ||
      undefined,
    country_region:
      ((project as { countryRegion?: string }).countryRegion as string) ||
      ((project as { country_region?: string }).country_region as string) ||
      undefined,
    total_contributed_amount:
      ((project as { totalContributedAmount?: number }).totalContributedAmount as number) ||
      ((project as { total_contributed_amount?: number }).total_contributed_amount as number) ||
      ((project as { monto_total_subvencionado?: number }).monto_total_subvencionado as number) ||
      undefined,
    wallet_provider:
      (project.walletProvider as string) ||
      ((project as { wallet_provider?: string }).wallet_provider as string) ||
      undefined,
  }

  const getProjectPhaseIds = (): string[] => {
    const ids = stages
      .map((stage) => String(stage.idPhaseProject || stage.id || (stage as { id_phase_project?: string }).id_phase_project || '').trim())
      .filter(Boolean)
    return Array.from(new Set(ids))
  }

  const validateProjectCanBeCompleted = async (): Promise<string | null> => {
    const hasOpenStages = stages.some((stage) => !STAGE_CLOSED_STATUSES.has(normalizeStatus(stage.status)))

    if (hasOpenStages) {
      return 'All stages must be closed or completed before setting the project to completed.'
    }

    const phaseIds = getProjectPhaseIds()
    if (phaseIds.length === 0) {
      return null
    }

    const taskLists = await Promise.all(
      phaseIds.map(async (phaseId) => {
        const response = await api.get<ApiResponse<ApiTask[]>>(`/projects/${projectId}/phases/${phaseId}/tasks`)
        if (!response || !Array.isArray(response.data)) {
          return []
        }
        return response.data.map(transformApiTask)
      })
    )

    const allTasks = taskLists.flat()
    const hasOpenTasks = allTasks.some((task) => !TASK_CLOSED_STATUSES.has(normalizeStatus(task.status)))

    if (hasOpenTasks) {
      return 'All tasks must be closed or completed before setting the project to completed.'
    }

    return null
  }

  const handleStatusChange = async (nextStatusRaw: string) => {
    const nextStatus = normalizeStatus(nextStatusRaw)

    if (nextStatus === projectStatus || isUpdatingStatus) {
      return
    }

    if (!projectId) {
      const message = 'Project ID is missing, status cannot be updated.'
      showError(message, 'Update failed')
      return
    }

    setIsUpdatingStatus(true)

    try {
      if (PROJECT_COMPLETED_STATUSES.has(nextStatus)) {
        const validationError = await validateProjectCanBeCompleted()
        if (validationError) {
          showWarning(validationError, 'Status not updated')
          return
        }
      }

      const response = await api.put<ApiResponse<ApiProject>>(`/projects/${projectId}`, {
        ...updatePayloadBase,
        status: nextStatus,
      })

      const updatedStatus = normalizeStatus(response?.data?.status || nextStatus)
      setProjectStatus(updatedStatus)
      showSuccess(`Project status changed to ${formatStatusLabel(updatedStatus)}.`, 'Status updated')
      router.refresh()
    } catch (error) {
      console.error('Failed to update project status:', error)
      const message = error instanceof Error ? error.message : 'Failed to update project status.'
      showError(message, 'Update failed')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-8">
        {/* Project Info */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={1}>{project.name}</Heading>
            {project.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{project.description}</p>
            )}
          </div>
          <div className="min-w-[220px] sm:text-right">
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              {enableStatusEdit ? (
                <div className="relative inline-block">
                  <select
                    className={`min-w-36 appearance-none rounded-lg px-4 py-1.5 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-70 ${getStatusBadgeClass(projectStatus)}`}
                    value={projectStatus}
                    onChange={(event) => void handleStatusChange(event.target.value)}
                    disabled={isUpdatingStatus}
                    aria-label="Project status"
                  >
                    {PROJECT_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {formatStatusLabel(status.value)}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                </div>
              ) : (
                <span className={`inline-flex items-center rounded-lg px-4 py-1.5 text-sm font-semibold ${getStatusBadgeClass(projectStatus)}`}>
                  {formatStatusLabel(projectStatus)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-4">
            <ProgressBar
              progress={progress}
              label={`${completedStages} of ${totalStages} stages completed`}
            />
          </div>
        )}

        {/* Stats */}
        {showProgress && (
          <div className="grid grid-cols-1 divide-y divide-zinc-200 border-t border-zinc-200 bg-zinc-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="px-6 py-5 text-center text-sm font-medium">
              <span className="text-zinc-900 dark:text-white">{totalStages}</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">Total Stages</span>
            </div>
            <div className="px-6 py-5 text-center text-sm font-medium">
              <span className="text-zinc-900 dark:text-white">{completedStages}</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
            </div>
            <div className="px-6 py-5 text-center text-sm font-medium">
              <span className="text-zinc-900 dark:text-white">{progress}%</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
            </div>
          </div>
        )}
      </div>

      {/* Project Details Section */}
      <div className="mb-8">
        <div className="px-4 sm:px-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-between text-left"
            type="button"
          >
            <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-white">Project Details</h3>
            {isCollapsed ? (
              <ChevronDownIcon className="size-5 text-zinc-400 dark:text-zinc-500" />
            ) : (
              <ChevronUpIcon className="size-5 text-zinc-400 dark:text-zinc-500" />
            )}
          </button>
        </div>
        {!isCollapsed && (
          <div className="mt-6">
            <dl className="grid grid-cols-1 sm:grid-cols-3">
              {/* Project Type */}
              <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <TagIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>Project Type</span>
                  </div>
                </dt>
                <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">
                  {typeProject.charAt(0).toUpperCase() + typeProject.slice(1).toLowerCase()}
                </dd>
              </div>

              {/* Organization ID */}
              <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>Organization ID</span>
                  </div>
                </dt>
                <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">{idOrganization}</dd>
              </div>

              {/* Start Date */}
              <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>Start Date</span>
                  </div>
                </dt>
                <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">{formatDate(dateStart)}</dd>
              </div>

              {/* End Date */}
              <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>End Date</span>
                  </div>
                </dt>
                <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">{formatDate(dateEnd)}</dd>
              </div>

              {/* Country/Region */}
              <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>Country/Region</span>
                  </div>
                </dt>
                <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">{countryRegion}</dd>
              </div>

              {/* Total Expected Amount - Hidden for User */}
              {!hideTotalContributed && (
                <div className="border-t border-zinc-100 px-4 py-6 sm:px-0 dark:border-white/10">
                  <dt className="text-sm/6 font-medium text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <BanknotesIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      <span>Token Balance</span>
                    </div>
                  </dt>
                  <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-400">
                    {formatCurrency(totalContributedAmount)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
