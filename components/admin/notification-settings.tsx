'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import { useRoleStore, type AppRole } from '@/lib/role-store'
import {
  type NotificationConfig,
  type NotificationType,
  type RecipientRole,
  NOTIFICATION_TYPE_CONFIG,
} from '@/lib/admin-mock-data'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Info, Zap, Bell, AlertTriangle, Clock, Shield, Lock, User, MessageSquare, Slack } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  operator_manager: '총괄',
  operator: '운영',
  learning_manager: '학관',
}

function canEditAlert(role: AppRole, recipients: RecipientRole[]): boolean {
  if (role === 'operator_manager') return true
  if (role === 'operator') return recipients.includes('operator')
  return false
}

function canEditThreshold(role: AppRole, target: string): boolean {
  if (role === 'operator_manager') return true
  if (role === 'operator') return target === '운영'
  return false
}

const THRESHOLD_FIELDS: {
  key: keyof NotificationConfig['thresholds']
  label: string
  unit: string
  description: string
  target: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'staffCompletionRate', label: '학관 업무완료율', unit: '%', description: '오후 2시 기준, 이 비율 미만이면 담당 운영매에게 알림', target: '운영', min: 10, max: 90, step: 5 },
  { key: 'operatorCompletionRate', label: '운영 업무완료율', unit: '%', description: '오후 2시 기준, 이 비율 미만이면 총괄에게 알림', target: '총괄', min: 10, max: 90, step: 5 },
  { key: 'pendingIssueCount', label: '미처리 이슈 누적', unit: '건', description: '미처리 이슈가 이 수치 이상이면 운영매에게 알림', target: '운영', min: 1, max: 10, step: 1 },
  { key: 'unreadMessageCount', label: '안읽은 메시지 누적', unit: '건', description: '안읽은 메시지가 이 수치 이상이면 알림', target: '총괄', min: 1, max: 20, step: 1 },
  { key: 'overdueTaskCount', label: '기한초과 Task 누적', unit: '건', description: 'overdue Task가 이 수치 이상이면 운영매에게 알림', target: '운영', min: 1, max: 10, step: 1 },
]

const DIGEST_OPTIONS: { value: NotificationConfig['digestMode']; label: string; description: string; icon: typeof Clock }[] = [
  { value: 'realtime', label: '실시간', description: '이벤트 발생 즉시 알림', icon: Zap },
  { value: 'hourly', label: '1시간 요약', description: '매시 정각에 모아서 알림', icon: Clock },
  { value: 'daily', label: '일일 요약', description: '매일 오전 9시에 요약', icon: Bell },
]

const CATEGORY_LABELS: Record<string, { label: string; description: string; icon: typeof Bell }> = {
  system: { label: '시스템 자동 알림', description: '상태 변화를 자동 감지하여 발송', icon: Shield },
  action: { label: '액션 기반 알림', description: '사용자 행동에 의해 발생하는 알림', icon: Bell },
  threshold: { label: '임계치 알림', description: '설정된 수치를 초과하면 발송', icon: AlertTriangle },
}

const CATEGORY_ORDER = ['system', 'action', 'threshold'] as const

function groupByCategory() {
  const groups: Record<string, { type: NotificationType; label: string; description: string; recipients: RecipientRole[] }[]> = {
    system: [],
    action: [],
    threshold: [],
  }
  for (const [type, cfg] of Object.entries(NOTIFICATION_TYPE_CONFIG)) {
    groups[cfg.category].push({
      type: type as NotificationType,
      label: cfg.label,
      description: cfg.description,
      recipients: cfg.recipients,
    })
  }
  return groups
}

function SectionCard({ title, description, icon: Icon, locked, children }: {
  title: string; description?: string; icon?: typeof Bell; locked?: boolean; children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border bg-card', locked ? 'border-border/60' : 'border-border')}>
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Lock className="h-2.5 w-2.5" /> 총괄만 수정 가능
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>}
      </div>
      <div className={cn('px-5 py-4', locked && 'opacity-70')}>{children}</div>
    </div>
  )
}

function SliderRow({
  label, unit, description, target, value, min, max, step, onChange, disabled,
}: {
  label: string; unit: string; description: string; target: string
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; disabled?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-2 py-3', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{label}</span>
            <span className="rounded bg-foreground/[0.06] px-1.5 py-px text-[9px] font-medium text-muted-foreground">
              → {target}
            </span>
            {disabled && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
          </div>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="min-w-[3ch] text-right text-[15px] font-bold tabular-nums text-foreground">{value}</span>
          <span className="text-[11px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-full items-center">
          <div className="h-1.5 w-full rounded-full bg-foreground/[0.06]">
            <div className="h-full rounded-full bg-foreground/20 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'relative z-10 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground/30 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:border-foreground/50',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function RecipientBadges({ recipients }: { recipients: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {recipients.map((r) => (
        <span key={r} className="inline-flex items-center gap-0.5 rounded bg-foreground/[0.05] px-1.5 py-px text-[9px] font-medium text-muted-foreground">
          <User className="h-2 w-2" />
          {ROLE_LABEL[r] ?? r}
        </span>
      ))}
    </div>
  )
}

