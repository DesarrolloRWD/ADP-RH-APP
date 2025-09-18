import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { TokenCleanupProvider } from '@/components/token-cleanup-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'adp_systems',
  description: 'develop_by_israel',
  generator: 'adp_systems',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme) {
                    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
                  } else {
                    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', systemPreference);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <TokenCleanupProvider>
          {children}
        </TokenCleanupProvider>
      </body>
    </html>
  )
}
