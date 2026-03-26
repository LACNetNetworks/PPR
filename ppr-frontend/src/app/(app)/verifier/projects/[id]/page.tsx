import { fetchProject, fetchProjectStages } from '@/lib/api-services-server'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { ProjectDetailsHeader } from '@/components/project-details-header'
import { StagesTable } from '@/components/tables/stages-table'
import { Subheading } from '@/components/heading'
import { TrackProjectView } from '@/components/track-project-view'
import type { Project, Phase } from '@/types/api'
import { Divider } from '@/components/divider'

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function VerifierProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params

  let project: Project | null = null
  let stages: Phase[] = []
  let error: string | null = null

  try {
    project = await fetchProject(id)
    stages = await fetchProjectStages(id)
  } catch (err) {
    console.error('Failed to fetch project details:', err)
    error = err instanceof Error ? err.message : 'Failed to load project details'
  }

  if (error || !project) {
    return (
      <RoleProtectedRoute requiredRole="verifier">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-lg text-red-600 dark:text-red-400">
              {error || 'Project not found'}
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute requiredRole="verifier">
      <TrackProjectView project={project} role="verifier" />
      <ProjectDetailsHeader project={project} stages={stages} />
      <Subheading className="mt-8">Stages</Subheading>
      <StagesTable
        stages={stages}
        projectId={id}
        hideActions={true}
        emptyMessage="No stages found for this project"
        description={`List of stages associated with project: ${id}`}
      />
    </RoleProtectedRoute>
  )
}

