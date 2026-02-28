import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { FloatingCommWidget } from '@/components/comm/floating-comm-widget'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'EduWorks 학습관리 대시보드',
  description: '학습관리매니저 대시보드 - Task 관리, 관리자 대시보드, 트랙 관리',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
        <FloatingCommWidget />
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
