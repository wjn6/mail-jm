import request from '@/utils/http'

export function fetchGetEmail(params: Api.Task.GetEmailParams) {
  return request.post<Api.Task.GetEmailResult>({
    url: '/user/task/get-email',
    params
  })
}

export function fetchGetCode(params: Api.Task.GetCodeParams) {
  return request.post<Api.Task.GetCodeResult>({
    url: '/user/task/get-code',
    params
  })
}

export function fetchCheckMail(params: { email: string; mailbox?: string }) {
  return request.post<Api.Task.CheckMailResult>({
    url: '/user/task/check-mail',
    params
  })
}

export function fetchReleaseEmail(params: { email: string }) {
  return request.post({
    url: '/user/task/release',
    params
  })
}

export function fetchTaskList(params: {
  page?: number
  pageSize?: number
  status?: string
  projectId?: number
}) {
  return request.get<Api.Common.PaginatedResponse<Api.Task.TaskItem>>({
    url: '/user/task/list',
    params
  })
}

export function fetchTaskDetail(taskId: number) {
  return request.get<Api.Task.TaskItem>({
    url: `/user/task/${taskId}`
  })
}
