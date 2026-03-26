// @vitest-environment jsdom

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrandDocumentTitle } from './brand-document-title'

const { useBrandingMock, usePathnameMock } = vi.hoisted(() => ({
  useBrandingMock: vi.fn(),
  usePathnameMock: vi.fn(),
}))

vi.mock('@/hooks/use-branding', () => ({
  useBranding: useBrandingMock,
  getBrandedDocumentTitle: (title: string, brandName: string) => `${title.split(' - ')[0]} - ${brandName}`,
}))

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}))

describe('BrandDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Dashboard - blockchain4impact'
    useBrandingMock.mockReturnValue({
      brandName: 'Trace4good',
    })
    usePathnameMock.mockReturnValue('/provider')
  })

  it('updates the browser title using the active brand', async () => {
    render(<BrandDocumentTitle />)

    await waitFor(() => {
      expect(document.title).toBe('Dashboard - Trace4good')
    })
  })
})
