import request from '@/utils/http'

interface AdminProfileResponse {
  id: number
  username: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  status: string
  createdAt: string
}

// ===== 用户认证 =====

export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    params
  })
}

export function fetchRegister(params: Api.Auth.RegisterParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/register',
    params
  })
}

export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/auth/me'
  })
}

export function fetchChangePassword(params: Api.Auth.ChangePasswordParams) {
  return request.post({
    url: '/auth/change-password',
    params
  })
}

// ===== 管理员认证 =====

export function fetchAdminLogin(params: Api.Auth.AdminLoginParams) {
  return request.post<Api.Auth.AdminLoginResponse>({
    url: '/admin/auth/login',
    params
  })
}

export function fetchAdminInfo() {
  return request.get<AdminProfileResponse>({
    url: '/admin/auth/me'
  })
}

// 兼容框架菜单获取（前端模式下不会调用，仅防止导入报错）
export function fetchGetMenuList() {
  return Promise.resolve([])
}
