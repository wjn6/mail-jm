/**
 * 邮箱接码平台 API 类型定义
 */
declare namespace Api {
  namespace Common {
    interface PaginationParams {
      current: number
      size: number
      total: number
    }
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>
    interface PaginatedResponse<T = any> {
      items: T[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }
    type EnableStatus = '1' | '2'
  }

  namespace Auth {
    interface LoginParams {
      username: string
      password: string
    }
    interface LoginResponse {
      token: string
      user: {
        id: number
        username: string
        email: string
      }
    }
    interface UnifiedLoginResponse {
      sessionType?: 'user' | 'admin'
      token: string
      user?: {
        id: number
        username: string
        email: string
      }
      admin?: {
        id: number
        username: string
        role: string
      }
    }
    interface AdminLoginParams {
      username: string
      password: string
    }
    interface AdminLoginResponse {
      token: string
      admin: {
        id: number
        username: string
        role: string
      }
    }
    interface AdminProfile {
      id: number
      username: string
      role: 'SUPER_ADMIN' | 'ADMIN'
      status: string
      createdAt: string
    }
    interface RegisterParams {
      username: string
      email: string
      password: string
    }
    interface UserInfo {
      id: number
      userId: number
      username: string
      userName: string
      email: string
      status: string
      balance: number
      createdAt: string
      buttons: string[]
      roles: string[]
      avatar?: string
    }
    interface ChangePasswordParams {
      oldPassword: string
      newPassword: string
    }
  }

  namespace Dashboard {
    interface UserDashboard {
      balance: number
      frozenBalance: number
      todayTasks: number
      totalTasks: number
      activeTasks: number
      projectCount: number
    }
    interface AdminDashboard {
      totalUsers: number
      totalTasks: number
      todayTasks: number
      activeTasks: number
      totalRecharge: number
      todayRecharge: number
      totalConsume: number
      upstreamCount: number
    }
    interface TrendItem {
      date: string
      total: number
      completed: number
      failed: number
    }
  }

  namespace Task {
    interface GetEmailParams {
      projectId?: number
      group?: string
    }
    interface GetEmailResult {
      taskId: number
      email: string
      expireAt: string
      cost: number
    }
    interface GetCodeParams {
      email: string
      match?: string
    }
    interface GetCodeResult {
      taskId: number
      email: string
      code: string | null
      message?: string
    }
    interface CheckMailResult {
      taskId: number
      email: string
      count: number
      messages: MailMessage[]
    }
    interface MailMessage {
      id: string
      from: string
      subject: string
      text: string
      html: string
      date: string
    }
    interface TaskItem {
      id: number
      email: string
      status: string
      cost: number
      verifyCode: string | null
      mailSubject: string | null
      matchPattern: string | null
      expireAt: string | null
      createdAt: string
      completedAt: string | null
      project?: {
        id: number
        name: string
      }
    }
  }

  namespace Project {
    interface ProjectItem {
      id: number
      userId: number
      name: string
      status: string
      createdAt: string
      updatedAt: string
      _count: {
        apiKeys: number
        emailTasks: number
      }
    }
  }

  namespace ApiKey {
    type ApiKeyStatus = 'ACTIVE' | 'DISABLED'

    interface ApiKeyItem {
      id: number
      name: string
      key?: string
      keyPrefix: string
      rateLimit: number
      status: ApiKeyStatus
      expiresAt: string | null
      createdAt: string
    }

    interface CreateApiKeyParams {
      name: string
      rateLimit?: number
      expiresAt?: string
    }

    interface UpdateApiKeyParams {
      name?: string
      rateLimit?: number
      expiresAt?: string
      status?: ApiKeyStatus
    }
  }

  namespace Wallet {
    interface WalletInfo {
      id: number
      userId: number
      balance: number
      frozenBalance: number
    }
    interface TransactionItem {
      id: number
      userId: number
      type: string
      amount: number
      balanceBefore: number
      balanceAfter: number
      description: string | null
      refNo: string | null
      relatedTaskId: number | null
      createdAt: string
    }
  }

  namespace Admin {
    type UserStatus = 'ACTIVE' | 'DISABLED'
    type AdminRole = 'SUPER_ADMIN' | 'ADMIN'
    type UpstreamType = 'gongxi' | 'custom'
    type AnnouncementType = 'INFO' | 'WARNING' | 'IMPORTANT'

