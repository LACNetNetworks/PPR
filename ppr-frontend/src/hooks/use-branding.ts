'use client'

import { useAuth } from '@/hooks/use-auth'

const PPR_API_CLIENT_AZP = 'ppr-api-client'
const KNOWN_BRANDS = ['Trace4Good', 'Trace4good', 'blockchain4impact']

export function getBrandNameFromAzp(azp?: string): string {
  return azp !== PPR_API_CLIENT_AZP ? 'blockchain4impact' : 'Trace4good'
}

function removeKnownBrandSuffix(title: string): string {
  const trimmedTitle = title.trim()
  const lowerTitle = trimmedTitle.toLowerCase()

  for (const brand of KNOWN_BRANDS) {
    const lowerBrand = brand.toLowerCase()
    const suffix = ` - ${brand}`
    const lowerSuffix = suffix.toLowerCase()

    if (lowerTitle === lowerBrand) {
      return ''
    }

    if (lowerTitle.endsWith(lowerSuffix)) {
      return trimmedTitle.slice(0, -suffix.length).trim()
    }
  }

  return trimmedTitle
}

export function getBrandedDocumentTitle(currentTitle: string, brandName: string): string {
  const baseTitle = removeKnownBrandSuffix(currentTitle)
  return baseTitle ? `${baseTitle} - ${brandName}` : brandName
}

export function useBranding() {
  const { azp, isLoading } = useAuth()

  return {
    azp,
    isLoading,
    isPprApiClient: azp === PPR_API_CLIENT_AZP,
    brandName: getBrandNameFromAzp(azp),
  }
}
