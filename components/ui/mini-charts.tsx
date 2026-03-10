'use client'

import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts'

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

export function MetricsBox() {
  const lastDropout = DROPOUT_DATA[DROPOUT_DATA.length - 1]
  const lastNps = NPS_DATA[NPS_DATA.length - 1]

  return (
    <div className="flex w-[200px] items-center gap-3 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2.5 py-1.5">
      <div className="flex flex-1 flex-col">
        <span className="text-[9px] font-medium text-foreground/50">이탈율</span>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-14">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DROPOUT_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" hide />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Line type="monotone" dataKey="rate" stroke="currentColor" strokeWidth={1.5} dot={false} strokeOpacity={0.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] font-semibold tabular-nums text-foreground">{lastDropout.rate}%</span>
        </div>
      </div>
      <div className="h-4 w-px bg-foreground/[0.08]" />
      <div className="flex flex-1 flex-col">
        <span className="text-[9px] font-medium text-foreground/50">NPS</span>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-14">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={NPS_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" hide />
                <YAxis hide domain={[0, 100]} />
                <Bar dataKey="score" fill="currentColor" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] font-semibold tabular-nums text-foreground">{lastNps.score}</span>
        </div>
      </div>
    </div>
  )
}