    interface PaginationParams {
      page?: number
      pageSize?: number
    }

    interface UserItem {
      id: number
      username: string
      email: string
      status: UserStatus
      createdAt: string
      wallet: {
        balance: number
        frozenBalance: number
      } | null
      _count: {
        emailTasks: number
        projects: number
      }
    }

    interface UpstreamItem {
      id: number
      name: string
      type: UpstreamType
      baseUrl: string
      apiKey: string
      status: string
      config: Record<string, unknown>
      priority: number
      createdAt: string
    }

    interface UpstreamHealthItem {
      id: number
      name: string
      healthy: boolean
    }

    interface FinanceStats {
      rechargeTotal: number
      consumeTotal: number
      refundTotal: number
      transactionCount: number
      period: string
    }

    interface RechargeRecordItem {
      id: number
      userId: number
      type: string
      amount: number
      description: string | null
      createdAt: string
      user: {
        id: number
        username: string
      } | null
    }

    interface PricingRule {
      id: number
      name: string
      type: string
      price: number
      description: string | null
      isDefault: boolean
      status: string
    }
    interface AnnouncementItem {
      id: number
      title: string
      content: string
      type: AnnouncementType
      status: string
      pinned: boolean
      createdAt: string
    }

    interface AdminItem {
      id: number
      username: string
      role: AdminRole
      status: string
      createdAt: string
    }

    interface AdminOrderItem extends Api.Task.TaskItem {
      user: {
        id: number
        username: string
      } | null
    }

    interface AdminLogItem {
      id: number
      adminId: number
      action: string
      targetType: string | null
      targetId: number | null
      detail: Record<string, unknown> | null
      ip: string | null
      createdAt: string
      admin: {
        username: string
      } | null
    }

    // Admin API 请求参数类型
    interface UserSearchParams extends PaginationParams {
      keyword?: string
      status?: UserStatus
    }

    type RechargeRecordSearchParams = PaginationParams

    interface OrderSearchParams extends PaginationParams {
      status?: string
      userId?: number
      email?: string
      startDate?: string
      endDate?: string
    }

    type AnnouncementSearchParams = PaginationParams

    type LogSearchParams = PaginationParams

    interface CreateAdminParams {
      username: string
      password: string
      role?: AdminRole
    }

    interface RechargeUserParams {
      amount: number
      description?: string
    }

    interface UpdateUserStatusParams {
      status: UserStatus
    }

    interface CreateUpstreamParams {
      name: string
      type: UpstreamType
      baseUrl: string
      apiKey: string
      priority?: number
      config?: Record<string, unknown>
    }

    interface UpdateUpstreamParams {
      name?: string
      type?: UpstreamType
      baseUrl?: string
      apiKey?: string
      status?: string
      priority?: number
      config?: Record<string, unknown>
    }

    interface CreatePricingParams {
      name: string
      type: string
      price: number
      description?: string
      isDefault?: boolean
    }

    interface UpdatePricingParams {
      name?: string
      type?: string
      price?: number
      description?: string
      isDefault?: boolean
      status?: string
    }

    interface CreateAnnouncementParams {
      title: string
      content: string
      type?: AnnouncementType
      pinned?: boolean
    }

    interface UpdateAnnouncementParams {
      title?: string
      content?: string
      type?: AnnouncementType
      status?: string
      pinned?: boolean
    }
  }

  // 兼容原始 SystemManage 类型（防止类型报错）
  namespace SystemManage {
    interface UserSearchParams {
      current?: number
      size?: number
      userName?: string
      userPhone?: string
      userEmail?: string
      userGender?: string
      status?: string
      [key: string]: unknown
    }

    interface RoleSearchParams {
      current?: number
      size?: number
      roleName?: string
      roleCode?: string
      description?: string
      enabled?: boolean
      [key: string]: unknown
    }

    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      nickName?: string
      userPhone: string
      userEmail: string
      userGender: string
      userRoles?: string[]
      createTime: string
      department?: string
      score?: number
    }

    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    type UserList = Api.Common.PaginatedResponse<UserListItem>
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>
  }
}
