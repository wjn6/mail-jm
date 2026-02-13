import assert from 'node:assert/strict'
import { createPaginationBindings, usePagination } from '../src/app/email-platform/composables/use-pagination'
import { runAction } from '../src/app/email-platform/utils/action'

async function testRunAction() {
  const successResult = await runAction(async () => {})
  assert.equal(successResult, 'success')

  const cancelledResult = await runAction(
    async () => {
      throw new Error('cancelled')
    },
    {
      isCancelled: (error) => (error as Error).message === 'cancelled'
    }
  )
  assert.equal(cancelledResult, 'cancelled')

  let handledError = false
  const failedResult = await runAction(
    async () => {
      throw new Error('boom')
    },
    {
      onError: () => {
        handledError = true
      }
    }
  )
  assert.equal(failedResult, 'failed')
  assert.equal(handledError, true)
}

function testPagination() {
  const { pagination, setTotal, resetPage } = usePagination(30)
  assert.equal(pagination.page, 1)
  assert.equal(pagination.pageSize, 30)
  assert.equal(pagination.total, 0)

  setTotal(99)
  assert.equal(pagination.total, 99)

  setTotal(undefined)
  assert.equal(pagination.total, 0)

  pagination.page = 5
  resetPage()
  assert.equal(pagination.page, 1)

  const bindings = createPaginationBindings(pagination)
  bindings.page.value = 3
  bindings.pageSize.value = 50

  assert.equal(pagination.page, 3)
  assert.equal(pagination.pageSize, 50)
  assert.equal(bindings.total.value, pagination.total)
}

async function main() {
  await testRunAction()
  testPagination()
  console.log('email-platform utility tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
