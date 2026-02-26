'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import {
  type NotificationConfig,
  type NotificationType,
  NOTIFICATION_TYPE_CONFIG,
} from '@/lib/admin-mock-data'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THRESHOLD_FIELDS: {
  key: keyof NotificationConfig['thresholds']
  label: string
  unit: string
  description: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'staffCompletionRate', label: '학관 업무완료율 기준', unit: '%', description: '오후 2시 기준, 이 비율 미만이면 담당 운영에게 알림', min: 10, max: 90, step: 5 },
  { key: 'operatorCompletionRate', label: '운영 업무완료율 기준', unit: '%', description: '오후 2시 기준, 이 비율 미만이면 총괄에게 알림', min: 10, max: 90, step: 5 },
  { key: 'pendingIssueCount', label: '미처리 이슈 누적', unit: '건', description: '미처리(pending) 이슈가 이 수치 이상이면 알림', min: 1, max: 10, step: 1 },
  { key: 'unreadMessageCount', label: '안읽은 메시지 누적', unit: '건', description: '안읽은 메시지가 이 수치 이상이면 알림', min: 1, max: 20, step: 1 },
  { key: 'overdueTaskCount', label: '기한초과 Task 누적', unit: '건', description: 'overdue 상태 Task가 이 수치 이상이면 알림', min: 1, max: 10, step: 1 },
]

const DIGEST_OPTIONS: { value: NotificationConfig['digestMode']; label: string; description: string }[] = [
  { value: 'realtime', label: '실시간', description: '이벤트 발생 즉시 알림' },
  { value: 'hourly', label: '1시간 요약', description: '매시 정각에 모아서 알림' },
  { value: 'daily', label: '일일 요약', description: '매일 오전 9시에 모아서 알림' },
]

const CATEGORY_LABELS: Record<string, string> = {
  system: '시스템 자동 알림',
  action: '액션 기반 알림',
  threshold: '임계치 알림',
}

const CATEGORY_ORDER = ['system', 'action', 'threshold'] as const

