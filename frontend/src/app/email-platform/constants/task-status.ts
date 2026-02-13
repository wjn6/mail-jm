import type { TagProps } from 'element-plus'

export type TaskStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'RELEASED' | 'FAILED'

const TASK_STATUS_TEXT_MAP: Record<string, string> = {
  PENDING: '等待中',
  ACTIVE: '进行中',
  COMPLETED: '已完成',
  EXPIRED: '已过期',
  RELEASED: '已释放',
  FAILED: '失败'
}

const TASK_STATUS_TAG_MAP: Record<string, TagProps['type']> = {
  PENDING: 'info',
  ACTIVE: 'primary',
  COMPLETED: 'success',
  EXPIRED: 'warning',
  RELEASED: 'info',
  FAILED: 'danger'
}

export function getTaskStatusText(status?: string): string {
  if (!status) return '-'
  return TASK_STATUS_TEXT_MAP[status] || status
}

export function getTaskStatusTagType(status?: string): TagProps['type'] {
  if (!status) return 'info'
  return TASK_STATUS_TAG_MAP[status] || 'info'
}
