import { AppRouteRecord } from '@/types/router'

export const adminRoutes: AppRouteRecord = {
  name: 'AdminPanel',
  path: '/admin-panel',
  component: '/index/index',
  meta: {
    title: '管理后台',
    icon: 'ri:shield-user-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: '/admin-panel/dashboard',
      meta: {
        title: '管理概览',
        icon: 'ri:bar-chart-box-line',
        keepAlive: false
      }
    },
    {
      path: 'users',
      name: 'AdminUsers',
      component: '/admin-panel/users',
      meta: {
        title: '用户管理',
        icon: 'ri:team-line',
        keepAlive: false
      }
    },
    {
      path: 'orders',
      name: 'AdminOrders',
      component: '/admin-panel/orders',
      meta: {
        title: '订单管理',
        icon: 'ri:order-play-line',
        keepAlive: false
      }
    },
    {
      path: 'upstream',
      name: 'AdminUpstream',
      component: '/admin-panel/upstream',
      meta: {
        title: '上游管理',
        icon: 'ri:cloud-line',
        keepAlive: false
      }
    },
    {
      path: 'finance',
      name: 'AdminFinance',
      component: '/admin-panel/finance',
      meta: {
        title: '财务管理',
        icon: 'ri:money-cny-box-line',
        keepAlive: false
      }
    },
    {
      path: 'pricing',
      name: 'AdminPricing',
      component: '/admin-panel/pricing',
      meta: {
        title: '计费设置',
        icon: 'ri:price-tag-3-line',
        keepAlive: false
      }
    },
    {
      path: 'announcements',
      name: 'AdminAnnouncements',
      component: '/admin-panel/announcements',
      meta: {
        title: '公告管理',
        icon: 'ri:megaphone-line',
        keepAlive: false
      }
    },
    {
      path: 'admins',
      name: 'AdminAdmins',
      component: '/admin-panel/admins',
      meta: {
        title: '管理员',
        icon: 'ri:admin-line',
        keepAlive: false,
        roles: ['R_SUPER']
      }
    }
  ]
}
