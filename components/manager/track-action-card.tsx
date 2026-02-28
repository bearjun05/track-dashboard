'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'

export interface ActionCardItem {
  id: string
  title: string
  subtitle?: string
  linkTo: string
}

interface TrackActionCardProps {
  trackName: string
  trackColor: string
  trackId: string
  count: number
  items: ActionCardItem[]
  filterParam: string
}

export function TrackActionCard({
  trackName,
  trackColor,
  trackId,
  count,
  items,
  filterParam,
}: TrackActionCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isEmpty = count === 0

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${
        isEmpty
          ? 'border-border/50 opacity-50'
          : isOpen
            ? 'border-foreground/10 shadow-sm'
            : 'border-border hover:border-foreground/10'
      }`}
    >
      <button
        type="button"
        onClick={() => !isEmpty && setIsOpen(!isOpen)}
        disabled={isEmpty}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span
          className="inline-flex shrink-0 items-center rounded-full px-2 py-[1px] text-[10px] font-semibold"
          style={{ backgroundColor: `${trackColor}15`, color: trackColor }}
        >
          {trackName}
        </span>
        <span className="flex-1" />
        <span className={`text-xs font-semibold tabular-nums ${isEmpty ? 'text-muted-foreground/50' : 'text-foreground'}`}>
          {count}건
        </span>
        {!isEmpty && (
          isOpen
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </button>

      {isOpen && items.length > 0 && (
        <div className="border-t border-border/50 px-3 pb-2 pt-1">
          <div className="space-y-0.5">
            {items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={item.linkTo}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-foreground/[0.03]"
              >
                <span className="truncate flex-1 text-foreground">{item.title}</span>
                {item.subtitle && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">{item.subtitle}</span>
                )}
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/30" />
              </Link>
            ))}
          </div>
          {items.length > 5 && (
            <Link
              href={`/tracks/${trackId}/tasks?${filterParam}`}
              className="mt-1 block text-center text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              외 {items.length - 5}건 더보기
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
