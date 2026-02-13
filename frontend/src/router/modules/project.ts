import { AppRouteRecord } from '@/types/router'

export const projectRoutes: AppRouteRecord = {
  name: 'Project',
  path: '/project',
  component: '/index/index',
  meta: {
    title: '项目管理',
    icon: 'ri:folder-line',
    roles: ['R_USER']
  },
  children: [
    {
      path: 'list',
      name: 'ProjectList',
      component: '/project/list',
      meta: {
        title: '项目列表',
        icon: 'ri:folder-open-line',
        keepAlive: false
      }
    },
    {
      path: ':id/keys',
      name: 'ProjectKeys',
      component: '/project/keys',
      meta: {
        title: 'API Key',
        icon: 'ri:key-2-line',
        keepAlive: false,
        hideInMenu: true
      }
    }
  ]
}
