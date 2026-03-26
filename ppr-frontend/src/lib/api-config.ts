/**
 * API Configuration
 * Client reads from runtime env.js; server reads from process env.
 */
function getClientEnv(key: string): string | undefined {
  if (typeof window !== 'undefined' && window.__ENV?.[key]) {
    return window.__ENV[key]
  }
  return undefined
}

function getServerEnv(key: string): string | undefined {
  if (typeof window === 'undefined') {
    const value = process.env[key]
    if (value && value.length > 0) return value
  }
  return undefined
}

export function getClientApiBaseUrl(): string {
  return getClientEnv('API_URL') ?? process.env.NEXT_PUBLIC_API_URL ?? ''
}

export function getServerApiBaseUrl(): string {
  return getServerEnv('API_URL') ?? getServerEnv('NEXT_PUBLIC_API_URL') ?? ''
}


