'use client'

import { useState, useEffect } from 'react'
import { Heading } from '@/components/heading'
import { GridEvidences } from '@/components/grids/grid-evidences'
import { EvidenceDetailModal } from '@/components/evidence-detail-modal'
import { useFetchEvidences } from '@/lib/api-services'
import type { Evidence } from '@/types/api'

export default function EvidencesPage() {
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fetchEvidences = useFetchEvidences()

  useEffect(() => {
    const loadEvidences = async () => {
      try {
        setIsLoading(true)
        const data = await fetchEvidences()
        setEvidences(data)
      } catch (error) {
        console.error('Failed to fetch evidences:', error)
        setEvidences([])
      } finally {
        setIsLoading(false)
      }
    }

    loadEvidences()
  }, [fetchEvidences])

  const handleViewEvidence = (evidence: Evidence) => {
    setSelectedEvidence(evidence)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvidence(null)
  }

  const handleDownloadEvidence = (evidence: Evidence) => {
    const fileUrl = evidence.fileUrl || evidence.uri
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Evidences</Heading>
        </div>
      </div>

      {/* Evidence List */}
      <GridEvidences
        evidences={evidences}
        isLoading={isLoading}
        emptyMessage="No evidences found"
        onView={handleViewEvidence}
        onDownload={handleDownloadEvidence}
      />

      {/* Evidence Detail Modal */}
      <EvidenceDetailModal
        evidence={selectedEvidence}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDownload={handleDownloadEvidence}
      />
    </>
  )
}
