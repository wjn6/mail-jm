import { computed, reactive, type WritableComputedRef, type ComputedRef } from 'vue'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function usePagination(defaultPageSize: number = 20) {
  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0
  })

  const setTotal = (total: number | undefined) => {
    pagination.total = total || 0
  }

  const resetPage = () => {
    pagination.page = 1
  }

  return {
    pagination,
    setTotal,
    resetPage
  }
}

export interface PaginationBindings {
  page: WritableComputedRef<number>
  pageSize: WritableComputedRef<number>
  total: ComputedRef<number>
}

export function createPaginationBindings(pagination: PaginationState): PaginationBindings {
  const page = computed({
    get: () => pagination.page,
    set: (value: number) => {
      pagination.page = value
    }
  })

  const pageSize = computed({
    get: () => pagination.pageSize,
    set: (value: number) => {
      pagination.pageSize = value
    }
  })

  const total = computed(() => pagination.total)

  return {
    page,
    pageSize,
    total
  }
}
