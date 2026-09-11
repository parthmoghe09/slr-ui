import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'CEAT SLR Intelligence', description: 'Engineering-grade sea level rise prediction and model operations workspace.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#0D9488', userScalable: false }

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang='en'><body className='antialiased'>{children}{process.env.NODE_ENV==='production'&&<Analytics/>}</body></html> }
