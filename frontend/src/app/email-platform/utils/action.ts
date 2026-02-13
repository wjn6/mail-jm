export type ActionResult = 'success' | 'cancelled' | 'failed'

export interface RunActionOptions {
  isCancelled?: (error: unknown) => boolean
  onError?: (error: unknown) => void | Promise<void>
}

export async function runAction(
  action: () => Promise<void>,
  options: RunActionOptions = {}
): Promise<ActionResult> {
  try {
    await action()
    return 'success'
  } catch (error) {
    if (options.isCancelled?.(error)) {
      return 'cancelled'
    }

    if (options.onError) {
      await options.onError(error)
    }

    return 'failed'
  }
}
