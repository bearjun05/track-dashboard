'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { TrackCreationData, StaffMember } from '@/lib/track-creation-types'

interface StepStaffAssignmentProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

const MOCK_USERS: StaffMember[] = [
  { id: 'u-om-1', name: '이운기', role: 'operator_manager' },
  { id: 'u-om-2', name: '박운기', role: 'operator_manager' },
  { id: 'u-op-1', name: '이운영', role: 'operator' },
  { id: 'u-op-2', name: '김운영', role: 'operator' },
  { id: 'u-op-3', name: '정운영', role: 'operator' },
  { id: 'u-lm-1', name: '김학관', role: 'learning_manager' },
  { id: 'u-lm-2', name: '이학관', role: 'learning_manager' },
  { id: 'u-lm-3', name: '박학관', role: 'learning_manager' },
  { id: 'u-lm-4', name: '최학관', role: 'learning_manager' },
  { id: 'u-lm-5', name: '강학관', role: 'learning_manager' },
  { id: 'u-lm-6', name: '정학관', role: 'learning_manager' },
  { id: 'u-lm-7', name: '한학관', role: 'learning_manager' },
  { id: 'u-tu-1', name: '김튜터', role: 'tutor' },
  { id: 'u-tu-2', name: '이튜터', role: 'tutor' },
  { id: 'u-tu-3', name: '박튜터', role: 'tutor' },
  { id: 'u-tu-4', name: '최튜터', role: 'tutor' },
  { id: 'u-tu-5', name: '정튜터', role: 'tutor' },
]

type RoleKey = 'operatorManagers' | 'operators' | 'learningManagers' | 'tutors'

const ROLE_CONFIG: { key: RoleKey; label: string; filterRole: StaffMember['role']; color: string; optional?: boolean }[] = [
  { key: 'operatorManagers', label: '운영기획매니저', filterRole: 'operator_manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { key: 'operators', label: '운영매니저', filterRole: 'operator', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { key: 'learningManagers', label: '학습관리매니저', filterRole: 'learning_manager', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { key: 'tutors', label: '튜터', filterRole: 'tutor', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', optional: true },
]

export function StepStaffAssignment({ data, updateData }: StepStaffAssignmentProps) {
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [searchTerms, setSearchTerms] = useState<Record<RoleKey, string>>({
    operatorManagers: '',
    operators: '',
    learningManagers: '',
    tutors: '',
  })

  const addStaff = (roleKey: RoleKey, member: StaffMember) => {
    if (data.staff[roleKey].some(m => m.id === member.id)) return
    updateData({
      staff: {
        ...data.staff,
        [roleKey]: [...data.staff[roleKey], member],
      },
    })
  }

  const addNewStaff = (roleKey: RoleKey, filterRole: StaffMember['role']) => {
    const name = searchTerms[roleKey].trim()
    if (!name) return
    if (data.staff[roleKey].some(m => m.name === name)) return
    const newMember: StaffMember = {
      id: `u-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      role: filterRole,
    }
    updateData({
      staff: {
        ...data.staff,
        [roleKey]: [...data.staff[roleKey], newMember],
      },
    })
    setSearchTerms(prev => ({ ...prev, [roleKey]: '' }))
  }

  const removeStaff = (roleKey: RoleKey, memberId: string) => {
    updateData({
      staff: {
        ...data.staff,
        [roleKey]: data.staff[roleKey].filter(m => m.id !== memberId),
      },
    })
  }

  const allAssigned = [...data.staff.operatorManagers, ...data.staff.operators, ...data.staff.learningManagers, ...data.staff.tutors]

  return (
    <div className="space-y-6">
      {/* Chapter Summary Accordion */}
      <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">챕터 구성 요약 ({data.chapters.length}개)</CardTitle>
                {chaptersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {data.chapters.map((ch) => (
                  <div key={ch.id} className="flex items-start justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ch.cards.map(c => c.subjectName).join(', ')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {ch.startDate} ~ {ch.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Staff Assignment */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">인원 배정</h2>
        </div>
        <div className="space-y-4">
          {ROLE_CONFIG.map(({ key, label, filterRole, color, optional }) => {
            const search = searchTerms[key]
            const available = MOCK_USERS.filter(
              u => u.role === filterRole && !allAssigned.some(a => a.id === u.id)
            ).filter(u => !search || u.name.includes(search))

            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {label}
                    {optional && <Badge variant="outline" className="text-[10px] font-normal">선택</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Selected members */}
                  <div className="flex flex-wrap gap-1.5">
                    {data.staff[key].map(m => (
                      <Badge key={m.id} variant="secondary" className={`${color} gap-1 pr-1`}>
                        {m.name}
                        <button
                          onClick={() => removeStaff(key, m.id)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {data.staff[key].length === 0 && (
                      <span className="text-xs text-muted-foreground">배정된 인원이 없습니다</span>
                    )}
                  </div>

                  {/* Search & Add */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="이름 검색 또는 새 이름 입력 후 Enter..."
                      value={search}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const exactMatch = available.find(u => u.name === search.trim())
                          if (exactMatch) {
                            addStaff(key, exactMatch)
                            setSearchTerms(prev => ({ ...prev, [key]: '' }))
                          } else if (search.trim()) {
                            addNewStaff(key, filterRole)
                          }
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    {search.trim() && !available.some(u => u.name === search.trim()) && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 shrink-0 text-xs"
                        onClick={() => addNewStaff(key, filterRole)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> 추가
                      </Button>
                    )}
                  </div>
                  {available.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {available.map(u => (
                        <Button
                          key={u.id}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            addStaff(key, u)
                            setSearchTerms(prev => ({ ...prev, [key]: '' }))
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" /> {u.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
