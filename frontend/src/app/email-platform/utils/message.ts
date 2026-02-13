import { ElMessage } from 'element-plus'

export function showApiError(error: unknown, fallback: string): void {
  if (error && typeof error === 'object' && 'message' in error) {
    ElMessage.error(String((error as { message?: unknown }).message || fallback))
    return
  }
  ElMessage.error(fallback)
}

export function isActionCancelled(error: unknown): boolean {
  return error === 'cancel' || error === 'close'
}
