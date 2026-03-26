'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Select } from '@/components/select'
import { useAuth } from '@/hooks/use-auth'
import { useCreateAuditRevision } from '@/lib/api-services'
import { useUserService } from '@/lib/user-service'
import type { Phase } from '@/types/api'
import { AUDIT_STATUS } from '@/types/enums'

interface AuditModalProps {
    isOpen: boolean
    onClose: () => void
    stage: Phase | null
    projectId: string | undefined
}

export function AuditModal({ isOpen, onClose, stage, projectId }: AuditModalProps) {
    const { userInfo } = useAuth()
    const { syncUser } = useUserService()
    const createAuditRevision = useCreateAuditRevision()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        objetive: '',
        observation: '',
        status: 'planned'
    })

    const resetForm = () => {
        setFormData({
            objetive: '',
            observation: '',
            status: 'planned'
        })
        setIsSuccess(false)
        setError(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stage || !projectId || !userInfo?.sub) return

        setIsSubmitting(true)
        setError(null)

        try {
            const syncedUser = await syncUser()
            const backendUserId = (syncedUser as any).id_user || syncedUser.id

            if (!backendUserId) {
                throw new Error('Unable to resolve internal user ID for audit request.')
            }

            await createAuditRevision({
                id_project: projectId,
                id_user: backendUserId,
                id_phase_project: stage.idPhaseProject || stage.id,
                objetive: formData.objetive,
                observation: formData.observation,
                status: formData.status,
                date_revision: new Date().toISOString().split('T')[0] // YYYY-MM-DD
            })

            setIsSuccess(true)
        } catch (err) {
            console.error('Failed to register audit revision:', err)
            setError(err instanceof Error ? err.message : 'Failed to register audit revision')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSuccessClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} size="md">
            <DialogTitle>Audit Stage: {stage?.name || 'N/A'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    <div className="space-y-4">
                        {isSuccess ? (
                            <div className="flex flex-col items-center space-y-4 rounded-xl bg-green-50 p-8 dark:bg-green-950/20">
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
                                        Audit Registered!
                                    </p>
                                    <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                                        Audit revision registered successfully.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <Field>
                                    <Label>Title</Label>
                                    <Input
                                        required
                                        name="objetive"
                                        placeholder="Audit objective"
                                        value={formData.objetive}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, objetive: e.target.value })}
                                    />
                                </Field>

                                <Field>
                                    <Label>Description</Label>
                                    <Textarea
                                        required
                                        name="observation"
                                        placeholder="Audit findings, observations, recommendations..."
                                        value={formData.observation}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, observation: e.target.value })}
                                        rows={4}
                                    />
                                </Field>

                                <Field>
                                    <Label>Status</Label>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {AUDIT_STATUS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.key.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                            </>
                        )}
                    </div>
                </DialogBody>
                <DialogActions>
                    {isSuccess ? (
                        <Button type="button" onClick={handleSuccessClose}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button outline onClick={handleClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Registering...' : 'Register Audit'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </form>
        </Dialog>
    )
}
