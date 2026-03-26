'use client'

import { Divider } from '@/components/divider'
import { EvidenceCard } from './evidence-card'
import type { Evidence } from '@/types/api'

interface GridEvidencesProps {
  evidences: Evidence[]
  isLoading?: boolean
  emptyMessage?: string
  onView?: (evidence: Evidence) => void
  onDownload?: (evidence: Evidence) => void
  onDelete?: (evidence: Evidence) => void
}

/**
 * Reusable Evidences Grid Component
 * Displays a list of evidences in a list format with dividers
 */
export function GridEvidences({
  evidences,
  isLoading = false,
  emptyMessage = 'No evidences found',
  onView,
  onDownload,
  onDelete,
}: GridEvidencesProps) {
  if (isLoading) {
    return (
      <div className="mt-10 text-center text-gray-500">Loading evidences...</div>
    )
  }

  if (evidences.length === 0) {
    return (
      <div className="mt-10 text-center text-gray-500">{emptyMessage}</div>
    )
  }

  return (
    <ul className="mt-6">
      {evidences.map((evidence, index) => (
        <li key={evidence.id_evidence || evidence.id || index}>
          <EvidenceCard
            evidence={evidence}
            index={index}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
          {/** Divider between evidences */}
          {index < evidences.length - 1 && <Divider soft={true} className="border-b border-t-0" />}
        </li>
      ))}
    </ul>
  )
}

