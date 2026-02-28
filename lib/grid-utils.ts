export interface OverlapPlacement {
  col: number
  groupSize: number
}

/**
 * Given a list of time-slot items (assumed pre-sorted by slot asc, span desc),
 * computes non-overlapping column indices and the group width for each item.
 */
export function computeOverlapColumns(
  items: readonly { slot: number; endSlot: number }[],
): OverlapPlacement[] {
  const colEnds: number[] = []
  const placed: OverlapPlacement[] = []

  for (const item of items) {
    let col = 0
    while (col < colEnds.length && colEnds[col] > item.slot) col++
    if (col >= colEnds.length) colEnds.push(0)
    colEnds[col] = item.endSlot
    placed.push({ col, groupSize: 1 })
  }

  for (let i = 0; i < items.length; i++) {
    let groupMax = placed[i].col + 1
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue
      if (items[j].slot < items[i].endSlot && items[j].endSlot > items[i].slot) {
        groupMax = Math.max(groupMax, placed[j].col + 1)
      }
    }
    placed[i].groupSize = groupMax
  }

  return placed
}
