<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-button text @click="$router.push('/project/list')">
              <i class="ri-arrow-left-line mr-1"></i>
            </el-button>
            <span class="text-lg font-bold">API Key 管理</span>
            <el-tag class="ml-2" type="info" size="small">{{ projectName }}</el-tag>
          </div>
          <el-button type="primary" @click="showCreateDialog">
            <i class="ri-add-line mr-1"></i>
            创建 Key
          </el-button>
        </div>
      </template>

      <el-table :data="apiKeys" stripe>
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="keyPrefix" label="Key 前缀" width="120">
          <template #default="{ row }">
            <code class="text-sm">{{ row.keyPrefix }}...</code>
          </template>
        </el-table-column>
        <el-table-column prop="rateLimit" label="限流/分钟" width="110" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expiresAt" label="过期时间" width="170">
          <template #default="{ row }">
            {{ row.expiresAt ? formatTime(row.expiresAt) : '永不过期' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="toggleStatus(row)">
              {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="apiKeys.length === 0" description="暂无 API Key" />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="创建 API Key" width="450px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="createForm.name" placeholder="如: 生产环境" />
        </el-form-item>
        <el-form-item label="限流(次/分)">
          <el-input-number v-model="createForm.rateLimit" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="createForm.expiresAt"
            type="datetime"
            placeholder="留空则永不过期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="keyResultDialogVisible"
      title="API Key 创建成功"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert type="warning" :closable="false" class="mb-4">
        <p class="font-bold">请立即保存此 API Key！关闭后将无法再次查看。</p>
      </el-alert>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p class="text-sm text-gray-500 mb-2">API Key:</p>
        <div class="flex items-center gap-2">
          <code class="text-lg font-mono break-all flex-1">{{ newApiKey }}</code>
          <el-button type="primary" @click="copyKey">复制</el-button>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="keyResultDialogVisible = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchApiKeys,
    fetchCreateApiKey,
    fetchDeleteApiKey,
    fetchProjectDetail,
    fetchUpdateApiKey
  } from '@/api/project'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { runConfirmAction, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'ProjectKeys' })

  interface CreateFormState {
    name: string
    rateLimit: number
    expiresAt: string | Date | null
  }

  const route = useRoute()
  const projectId = computed(() => Number(route.params.id))
  const projectName = ref('')
  const apiKeys = ref<Api.ApiKey.ApiKeyItem[]>([])

  const createDialogVisible = ref(false)
  const keyResultDialogVisible = ref(false)
  const newApiKey = ref('')
  const creating = ref(false)
  const createForm = reactive<CreateFormState>({
    name: '',
    rateLimit: 60,
    expiresAt: null
  })

  const formatTime = (value: string) => formatDateTime(value)

  const loadKeys = async () => {
    try {
      const project = await fetchProjectDetail(projectId.value)
      projectName.value = project.name
      apiKeys.value = await fetchApiKeys(projectId.value)
    } catch (error) {
      showApiError(error, '加载 API Key 失败')
    }
  }

  const showCreateDialog = () => {
    createForm.name = ''
    createForm.rateLimit = 60
    createForm.expiresAt = null
    createDialogVisible.value = true
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      ElMessage.warning('请输入名称')
      return
    }

    creating.value = true
    try {
      const result = await fetchCreateApiKey(projectId.value, {
        name: createForm.name,
        rateLimit: createForm.rateLimit,
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : undefined
      })

      createDialogVisible.value = false
      newApiKey.value = result.key || ''
      keyResultDialogVisible.value = true
      await loadKeys()
    } catch (error) {
      showApiError(error, '创建失败')
    } finally {
      creating.value = false
    }
  }

  const toggleStatus = async (row: Api.ApiKey.ApiKeyItem) => {
    const newStatus: Api.ApiKey.ApiKeyStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    try {
      await fetchUpdateApiKey(projectId.value, row.id, { status: newStatus })
      ElMessage.success('状态已更新')
      await loadKeys()
    } catch (error) {
      showApiError(error, '操作失败')
    }
  }

  const handleDelete = async (keyId: number) => {
    await runConfirmAction({
      message: '确定删除此 API Key？',
      errorMessage: '删除失败',
      successMessage: '已删除',
      onConfirm: async () => {
        await fetchDeleteApiKey(projectId.value, keyId)
        await loadKeys()
      }
    })
  }

  const copyKey = async () => {
    await navigator.clipboard.writeText(newApiKey.value)
    ElMessage.success('已复制到剪贴板')
  }

  onMounted(loadKeys)
</script>
