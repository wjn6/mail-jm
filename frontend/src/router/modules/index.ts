import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { taskRoutes } from './task'
import { projectRoutes } from './project'
import { walletRoutes } from './wallet'
import { settingsRoutes } from './settings'
import { adminRoutes } from './admin'

export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  taskRoutes,
  projectRoutes,
  walletRoutes,
  settingsRoutes,
  adminRoutes
]