function Toggle({
  checked, disabled, onChange, label, description, recipients,
}: {
  checked: boolean; disabled?: boolean; onChange: (v: boolean) => void
  label: string; description: string; recipients: string[]
}) {
  return (
    <div className={cn(
      'flex items-start justify-between gap-3 rounded-lg px-3 py-3 transition-colors',
      disabled ? 'opacity-40' : 'hover:bg-secondary/30',
    )}>
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">{label}</span>
          {disabled && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">{description}</p>
        <RecipientBadges recipients={recipients} />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-foreground' : 'bg-foreground/15',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span className={cn(
          'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
          checked && 'translate-x-4',
        )} />
      </button>
    </div>
  )
}

function InfoTooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-muted-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-lg">
          <div className="text-[11px] leading-relaxed text-foreground/80">{children}</div>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </span>
  )
}

export function NotificationSettings() {
  const {
    plannerTracks,
    notificationConfigs,
    updateNotificationConfig,
    toastSettings,
    updateToastSetting,
    slackSettings,
    updateSlackSetting,
  } = useAdminStore()
  const currentRole = useRoleStore((s) => s.currentRole)
  const [selectedTrackId, setSelectedTrackId] = useState(plannerTracks[0]?.id ?? 'track1')

  const isManager = currentRole === 'operator_manager'
  const isOperatorOrManager = currentRole === 'operator_manager' || currentRole === 'operator'
  const config = notificationConfigs.find((c) => c.trackId === selectedTrackId)
  const alertGroups = useMemo(groupByCategory, [])

  const update = useCallback(
    (updates: Partial<Omit<NotificationConfig, 'trackId'>>) => {
      updateNotificationConfig(selectedTrackId, updates)
    },
    [selectedTrackId, updateNotificationConfig],
  )

  const updateThreshold = useCallback(
    (key: keyof NotificationConfig['thresholds'], value: number) => {
      if (!config) return
      update({ thresholds: { ...config.thresholds, [key]: value } })
    },
    [config, update],
  )

  const updateEscalation = useCallback(
    (key: keyof NotificationConfig['escalation'], value: number) => {
      if (!config) return
      update({ escalation: { ...config.escalation, [key]: value } })
    },
    [config, update],
  )

  const toggleAlert = useCallback(
    (type: string) => {
      if (!config) return
      const disabled = config.disabledOptionalAlerts.includes(type)
        ? config.disabledOptionalAlerts.filter((t) => t !== type)
        : [...config.disabledOptionalAlerts, type]
      update({ disabledOptionalAlerts: disabled })
    },
    [config, update],
  )

  if (!config) return null

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
        <Link href="/admin" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight text-foreground">알림 설정</h1>
          <p className="text-[11px] text-muted-foreground">
            트랙별 알림 정책을 설정합니다
            {!isManager && (
              <span className="ml-1.5 text-amber-600">· 운영매는 본인 수신 알림만 설정 가능</span>
            )}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 pt-6 pb-24">
          {/* Track selector */}
          <div className="mb-6 flex gap-2">
            {plannerTracks.map((track) => (
              <button
                key={track.id} type="button"
                onClick={() => setSelectedTrackId(track.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  selectedTrackId === track.id
                    ? 'border-foreground/20 bg-card text-foreground shadow-sm'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                {track.name}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {/* ── 에스컬레이션 ── */}
            <SectionCard
              title="에스컬레이션"
              description="운영매가 알림을 받고도 설정 시간 내에 조치하지 않으면, 자동으로 총괄에게 에스컬레이션됩니다."
              icon={AlertTriangle}
              locked={!isManager}
            >
              <div className="space-y-5">
                {/* Visual flow */}
                <div className="rounded-lg bg-foreground/[0.025] px-4 py-4">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-lg bg-blue-500/10 px-3.5 py-2 text-[12px] font-semibold text-blue-700">학관</div>
                      <span className="text-[9px] text-muted-foreground">업무 수행</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-px w-5 bg-foreground/15" />
                        <span className="text-[10px] text-muted-foreground">이벤트</span>
                        <ArrowRight className="h-3 w-3 text-foreground/25" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-lg bg-amber-500/10 px-3.5 py-2 text-[12px] font-semibold text-amber-700">운영매</div>
                      <span className="text-[9px] text-muted-foreground">1차 알림</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-px w-3 bg-foreground/15" />
                        <div className="flex items-center gap-0.5 rounded-full border border-destructive/20 bg-destructive/5 px-2 py-0.5">
                          <Clock className="h-2.5 w-2.5 text-destructive/60" />
                          <span className="text-[10px] font-semibold tabular-nums text-destructive/70">
                            {config.escalation.operatorToManagerHours}h
                          </span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-destructive/40" />
                      </div>
                      <span className="text-[9px] text-destructive/50">미조치</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-lg bg-red-500/10 px-3.5 py-2 text-[12px] font-semibold text-red-700">총괄</div>
                      <span className="text-[9px] text-muted-foreground">에스컬레이션</span>
                    </div>
                  </div>
                </div>

                {/* Escalation inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                      운영매 → 총괄 에스컬레이션
                      <InfoTooltip>
                        <p className="font-semibold">운영매에게 알림이 전달된 후, 이 시간 내에 조치하지 않으면 총괄에게 자동으로 에스컬레이션됩니다.</p>
                        <p className="mt-1.5 text-muted-foreground">대상: 기한초과, 미배정, 확인요청 미처리</p>
                        <div className="mt-2 rounded bg-destructive/5 px-2 py-1">
                          <p className="font-medium text-destructive">긴급(urgent) Task는 이 시간의 1/4로 단축됩니다.</p>
                          <p className="text-muted-foreground">예: {config.escalation.operatorToManagerHours}시간 → {Math.ceil(config.escalation.operatorToManagerHours / 4)}시간</p>
                        </div>
                      </InfoTooltip>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} max={48}
                        value={config.escalation.operatorToManagerHours}
                        disabled={!isManager}
                        onChange={(e) => updateEscalation('operatorToManagerHours', Math.max(1, Math.min(48, Number(e.target.value))))}
                        className={cn(
                          'h-9 w-20 rounded-md border border-border bg-background px-3 text-center text-[13px] font-medium tabular-nums text-foreground outline-none transition-colors focus:border-foreground/30',
                          !isManager && 'cursor-not-allowed bg-foreground/[0.03]',
                        )}
                      />
                      <span className="text-[12px] text-muted-foreground">시간</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50">
                      긴급 Task: <span className="font-semibold text-destructive/60">{Math.ceil(config.escalation.operatorToManagerHours / 4)}시간</span>으로 단축
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                      학관 이벤트 → 운영매 전달
                      <InfoTooltip>
                        <p className="font-semibold">학관의 Task 상태 변화(기한초과, 미배정 등)가 발생하면 운영매에게 즉시 알림이 전달됩니다.</p>
                        <p className="mt-1.5 text-muted-foreground">이 시간은 임계치 알림의 에스컬레이션 대기 시간 참고값입니다.</p>
                      </InfoTooltip>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} max={24}
                        value={config.escalation.staffToOperatorHours}
                        disabled={!isManager}
                        onChange={(e) => updateEscalation('staffToOperatorHours', Math.max(1, Math.min(24, Number(e.target.value))))}
                        className={cn(
                          'h-9 w-20 rounded-md border border-border bg-background px-3 text-center text-[13px] font-medium tabular-nums text-foreground outline-none transition-colors focus:border-foreground/30',
                          !isManager && 'cursor-not-allowed bg-foreground/[0.03]',
                        )}
                      />
                      <span className="text-[12px] text-muted-foreground">시간</span>
                    </div>
                  </div>
                </div>

                {/* Info boxes */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg bg-foreground/[0.03] px-3 py-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <div className="text-[11px] leading-relaxed text-muted-foreground">
                      <p>에스컬레이션 대상: <span className="font-medium text-foreground/60">기한초과, 미배정, 확인요청 미처리, 학관 완료율 저조</span></p>
                      <p className="mt-0.5">"조치" 판정: Task 완료/미루기, 배정 처리, 리뷰 승인/반려 시 타이머 해제</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/[0.03] px-3 py-2.5">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/50" />
                    <div className="text-[11px] leading-relaxed text-muted-foreground">
                      <p><span className="font-semibold text-destructive/70">긴급(urgent) Task 특별 처리:</span></p>
                      <p className="mt-0.5">에스컬레이션 시간 1/4 단축 · 담당자+운영매 동시 알림 · 수신 모드 무시(항상 실시간) · 방해금지 시간 무시</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 알림 타입별 ON/OFF ── */}
            <SectionCard
              title="알림 타입별 설정"
              description={isManager
                ? '모든 알림의 수신 여부를 설정할 수 있습니다.'
                : '본인이 수신하는 알림만 ON/OFF를 변경할 수 있습니다. 다른 역할의 알림은 총괄이 관리합니다.'
              }
              icon={Bell}
            >
              <div className="space-y-5">
                {CATEGORY_ORDER.map((cat) => {
                  const catConfig = CATEGORY_LABELS[cat]
                  return (
                    <div key={cat}>
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <catConfig.icon className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {catConfig.label}
                        </span>
                        <InfoTooltip>{catConfig.description}</InfoTooltip>
                      </div>
                      <div className="divide-y divide-border/50 rounded-lg border border-border/50">
                        {alertGroups[cat].map(({ type, label, description, recipients }) => {
                          const editable = canEditAlert(currentRole, recipients)
                          const isEnabled = !config.disabledOptionalAlerts.includes(type)
                          return (
                            <Toggle
                              key={type}
                              label={label}
                              description={description}
                              recipients={recipients}
                              checked={isEnabled}
                              disabled={!editable}
                              onChange={() => toggleAlert(type)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* ── 임계치 ── */}
            <SectionCard
              title="임계치 설정"
              description="기준치를 초과하면 자동으로 알림이 발송됩니다."
              icon={AlertTriangle}
            >
              <div className="divide-y divide-border">
                {THRESHOLD_FIELDS.map((field) => {
                  const editable = canEditThreshold(currentRole, field.target)
                  return (
                    <SliderRow
                      key={field.key}
                      label={field.label}
                      unit={field.unit}
                      description={field.description}
                      target={field.target}
                      value={config.thresholds[field.key]}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      disabled={!editable}
                      onChange={(v) => updateThreshold(field.key, v)}
                    />
                  )
                })}
              </div>
            </SectionCard>

            {/* ── 수신 모드 ── */}
            <SectionCard
              title="수신 모드"
              description="알림을 받는 방식과 방해금지 시간을 설정합니다."
              icon={Clock}
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-muted-foreground">알림 수신 방식</span>
                    <InfoTooltip>
                      <p>긴급(urgent) Task 알림은 수신 모드와 무관하게 <span className="font-semibold text-destructive">항상 실시간</span>으로 전달됩니다.</p>
                    </InfoTooltip>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {DIGEST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => update({ digestMode: opt.value })}
                        className={cn(
                          'flex flex-col items-start rounded-lg border px-3 py-3 transition-colors',
                          config.digestMode === opt.value
                            ? 'border-foreground/20 bg-foreground/[0.04] shadow-sm'
                            : 'border-border hover:border-foreground/10 hover:bg-secondary/30',
                        )}
                      >
                        <opt.icon className={cn('mb-1.5 h-4 w-4', config.digestMode === opt.value ? 'text-foreground' : 'text-muted-foreground/40')} />
                        <div className="text-[13px] font-medium text-foreground">{opt.label}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-muted-foreground">방해금지 시간</span>
                        <InfoTooltip>
                          <p>이 시간대에는 브라우저 푸시 알림을 보내지 않습니다. 인앱 피드에는 정상적으로 누적됩니다.</p>
                          <p className="mt-1.5 text-destructive">긴급(urgent) Task 알림은 방해금지를 무시하고 항상 전달됩니다.</p>
                        </InfoTooltip>
                      </div>
                      <p className="text-[11px] text-muted-foreground/60">설정 시간에는 푸시 알림을 보내지 않습니다</p>
                    </div>
                    <button
                      type="button" role="switch"
                      aria-checked={config.quietHours !== null}
                      onClick={() => update({ quietHours: config.quietHours ? null : { start: '22:00', end: '08:00' } })}
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                        config.quietHours ? 'bg-foreground' : 'bg-foreground/15',
                      )}
                    >
                      <span className={cn(
                        'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                        config.quietHours && 'translate-x-4',
                      )} />
                    </button>
                  </div>

                  {config.quietHours && (
                    <div className="flex items-center gap-3 rounded-lg bg-foreground/[0.03] px-4 py-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">시작</label>
                        <input
                          type="time" value={config.quietHours.start}
                          onChange={(e) => update({ quietHours: { ...config.quietHours!, start: e.target.value } })}
                          className="h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-foreground/30"
                        />
                      </div>
                      <span className="mt-4 text-[12px] text-muted-foreground">~</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">종료</label>
                        <input
                          type="time" value={config.quietHours.end}
                          onChange={(e) => update({ quietHours: { ...config.quietHours!, end: e.target.value } })}
                          className="h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-foreground/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
