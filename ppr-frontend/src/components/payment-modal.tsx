'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { Button } from '@/components/button'
import { QRCodeSVG } from 'qrcode.react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  itemName: string
  itemType?: 'stage' | 'project'
}

const PAYMENT_ADDRESS = '0x4f36ad7f06554328840ce5afa9d2c0c01493b5bd'

export function PaymentModal({ isOpen, onClose, itemName, itemType = 'stage' }: PaymentModalProps) {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false)

  const handleClose = () => {
    if (!isPaymentLoading) {
      setIsPaymentSuccess(false)
      setIsPaymentLoading(false)
      onClose()
    }
  }

  const handleSimulatePayment = () => {
    setIsPaymentLoading(true)
    // Simulate waiting for transaction
    setTimeout(() => {
      setIsPaymentLoading(false)
      setIsPaymentSuccess(true)
    }, 3000)
  }

  const handleSuccessClose = () => {
    setIsPaymentSuccess(false)
    setIsPaymentLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} size="md">
      <DialogTitle>Payment</DialogTitle>
      <DialogBody>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Payment for {itemType}
            </p>
            <p className="mt-1 text-base font-semibold text-zinc-950 dark:text-white">
              {itemName || 'N/A'}
            </p>
          </div>
          
          {isPaymentSuccess ? (
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
                  Payment Successful!
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  Your Payment of $100,000 tokens has been sent!
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              {/* QR Code Section */}
              <div className="flex items-center justify-center border-b border-zinc-200 bg-zinc-50/50 p-8 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <QRCodeSVG
                    value={PAYMENT_ADDRESS}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="p-6">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Payment Address
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <code className="flex-1 break-all rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-mono leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100">
                    {PAYMENT_ADDRESS}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PAYMENT_ADDRESS)
                    }}
                    className="group shrink-0 rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200"
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

              {/* Loading State Overlay */}
              {isPaymentLoading && (
                <div className="border-t border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-700 dark:bg-zinc-800/80">
                  <div className="flex flex-col items-center space-y-3">
                    <svg
                      className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
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
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Waiting for transaction...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogBody>
      <DialogActions>
        {isPaymentSuccess ? (
          <Button type="button" onClick={handleSuccessClose}>
            Close
          </Button>
        ) : (
          <>
            <Button
              type="button"
              outline
              onClick={handleClose}
              disabled={isPaymentLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? 'Processing...' : 'Do Payment'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

