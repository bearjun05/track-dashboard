import { create } from 'zustand'
import type { Task, Notice, Issue } from './types'
import {
  mockTimedTasks,
  mockTodayTasks,
  mockNotices,
  mockIssues,
} from './mock-data'

interface DashboardState {
  timedTasks: Task[]
  todayTasks: Task[]
  notices: Notice[]
  issues: Issue[]

  toggleTaskComplete: (id: string) => void
  toggleTaskImportant: (id: string) => void
  markNoticeRead: (id: string) => void
  addNoticeReply: (noticeId: string, content: string) => void
  addIssue: (issue: Omit<Issue, 'id' | 'timestamp' | 'replies' | 'status'>) => void
  addIssueReply: (issueId: string, content: string) => void
  updateTaskDetail: (taskId: string, content: string) => void
  addTodayTask: (title: string) => void
  addTaskChatMessage: (taskId: string, content: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  timedTasks: mockTimedTasks,
  todayTasks: mockTodayTasks,
  notices: mockNotices,
  issues: mockIssues,

  toggleTaskComplete: (id) =>
    set((state) => ({
      timedTasks: state.timedTasks.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
      todayTasks: state.todayTasks.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
    })),

  toggleTaskImportant: (id) =>
    set((state) => ({
      timedTasks: state.timedTasks.map((t) =>
        t.id === id ? { ...t, isImportant: !t.isImportant } : t,
      ),
      todayTasks: state.todayTasks.map((t) =>
        t.id === id ? { ...t, isImportant: !t.isImportant } : t,
      ),
    })),

  markNoticeRead: (noticeId) =>
    set((state) => ({
      notices: state.notices.map((n) =>
        n.id === noticeId ? { ...n, isRead: true } : n,
      ),
    })),

  addNoticeReply: (noticeId, content) =>
    set((state) => ({
      notices: state.notices.map((n) =>
        n.id === noticeId
          ? {
              ...n,
              replies: [
                ...n.replies,
                {
                  id: `reply-${Date.now()}`,
                  authorId: 'me',
                  authorName: '나',
                  content,
                  timestamp: new Date().toISOString(),
                  isFromManager: false,
                },
              ],
            }
          : n,
      ),
    })),

  addIssue: (issue) =>
    set((state) => ({
      issues: [
        {
          ...issue,
          id: `issue-${Date.now()}`,
          timestamp: new Date().toISOString(),
          replies: [],
          status: 'pending' as const,
        },
        ...state.issues,
      ],
    })),

  addIssueReply: (issueId, content) =>
    set((state) => ({
      issues: state.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              replies: [
                ...i.replies,
                {
                  id: `reply-${Date.now()}`,
                  authorId: 'me',
                  authorName: '나',
                  content,
                  timestamp: new Date().toISOString(),
                  isFromManager: false,
                },
              ],
            }
          : i,
      ),
    })),

  updateTaskDetail: (taskId, content) =>
    set((state) => ({
      timedTasks: state.timedTasks.map((t) =>
        t.id === taskId ? { ...t, detailContent: content } : t,
      ),
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId ? { ...t, detailContent: content } : t,
      ),
    })),

  addTaskChatMessage: (taskId, content) =>
    set((state) => {
      const newMsg = {
        id: `msg-${Date.now()}`,
        authorId: 'me',
        authorName: '나',
        content,
        timestamp: new Date().toISOString(),
        isFromManager: false,
      }
      return {
        timedTasks: state.timedTasks.map((t) =>
          t.id === taskId ? { ...t, chatMessages: [...t.chatMessages, newMsg] } : t,
        ),
        todayTasks: state.todayTasks.map((t) =>
          t.id === taskId ? { ...t, chatMessages: [...t.chatMessages, newMsg] } : t,
        ),
      }
    }),

  addTodayTask: (title) =>
    set((state) => ({
      todayTasks: [
        ...state.todayTasks,
        {
          id: `task-${Date.now()}`,
          title,
          dueDate: new Date().toISOString().split('T')[0],
          isCompleted: false,
          isImportant: false,
          type: 'self_added' as const,
          chatMessages: [],
        },
      ],
    })),
}))
