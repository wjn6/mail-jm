import { AppRouteRecord } from '@/types/router'

export const walletRoutes: AppRouteRecord = {
  name: 'Wallet',
  path: '/wallet',
  component: '/index/index',
  meta: {
    title: '财务中心',
    icon: 'ri:wallet-3-line',
    roles: ['R_USER']
  },
  children: [
    {
      path: 'recharge',
      name: 'Recharge',
      component: '/wallet/recharge',
      meta: {
        title: '充值中心',
        icon: 'ri:coin-line',
        keepAlive: false
      }
    },
    {
      path: 'transactions',
      name: 'Transactions',
      component: '/wallet/transactions',
      meta: {
        title: '消费记录',
        icon: 'ri:file-list-3-line',
        keepAlive: false
      }
    }
  ]
}
