'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { TasksTable } from '@/components/tables/tasks-table'
import { StageDetailsHeader } from '@/components/stage-details-header'
import { useFetchProjectPhaseTasks, useFetchProjectStages } from '@/lib/api-services'
import type { Task, Phase } from '@/types/api'

function TasksPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const phaseId = searchParams.get('phaseId') || ''
  const fetchProjectPhaseTasks = useFetchProjectPhaseTasks()
  const fetchProjectStages = useFetchProjectStages()

  const [tasks, setTasks] = useState<Task[]>([])
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!phaseId) {
        setError('Phase ID is required')
        setIsLoading(false)
        return
      }

      if (!projectId) {
        setError('Project ID is required')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch tasks and stages in parallel
        const [fetchedTasks, stages] = await Promise.all([
          fetchProjectPhaseTasks(projectId, phaseId),
          fetchProjectStages(projectId)
        ])

        setTasks(fetchedTasks)

        // Find the current phase
        const phase = stages.find((s) => s.idPhase === phaseId || s.idPhaseProject === phaseId || s.id === phaseId)
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
  }, [projectId, phaseId])

  if (!phaseId) {
    return (
      <RoleProtectedRoute requiredRole="sponsor">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-lg text-red-600 dark:text-red-400">
              Phase ID is required
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  if (error) {
    return (
      <RoleProtectedRoute requiredRole="sponsor">
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
    <RoleProtectedRoute requiredRole="sponsor">
      {currentPhase && <StageDetailsHeader stage={currentPhase} />}
      <TasksTable
        tasks={tasks}
        isLoading={isLoading}
        emptyMessage="No tasks found for this stage"
        title="Tasks"
        description="Here you can see all the tasks for this stage."
      />
    </RoleProtectedRoute>
  )
}

export default function SponsorProjectTasksPage() {
  return (
    <Suspense fallback={
      <RoleProtectedRoute requiredRole="sponsor">
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
