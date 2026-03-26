'use client'

import { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Link } from '@/components/link'
import type { Task } from '@/types/api'
import { useRouter } from 'next/navigation'
import { EllipsisVerticalIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Button } from '@/components/button'
import { Select } from '@/components/select'
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/dropdown'
import { useApiClient, useFetchAvailableTasks } from '@/lib/api-services'
import { PHASE_PROJECT_TASK_STATUS } from '@/types/enums'
import { useToast } from '@/components/toast'

interface TasksTableWithNewTaskButtonProps {
  tasks: Task[]
  projectId: string
  phaseProjectId: string
  isLoading?: boolean
  emptyMessage?: string
  title?: string
  description?: string
  buttonText?: string
  buttonHref?: string
  onButtonClick?: () => void
  showCreateModal?: boolean
  onTasksChanged?: () => void
}

/**
 * Reusable Tasks Table Component with New Task Button
 * Displays a list of tasks in a table format with ability to create new tasks
 */
export function TasksTableWithNewTaskButton({
  tasks,
  projectId,
  phaseProjectId,
  isLoading = false,
  emptyMessage = 'No tasks found',
  title,
  description,
  buttonText = 'New Task',
  buttonHref,
  onButtonClick,
  showCreateModal = false,
  onTasksChanged
}: TasksTableWithNewTaskButtonProps) {
  const router = useRouter()
  const api = useApiClient()
  const fetchAvailableTasks = useFetchAvailableTasks()
  const fetchAvailableTasksRef = useRef(fetchAvailableTasks)
  const { error: showError } = useToast()

  // Keep ref updated with latest function
  useEffect(() => {
    fetchAvailableTasksRef.current = fetchAvailableTasks
  }, [fetchAvailableTasks])

  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  // Available tasks modal state
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasksPage, setTasksPage] = useState(0)
  const [tasksTotal, setTasksTotal] = useState(0)
  const [tasksSearchQuery, setTasksSearchQuery] = useState('')
  const tasksLimit = 9
  const [addingTaskIds, setAddingTaskIds] = useState<Set<string>>(new Set())
  const [addedTaskIds, setAddedTaskIds] = useState<Set<string>>(new Set())

  // Filter available tasks to hide those already in the stage or added in this session
  const filteredAvailableTasks = useMemo(() => {
    // Get IDs of tasks already in the stage
    const existingTaskIds = new Set(tasks.map((t) => t.id))

    // Filter out tasks that are already in the stage OR were added during this modal session
    return availableTasks.filter((task) => !existingTaskIds.has(task.id) && !addedTaskIds.has(task.id))
  }, [availableTasks, tasks, addedTaskIds])

  // Form state to preserve values on error
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    assignedTo: '',
    dueDate: '',
  })

  const notifyTasksChanged = () => {
    if (onTasksChanged) {
      onTasksChanged()
      return
    }

    router.refresh()
  }

  const handleOpenModal = () => {
    if (showCreateModal) {
      // Open add task modal (select from available tasks)
      setIsAddTaskModalOpen(true)
      setAddingTaskIds(new Set())
      setAddedTaskIds(new Set())
      setTasksPage(0)
      setTasksSearchQuery('')
      // Tasks will be loaded automatically by useEffect when modal opens
    } else {
      // Open edit modal (legacy behavior)
      setEditingTask(null)
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        assignedTo: '',
        dueDate: '',
      })
      setIsModalOpen(true)
      setFormError(null)
      setFormSuccess(false)
    }
  }

  useEffect(() => {
    if (!isAddTaskModalOpen) {
      return
    }

    let isCancelled = false

    const loadAvailableTasks = async () => {
      setIsLoadingTasks(true)
      setTasksError(null)
      try {
        const offset = tasksPage * tasksLimit
        const result = await fetchAvailableTasksRef.current(tasksLimit, offset, tasksSearchQuery)

        if (!isCancelled) {
          setAvailableTasks(result.data)
          setTasksTotal(result.total || 0)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch available tasks:', err)
          setTasksError(err instanceof Error ? err.message : 'Failed to load tasks')
          setAvailableTasks([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTasks(false)
        }
      }
    }

    loadAvailableTasks()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddTaskModalOpen, tasksPage, tasksSearchQuery, tasksLimit])

  const handleTaskSearch = (query: string) => {
    setTasksSearchQuery(query)
    setTasksPage(0) // Reset to first page when searching
  }

  const handleAddTask = async (taskId: string) => {
    // Don't add if already adding or already added
    if (addingTaskIds.has(taskId) || addedTaskIds.has(taskId)) {
      return
    }

    setTasksError(null)
    setAddingTaskIds((prev) => new Set(prev).add(taskId))

    try {
      await api.post(`/projects/${projectId}/phases/${phaseProjectId}/tasks`, {
        id_task: taskId,
        status_task: 'pending'
      })

      // Mark as added
      setAddedTaskIds((prev) => new Set(prev).add(taskId))

      // Refresh the tasks list to show updated state
      notifyTasksChanged()
    } catch (error) {
      console.error('Failed to add task:', error)
      setTasksError(error instanceof Error ? error.message : 'Failed to add task')
    } finally {
      setAddingTaskIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleCloseAddTaskModal = () => {
    setIsAddTaskModalOpen(false)
    setAddingTaskIds(new Set())
    setAddedTaskIds(new Set())
    setTasksError(null)
    setTasksSearchQuery('')
    setTasksPage(0)
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
    try {
      await api.put(`/projects/${projectId}/phases/${phaseProjectId}/tasks/${taskId}`, {
        status_task: newStatus
      })
      // Refresh the page to show updated status
      notifyTasksChanged()
    } catch (error) {
      console.error('Failed to update task status:', error)
      showError(error instanceof Error ? error.message : 'Failed to update task status')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name || '',
      description: task.description || '',
      status: task.status || 'pending',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    })
    setIsModalOpen(true)
    setFormError(null)
    setFormSuccess(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
    setFormError(null)
    setFormSuccess(false)
    // Reset form data when closing
    setFormData({
      name: '',
      description: '',
      status: '',
      assignedTo: '',
      dueDate: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)

    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      setFormError('Task name is required')
      return
    }

    const taskData = {
      name_task: formData.name.trim(),
      description: formData.description || undefined,
      status: formData.status || 'pending',
      assigned_to: formData.assignedTo || undefined,
      due_date: formData.dueDate || undefined,
    }

    startTransition(async () => {
      try {
        if (editingTask) {
          // Update task
          await api.put(`/projects/${projectId}/phases/${phaseProjectId}/tasks/${editingTask.id}`, taskData)
        } else {
          // Create task
          await api.post(`/projects/${projectId}/phases/${phaseProjectId}/tasks`, taskData)
        }

        setFormSuccess(true)
        // Close modal after a short delay and refresh the page
        setTimeout(() => {
          handleCloseModal()
          notifyTasksChanged()
        }, 1500)
      } catch (error) {
        console.error(`Failed to ${editingTask ? 'update' : 'create'} task:`, error)
        setFormError(error instanceof Error ? error.message : `Failed to ${editingTask ? 'update' : 'create'} task`)
      }
    })
  }

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks
    }

    const query = searchQuery.toLowerCase().trim()
    return tasks.filter((task) => {
      const name = ((task as any).task_nameTask || task.name || '').toLowerCase()
      const status = task.status?.toLowerCase() || ''
      const assignedTo = task.assignedTo?.toLowerCase() || ''
      const id = task.id?.toLowerCase() || ''

      return (
        name.includes(query) ||
        status.includes(query) ||
        assignedTo.includes(query) ||
        id.includes(query)
      )
    })
  }, [tasks, searchQuery])

  const renderTable = () => {
    if (isLoading) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader>Assigned To</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500">
                Loading tasks...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (filteredTasks.length === 0) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader>Assigned To</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader className="text-center">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500">
                {searchQuery ? `No tasks found matching "${searchQuery}"` : emptyMessage}
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
          {filteredTasks.map((task) => {
            return (
              <TableRow key={task.id} title={`Task ${(task as any).task_nameTask || task.name || 'N/A'}`}>
                {/** id */}
                <TableCell className="font-mono text-sm">{task.id}</TableCell>
                {/** name */}
                <TableCell className="font-medium">{(task as any).task_nameTask || task.name || 'N/A'}</TableCell>
                {/** status - editable dropdown */}
                <TableCell className="text-center">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status || 'pending'}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={updatingTaskId === task.id}
                      className={`w-32 text-xs ${updatingTaskId === task.id ? 'opacity-50 cursor-wait' : ''
                        }`}
                    >
                      {PHASE_PROJECT_TASK_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.key.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                </TableCell>
                {/** created at */}
                <TableCell className="text-zinc-500">
                  {/* {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'} */}
                  {new Date().toLocaleString()}
                </TableCell>
                {/** due date */}
                <TableCell className="text-zinc-500">
                  {/* {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'} */}
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}
                </TableCell>
                {/** actions */}
                <TableCell className="text-center">
                  <div className="relative z-10 flex justify-center items-center min-h-[2.5rem]" onClick={(e) => e.stopPropagation()}>
                    <Dropdown>
                      <DropdownButton plain aria-label="More options" className="p-1.5">
                        <EllipsisVerticalIcon className="size-4" />
                      </DropdownButton>
                      <DropdownMenu anchor="bottom end">
                        <DropdownItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditModal(task)
                          }}
                        >
                          <DropdownLabel>Edit</DropdownLabel>
                        </DropdownItem>
                        <DropdownItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingTaskId(task.id)
                            setDeleteConfirmOpen(true)
                          }}
                          disabled={deletingTaskId === task.id}
                        >
                          <DropdownLabel>Delete</DropdownLabel>
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

  // Button is always visible in this component version
  return (
    <>
      <div className="border-b border-zinc-200 pb-5 dark:border-white/10">
        <div className="sm:flex sm:items-center sm:justify-between">
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
          <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex sm:items-center sm:gap-4">
            <div className="flex-1 sm:flex-none sm:w-64">
              <div className="relative">
                <input
                  id="query"
                  name="query"
                  type="text"
                  placeholder="Search tasks"
                  aria-label="Search tasks"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-zinc-950 outline-1 -outline-offset-1 outline-zinc-950/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-zinc-400 dark:focus:outline-blue-500"
                />
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-500 sm:size-4 dark:text-zinc-400"
                />
              </div>
            </div>
            <div className="flex-none">
              {showCreateModal ? (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {buttonText}
                </button>
              ) : buttonHref ? (
                <Link
                  href={buttonHref}
                  className="inline-block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {buttonText}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/** Render Table with Search Bar and Button */}
      {renderTable()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => {
        if (!isDeleting) {
          setDeleteConfirmOpen(false)
          setDeletingTaskId(null)
        }
      }}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogBody>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            outline
            onClick={() => {
              setDeleteConfirmOpen(false)
              setDeletingTaskId(null)
              setIsDeleting(false)
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="red"
            onClick={async () => {
              if (!deletingTaskId) return

              setIsDeleting(true)
              try {
                await api.delete(`/projects/${projectId}/phases/${phaseProjectId}/tasks/${deletingTaskId}`)
                setDeleteConfirmOpen(false)
                setDeletingTaskId(null)
                setIsDeleting(false)
                notifyTasksChanged()
              } catch (error) {
                console.error('Failed to delete task:', error)
                showError(error instanceof Error ? error.message : 'Failed to delete task')
                setIsDeleting(false)
              }
            }}
            disabled={isDeleting || deletingTaskId === null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Tasks Modal - Select from available tasks */}
      <Dialog open={isAddTaskModalOpen} onClose={handleCloseAddTaskModal} size="4xl">
        <DialogTitle>Add Tasks to Stage</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            {tasksError && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {tasksError}
                </p>
              </div>
            )}

            {/* Search input */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={tasksSearchQuery}
                  onChange={(e) => handleTaskSearch(e.target.value)}
                  className="block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-zinc-950 outline-1 -outline-offset-1 outline-zinc-950/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-zinc-400 dark:focus:outline-blue-500"
                />
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-500 sm:size-4 dark:text-zinc-400"
                />
              </div>
            </div>

            {/* Tasks grid */}
            {isLoadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading tasks...</p>
              </div>
            ) : filteredAvailableTasks.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tasksSearchQuery ? `No new tasks found matching "${tasksSearchQuery}"` : 'No more tasks available to add'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                  {filteredAvailableTasks.map((task) => {
                    const isAdding = addingTaskIds.has(task.id)
                    const isAdded = addedTaskIds.has(task.id)
                    const isDisabled = isAdding || isAdded

                    return (
                      <div
                        key={task.id}
                        className={`relative rounded-lg border p-4 transition-colors ${isAdded
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20 cursor-default'
                          : isAdding
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 cursor-wait'
                            : 'border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer'
                          }`}
                        onClick={() => !isDisabled && handleAddTask(task.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {task.name || 'Unnamed Task'}
                              </h3>
                              {isAdding && (
                                <span className="inline-flex items-center">
                                  <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                              )}
                              {isAdded && (
                                <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.id && (
                              <p className="mt-1 text-xs font-mono text-gray-400 dark:text-gray-500">
                                ID: {task.id}
                              </p>
                            )}
                            {isAdded && (
                              <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                                Added to stage
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination controls */}
                <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-white/10">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {tasksTotal > 0 ? (
                      <>Showing {filteredAvailableTasks.length} available task{filteredAvailableTasks.length !== 1 ? 's' : ''} on this page (Total: {tasksTotal})</>
                    ) : (
                      <>Showing {filteredAvailableTasks.length} task{filteredAvailableTasks.length !== 1 ? 's' : ''}</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      outline
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTasksPage((p) => Math.max(0, p - 1))
                      }}
                      disabled={tasksPage === 0 || isLoadingTasks}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="size-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      outline
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTasksPage((p) => p + 1)
                      }}
                      disabled={
                        isLoadingTasks ||
                        (tasksTotal > 0
                          ? (tasksPage + 1) * tasksLimit >= tasksTotal
                          : availableTasks.length < tasksLimit)
                      }
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            outline
            onClick={handleCloseAddTaskModal}
            disabled={isLoadingTasks}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} size="4xl">
        <DialogTitle>Edit Task</DialogTitle>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formSuccess && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Task updated successfully!
                </p>
              </div>
            )}

            {formError && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {formError}
                </p>
              </div>
            )}

            {/* Full width fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter task name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isPending || formSuccess}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <div className="mt-2">
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Enter task description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isPending || formSuccess}
                  className="w-full"
                />
              </div>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="mt-2">
                  <Select
                    id="status"
                    name="status"
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isPending || formSuccess}
                    className="w-full"
                  >
                    {PHASE_PROJECT_TASK_STATUS.map((status) => (
                      <option key={status.key} value={status.value}>
                        {status.key.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <div className="mt-2">
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    disabled={isPending || formSuccess}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assigned To
              </label>
              <div className="mt-2">
                <Input
                  id="assignedTo"
                  name="assignedTo"
                  type="text"
                  placeholder="Enter assignee name or email"
                  value={formData.assignedTo || ''}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={isPending || formSuccess}
                  className="w-full"
                />
              </div>
            </div>

            <DialogActions>
              <Button
                type="button"
                outline
                onClick={handleCloseModal}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="indigo"
                disabled={isPending || formSuccess}
              >
                {isPending ? 'Updating...' : 'Update Task'}
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>
    </>
  )
}
