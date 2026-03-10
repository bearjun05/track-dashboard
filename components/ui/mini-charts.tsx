'use client'

import { LineChart, Line, BarChart, Bar, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'

const DROPOUT_DATA = [
  { month: '1월', rate: 5.2 },
  { month: '2월', rate: 4.8 },
  { month: '3월', rate: 3.5 },
]

const NPS_DATA = [
  { month: '1월', score: 42 },
  { month: '2월', score: 48 },
  { month: '3월', score: 55 },
]

function MiniTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-foreground/[0.08] bg-background px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-foreground/60">{label}</p>
      <p className="text-[11px] font-semibold text-foreground">{payload[0].value}{suffix}</p>
    </div>
  )
}

function TrendBadge({ current, previous, inverted = false }: { current: number; previous: number; inverted?: boolean }) {
  const diff = current - previous
  const isPositive = inverted ? diff < 0 : diff > 0
  const Icon = diff < 0 ? TrendingDown : TrendingUp

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1 py-px text-[8px] font-semibold ${
      isPositive
        ? 'bg-emerald-500/10 text-emerald-600'
        : diff === 0
          ? 'bg-foreground/[0.04] text-foreground/40'
          : 'bg-red-500/10 text-red-500'
    }`}>
      <Icon className="h-2 w-2" />
      {Math.abs(diff).toFixed(diff % 1 === 0 ? 0 : 1)}
    </span>
  )
}

export function MetricsBox() {
  const lastDropout = DROPOUT_DATA[DROPOUT_DATA.length - 1]
  const prevDropout = DROPOUT_DATA[DROPOUT_DATA.length - 2]
  const lastNps = NPS_DATA[NPS_DATA.length - 1]
  const prevNps = NPS_DATA[NPS_DATA.length - 2]

  return (
    <div className="flex items-stretch gap-0 rounded-xl border border-foreground/[0.07] bg-gradient-to-b from-foreground/[0.02] to-foreground/[0.04] shadow-sm">
      {/* Dropout Rate */}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground/40">이탈율</span>
          <TrendBadge current={lastDropout.rate} previous={prevDropout.rate} inverted />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-[18px] font-bold tabular-nums leading-none text-foreground">{lastDropout.rate}<span className="text-[11px] font-medium text-foreground/40">%</span></span>
          <div className="h-[28px] w-[56px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DROPOUT_DATA} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="dropoutGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <RTooltip content={<MiniTooltip suffix="%" />} />
                <Line type="monotone" dataKey="rate" stroke="url(#dropoutGrad)" strokeWidth={2} dot={{ r: 2, fill: 'rgb(34 197 94)', strokeWidth: 0 }} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <span className="text-[8px] text-foreground/30">{lastDropout.month} 기준</span>
      </div>

      <div className="my-2 w-px bg-foreground/[0.08]" />

      {/* NPS */}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground/40">NPS</span>
          <TrendBadge current={lastNps.score} previous={prevNps.score} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-[18px] font-bold tabular-nums leading-none text-foreground">{lastNps.score}</span>
          <div className="h-[28px] w-[56px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={NPS_DATA} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <RTooltip content={<MiniTooltip />} />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {NPS_DATA.map((_, index) => (
                    <Cell key={index} fill={index === NPS_DATA.length - 1 ? 'rgb(99 102 241)' : 'rgba(99, 102, 241, 0.25)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <span className="text-[8px] text-foreground/30">{lastNps.month} 기준</span>
      </div>
    </div>
  )
}
