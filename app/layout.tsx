import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Anton } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const display = Anton({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://redliner.online'),

  title: 'REDLINER // MERC.OS',

  description:
    'MERC.OS | Mercenary Engagement & Reconnaissance Command Operating System.',

  generator: 'merc.os',

  keywords: [
    'REDLINER',
    'Roblox',
    'mercenary',
    'MERC.OS',
    'leaderboards',
    'arsenal',
  ],

  icons: {
    icon: '/mercos.png',
    shortcut: '/mercos.png',
    apple: '/mercos.png',
  },

  openGraph: {
    title: 'REDLINER // MERC.OS',
    description:
      'MERC.OS | Mercenary Engagement & Reconnaissance Command Operating System.',
    url: 'https://redliner.online',
    siteName: 'REDLINER // MERC.OS',
    type: 'website',

    images: [
      {
        url: 'https://redliner.online/mercos.png',
        width: 1200,
        height: 630,
        alt: 'MERC.OS',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'REDLINER // MERC.OS',
    description:
      'MERC.OS | Mercenary Engagement & Reconnaissance Command Operating System.',
    images: ['https://redliner.online/mercos.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistMono.variable} ${display.variable} bg-background`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
