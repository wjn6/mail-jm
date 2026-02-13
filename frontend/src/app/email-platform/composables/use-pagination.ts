import { reactive } from 'vue'

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
