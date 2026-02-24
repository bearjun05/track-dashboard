'use client'

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, Calendar, BookOpen, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseXlsxTimetable } from '@/lib/xlsx-parser'
import type { TrackCreationData } from '@/lib/track-creation-types'

interface StepTimetableUploadProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

export function StepTimetableUpload({ data, updateData }: StepTimetableUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('xlsx 또는 xls 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const result = parseXlsxTimetable(buffer)

      if (result.cards.length === 0) {
        setError('시간표에서 교과 데이터를 추출할 수 없습니다. 파일 형식을 확인해 주세요.')
        return
      }

      setFileName(file.name)
      updateData({
        parsedSchedule: result,
        unassignedCards: [...result.cards],
        chapters: [],
      })
    } catch {
      setError('파일 파싱 중 오류가 발생했습니다.')
    }
  }, [updateData])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const schedule = data.parsedSchedule

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('xlsx-file-input')?.click()}
      >
        <input
          id="xlsx-file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium">정부용 시간표(xlsx) 파일을 드래그하거나 클릭하여 업로드</p>
        <p className="mt-1 text-xs text-muted-foreground">xlsx, xls 형식 지원</p>
        {fileName && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{fileName}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Parsed Result Preview */}
      {schedule && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">트랙 기간</p>
                  <p className="text-sm font-semibold">{schedule.trackStart} ~ {schedule.trackEnd}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">총 교과 블록</p>
                  <p className="text-sm font-semibold">{schedule.cards.length}개</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-4">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">총 주차 / 공휴일</p>
                  <p className="text-sm font-semibold">{schedule.totalWeeks}주 / {schedule.holidays.length}일</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Cards Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">추출된 교과 블록</CardTitle>
              <CardDescription>시간표에서 연속 교과명 기준으로 자동 분리된 블록입니다. 다음 단계에서 챕터로 편성합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule.cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {card.isProject && (
                        <Badge variant="secondary" className="text-[10px]">프로젝트</Badge>
                      )}
                      <span className="text-sm font-medium">{card.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{card.startDate} ~ {card.endDate}</span>
                      <span>{card.totalHours}시간</span>
                      <span>{card.weekNumbers.join(', ')}주차</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Holidays */}
          {schedule.holidays.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">공휴일</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {schedule.holidays.map((h) => (
                    <Badge key={h.date} variant="outline">
                      {h.date} {h.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
