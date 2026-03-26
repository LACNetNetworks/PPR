'use client'

import { Stat } from '@/app/stat'
import { Heading, Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { ProjectsTable } from '@/components/projects-table'
import type { Project } from '@/types/api'
import { useKeycloak } from '@react-keycloak/web'
import PieChartComponent from '@/components/charts/chart-component'

interface DashboardContentProps {
  projects: Project[]
  isLoading?: boolean
}

export function DashboardContent({ projects, isLoading = false }: DashboardContentProps) {
  const { keycloak } = useKeycloak()

  // Get user info from Keycloak token (same logic as sidebar)
  const userDisplayName =
    (keycloak?.tokenParsed?.name as string | undefined) ??
    (keycloak?.tokenParsed?.preferred_username as string | undefined) ??
    'User'

  // Ensure projects is always an array
  const projectsArray = Array.isArray(projects) ? projects : []

  // Calculate stats from projects
  const totalProjects = projectsArray.length
  const ongoingProjects = projectsArray.filter((p) => p.status === 'inprogress').length
  const completedProjects = projectsArray.filter((p) => p.status === 'closed').length
  const cancelledProjects = projectsArray.filter((p) => p.status === 'canceled').length


  // Simualte data from apis
  const activeProjects = 10
  const inactiveProjects = 20
  const totalAllocated = 1000
  const totalPaid = 500

  const COLORS = {
    active: '#10b981', // green
    inactive: '#6b7280', // gray
    allocated: '#10b981', // blue
    paid: '#18AAF0', // green
  }

  return (
    <>
      <Heading>Hey, {userDisplayName}</Heading>
      {/** TOP SECTION */}
      <div className="mt-8 flex items-end justify-between">
        <Subheading>Overview</Subheading>
        {/* <div>
          <Select name="period">
            <option value="last_week">Last week</option>
            <option value="last_two">Last two weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
          </Select>
        </div> */}
      </div>

      {/** STATS SECTION */}
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Active Projects" value={ongoingProjects.toString()} change="0%" />
        <Stat title="Total Funds" value={`$${projectsArray.reduce((acc, p) => acc + (Number(p.monto_total_subvencionado) || 0), 0).toLocaleString()}`} change="$0" />
        <Stat title="Total Deployed" value={`$${projectsArray.reduce((acc, p) => acc + (Number(p.total_contributed_amount) || 0), 0).toLocaleString()}`} change="$0" />
        <Stat title="Total Allocated" value={`$${projectsArray.reduce((acc, p) => acc + (Number(p.monto_total_subvencionado) || 0), 0).toLocaleString()}`} change="$0" />
      </div>

      {/** PIE CHARTS SECTION */}
      <div className="mt-10 grid grid-cols-2 gap-8">
        <div>
          <PieChartComponent
            title="Active/Inactive Projects"
            labels={['Active', 'Inactive']}
            values={[ongoingProjects, totalProjects - ongoingProjects]}
            colors={[COLORS.active, COLORS.inactive]}
            isCurrency={false}
          />
        </div>
        <div>
          <PieChartComponent
            title="Allocated/Paid"
            labels={['Allocated', 'Paid']}
            values={[
              projectsArray.reduce((acc, p) => acc + (Number(p.monto_total_subvencionado) || 0), 0),
              projectsArray.reduce((acc, p) => acc + (Number(p.total_contributed_amount) || 0), 0)
            ]}
            colors={[COLORS.allocated, COLORS.paid]}
            isCurrency={true}
          />
        </div>
      </div>

      {/** PATREONS CONTRIBUTIONS TABLE SECTION */}
      {/* <Subheading className="mt-14">Patreons Contributions</Subheading> */}
      <ProjectsTable projects={projectsArray} isLoading={isLoading} emptyMessage="No projects found" />
    </>
  )
}
