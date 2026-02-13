import request from '@/utils/http'

export function fetchUserDashboard() {
  return request.get<Api.Dashboard.UserDashboard>({
    url: '/user/dashboard'
  })
}

export function fetchRecentTasks() {
  return request.get<Api.Task.TaskItem[]>({
    url: '/user/recent-tasks'
  })
}

export function fetchAdminDashboard() {
  return request.get<Api.Dashboard.AdminDashboard>({
    url: '/admin/dashboard/stats'
  })
}

export function fetchTaskTrend(days: number = 7) {
  return request.get<Api.Dashboard.TrendItem[]>({
    url: '/admin/dashboard/trend',
    params: { days }
  })
}
