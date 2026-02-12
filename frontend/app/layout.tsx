import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import './globals.css'

// Fuentes: Inter para body, Space Grotesk para títulos
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

// Metadata para SEO
export const metadata: Metadata = {
  title: 'CompraBTC - Ahorra en Bitcoin sin complicaciones',
  description: 'Acumula Bitcoin de forma automática con compras pequeñas y constantes. Sin necesidad de entender de cripto.',
  generator: 'CompraBTC',
  manifest: '/manifest.json',
  keywords: ['bitcoin', 'DCA', 'ahorro', 'inversión', 'colombia', 'cripto'],
  authors: [{ name: 'CompraBTC' }],
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CompraBTC',
  },
  formatDetection: {
    telephone: false,
  },
}

// Viewport para PWA mobile
export const viewport: Viewport = {
  themeColor: '#F7931A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background">
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  )
}
