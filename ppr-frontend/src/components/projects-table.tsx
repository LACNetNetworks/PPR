'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Link } from '@/components/link'
import type { Project } from '@/types/api'
import { usePathname } from 'next/navigation'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/dropdown'
import { useAuth } from '@/hooks/use-auth'

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
  emptyMessage?: string
  title?: string
  description?: string
  buttonText?: string
  buttonHref?: string
  onButtonClick?: () => void
}

/**
 * Reusable Projects Table Component
 * Displays a list of projects in a table format
 */
export function ProjectsTable({
  projects,
  isLoading = false,
  emptyMessage = 'No projects found',
  title,
  description,
  buttonText,
  buttonHref,
  onButtonClick
}: ProjectsTableProps) {
  const pathname = usePathname()
  const { hasRole } = useAuth()

  // Determine role prefix from pathname, with fallback to user's role from auth
  const getRolePrefix = (): string => {
    // First try to get role from pathname
    if (pathname?.startsWith('/user')) return '/user'
    if (pathname?.startsWith('/verifier')) return '/verifier'
    if (pathname?.startsWith('/sponsor')) return '/sponsor'
    if (pathname?.startsWith('/provider')) return '/provider'

    // Fallback: determine role from user's authentication (for root "/" path)
    if (hasRole('user')) return '/user'
    if (hasRole('verifier')) return '/verifier'
    if (hasRole('sponsor')) return '/sponsor'
    if (hasRole('provider')) return '/provider'

    return '' // Fallback to no prefix if no role found
  }

  const rolePrefix = getRolePrefix()

  const renderTable = () => {
    if (isLoading) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Organization</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-500">
                Loading projects...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (projects.length === 0) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Organization</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    return (
      <Table className="mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>Name</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Organization</TableHeader>
            <TableHeader>Created At</TableHeader>
            <TableHeader className="text-center">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...projects]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
              return dateB - dateA
            })
            .map((project, index) => {
              const projectId = String(project.id || (project as any).id_project || (project as any).project_id || '').trim()
              const projectUrl = projectId ? `${rolePrefix}/projects/${projectId}` : undefined
              return (
                <TableRow key={projectId || `project-${index}`} href={projectUrl} title={`Project ${project.name}`}>
                  <TableCell className="font-mono text-sm">{projectId || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${project.status === 'inprogress'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : project.status === 'closed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : project.status === 'canceled'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : project.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                    >
                      {project.status || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-500">{project.organizationId || 'N/A'}</TableCell>
                  <TableCell className="text-zinc-500">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="relative z-10 flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Dropdown>
                        <DropdownButton plain aria-label="More options">
                          <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu anchor="bottom end">
                          <DropdownItem
                            href={projectUrl}
                            disabled={!projectUrl}
                          >
                            <DropdownLabel>View</DropdownLabel>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    )
  }

  // If title or buttonText is provided, wrap in container with header <div className="px-4 sm:px-6 lg:px-8">
  if (title || buttonText) {
    return (
      <>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            {title && (
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {description}
              </p>
            )}
          </div>
          {buttonText && (
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              {buttonHref ? (
                <Link
                  href={buttonHref}
                  className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {buttonText}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {buttonText}
                </button>
              )}
            </div>
          )}
        </div>
        {renderTable()}
      </>
    )
  }

  // Otherwise, return table without header wrapper
  return renderTable()
}
