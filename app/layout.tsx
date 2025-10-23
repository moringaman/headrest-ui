import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import PaymentNotification from '@/components/payment-notification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Suede - Modern APIs for PrestaShop Stores',
  description: 'Transform your PrestaShop store with modern headless commerce APIs and React frontends',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <PaymentNotification />
        </Providers>
      </body>
    </html>
  )
}