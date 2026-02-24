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
