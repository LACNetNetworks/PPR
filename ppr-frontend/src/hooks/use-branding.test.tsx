// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBrandNameFromAzp, getBrandedDocumentTitle, useBranding } from './use-branding'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: useAuthMock,
}))

describe('getBrandNameFromAzp', () => {
  it('returns Trace4good for the PPR API client and blockchain4impact otherwise', () => {
    expect(getBrandNameFromAzp('ppr-api-client')).toBe('Trace4good')
    expect(getBrandNameFromAzp('external-client')).toBe('blockchain4impact')
    expect(getBrandNameFromAzp()).toBe('blockchain4impact')
  })
})

describe('getBrandedDocumentTitle', () => {
  it('replaces known brand suffixes instead of duplicating them', () => {
    expect(getBrandedDocumentTitle('Dashboard - Trace4Good', 'Trace4good')).toBe('Dashboard - Trace4good')
    expect(getBrandedDocumentTitle('Dashboard - blockchain4impact', 'Trace4good')).toBe('Dashboard - Trace4good')
  })

  it('returns only the brand when the current title is already a brand name', () => {
    expect(getBrandedDocumentTitle('Trace4Good', 'Trace4good')).toBe('Trace4good')
  })
})

describe('useBranding', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      azp: 'ppr-api-client',
      isLoading: false,
    })
  })

  it('derives branding flags from the authentication state', () => {
    const { result } = renderHook(() => useBranding())

    expect(result.current).toEqual({
      azp: 'ppr-api-client',
      isLoading: false,
      isPprApiClient: true,
      brandName: 'Trace4good',
    })
  })

  it('marks non-PPR clients with the alternate brand', () => {
    useAuthMock.mockReturnValue({
      azp: 'partner-client',
      isLoading: true,
    })

    const { result } = renderHook(() => useBranding())

    expect(result.current.brandName).toBe('blockchain4impact')
    expect(result.current.isPprApiClient).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })
})
