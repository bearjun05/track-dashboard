'use client'

import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  PlusCircle,
  Bell,
  Settings,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react'

const adminMenus = [
  {
    id: 'create-track',
    label: '트랙 생성',
    description: '새 트랙을 만들고 인원 배정, Task 생성까지 한 번에 진행합니다.',
    icon: PlusCircle,
    href: '/admin/tracks/new',
  },
  {
    id: 'notification-settings',
    label: '알림 설정',
    description: '트랙별 알림 정책, 임계치, 에스컬레이션 시간 등을 설정합니다.',
    icon: Bell,
    href: '#',
    disabled: true,
  },
  {
    id: 'track-management',
    label: '트랙 관리',
    description: '기존 트랙의 설정 변경, 인원 변경, Task 템플릿 수정을 처리합니다.',
    icon: FolderOpen,
    href: '#',
    disabled: true,
  },
  {
    id: 'system-settings',
    label: '시스템 설정',
    description: '역할 라벨, 기본값, 시스템 전반 설정을 관리합니다.',
    icon: Settings,
    href: '#',
    disabled: true,
  },
]

export default function AdminPage() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
        <Link
          href="/manager"
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">
          시스템 관리
        </h1>
        <span className="text-xs text-muted-foreground">
          {ROLE_LABELS.operator_manager} 전용
        </span>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground">관리 메뉴</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            트랙 생성, 알림 정책, 시스템 설정 등을 관리합니다.
          </p>
        </div>

        <div className="grid gap-4">
          {adminMenus.map((menu) => {
            const Icon = menu.icon
            const isDisabled = 'disabled' in menu && menu.disabled

            if (isDisabled) {
              return (
                <div
                  key={menu.id}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{menu.label}</h3>
                      <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">
                        준비중
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">{menu.description}</p>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={menu.id}
                href={menu.href}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-secondary/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                  <Icon className="h-5 w-5 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{menu.label}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{menu.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
