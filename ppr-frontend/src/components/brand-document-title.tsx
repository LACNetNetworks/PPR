'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getBrandedDocumentTitle, useBranding } from '@/hooks/use-branding'

export function BrandDocumentTitle() {
  const { brandName } = useBranding()
  const pathname = usePathname()

  useEffect(() => {
    document.title = getBrandedDocumentTitle(document.title, brandName)
  }, [brandName, pathname])

  return null
}
