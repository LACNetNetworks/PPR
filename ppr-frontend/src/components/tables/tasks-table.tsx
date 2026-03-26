'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import type { Task } from '@/types/api'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/dropdown'

interface TasksTableProps {
  tasks: Task[]
  isLoading?: boolean
  emptyMessage?: string
  title?: string
  description?: string
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}

/**
 * Reusable Tasks Table Component
 * Displays a list of tasks in a table format
 */
export function TasksTable({ 
  tasks, 
  isLoading = false, 
  emptyMessage = 'No tasks found',
  title,
  description,
  onEdit,
  onDelete
}: TasksTableProps) {
  
  const renderTable = () => {
    if (isLoading) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-500">
                Loading tasks...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (tasks.length === 0) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Due Date</TableHeader>
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
            <TableHeader className="text-center">Status</TableHeader>            
            <TableHeader>Created At</TableHeader>
            <TableHeader>Due Date</TableHeader>
            <TableHeader className="text-center">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => {
            return (
              <TableRow key={task.id} title={`Task ${(task as any).task_nameTask || task.name || 'N/A'}`}>
                {/** id */}
                <TableCell className="font-mono text-sm">{task.id}</TableCell>
                {/** name */}
                <TableCell className="font-medium">{(task as any).task_nameTask || task.name || 'N/A'}</TableCell>
                {/** status */}
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : task.status === 'inprogress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : task.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {task.status || 'N/A'}
                  </span>
                </TableCell>   
                {/** created at */}             
                <TableCell className="text-zinc-500">
                  {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
                </TableCell>
                {/** due date */}
                <TableCell className="text-zinc-500">
                  {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'}
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
                              onEdit(task)
                            }}
                          >
                            <DropdownLabel>Edit</DropdownLabel>
                          </DropdownItem>
                        )}
                        {onDelete && (
                          <DropdownItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(task)
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


