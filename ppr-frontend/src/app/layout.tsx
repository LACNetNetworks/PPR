import '@/styles/tailwind.css'
import { ToastProvider } from '@/components/toast'
import type { Metadata } from 'next'
import Script from 'next/script'
import { KeycloakProvider } from '@/components/keycloak-provider'

export const metadata: Metadata = {
  title: {
    template: '%s - Trace4good',
    default: 'Trace4good',
  },
  description: 'Trace4good is a platform for tracking and verifying the impact of projects.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950"
    >
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <Script src="/env.js" strategy="beforeInteractive" />
        <KeycloakProvider>
          <ToastProvider>{children}</ToastProvider>
        </KeycloakProvider>
      </body>
    </html>
  )
}
