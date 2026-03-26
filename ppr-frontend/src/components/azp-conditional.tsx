'use client'

import { useAuth } from '@/hooks/use-auth'

interface AzpConditionalProps {
  renderA: React.ReactNode
  renderB: React.ReactNode
  expectedAzp?: string
  loadingFallback?: React.ReactNode
}

/**
 * Renderiza A o B según el claim `azp` del token de Keycloak.
 * Lógica por defecto:
 * if (azp !== 'ppr-api-client') mostrar A, de lo contrario mostrar B.
 */
export function AzpConditional({
  renderA,
  renderB,
  expectedAzp = 'ppr-api-client',
  loadingFallback = null,
}: AzpConditionalProps) {
  const { azp, isLoading } = useAuth()

  if (isLoading) {
    return <>{loadingFallback}</>
  }

  return azp !== expectedAzp ? <>{renderA}</> : <>{renderB}</>
}
