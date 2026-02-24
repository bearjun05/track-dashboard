import { create } from 'zustand'
import type { Student, TeamRoundCheck, StudentLog } from './types'
import { mockStudents, mockRoundChecks, mockStudentLogs } from './interview-mock-data'

interface InterviewState {
  students: Student[]
  roundChecks: TeamRoundCheck[]
  studentLogs: StudentLog[]
  selectedStudentId: string | null
  period: 'morning' | 'afternoon'

  setPeriod: (p: 'morning' | 'afternoon') => void
  selectStudent: (id: string | null) => void

  toggleAbsent: (studentId: string) => void
  toggleHealth: (studentId: string) => void
  toggleProgress: (studentId: string) => void
  updateSpecialNote: (studentId: string, note: string) => void

  addStudentLog: (studentId: string, content: string) => void
}

function getOrCreateCheck(
  checks: TeamRoundCheck[],
  studentId: string,
  period: 'morning' | 'afternoon',
): { checks: TeamRoundCheck[]; idx: number } {
  const todayStr = new Date().toISOString().split('T')[0]
  const idx = checks.findIndex(
    (c) => c.studentId === studentId && c.date === todayStr && c.period === period,
  )
  if (idx >= 0) return { checks, idx }
  const newCheck: TeamRoundCheck = {
    studentId,
    date: todayStr,
    period,
    isAbsent: false,
    healthCheck: false,
    progressCheck: false,
    specialNote: '',
  }
  const updated = [...checks, newCheck]
  return { checks: updated, idx: updated.length - 1 }
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  students: mockStudents,
  roundChecks: mockRoundChecks,
  studentLogs: mockStudentLogs,
  selectedStudentId: null,
  period: new Date().getHours() >= 13 ? 'afternoon' : 'morning',

  setPeriod: (p) => set({ period: p }),
  selectStudent: (id) => set({ selectedStudentId: id }),

  toggleAbsent: (studentId) =>
    set((state) => {
      const { checks, idx } = getOrCreateCheck(state.roundChecks, studentId, state.period)
      const updated = [...checks]
      updated[idx] = { ...updated[idx], isAbsent: !updated[idx].isAbsent }
      return { roundChecks: updated }
    }),

  toggleHealth: (studentId) =>
    set((state) => {
      const { checks, idx } = getOrCreateCheck(state.roundChecks, studentId, state.period)
      const updated = [...checks]
      updated[idx] = { ...updated[idx], healthCheck: !updated[idx].healthCheck }
      return { roundChecks: updated }
    }),

  toggleProgress: (studentId) =>
    set((state) => {
      const { checks, idx } = getOrCreateCheck(state.roundChecks, studentId, state.period)
      const updated = [...checks]
      updated[idx] = { ...updated[idx], progressCheck: !updated[idx].progressCheck }
      return { roundChecks: updated }
    }),

  updateSpecialNote: (studentId, note) =>
    set((state) => {
      const { checks, idx } = getOrCreateCheck(state.roundChecks, studentId, state.period)
      const updated = [...checks]
      updated[idx] = { ...updated[idx], specialNote: note }
      return { roundChecks: updated }
    }),

  addStudentLog: (studentId, content) => {
    const state = get()
    const student = state.students.find((s) => s.id === studentId)
    if (!student) return
    const now = new Date()
    const newLog: StudentLog = {
      id: `log-${Date.now()}`,
      studentId,
      studentName: student.name,
      content,
      authorId: 'me',
      authorName: '나 (학관)',
      period: now.getHours() >= 13 ? 'afternoon' : 'morning',
      createdAt: now.toISOString(),
    }
    set({ studentLogs: [...state.studentLogs, newLog] })
  },
}))
