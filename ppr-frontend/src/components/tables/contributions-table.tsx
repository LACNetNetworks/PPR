'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import type { Contribution } from '@/types/api'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/dropdown'

interface ContributionsTableProps {
  contributions: Contribution[]
  isLoading?: boolean
  emptyMessage?: string
  title?: string
  description?: string
  onEdit?: (contribution: Contribution) => void
  onDelete?: (contribution: Contribution) => void
}

/**
 * Reusable Contributions Table Component
 * Displays a list of contributions in a table format
 */
export function ContributionsTable({ 
  contributions, 
  isLoading = false, 
  emptyMessage = 'No contributions found',
  title,
  description,
  onEdit,
  onDelete
}: ContributionsTableProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }
  
  const renderTable = () => {
    if (isLoading) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Project ID</TableHeader>
              <TableHeader>User ID</TableHeader>
              <TableHeader className="text-right">Amount</TableHeader>
              <TableHeader>Phase Project ID</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500">
                Loading contributions...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (contributions.length === 0) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Project ID</TableHeader>
              <TableHeader>User ID</TableHeader>
              <TableHeader className="text-right">Amount</TableHeader>
              <TableHeader>Phase Project ID</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500">
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
            <TableHeader>Project ID</TableHeader>
            <TableHeader>User ID</TableHeader>
            <TableHeader className="text-right">Amount</TableHeader>
            <TableHeader>Phase Project ID</TableHeader>
            <TableHeader>Date</TableHeader>
            <TableHeader className="text-center">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {contributions.map((contribution) => {
            const contributionId = contribution.id_contribution || contribution.id || 'N/A'
            return (
              <TableRow key={contributionId} title={`Contribution ${contributionId}`}>
                {/** id */}
                <TableCell className="font-mono text-sm">{contributionId}</TableCell>
                {/** project id */}
                <TableCell className="font-mono text-sm">{contribution.id_project || 'N/A'}</TableCell>
                {/** user id */}
                <TableCell className="font-mono text-sm">{contribution.id_user || 'N/A'}</TableCell>
                {/** amount */}
                <TableCell className="text-right font-medium">
                  {contribution.deposit_amount ? formatCurrency(contribution.deposit_amount) : 'N/A'}
                </TableCell>
                {/** phase project id */}
                <TableCell className="font-mono text-sm">{contribution.id_phase_project || 'N/A'}</TableCell>
                {/** date */}
                <TableCell className="text-zinc-500">
                  {contribution.date_contribution ? formatDate(contribution.date_contribution) : 'N/A'}
                </TableCell>
                {/** actions */}
                <TableCell className="text-center">
                  <div className="relative z-10 flex justify-center items-center min-h-[2.5rem]" onClick={(e) => e.stopPropagation()}>
                    <Dropdown>
                      <DropdownButton plain aria-label="More options" className="p-1.5">
                        <EllipsisVerticalIcon className="size-4" />
                      </DropdownButton>
                      <DropdownMenu anchor="bottom end">
                        {onEdit && (
                          <DropdownItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(contribution)
                            }}
                          >
                            <DropdownLabel>Edit</DropdownLabel>
                          </DropdownItem>
                        )}
                        {onDelete && (
                          <DropdownItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(contribution)
                            }}
                          >
                            <DropdownLabel>Delete</DropdownLabel>
                          </DropdownItem>
                        )}
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

  // If title is provided, wrap in container with header
  if (title) {
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
        </div>
        {renderTable()}
      </>
    )
  }

  // Otherwise, return table without header wrapper
  return renderTable()
}







