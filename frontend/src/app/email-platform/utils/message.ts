import { ElMessage, ElMessageBox } from 'element-plus'
import { runAction } from './action'

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

export interface ConfirmActionOptions {
  message: string
  title?: string
  confirmType?: 'success' | 'warning' | 'info' | 'error'
  successMessage?: string
  errorMessage: string
  onConfirm: () => Promise<void>
}

export async function runConfirmAction(options: ConfirmActionOptions): Promise<boolean> {
  const result = await runAction(
    async () => {
      await ElMessageBox.confirm(options.message, options.title || '确认', {
        type: options.confirmType || 'warning'
      })

      await options.onConfirm()

      if (options.successMessage) {
        ElMessage.success(options.successMessage)
      }
    },
    {
      isCancelled: isActionCancelled,
      onError: (error) => showApiError(error, options.errorMessage)
    }
  )

  return result === 'success'
}
