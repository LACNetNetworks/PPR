'use client'

import { useRef, useState, useMemo, useTransition, useCallback, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Link } from '@/components/link'
import type { Phase, AvailablePhase } from '@/types/api'
import { usePathname, useRouter } from 'next/navigation'
import { EllipsisVerticalIcon, MagnifyingGlassIcon, BanknotesIcon } from '@heroicons/react/16/solid'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { Select } from '@/components/select'
import { Checkbox } from '@/components/checkbox'
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/dropdown'
import { useApiClient, useUploadEvidence, useFetchAvailablePhases } from '@/lib/api-services'
import { PHASE_PROJECT_STATUS } from '@/types/enums'
import { ContributionModal } from '@/components/contribution-modal'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/toast'
import { formatHashPreview } from '@/lib/hash-utils'

interface StagesTableProps {
  stages: Phase[]
  isLoading?: boolean
  emptyMessage?: string
  projectId?: string
  projectTotalContributed?: number
  typeProject?: string
  onUploadProof?: (stage: Phase) => void
  title?: string
  description?: string
  buttonText?: string
  buttonHref?: string
  onButtonClick?: () => void
  showCreateModal?: boolean
  enablePayment?: boolean
  hideActions?: boolean
}

type StageEvidencePreview = {
  hash: string
  fileUrl?: string
  uri?: string
}

/**
 * Reusable Stages Table Component
 * Displays a list of stages in a table format
 */
