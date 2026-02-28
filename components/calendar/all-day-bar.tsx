'use client'

import { cn } from '@/lib/utils'
import type { SpanBar } from './calendar-types'
import { getBarStyle } from './calendar-utils'

export function AllDayBarRenderer({ bar, cols, rowHeight, highlightIds }: { bar: SpanBar; cols: number; rowHeight: number; highlightIds?: Set<string> }) {
  const style = getBarStyle(bar)
  const isHighlighted = highlightIds?.has(bar.id)
  const topOffset = bar.row * rowHeight + 1
  const pos = {
    left: `${(bar.startCol / cols) * 100}%`,
    width: `${(bar.span / cols) * 100}%`,
    top: `${topOffset}px`,
    height: `${rowHeight - 2}px`,
  }

  const highlightCls = isHighlighted
    ? 'animate-calendar-highlight ring-2 ring-violet-400/60 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
    : ''

  if (bar.layer === 'chapter') {
    return (
      <div className="absolute flex items-center" style={pos}>
        <div className="mx-1 flex h-full w-full items-center gap-1.5 overflow-hidden">
          <div className="h-[1.5px] min-w-[6px] flex-1 rounded-full bg-foreground/[0.1]" />
          <span className="shrink-0 text-[11px] font-medium text-foreground/25">{bar.label}</span>
          <div className="h-[1.5px] min-w-[6px] flex-1 rounded-full bg-foreground/[0.1]" />
        </div>
      </div>
    )
  }

  if (bar.layer === 'operation') {
    return (
      <div className={cn('absolute flex items-center transition-all duration-500', highlightCls)} style={pos}>
        <div className={cn('mx-1 flex h-full w-full items-center truncate rounded-[4px] border border-violet-500/15', style.bg)}>
          <span className={cn('truncate px-2 text-[11px] font-medium', style.text)}>{bar.label}</span>
        </div>
      </div>
    )
  }

  if (bar.layer === 'period_task') {
    return (
      <div className={cn('absolute flex items-center transition-all duration-500', highlightCls)} style={pos}>
        <div className={cn('mx-1 flex h-full w-full items-center gap-1 truncate rounded-[4px] px-1.5', style.bg)}>
          <div className={cn('h-1.5 w-1.5 shrink-0', bar.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
          <span className={cn('truncate text-[11px] font-medium', style.text)}>{bar.label}</span>
          {bar.dateLabel && <span className="ml-auto shrink-0 text-[9px] tabular-nums text-foreground/25">{bar.dateLabel}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('absolute flex items-center transition-all duration-500', highlightCls)} style={pos}>
      <div className={cn('mx-1 flex h-full w-full items-center truncate rounded-[4px]', style.bg)}>
        <span className={cn('truncate px-2 text-[11px] font-semibold', style.text)}>{bar.label}</span>
      </div>
    </div>
  )
}
