'use client'

import type { Phase } from '@/types/api'
import { Heading } from '@/components/heading'
import ProgressBar from './progress-bar'
import {
    TagIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/16/solid'

interface StageDetailsHeaderProps {
    stage: Phase
    hideContribution?: boolean
}

/**
 * Format currency helper
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * Stage Details Header Component
 * Displays stage information including contribution progress
 */
export function StageDetailsHeader({ stage, hideContribution = false }: StageDetailsHeaderProps) {
    const contributionRequired = stage.contributionRequired || 0
    const contributionReceived = stage.contributionReceived || 0

    // Calculate contribution progress
    const contributionProgress = contributionRequired === 0
        ? 0
        : Math.min(100, Math.max(0, Math.round((contributionReceived / contributionRequired) * 100)))

    // Get status display info
    const getStatusStyles = (status: string | undefined) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'inprogress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            default:
                return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
        }
    }

    return (
        <div className="mb-8">
            {/* Stage Info */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <Heading level={2}>{stage.name || 'Stage'}</Heading>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyles(stage.status)}`}>
                        {stage.status || 'N/A'}
                    </span>
                </div>
                {stage.idPhase && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Phase ID: <span className="font-mono">{stage.idPhase}</span>
                    </p>
                )}
            </div>

            {/* Contribution Progress */}
            {!hideContribution && contributionRequired > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Contribution Progress
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {formatCurrency(contributionReceived)} / {formatCurrency(contributionRequired)}
                        </span>
                    </div>
                    <ProgressBar
                        progress={contributionProgress}
                        label={`${contributionProgress}% funded`}
                    />
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 divide-y divide-zinc-200 border-t border-b border-zinc-200 bg-zinc-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
                {/* Status */}
                <div className="px-6 py-5">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <ClockIcon className="size-4" />
                        Status
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white capitalize">
                        {stage.status || 'N/A'}
                    </dd>
                </div>

                {/* Contribution Required */}
                {!hideContribution && (
                    <div className="px-6 py-5">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <BanknotesIcon className="size-4" />
                            Required
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                            {formatCurrency(contributionRequired)}
                        </dd>
                    </div>
                )}

                {/* Contribution Received */}
                {!hideContribution && (
                    <div className="px-6 py-5">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <CheckCircleIcon className="size-4" />
                            Received
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                            {formatCurrency(contributionReceived)}
                        </dd>
                    </div>
                )}

                {/* Require Evidence */}
                <div className="px-6 py-5">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <TagIcon className="size-4" />
                        Evidence Required
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                        {stage.requireEvidence ? 'Yes' : 'No'}
                    </dd>
                </div>
            </div>
        </div>
    )
}