function groupByCategory() {
  const groups: Record<string, { type: NotificationType; label: string; isMandatory: boolean }[]> = {
    system: [],
    action: [],
    threshold: [],
  }
  for (const [type, cfg] of Object.entries(NOTIFICATION_TYPE_CONFIG)) {
    groups[cfg.category].push({ type: type as NotificationType, label: cfg.label, isMandatory: cfg.isMandatory })
  }
  return groups
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function SliderRow({
  label, unit, description, value, min, max, step, onChange,
}: {
  label: string; unit: string; description: string
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[13px] font-medium text-foreground">{label}</span>
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
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground/30 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:border-foreground/50"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function Toggle({
  checked, disabled, onChange, label, badge,
}: {
  checked: boolean; disabled?: boolean; onChange: (v: boolean) => void
  label: string; badge?: string
}) {
  return (
    <label className={cn(
      'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
      disabled ? 'opacity-60' : 'hover:bg-secondary/30 cursor-pointer',
    )}>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-foreground">{label}</span>
        {badge && (
          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-foreground' : 'bg-foreground/15',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span className={cn(
          'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
          checked && 'translate-x-4',
        )} />
      </button>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NotificationSettings() {
  const { plannerTracks, notificationConfigs, updateNotificationConfig } = useAdminStore()
  const [selectedTrackId, setSelectedTrackId] = useState(plannerTracks[0]?.id ?? 'track1')

  const config = notificationConfigs.find((c) => c.trackId === selectedTrackId)
  const alertGroups = groupByCategory()

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
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
        <Link
          href="/admin"
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">알림 설정</h1>
        <span className="text-[11px] text-muted-foreground">트랙별 알림 정책을 설정합니다</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-6">
          {/* Track Tabs */}
          <div className="mb-6 flex gap-2">
            {plannerTracks.map((track) => (
              <button
                key={track.id}
                type="button"
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
            {/* Section 1: Thresholds */}
            <SectionCard title="임계치 설정" description="기준치를 초과하면 자동으로 알림이 발송됩니다">
              <div className="divide-y divide-border">
                {THRESHOLD_FIELDS.map((field) => (
                  <SliderRow
                    key={field.key}
                    label={field.label}
                    unit={field.unit}
                    description={field.description}
                    value={config.thresholds[field.key]}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(v) => updateThreshold(field.key, v)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Section 2: Escalation */}
            <SectionCard title="에스컬레이션 설정" description="지정 시간 내 미처리 시 상위 역할에게 자동 에스컬레이션됩니다">
              <div className="space-y-5">
                {/* Visual flow */}
                <div className="flex items-center justify-center gap-3 rounded-lg bg-foreground/[0.03] px-4 py-5">
                  <div className="rounded-md bg-foreground/[0.06] px-3 py-1.5 text-[12px] font-medium text-foreground">
                    학관
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="h-px w-6 bg-foreground/20" />
                    <div className="flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5">
                      <span className="text-[11px] font-semibold tabular-nums text-foreground">
                        {config.escalation.staffToOperatorHours}
                      </span>
                      <span className="text-[10px] text-muted-foreground">시간</span>
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="rounded-md bg-foreground/[0.06] px-3 py-1.5 text-[12px] font-medium text-foreground">
                    운영
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="h-px w-6 bg-foreground/20" />
                    <div className="flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5">
                      <span className="text-[11px] font-semibold tabular-nums text-foreground">
                        {config.escalation.operatorToManagerHours}
                      </span>
                      <span className="text-[10px] text-muted-foreground">시간</span>
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="rounded-md bg-foreground/[0.06] px-3 py-1.5 text-[12px] font-medium text-foreground">
                    총괄
                  </div>
                </div>

                {/* Escalation inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground">
                      학관 → 운영 에스컬레이션
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={config.escalation.staffToOperatorHours}
                        onChange={(e) => updateEscalation('staffToOperatorHours', Math.max(1, Math.min(24, Number(e.target.value))))}
                        className="h-9 w-20 rounded-md border border-border bg-background px-3 text-center text-[13px] font-medium tabular-nums text-foreground outline-none transition-colors focus:border-foreground/30"
                      />
                      <span className="text-[12px] text-muted-foreground">시간 후 에스컬레이션</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground">
                      운영 → 총괄 에스컬레이션
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={48}
                        value={config.escalation.operatorToManagerHours}
                        onChange={(e) => updateEscalation('operatorToManagerHours', Math.max(1, Math.min(48, Number(e.target.value))))}
                        className="h-9 w-20 rounded-md border border-border bg-background px-3 text-center text-[13px] font-medium tabular-nums text-foreground outline-none transition-colors focus:border-foreground/30"
                      />
                      <span className="text-[12px] text-muted-foreground">시간 후 에스컬레이션</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-foreground/[0.03] px-3 py-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    30분 단위로 체크합니다. 에스컬레이션 시 원본 알림에 &ldquo;에스컬레이션됨&rdquo; 표시가 추가되고, 상위 역할에게 새 알림이 발송됩니다.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Section 3: Alert ON/OFF */}
            <SectionCard title="알림 ON/OFF" description="알림 타입별로 수신 여부를 설정합니다. 필수 알림은 끌 수 없습니다.">
              <div className="space-y-4">
                {CATEGORY_ORDER.map((cat) => (
                  <div key={cat}>
                    <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="divide-y divide-border/50 rounded-lg border border-border/50">
                      {alertGroups[cat].map(({ type, label, isMandatory }) => {
                        const isEnabled = !config.disabledOptionalAlerts.includes(type)
                        return (
                          <Toggle
                            key={type}
                            label={label}
                            badge={isMandatory ? '필수' : undefined}
                            checked={isMandatory || isEnabled}
                            disabled={isMandatory}
                            onChange={() => toggleAlert(type)}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Section 4: Digest Mode + Quiet Hours */}
            <SectionCard title="수신 모드" description="알림을 받는 방식과 방해금지 시간을 설정합니다">
              <div className="space-y-5">
                {/* Digest mode */}
                <div className="space-y-2">
                  <span className="text-[12px] font-medium text-muted-foreground">알림 수신 방식</span>
                  <div className="grid grid-cols-3 gap-2">
                    {DIGEST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update({ digestMode: opt.value })}
                        className={cn(
                          'rounded-lg border px-3 py-3 text-left transition-colors',
                          config.digestMode === opt.value
                            ? 'border-foreground/20 bg-foreground/[0.04] shadow-sm'
                            : 'border-border hover:border-foreground/10 hover:bg-secondary/30',
                        )}
                      >
                        <div className="text-[13px] font-medium text-foreground">{opt.label}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quiet hours */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium text-muted-foreground">방해금지 시간</span>
                      <p className="text-[11px] text-muted-foreground/60">설정 시간 동안 알림을 보내지 않습니다</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.quietHours !== null}
                      onClick={() => {
                        update({
                          quietHours: config.quietHours ? null : { start: '22:00', end: '08:00' },
                        })
                      }}
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
                          type="time"
                          value={config.quietHours.start}
                          onChange={(e) => update({ quietHours: { ...config.quietHours!, start: e.target.value } })}
                          className="h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-foreground/30"
                        />
                      </div>
                      <span className="mt-4 text-[12px] text-muted-foreground">~</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">종료</label>
                        <input
                          type="time"
                          value={config.quietHours.end}
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
