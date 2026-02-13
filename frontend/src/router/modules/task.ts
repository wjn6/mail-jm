import { AppRouteRecord } from '@/types/router'

export const taskRoutes: AppRouteRecord = {
  name: 'Task',
  path: '/task',
  component: '/index/index',
  meta: {
    title: '接码中心',
    icon: 'ri:mail-send-line',
    roles: ['R_USER']
  },
  children: [
    {
      path: 'get-email',
      name: 'GetEmail',
      component: '/task/get-email',
      meta: {
        title: '获取邮箱',
        icon: 'ri:mail-add-line',
        keepAlive: false
      }
    },
    {
      path: 'history',
      name: 'TaskHistory',
      component: '/task/history',
      meta: {
        title: '任务记录',
        icon: 'ri:history-line',
        keepAlive: false
      }
    }
  ]
}
