import { AppRouteRecord } from '@/types/router'

export const settingsRoutes: AppRouteRecord = {
  name: 'Settings',
  path: '/settings',
  component: '/index/index',
  meta: {
    title: '个人设置',
    icon: 'ri:settings-3-line',
    roles: ['R_USER']
  },
  children: [
    {
      path: 'profile',
      name: 'Profile',
      component: '/settings/profile',
      meta: {
        title: '账户设置',
        icon: 'ri:user-settings-line',
        keepAlive: false
      }
    }
  ]
}
