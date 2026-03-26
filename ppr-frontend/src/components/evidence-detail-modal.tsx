'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { Button } from '@/components/button'
import { Text } from '@/components/text'
import { XMarkIcon, ArrowDownTrayIcon, PhotoIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/16/solid'
import type { Evidence } from '@/types/api'

interface EvidenceDetailModalProps {
  evidence: Evidence | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (evidence: Evidence) => void
}

export function EvidenceDetailModal({
  evidence,
  isOpen,
  onClose,
  onDownload,
}: EvidenceDetailModalProps) {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fileUrl = evidence?.fileUrl || evidence?.uri
  const fileType = evidence?.fileType || ''
  const fileName = evidence?.name || evidence?.file_name || 'Untitled Evidence'

  // Reset errors when evidence changes
  useEffect(() => {
    if (evidence) {
      setImageError(false)
      setVideoError(false)
      setIsLoading(true)
    }
  }, [evidence])

  if (!evidence) return null

  const isImage = fileType.startsWith('image/')
  const isVideo = fileType.startsWith('video/')
  const isDocument = !isImage && !isVideo

  const handleDownload = () => {
    if (onDownload) {
      onDownload(evidence)
    } else if (fileUrl) {
      // Fallback: open in new tab for download
      window.open(fileUrl, '_blank')
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
    setVideoError(false)
  }

  const handleVideoError = () => {
    setIsLoading(false)
    setVideoError(true)
  }

  const getFileIcon = () => {
    if (isImage) return <PhotoIcon className="size-12 text-gray-400" />
    if (isVideo) return <VideoCameraIcon className="size-12 text-gray-400" />
    return <DocumentIcon className="size-12 text-gray-400" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Dialog open={isOpen} onClose={onClose} size="5xl">
      <div className="flex items-center justify-between">
        <DialogTitle>{fileName}</DialogTitle>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      <DialogBody>
        <div className="space-y-6">
          {/* Preview Section */}
          <div className="relative w-full">
            {isImage && fileUrl ? (
              <div className="relative flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[400px]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400">Loading image...</div>
                  </div>
                )}
                {imageError ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    {getFileIcon()}
                    <Text className="mt-4">Failed to load image</Text>
                    <Text className="text-sm">The image could not be displayed</Text>
                  </div>
                ) : (
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-h-[70vh] w-full rounded-lg object-contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </div>
            ) : isVideo && fileUrl ? (
              <div className="relative flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[400px]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400">Loading video...</div>
                  </div>
                )}
                {videoError ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    {getFileIcon()}
                    <Text className="mt-4">Failed to load video</Text>
                    <Text className="text-sm">The video could not be displayed</Text>
                    {fileUrl && (
                      <Button
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="mt-4"
                        outline
                      >
                        Open in new tab
                      </Button>
                    )}
                  </div>
                ) : (
                  <video
                    src={fileUrl}
                    controls
                    className="max-h-[70vh] w-full rounded-lg"
                    onLoadedData={handleVideoLoad}
                    onError={handleVideoError}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-16 min-h-[400px]">
                {getFileIcon()}
                <Text className="mt-4 text-gray-600 dark:text-gray-400">
                  {fileUrl ? 'Preview not available' : 'No file available'}
                </Text>
                {fileUrl && (
                  <Button
                    onClick={handleDownload}
                    className="mt-4"
                    outline
                  >
                    <ArrowDownTrayIcon className="mr-2 size-4" />
                    Download File
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 dark:border-gray-700 sm:grid-cols-2">
            {evidence.description && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.description}
                </Text>
              </div>
            )}

            {fileType && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  File Type
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {fileType}
                </Text>
              </div>
            )}

            {(evidence.uploadedAt || evidence.created_at) && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Upload Date
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(evidence.uploadedAt || evidence.created_at || '').toLocaleString()}
                </Text>
              </div>
            )}

            {(evidence.hash || evidence.tx_hash || evidence.txHash) && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Hash
                </Text>
                <Text className="mt-1 break-all text-sm font-mono text-gray-600 dark:text-gray-400">
                  {evidence.hash || evidence.tx_hash || evidence.txHash}
                </Text>
              </div>
            )}

            {evidence.id_evidence && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Evidence ID
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.id_evidence}
                </Text>
              </div>
            )}

            {evidence.id_project && (
              <div>
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Project ID
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.id_project}
                </Text>
              </div>
            )}
          </div>
        </div>
      </DialogBody>

      <DialogActions>
        <Button onClick={onClose} outline>
          Close
        </Button>
        {fileUrl && (
          <Button onClick={handleDownload}>
            <ArrowDownTrayIcon className="mr-2 size-4" />
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

