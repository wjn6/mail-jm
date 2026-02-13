import type { AppRouteRecord } from '@/types/router'
import { asyncRoutes } from '@/router/routes/asyncRoutes'
import { ACCOUNT_TABLE_DATA, ROLE_LIST_DATA } from '@/mock/temp/formData'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

function toLowerCaseText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function normalizePagination(current?: unknown, size?: unknown) {
  const page = Number(current) > 0 ? Number(current) : DEFAULT_PAGE
  const pageSize = Number(size) > 0 ? Number(size) : DEFAULT_PAGE_SIZE
  return { page, pageSize }
}

function paginate<T>(items: T[], page: number, pageSize: number): Api.Common.PaginatedResponse<T> {
  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  }
}

const USER_ROLES = ['R_SUPER', 'R_ADMIN', 'R_USER', 'R_FINANCE', 'R_SUPPORT'] as const

const USER_LIST_DATA: Api.SystemManage.UserListItem[] = ACCOUNT_TABLE_DATA.map((item, index) => {
  const gender = item.gender === 1 ? '1' : '2'

  return {
    id: item.id,
    avatar: item.avatar,
    status: item.status,
    userName: item.username,
    nickName: item.username,
    userPhone: item.mobile,
    userEmail: item.email,
    userGender: gender,
    userRoles: [USER_ROLES[index % USER_ROLES.length]],
    createTime: item.create_time,
    department: item.dep,
    score: (index % 5) + 1
  }
})

function matchesGender(userGender: string, searchGender: unknown) {
  const value = toLowerCaseText(searchGender)

  if (!value) return true
  if (value === '1' || value === 'male' || value === 'man') return userGender === '1'
  if (value === '2' || value === 'female' || value === 'woman') return userGender === '2'

  return toLowerCaseText(userGender) === value
}

function normalizeEnabled(enabled: unknown) {
  if (typeof enabled === 'boolean') return enabled
  if (enabled === '1' || enabled === 1 || enabled === 'true') return true
  if (enabled === '0' || enabled === 0 || enabled === 'false') return false
  return undefined
}

function cloneMenuRoutes(routes: AppRouteRecord[]): AppRouteRecord[] {
  return routes.map((route) => ({
    ...route,
    meta: route.meta
      ? {
          ...route.meta,
          authList: route.meta.authList ? [...route.meta.authList] : route.meta.authList,
          roles: route.meta.roles ? [...route.meta.roles] : route.meta.roles
        }
      : route.meta,
    children: route.children?.length ? cloneMenuRoutes(route.children) : route.children
  }))
}

export function fetchGetUserList(params: Api.SystemManage.UserSearchParams = {}) {
  const { page, pageSize } = normalizePagination(params.current, params.size)
  const userName = toLowerCaseText(params.userName ?? params.name)
  const userPhone = toLowerCaseText(params.userPhone ?? params.phone)
  const userEmail = toLowerCaseText(params.userEmail ?? params.email)
  const status = toLowerCaseText(params.status)
  const department = toLowerCaseText(params.department)

  const filtered = USER_LIST_DATA.filter((item) => {
    if (userName && !toLowerCaseText(item.userName).includes(userName)) return false
    if (userPhone && !toLowerCaseText(item.userPhone).includes(userPhone)) return false
    if (userEmail && !toLowerCaseText(item.userEmail).includes(userEmail)) return false
    if (status && toLowerCaseText(item.status) !== status) return false
    if (department && !toLowerCaseText(item.department).includes(department)) return false
    if (!matchesGender(item.userGender, params.userGender)) return false
    return true
  })

  return Promise.resolve(paginate(filtered, page, pageSize))
}

export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams = {}) {
  const { page, pageSize } = normalizePagination(params.current, params.size)
  const roleName = toLowerCaseText(params.roleName)
  const roleCode = toLowerCaseText(params.roleCode)
  const description = toLowerCaseText(params.description)
  const enabled = normalizeEnabled(params.enabled)

  const roles: Api.SystemManage.RoleListItem[] = ROLE_LIST_DATA.map((item, index) => ({
    roleId: index + 1,
    roleName: item.roleName,
    roleCode: item.roleCode,
    description: item.des,
    enabled: item.enable,
    createTime: item.date
  }))

  const filtered = roles.filter((item) => {
    if (roleName && !toLowerCaseText(item.roleName).includes(roleName)) return false
    if (roleCode && !toLowerCaseText(item.roleCode).includes(roleCode)) return false
    if (description && !toLowerCaseText(item.description).includes(description)) return false
    if (enabled !== undefined && item.enabled !== enabled) return false
    return true
  })

  return Promise.resolve(paginate(filtered, page, pageSize))
}

export function fetchGetMenuList() {
  return Promise.resolve(cloneMenuRoutes(asyncRoutes))
}
