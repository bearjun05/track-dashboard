'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TrackCreationData } from '@/lib/track-creation-types'

interface StepBasicInfoProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

export function StepBasicInfo({ data, updateData }: StepBasicInfoProps) {
  return (
    <div className="flex justify-center pt-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>트랙 기본 정보</CardTitle>
          <CardDescription>생성할 트랙의 이름과 회차를 입력하세요.</CardDescription>
          <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              실수해도 괜찮아요! 언제든 이전 단계로 돌아갈 수 있고, 트랙을 다 만든 뒤에도 <span className="font-medium text-foreground/80">트랙 수정</span>에서 얼마든지 다시 바꿀 수 있어요.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trackName">트랙명</Label>
            <Input
              id="trackName"
              placeholder="예: 실무형 데이터분석가 양성과정"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackRound">회차</Label>
            <Input
              id="trackRound"
              type="number"
              min={1}
              placeholder="예: 11"
              value={data.round || ''}
              onChange={(e) => updateData({ round: parseInt(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
