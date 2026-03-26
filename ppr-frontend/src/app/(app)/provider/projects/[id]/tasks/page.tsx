'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { TasksTableWithNewTaskButton } from '@/components/tables/tasks-table-with-new-task-button'
import { StageDetailsHeader } from '@/components/stage-details-header'
import { useFetchProjectPhaseTasks, useFetchProjectStages } from '@/lib/api-services'
import type { Task, Phase } from '@/types/api'
import { Select } from '@/components/select'
import { Heading } from '@/components/heading'

function TasksPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.id as string
  const phaseId = searchParams.get('phaseId') || ''
  const fetchProjectPhaseTasks = useFetchProjectPhaseTasks()
  const fetchProjectStages = useFetchProjectStages()

  const [tasks, setTasks] = useState<Task[]>([])
  const [stages, setStages] = useState<Phase[]>([])
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStages, setIsLoadingStages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasksReloadTrigger, setTasksReloadTrigger] = useState(0)

  // Load stages on mount
  useEffect(() => {
    const loadStages = async () => {
      if (!projectId) return

      setIsLoadingStages(true)
      try {
        const fetchedStages = await fetchProjectStages(projectId)
        setStages(fetchedStages)
      } catch (err) {
        console.error('Failed to fetch stages:', err)
      } finally {
        setIsLoadingStages(false)
      }
    }

    loadStages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Load tasks when phaseId changes
  useEffect(() => {
    const loadData = async () => {
      if (!phaseId || !projectId) {
        setTasks([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const fetchedTasks = await fetchProjectPhaseTasks(projectId, phaseId)
        setTasks(fetchedTasks)

        // Find the current phase
        const phase = stages.find(
          (s) => s.idPhase === phaseId || s.idPhaseProject === phaseId || s.id === phaseId
        )
        setCurrentPhase(phase || null)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, phaseId, stages, tasksReloadTrigger])

  const handleStageChange = (stageId: string) => {
    if (stageId) {
      router.push(`/provider/projects/${projectId}/tasks?phaseId=${stageId}`)
    }
  }

  if (error) {
    return (
      <RoleProtectedRoute requiredRole="provider">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute requiredRole="provider">
      <div className="space-y-6">
        <div className="border-b border-zinc-200 pb-5 dark:border-white/10">
          <Heading level={1}>Project Tasks</Heading>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Select a stage to view and manage its tasks.
          </p>
        </div>

        {/* Stage Selector */}
        <div className="max-w-md">
          <label htmlFor="stage-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Stage
          </label>
          <Select
            id="stage-select"
            value={phaseId}
            onChange={(e) => handleStageChange(e.target.value)}
            disabled={isLoadingStages}
            className="w-full"
          >
            <option value="">-- Select a stage --</option>
            {stages.map((stage) => (
              <option key={stage.idPhase || stage.idPhaseProject || stage.id} value={stage.idPhase || stage.idPhaseProject || stage.id}>
                {stage.name || `Stage ${stage.order || stage.id}`}
              </option>
            ))}
          </Select>
        </div>

        {/* Show stage header and tasks when a stage is selected */}
        {phaseId && (
          <>
            {currentPhase && <StageDetailsHeader stage={currentPhase} />}
            <TasksTableWithNewTaskButton
              tasks={tasks}
              projectId={projectId}
              phaseProjectId={phaseId}
              isLoading={isLoading}
              emptyMessage="No tasks found for this stage"
              title="Tasks"
              description="Manage the tasks for this stage. Change the status using the dropdown."
              showCreateModal={true}
              onTasksChanged={() => setTasksReloadTrigger((prev) => prev + 1)}
            />
          </>
        )}

        {/* Show message when no stage is selected */}
        {!phaseId && !isLoadingStages && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-zinc-500 dark:text-zinc-400">
              Please select a stage above to view and manage its tasks.
            </p>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  )
}

export default function ProviderProjectTasksPage() {
  return (
    <Suspense fallback={
      <RoleProtectedRoute requiredRole="provider">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-lg text-zinc-500 dark:text-zinc-400">
              Loading...
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    }>
      <TasksPageContent />
    </Suspense>
  )
}
