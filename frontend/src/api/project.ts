import request from '@/utils/http'

export function fetchProjects() {
  return request.get<Api.Project.ProjectItem[]>({
    url: '/user/projects'
  })
}

export function fetchProjectDetail(projectId: number) {
  return request.get<Api.Project.ProjectItem>({
    url: `/user/projects/${projectId}`
  })
}

export function fetchCreateProject(name: string) {
  return request.post<Api.Project.ProjectItem>({
    url: '/user/projects',
    params: { name }
  })
}

export function fetchUpdateProject(projectId: number, data: { name?: string; status?: string }) {
  return request.put<Api.Project.ProjectItem>({
    url: `/user/projects/${projectId}`,
    params: data
  })
}

export function fetchDeleteProject(projectId: number) {
  return request.del<void>({
    url: `/user/projects/${projectId}`
  })
}

// ===== API Key =====

export function fetchApiKeys(projectId: number) {
  return request.get<Api.ApiKey.ApiKeyItem[]>({
    url: `/user/projects/${projectId}/api-keys`
  })
}

export function fetchCreateApiKey(projectId: number, data: Api.ApiKey.CreateApiKeyParams) {
  return request.post<Api.ApiKey.ApiKeyItem>({
    url: `/user/projects/${projectId}/api-keys`,
    params: data
  })
}

export function fetchUpdateApiKey(
  projectId: number,
  keyId: number,
  data: Api.ApiKey.UpdateApiKeyParams
) {
  return request.put<Api.ApiKey.ApiKeyItem>({
    url: `/user/projects/${projectId}/api-keys/${keyId}`,
    params: data
  })
}

export function fetchDeleteApiKey(projectId: number, keyId: number) {
  return request.del<void>({
    url: `/user/projects/${projectId}/api-keys/${keyId}`
  })
}