export function StagesTableWithNewStageButton({
  stages,
  isLoading = false,
  emptyMessage = 'No stages found',
  projectId,
  projectTotalContributed = 0,
  typeProject,
  onUploadProof,
  title,
  description,
  buttonText = 'New Stage',
  buttonHref,
  onButtonClick,
  showCreateModal = false,
  enablePayment = false,
  hideActions = false
}: StagesTableProps) {
  const pathname = usePathname()
  const router = useRouter()
  const api = useApiClient()
  const uploadEvidence = useUploadEvidence()
  const { hasRole } = useAuth()
  const { success: showSuccess, warning: showWarning, error: showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stageWeight, setStageWeight] = useState(0)
  const [editingStage, setEditingStage] = useState<Phase | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<Phase | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedStageForPayment, setSelectedStageForPayment] = useState<Phase | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<{ hash: string; fileName: string } | null>(null)
  const [uploadedEvidenceByStageKey, setUploadedEvidenceByStageKey] = useState<
    Record<string, StageEvidencePreview>
  >({})

  // Available phases state
  const [availablePhases, setAvailablePhases] = useState<AvailablePhase[]>([])
  const [isLoadingPhases, setIsLoadingPhases] = useState(false)
  const [phasesError, setPhasesError] = useState<string | null>(null)
  const fetchAvailablePhases = useFetchAvailablePhases()

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
  const canNavigateToTasks = rolePrefix === '/provider' || rolePrefix === '/sponsor'

  const getStageEvidenceKey = useCallback((stage: Phase | null): string | null => {
    if (!stage) return null
    return stage.idPhaseProject || stage.idPhase || stage.id || null
  }, [])

  const getStageEvidence = useCallback((stage: Phase) => {
    const stageEvidenceKey = getStageEvidenceKey(stage)
    const uploadedEvidence = stageEvidenceKey ? uploadedEvidenceByStageKey[stageEvidenceKey] : undefined
    const fallbackStage = stage as any

    const hash = uploadedEvidence?.hash || fallbackStage.hash || fallbackStage.txHash || fallbackStage.tx_hash
    const fileUrl =
      uploadedEvidence?.fileUrl || uploadedEvidence?.uri || fallbackStage.fileUrl || fallbackStage.uri
    const uri =
      uploadedEvidence?.uri || uploadedEvidence?.fileUrl || fallbackStage.uri || fallbackStage.fileUrl

    return { hash, fileUrl, uri }
  }, [getStageEvidenceKey, uploadedEvidenceByStageKey])

  const handleUploadClick = (stage: Phase) => {
    if (onUploadProof) {
      onUploadProof(stage)
    } else {
      setSelectedStage(stage)
      setIsUploadModalOpen(true)
      setSelectedFile(null)
      setUploadError(null)
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(fileExtension)) {
      setUploadError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError('File size exceeds 10MB limit.')
      return
    }

    setSelectedFile(file)
    setUploadError(null)
  }, [])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile || !selectedStage) return

    const stageProjectId = projectId || selectedStage.projectId
    if (!stageProjectId) {
      setUploadError('Project ID is required to upload evidence')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const response = await uploadEvidence({
        file: selectedFile,
        projectId: stageProjectId,
        phaseId: selectedStage.idPhase || selectedStage.idPhaseProject || selectedStage.id,
        phaseProjectId: selectedStage.idPhaseProject || undefined,
        name: `Evidence for ${selectedStage.name || 'Stage'}`,
      })

      const responsePayload = (response as any)?.data || response
      if (process.env.NODE_ENV !== 'production') {
        console.log('[evidence-upload][stages-table-with-new-stage-button] response payload:', responsePayload)
      }
      const evidenceHash = responsePayload?.hash || responsePayload?.tx_hash || responsePayload?.txHash || null
      const fileName = responsePayload?.file_name || responsePayload?.name || selectedFile.name
      const evidenceFileUrl = responsePayload?.fileUrl || responsePayload?.uri || responsePayload?.file_url || null

      if (evidenceHash) {
        const stageEvidenceKey = getStageEvidenceKey(selectedStage)
        if (stageEvidenceKey) {
          setUploadedEvidenceByStageKey((previous) => ({
            ...previous,
            [stageEvidenceKey]: {
              hash: evidenceHash,
              fileUrl: evidenceFileUrl || undefined,
              uri: evidenceFileUrl || undefined,
            },
          }))
        }
        setUploadSuccess({ hash: evidenceHash, fileName })
      } else {
        // If backend does not return any hash, just close modal
        setSelectedFile(null)
        setSelectedStage(null)
        setIsUploadModalOpen(false)
        showSuccess('Evidence uploaded successfully!')
      }
    } catch (error) {
      console.error('Failed to upload evidence:', error)
      setUploadError('Failed to upload evidence. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseUploadModal = () => {
    if (!isUploading) {
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      setSelectedStage(null)
      setUploadError(null)
      setUploadSuccess(null)
      setIsDragging(false)
    }
  }

  const handleSuccessClose = () => {
    setSelectedFile(null)
    setSelectedStage(null)
    setUploadSuccess(null)
    setIsUploadModalOpen(false)
    router.refresh()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const canShowUploadButton = (stage: Phase) => {
    return stage.requireEvidence && (onUploadProof || projectId || stage.projectId)
  }

  const handleRowClick = async (stage: Phase, e: React.MouseEvent) => {
    if (!canNavigateToTasks) {
      return
    }

    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('[role="menu"]')) {
      return
    }

    // Navigate to tasks page for this stage
    const stageProjectId = projectId || stage.projectId
    if (stageProjectId) {
      const stageId = stage.idPhase || stage.idPhaseProject || stage.id
      router.push(`${rolePrefix}/projects/${stageProjectId}/tasks?phaseId=${stageId}`)
    }
  }

  const handleOpenModal = async () => {
    setEditingStage(null)
    setIsModalOpen(true)
    setStageWeight(0)
    setFormError(null)
    setFormSuccess(false)
    setAvailablePhases([])
    setPhasesError(null)

    // Fetch available phases when opening modal
    if (!editingStage && projectId) {
      setIsLoadingPhases(true)
      try {
        const phases = await fetchAvailablePhases()
        setAvailablePhases(phases)
      } catch (error) {
        console.error('Failed to fetch available phases:', error)
        setPhasesError('Failed to load available phases. Please try again.')
      } finally {
        setIsLoadingPhases(false)
      }
    }
  }

  const handleOpenEditModal = (stage: Phase) => {
    setEditingStage(stage)
    setStageWeight(typeof stage.stageWeight === 'number' ? stage.stageWeight : 0)
    setIsModalOpen(true)
    setFormError(null)
    setFormSuccess(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingStage(null)
    setFormError(null)
    setFormSuccess(false)
  }

  // Handler to validate and restrict contribution inputs to positive numbers only
  const handleContributionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string, numbers, and single decimal point
    // Remove any negative signs, multiple decimal points, or non-numeric characters (except one decimal point)
    let sanitized = value.replace(/[^\d.]/g, '')

    // Ensure only one decimal point
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('')
    }

    // Update the input value
    e.target.value = sanitized
  }

  const handleSubmit = async (formData: FormData) => {
    setFormError(null)
    setFormSuccess(false)

    if (!projectId) {
      setFormError('Project ID is required')
      return
    }

    // For creating new stage, we need to select a phase
    if (!editingStage) {
      const idPhase = formData.get('id_phase') as string
      if (!idPhase) {
        setFormError('Please select a phase')
        return
      }

      const requireEvidence = formData.get('require_evidence') === 'on'
      const requireContribution = formData.get('require_contribution') === 'on'
      const requireAuditory = formData.get('require_auditory') === 'on'
      const orderStr = formData.get('order') as string
      const contributionRequiredStr = formData.get('contribution_required') as string
      const contributionReceivedStr = formData.get('contribution_received') as string

      const order = orderStr ? parseInt(orderStr, 10) : 0

      // Validate contribution required
      if (!contributionRequiredStr || contributionRequiredStr.trim() === '') {
        setFormError('Contribution required is required')
        return
      }

      // Validate contribution received
      if (!contributionReceivedStr || contributionReceivedStr.trim() === '') {
        setFormError('Contribution received is required')
        return
      }

      // Parse contribution values, removing any non-numeric characters except decimal point
      const contributionRequired = parseFloat(contributionRequiredStr.replace(/[^\d.]/g, ''))
      const contributionReceived = parseFloat(contributionReceivedStr.replace(/[^\d.]/g, ''))

      if (isNaN(order)) {
        setFormError('Order must be a valid number')
        return
      }

      if (isNaN(contributionRequired) || contributionRequired < 0) {
        setFormError('Contribution required must be a valid positive number')
        return
      }

      if (isNaN(contributionReceived) || contributionReceived < 0) {
        setFormError('Contribution received must be a valid positive number')
        return
      }

      const stageData = {
        id_phase: idPhase,
        require_evidence: requireEvidence,
        require_contribution: requireContribution,
        require_auditory: requireAuditory,
        status: 'pending',
        order: order,
        stage_weight: stageWeight,
        contribution_required: contributionRequired,
        contribution_received: contributionReceived,
        // TODO: Remove type_project in the future - it's redundant since the API already knows the project
        // The API currently asks for it but it's redundant information
        type_project: typeProject,
      }

      startTransition(async () => {
        try {
          await api.post(`/projects/${projectId}/phase`, stageData)

          setFormSuccess(true)
          // Close modal after a short delay and refresh the page
          setTimeout(() => {
            handleCloseModal()
            router.refresh()
          }, 1500)
        } catch (error) {
          console.error('Failed to create stage:', error)
          setFormError(error instanceof Error ? error.message : 'Failed to create stage')
        }
      })
    } else {
      // For editing stages
      const status = formData.get('status') as string
      const requireEvidence = formData.get('require_evidence') === 'on'
      const requireContribution = formData.get('require_contribution') === 'on'
      const requireAuditory = formData.get('require_auditory') === 'on'
      const orderStr = formData.get('order') as string
      const contributionRequiredStr = formData.get('contribution_required') as string
      const contributionReceivedStr = formData.get('contribution_received') as string

      if (!status) {
        setFormError('Status is required')
        return
      }

      const order = orderStr ? parseInt(orderStr, 10) : (editingStage.order || 0)

      // Parse contribution values
      const contributionRequired = contributionRequiredStr
        ? parseFloat(contributionRequiredStr.replace(/[^\d.]/g, ''))
        : (editingStage.contributionRequired || 0)
      const contributionReceived = contributionReceivedStr
        ? parseFloat(contributionReceivedStr.replace(/[^\d.]/g, ''))
        : (editingStage.contributionReceived || 0)

      if (isNaN(order)) {
        setFormError('Order must be a valid number')
        return
      }

      if (isNaN(contributionRequired) || contributionRequired < 0) {
        setFormError('Contribution required must be a valid positive number')
        return
      }

      if (isNaN(contributionReceived) || contributionReceived < 0) {
        setFormError('Contribution received must be a valid positive number')
        return
      }

      const updateData = {
        type_project: typeProject,
        require_evidence: requireEvidence,
        require_contribution: requireContribution,
        require_auditory: requireAuditory,
        status: status,
        order: order,
        stage_weight: stageWeight,
        contribution_required: contributionRequired,
        contribution_received: contributionReceived,
      }

      const phaseProjectId = editingStage.idPhaseProject || editingStage.id

      startTransition(async () => {
        try {
          await api.put(`/projects/${projectId}/phase/${phaseProjectId}`, updateData)

          setFormSuccess(true)
          // Close modal after a short delay and refresh the page
          setTimeout(() => {
            handleCloseModal()
            router.refresh()
          }, 1500)
        } catch (error) {
          console.error('Failed to update stage:', error)
          setFormError(error instanceof Error ? error.message : 'Failed to update stage')
        }
      })
    }
  }

  // Filter stages based on search query
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) {
      return stages
    }

    const query = searchQuery.toLowerCase().trim()
    return stages.filter((stage) => {
      const name = stage.name?.toLowerCase() || ''
      const status = stage.status?.toLowerCase() || ''
      const id = stage.id?.toLowerCase() || ''
      const idPhase = stage.idPhase?.toLowerCase() || ''

      return (
        name.includes(query) ||
        status.includes(query) ||
        id.includes(query) ||
        idPhase.includes(query)
      )
    })
  }, [stages, searchQuery])

  const renderTable = () => {
    let columnCount = 6 // Base: ID, Name, Status, Contributed, Proof, Hash
    if (enablePayment) columnCount++
    if (!hideActions) columnCount++

    if (isLoading) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader className="text-center">Contributed</TableHeader>
              <TableHeader className="text-center">Proof</TableHeader>
              <TableHeader className="text-center">Hash</TableHeader>
              {enablePayment && <TableHeader className="text-center">Payment</TableHeader>}
              {!hideActions && <TableHeader className="text-center">Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columnCount} className="text-center text-zinc-500">
                Loading stages...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (filteredStages.length === 0) {
      return (
        <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
              <TableHeader className="text-center">Contributed</TableHeader>
              <TableHeader className="text-center">Proof</TableHeader>
              <TableHeader className="text-center">Hash</TableHeader>
              {enablePayment && <TableHeader className="text-center">Payment</TableHeader>}
              {!hideActions && <TableHeader className="text-center">Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columnCount} className="text-center text-zinc-500">
                {searchQuery ? `No stages found matching "${searchQuery}"` : emptyMessage}
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
            <TableHeader className="text-center">Contributed</TableHeader>
            <TableHeader className="text-center">Proof</TableHeader>
            <TableHeader className="text-center">Hash</TableHeader>
            {enablePayment && <TableHeader className="text-center">Payment</TableHeader>}
            {!hideActions && <TableHeader className="text-center">Actions</TableHeader>}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredStages.map((stage) => {
            const evidence = getStageEvidence(stage)
            const canPayStage = Boolean(evidence.hash)
            return (
              <TableRow
                key={stage.id}
                title={`Stage ${stage.name}`}
                onClick={(e) => handleRowClick(stage, e)}
                className={canNavigateToTasks ? 'cursor-pointer' : undefined}
              >
                <TableCell className="font-mono text-sm">{stage.idPhase || stage.id}</TableCell>
                <TableCell className="font-medium">{stage.name || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${stage.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : stage.status === 'inprogress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : stage.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                  >
                    {stage.status || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">
                      {stage.contributionReceived || 0} / {stage.contributionRequired || 0}
                    </span>
                    {(stage.contributionRequired || 0) > 0 && (
                      <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round(((stage.contributionReceived || 0) / (stage.contributionRequired || 1)) * 100))}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center items-center min-h-[2.5rem]">
                    {evidence.hash ? (
                      <Button
                        outline
                        onClick={(e) => {
                          e.stopPropagation()
                          const fileUrl = evidence.fileUrl || evidence.uri
                          if (fileUrl) {
                            window.open(fileUrl, '_blank')
                          } else {
                            navigator.clipboard
                              .writeText(evidence.hash)
                              .then(() => showSuccess('Hash copied to clipboard'))
                              .catch(() => showWarning('Unable to copy hash to clipboard'))
                          }
                        }}
                        className="text-sm"
                      >
                        View
                      </Button>
                    ) : canShowUploadButton(stage) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUploadClick(stage)
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                        title="Upload Proof"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-400">Not Required</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-500 text-center">
                  {evidence.hash ? (
                    <span title={evidence.hash}>{formatHashPreview(evidence.hash)}</span>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                {enablePayment && (
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center min-h-[2.5rem]" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!canPayStage) return
                          setSelectedStageForPayment(stage)
                          setIsPaymentModalOpen(true)
                        }}
                        className={`rounded-md bg-transparent p-1.5 transition-colors ${
                          canPayStage
                            ? 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/20 dark:hover:text-green-300 cursor-pointer'
                            : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                        }`}
                        title={canPayStage ? 'Pay' : 'Proof hash required to enable payment'}
                        disabled={!canPayStage}
                      >
                        <BanknotesIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                )}
                {!hideActions && (
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
                              handleOpenEditModal(stage)
                            }}
                          >
                            <DropdownLabel>Edit</DropdownLabel>
                          </DropdownItem>
                          <DropdownItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingStageId(stage.id)
                              setDeleteConfirmOpen(true)
                            }}
                            disabled={deletingStageId === stage.id}
                          >
                            <DropdownLabel>Delete</DropdownLabel>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                )}
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
                  placeholder="Search stages"
                  aria-label="Search stages"
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
          setDeletingStageId(null)
        }
      }}>
        <DialogTitle>Delete Stage</DialogTitle>
        <DialogBody>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this stage? This action cannot be undone.
          </p>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            outline
            onClick={() => {
              setDeleteConfirmOpen(false)
              setDeletingStageId(null)
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
              if (!deletingStageId) return

              setIsDeleting(true)
              try {
                await api.delete(`/phases/${deletingStageId}`)
                setDeleteConfirmOpen(false)
                setDeletingStageId(null)
                setIsDeleting(false)
                router.refresh()
              } catch (error) {
                console.error('Failed to delete stage:', error)
                showError(error instanceof Error ? error.message : 'Failed to delete stage')
                setIsDeleting(false)
              }
            }}
            disabled={isDeleting || deletingStageId === null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Stage Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} size="4xl">
        <DialogTitle>{editingStage ? 'Edit Stage' : 'Create New Stage'}</DialogTitle>
        <DialogBody>
          <form action={handleSubmit} className="grid grid-cols-2 gap-6">
            {formSuccess && (
              <div className="col-span-2 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Stage {editingStage ? 'updated' : 'created'} successfully!
                </p>
              </div>
            )}

            {formError && (
              <div className="col-span-2 rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {formError}
                </p>
              </div>
            )}

            {!editingStage && (
              <>
                {/* Phase Selection and Requirements - Same Line */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  {/* Phase Selection */}
                  <div>
                    <label htmlFor="id_phase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Phase <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      {isLoadingPhases ? (
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                          <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Loading phases...
                        </div>
                      ) : phasesError ? (
                        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                          <p className="text-sm text-red-600 dark:text-red-400">{phasesError}</p>
                        </div>
                      ) : (
                        <Select
                          id="id_phase"
                          name="id_phase"
                          required
                          disabled={isPending || formSuccess || availablePhases.length === 0}
                          className="w-full"
                        >
                          <option value="">Select a phase...</option>
                          {availablePhases.map((phase) => (
                            <option key={phase.id_phase} value={phase.id_phase}>
                              {phase.name_phase}
                            </option>
                          ))}
                        </Select>
                      )}
                      {availablePhases.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {availablePhases.length} phase(s) available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Requirement Checkboxes */}
                  <div>
                    <div className="h-[1.375rem] sm:h-[1.25rem]"></div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="require_evidence"
                          name="require_evidence"
                          defaultChecked={false}
                          disabled={isPending || formSuccess}
                        />
                        <label htmlFor="require_evidence" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Evidence
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="require_contribution"
                          name="require_contribution"
                          defaultChecked={false}
                          disabled={isPending || formSuccess}
                        />
                        <label htmlFor="require_contribution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Contribution
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="require_auditory"
                          name="require_auditory"
                          defaultChecked={false}
                          disabled={isPending || formSuccess}
                        />
                        <label htmlFor="require_auditory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Auditory
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two Column Grid for Status and Order */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  {/* Status Selection */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <Select
                        id="status"
                        name="status"
                        required
                        disabled={isPending || formSuccess}
                        className="w-full"
                        defaultValue="pending"
                      >
                        {PHASE_PROJECT_STATUS.map((status) => (
                          <option key={status.key} value={status.value}>
                            {status.key.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Order */}
                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Order
                    </label>
                    <div className="mt-2">
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        min="0"
                        placeholder="0"
                        defaultValue="1"
                        disabled={isPending || formSuccess}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Two Column Grid for Contribution Fields */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  {/* Contribution Required */}
                  <div>
                    <label htmlFor="contribution_required" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                      Contribution Required <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
                        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400">$</div>
                        <input
                          id="contribution_required"
                          name="contribution_required"
                          type="text"
                          placeholder="0.00"
                          defaultValue="0"
                          required
                          disabled={isPending || formSuccess}
                          aria-describedby="contribution_required-currency"
                          onChange={handleContributionInput}
                          onKeyDown={(e) => {
                            // Prevent minus sign, 'e', 'E', and '+' keys
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                              e.preventDefault()
                            }
                          }}
                          className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div
                          id="contribution_required-currency"
                          className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400"
                        >
                          USD
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contribution Received */}
                  <div>
                    <label htmlFor="contribution_received" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                      Contribution Received <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
                        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400">$</div>
                        <input
                          id="contribution_received"
                          name="contribution_received"
                          type="text"
                          placeholder="0.00"
                          defaultValue="0"
                          required
                          disabled={isPending || formSuccess}
                          aria-describedby="contribution_received-currency"
                          onChange={handleContributionInput}
                          onKeyDown={(e) => {
                            // Prevent minus sign, 'e', 'E', and '+' keys
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                              e.preventDefault()
                            }
                          }}
                          className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div
                          id="contribution_received-currency"
                          className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400"
                        >
                          USD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Stage Weight Slider */}
                <div className="col-span-2">
                  <label htmlFor="stage_weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stage Weight: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stageWeight}%</span>
                  </label>
                  <div className="mt-4 px-2">
                    <input
                      id="stage_weight"
                      name="stage_weight"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stageWeight}
                      onChange={(e) => setStageWeight(parseInt(e.target.value, 10))}
                      disabled={isPending || formSuccess}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 hover:accent-indigo-500 transition-all"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {editingStage && (
              <>
                {/* Stage Name (read-only) */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stage Name
                  </label>
                  <div className="mt-2">
                    <Input
                      type="text"
                      value={editingStage.name || 'N/A'}
                      disabled
                      className="w-full bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Status and Requirements - Same Line */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <Select
                        id="status"
                        name="status"
                        defaultValue={editingStage.status || 'pending'}
                        disabled={isPending || formSuccess}
                        className="w-full"
                      >
                        {PHASE_PROJECT_STATUS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.key.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-end pb-2">
                    <div className="space-y-3">
                      <label htmlFor="edit-require-evidence" className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          id="edit-require-evidence"
                          name="require_evidence"
                          defaultChecked={
                            editingStage.requireEvidence ??
                            ((editingStage as Phase & { require_evidence?: boolean }).require_evidence ?? false)
                          }
                          disabled={isPending || formSuccess}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Evidence
                        </span>
                      </label>
                      <label htmlFor="edit-require-contribution" className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          id="edit-require-contribution"
                          name="require_contribution"
                          defaultChecked={
                            editingStage.requireContribution ??
                            ((editingStage as Phase & { require_contribution?: boolean }).require_contribution ?? false)
                          }
                          disabled={isPending || formSuccess}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Contribution
                        </span>
                      </label>
                      <label htmlFor="edit-require-auditory" className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          id="edit-require-auditory"
                          name="require_auditory"
                          defaultChecked={
                            editingStage.requireAuditory ??
                            ((editingStage as Phase & { require_auditory?: boolean; require_audit?: boolean }).require_auditory ??
                              (editingStage as Phase & { require_auditory?: boolean; require_audit?: boolean }).require_audit ??
                              false)
                          }
                          disabled={isPending || formSuccess}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Auditory
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Contribution Required and Received - Same Line */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div>
                    <label htmlFor="contribution_required" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribution Required <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <Input
                        id="contribution_required"
                        name="contribution_required"
                        type="text"
                        inputMode="decimal"
                        defaultValue={editingStage.contributionRequired || 0}
                        onChange={handleContributionInput}
                        disabled={isPending || formSuccess}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contribution_received" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribution Received <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <Input
                        id="contribution_received"
                        name="contribution_received"
                        type="text"
                        inputMode="decimal"
                        defaultValue={editingStage.contributionReceived || 0}
                        onChange={handleContributionInput}
                        disabled={isPending || formSuccess}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Order and Stage Weight - Same Line */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Order
                    </label>
                    <div className="mt-2">
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        min="0"
                        defaultValue={editingStage.order || 0}
                        disabled={isPending || formSuccess}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stage_weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stage Weight: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stageWeight}%</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="stage_weight"
                        name="stage_weight"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={stageWeight}
                        onChange={(e) => setStageWeight(parseInt(e.target.value, 10))}
                        disabled={isPending || formSuccess}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 hover:accent-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <DialogActions className="col-span-2">
              <Button
                type="button"
                outline
                onClick={handleCloseModal}
                disabled={isPending}
              >
                Cancel
              </Button>
              {!editingStage ? (
                <Button
                  type="submit"
                  color="indigo"
                  disabled={isPending || formSuccess || isLoadingPhases || availablePhases.length === 0}
                  loading={isPending}
                >
                  Create Stage
                </Button>
              ) : (
                <Button
                  type="submit"
                  color="indigo"
                  disabled={isPending || formSuccess}
                  loading={isPending}
                >
                  Update Stage
                </Button>
              )}
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>

      {/* Upload Evidence Dialog */}
      <Dialog open={isUploadModalOpen} onClose={handleCloseUploadModal} size="md">
        <DialogTitle>Upload Evidence</DialogTitle>
        <DialogBody>
          {selectedStage && (
            <div className="space-y-4">
              {uploadSuccess ? (
                // Success view with hash
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4 rounded-xl bg-green-50 p-6 dark:bg-green-950/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg
                        className="h-8 w-8 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Evidence Uploaded Successfully!
                      </p>
                      <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                        {uploadSuccess.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Hash
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs font-mono text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {uploadSuccess.hash}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadSuccess.hash)
                        }}
                        className="rounded-md bg-zinc-200 p-2 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <svg
                          className="h-4 w-4 text-zinc-600 dark:text-zinc-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Upload form view
                <>
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Stage: <span className="font-semibold">{selectedStage.name || 'N/A'}</span>
                    </p>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all
                      ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20'
                        : selectedFile
                          ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950/20'
                          : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                      }
                    `}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      disabled={isUploading}
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center space-y-3 p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg
                            className="h-8 w-8 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFile(null)
                            setUploadError(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4 p-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <svg
                            className="h-8 w-8 text-zinc-500 dark:text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            or click to browse
                          </p>
                          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                            PDF, DOC, DOCX, JPG, PNG, GIF (max 10MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogBody>
        <DialogActions>
          {uploadSuccess ? (
            <Button onClick={handleSuccessClose} className="min-w-[100px]">
              Close
            </Button>
          ) : (
            <>
              <Button outline onClick={handleCloseUploadModal} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="min-w-[100px]"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Contribution Modal */}
      {enablePayment && (
        <ContributionModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedStageForPayment(null)
          }}
          stage={selectedStageForPayment}
          projectId={projectId || ''}
          projectTotalContributed={projectTotalContributed}
        />
      )}

    </>
  )
}
