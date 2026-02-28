'use client'

import { useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StepBasicInfo } from './step-basic-info'
import { StepTimetableUpload } from './step-timetable-upload'
import { StepChapterBuilder } from './step-chapter-builder'
import { StepStaffAssignment } from './step-staff-assignment'
import { StepTaskGeneration } from './step-task-generation'
import { StepTaskAssignment } from './step-task-assignment'
import { StepTaskReview } from './step-task-review'
import { StepFinalConfirmation } from './step-final-confirmation'
import { suggestDefaultAssignments, applyAssignments } from '@/lib/task-generator'
import type { TrackCreationData } from '@/lib/track-creation-types'

const STEPS = [
  { id: 1, label: '기본 정보' },
  { id: 2, label: '시간표 업로드' },
  { id: 3, label: '챕터 편성' },
  { id: 4, label: '인원 배정' },
  { id: 5, label: 'Task 생성' },
  { id: 6, label: 'Task 배정' },
  { id: 7, label: 'Task 확인' },
  { id: 8, label: '최종 확인' },
]

const TOTAL_STEPS = STEPS.length

interface TrackCreationWizardProps {
  mode?: 'create' | 'edit'
  trackId?: string
  initialData?: TrackCreationData
}

const DEFAULT_DATA: TrackCreationData = {
  name: '',
  round: 1,
  parsedSchedule: null,
  chapters: [],
  unassignedCards: [],
  staff: { operatorManagers: [], operators: [], learningManagers: [], tutors: [] },
  generatedTasks: [],
  recurrenceConfigs: {},
  customTemplates: [],
  taskAssignments: {},
}

export function TrackCreationWizard({ mode = 'create', trackId, initialData }: TrackCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<TrackCreationData>(initialData ?? DEFAULT_DATA)
  const [preAssignmentTasks, setPreAssignmentTasks] = useState(data.generatedTasks)

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return data.name.trim() !== '' && data.round > 0
      case 2: return data.parsedSchedule !== null && data.parsedSchedule.cards.length > 0
      case 3: return data.chapters.length > 0 && data.unassignedCards.length === 0
      case 4: return data.staff.operators.length > 0 || data.staff.learningManagers.length > 0
      case 5: return data.generatedTasks.length > 0
      case 6: return true
      case 7: return true
      case 8: return true
      default: return false
    }
  }

  const handleNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS) return

    if (currentStep === 5) {
      const defaults = suggestDefaultAssignments(data.staff.learningManagers)
      const merged = { ...defaults, ...data.taskAssignments }
      setPreAssignmentTasks(data.generatedTasks)
      setData(prev => ({ ...prev, taskAssignments: merged }))
    }

    if (currentStep === 6) {
      const assigned = applyAssignments(
        preAssignmentTasks,
        data.taskAssignments,
        data.staff.learningManagers,
      )
      setData(prev => ({ ...prev, generatedTasks: assigned }))
    }

    setCurrentStep(currentStep + 1)
  }, [currentStep, data, preAssignmentTasks])

  const handlePrev = useCallback(() => {
    if (currentStep <= 1) return

    if (currentStep === 7) {
      setData(prev => ({ ...prev, generatedTasks: preAssignmentTasks }))
    }

    setCurrentStep(currentStep - 1)
  }, [currentStep, preAssignmentTasks])

  const updateData = (partial: Partial<TrackCreationData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Step Indicator */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-4">
          {mode === 'edit' && (
            <p className="mb-2 text-center text-[11px] font-medium text-primary">
              트랙 수정 모드 — 기존 설정이 반영되어 있습니다
            </p>
          )}
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors',
                      currentStep > step.id && 'border-primary bg-primary text-primary-foreground',
                      currentStep === step.id && 'border-primary bg-primary/10 text-primary',
                      currentStep < step.id && 'border-muted-foreground/30 text-muted-foreground/50',
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium whitespace-nowrap',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-0.5 h-[2px] w-6 sm:w-8 md:w-12',
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
        {currentStep === 1 && <StepBasicInfo data={data} updateData={updateData} />}
        {currentStep === 2 && <StepTimetableUpload data={data} updateData={updateData} />}
        {currentStep === 3 && <StepChapterBuilder data={data} updateData={updateData} />}
        {currentStep === 4 && <StepStaffAssignment data={data} updateData={updateData} />}
        {currentStep === 5 && <StepTaskGeneration data={data} updateData={updateData} />}
        {currentStep === 6 && <StepTaskAssignment data={data} updateData={updateData} />}
        {currentStep === 7 && <StepTaskReview data={data} updateData={updateData} />}
        {currentStep === 8 && <StepFinalConfirmation data={data} mode={mode} trackId={trackId} />}
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
            {currentStep} / {TOTAL_STEPS}
          </span>
          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              다음
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  )
}
