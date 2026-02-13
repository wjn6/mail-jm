import request from '@/utils/http'

// ===== 用户管理 =====
export function fetchAdminUsers(params: Api.Admin.UserSearchParams) {
  return request.get<Api.Common.PaginatedResponse<Api.Admin.UserItem>>({
    url: '/admin/users',
    params
  })
}

export function fetchAdminUserDetail(userId: number) {
  return request.get<Api.Admin.UserItem>({ url: `/admin/users/${userId}` })
}

export function fetchUpdateUserStatus(userId: number, status: Api.Admin.UserStatus) {
  return request.put<void>({
    url: `/admin/users/${userId}/status`,
    params: { status } satisfies Api.Admin.UpdateUserStatusParams
  })
}

export function fetchRechargeUser(userId: number, data: Api.Admin.RechargeUserParams) {
  return request.post<void>({ url: `/admin/users/${userId}/recharge`, params: data })
}

// ===== 订单管理 =====
export function fetchAdminOrders(params: Api.Admin.OrderSearchParams) {
  return request.get<Api.Common.PaginatedResponse<Api.Admin.AdminOrderItem>>({
    url: '/admin/orders',
    params
  })
}

// ===== 上游管理 =====
export function fetchUpstreams() {
  return request.get<Api.Admin.UpstreamItem[]>({ url: '/admin/upstreams' })
}

export function fetchCreateUpstream(data: Api.Admin.CreateUpstreamParams) {
  return request.post<Api.Admin.UpstreamItem>({ url: '/admin/upstreams', params: data })
}

export function fetchUpdateUpstream(id: number, data: Api.Admin.UpdateUpstreamParams) {
  return request.put<Api.Admin.UpstreamItem>({ url: `/admin/upstreams/${id}`, params: data })
}

export function fetchDeleteUpstream(id: number) {
  return request.del<void>({ url: `/admin/upstreams/${id}` })
}

export function fetchUpstreamHealth() {
  return request.get<Api.Admin.UpstreamHealthItem[]>({ url: '/admin/upstreams/health' })
}

// ===== 财务 =====
export function fetchFinanceStats(days = 7) {
  return request.get<Api.Admin.FinanceStats>({ url: '/admin/finance/stats', params: { days } })
}

export function fetchRechargeRecords(params: Api.Admin.RechargeRecordSearchParams) {
  return request.get<Api.Common.PaginatedResponse<Api.Admin.RechargeRecordItem>>({
    url: '/admin/finance/recharge-records',
    params
  })
}

// ===== 计费规则 =====
export function fetchPricingRules() {
  return request.get<Api.Admin.PricingRule[]>({ url: '/admin/pricing' })
}

export function fetchCreatePricing(data: Api.Admin.CreatePricingParams) {
  return request.post<Api.Admin.PricingRule>({ url: '/admin/pricing', params: data })
}

export function fetchUpdatePricing(id: number, data: Api.Admin.UpdatePricingParams) {
  return request.put<Api.Admin.PricingRule>({ url: `/admin/pricing/${id}`, params: data })
}

export function fetchDeletePricing(id: number) {
  return request.del<void>({ url: `/admin/pricing/${id}` })
}

// ===== 公告 =====
export function fetchAdminAnnouncements(params: Api.Admin.AnnouncementSearchParams) {
  return request.get<Api.Common.PaginatedResponse<Api.Admin.AnnouncementItem>>({
    url: '/admin/announcements',
    params
  })
}

export function fetchCreateAnnouncement(data: Api.Admin.CreateAnnouncementParams) {
  return request.post<Api.Admin.AnnouncementItem>({
    url: '/admin/announcements',
    params: data
  })
}

export function fetchUpdateAnnouncement(id: number, data: Api.Admin.UpdateAnnouncementParams) {
  return request.put<Api.Admin.AnnouncementItem>({
    url: `/admin/announcements/${id}`,
    params: data
  })
}

export function fetchDeleteAnnouncement(id: number) {
  return request.del<void>({ url: `/admin/announcements/${id}` })
}

// ===== 公开公告 =====
export function fetchPublicAnnouncements() {
  return request.get<Api.Admin.AnnouncementItem[]>({ url: '/public/announcements' })
}

// ===== 管理员管理 =====
export function fetchAdmins() {
  return request.get<Api.Admin.AdminItem[]>({ url: '/admin/admins' })
}

export function fetchCreateAdmin(data: Api.Admin.CreateAdminParams) {
  return request.post<Api.Admin.AdminItem>({ url: '/admin/admins', params: data })
}

export function fetchDeleteAdmin(id: number) {
  return request.del<void>({ url: `/admin/admins/${id}` })
}

// ===== 操作日志 =====
export function fetchAdminLogs(params: Api.Admin.LogSearchParams) {
  return request.get<Api.Common.PaginatedResponse<Api.Admin.AdminLogItem>>({
    url: '/admin/logs',
    params
  })
}
