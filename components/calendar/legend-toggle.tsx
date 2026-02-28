'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { FilterKey } from './calendar-types'

export function LegendToggle({ filterKey, label, shape, cls, border, active, onToggle }: {
  filterKey: FilterKey; label: string; shape: 'bar' | 'square' | 'circle' | 'outline-circle'
  cls: string; border?: boolean; active: boolean; onToggle: (k: FilterKey) => void
}) {
  return (
    <button type="button" onClick={() => onToggle(filterKey)}
      className={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all',
        active ? 'hover:bg-foreground/[0.03]' : 'opacity-35 hover:opacity-55',
      )}>
      <div className={cn('flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-[2px] border transition-colors',
        active ? 'border-foreground/35' : 'border-foreground/15',
      )}>
        {active && <Check className="h-[8px] w-[8px] text-foreground/45" strokeWidth={2.5} />}
      </div>
      <div className={cn(
        'shrink-0 transition-opacity',
        shape === 'bar' && 'h-[7px] w-[12px] rounded-[2px]',
        shape === 'square' && 'h-[6px] w-[6px] rounded-[1px]',
        shape === 'circle' && 'h-[6px] w-[6px] rounded-full',
        shape === 'outline-circle' && 'h-[6px] w-[6px] rounded-full border-[1.5px]',
        cls,
        border && 'border border-violet-500/20',
        !active && 'opacity-30',
      )} />
      <span className={cn('text-[11px] transition-colors', active ? 'font-medium text-foreground/70' : 'text-foreground/25')}>{label}</span>
    </button>
  )
}
