'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StepBasicInfo } from './step-basic-info'
import { StepTimetableUpload } from './step-timetable-upload'
import { StepChapterBuilder } from './step-chapter-builder'
import { StepStaffAssignment } from './step-staff-assignment'
import { StepTaskGeneration } from './step-task-generation'
import { StepTaskReview } from './step-task-review'
import { StepFinalConfirmation } from './step-final-confirmation'
import type { TrackCreationData, SubjectCard, Chapter, TrackStaffAssignment, GeneratedTask, HolidayEntry, RecurrenceConfig } from '@/lib/track-creation-types'

const STEPS = [
  { id: 1, label: '기본 정보' },
  { id: 2, label: '시간표 업로드' },
  { id: 3, label: '챕터 편성' },
  { id: 4, label: '인원 배정' },
  { id: 5, label: 'Task 생성' },
  { id: 6, label: 'Task 확인' },
  { id: 7, label: '최종 확인' },
]

export function TrackCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<TrackCreationData>({
    name: '',
    round: 1,
    parsedSchedule: null,
    chapters: [],
    unassignedCards: [],
    staff: { operatorManagers: [], operators: [], learningManagers: [], tutors: [] },
    generatedTasks: [],
    recurrenceConfigs: {},
    customTemplates: [],
  })

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return data.name.trim() !== '' && data.round > 0
      case 2: return data.parsedSchedule !== null && data.parsedSchedule.cards.length > 0
      case 3: return data.chapters.length > 0 && data.unassignedCards.length === 0
      case 4: return data.staff.operators.length > 0 || data.staff.learningManagers.length > 0
      case 5: return data.generatedTasks.length > 0
      case 6: return true
      case 7: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateData = (partial: Partial<TrackCreationData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Step Indicator */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                      currentStep > step.id && 'border-primary bg-primary text-primary-foreground',
                      currentStep === step.id && 'border-primary bg-primary/10 text-primary',
                      currentStep < step.id && 'border-muted-foreground/30 text-muted-foreground/50',
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-medium whitespace-nowrap',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-1 h-[2px] w-8 sm:w-12 md:w-16',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/20',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {currentStep === 1 && (
          <StepBasicInfo data={data} updateData={updateData} />
        )}
        {currentStep === 2 && (
          <StepTimetableUpload data={data} updateData={updateData} />
        )}
        {currentStep === 3 && (
          <StepChapterBuilder data={data} updateData={updateData} />
        )}
        {currentStep === 4 && (
          <StepStaffAssignment data={data} updateData={updateData} />
        )}
        {currentStep === 5 && (
          <StepTaskGeneration data={data} updateData={updateData} />
        )}
        {currentStep === 6 && (
          <StepTaskReview data={data} updateData={updateData} />
        )}
        {currentStep === 7 && (
          <StepFinalConfirmation data={data} />
        )}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentStep} / {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep < 7 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleNext}>
                건너뛰기
              </Button>
            )}
            {currentStep < 7 ? (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                다음
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
