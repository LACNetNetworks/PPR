'use server'

import { createProject, updateProject } from '@/lib/api-services-server'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/types/api'

export interface CreateProjectFormData {
  name: string
  description?: string
  organizationId?: string
  typeProject?: string
  dateStart?: string
  dateEnd?: string
  countryRegion?: string
  status?: string
  totalContributedAmount?: number
  walletProvider?: string
}

export interface CreateProjectResult {
  success: boolean
  project?: Project
  error?: string
}

/**
 * Server action to create a new project
 */
export async function createProjectAction(
  formData: CreateProjectFormData
): Promise<CreateProjectResult> {
  try {
    // Transform form data to API format
    const projectData: {
      name_project: string
      description?: string
      id_organization?: string
      type_project?: string
      date_start?: string
      date_end?: string
      country_region?: string
      status?: string
      total_contributed_amount?: number
      wallet_provider?: string
    } = {
      name_project: formData.name,
      description: formData.description,
      id_organization: formData.organizationId,
      type_project: formData.typeProject,
      date_start: formData.dateStart,
      date_end: formData.dateEnd,
      country_region: formData.countryRegion,
      status: formData.status,
      total_contributed_amount: formData.totalContributedAmount,
      wallet_provider: formData.walletProvider,
    }

    const project = await createProject(projectData)

    // Revalidate the projects page to show the new project
    revalidatePath('/sponsor/my-projects')

    return {
      success: true,
      project,
    }
  } catch (error) {
    console.error('Failed to create project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    }
  }
}

/**
 * Server action to update an existing project
 */
export async function updateProjectAction(
  projectId: string,
  formData: CreateProjectFormData
): Promise<CreateProjectResult> {
  try {
    // Transform form data to API format
    const projectData: {
      name_project: string
      description?: string
      id_organization?: string
      type_project?: string
      date_start?: string
      date_end?: string
      country_region?: string
      status?: string
      total_contributed_amount?: number
      wallet_provider?: string
    } = {
      name_project: formData.name,
      description: formData.description,
      id_organization: formData.organizationId,
      type_project: formData.typeProject,
      date_start: formData.dateStart,
      date_end: formData.dateEnd,
      country_region: formData.countryRegion,
      status: formData.status,
      total_contributed_amount: formData.totalContributedAmount,
      wallet_provider: formData.walletProvider,
    }

    const project = await updateProject(projectId, projectData)

    // Revalidate the projects page to show the updated project
    revalidatePath('/sponsor/my-projects')

    return {
      success: true,
      project,
    }
  } catch (error) {
    console.error('Failed to update project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }
  }
}

