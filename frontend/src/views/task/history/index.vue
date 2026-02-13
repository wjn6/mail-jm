<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">任务记录</span>
          <div class="flex gap-2">
            <el-select
              v-model="filters.status"
              placeholder="状态筛选"
              clearable
              style="width: 140px"
              @change="loadTasks"
            >
              <el-option label="进行中" value="ACTIVE" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已过期" value="EXPIRED" />
              <el-option label="已释放" value="RELEASED" />
              <el-option label="失败" value="FAILED" />
            </el-select>
            <el-button @click="loadTasks" :loading="loading">
              <i class="ri-refresh-line mr-1"></i> 刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tasks" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{
              getStatusText(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyCode" label="验证码" width="120">
          <template #default="{ row }">
            <span
              v-if="row.verifyCode"
              class="font-mono font-bold text-green-600 cursor-pointer"
              @click="copyText(row.verifyCode)"
            >
              {{ row.verifyCode }} <i class="ri-file-copy-line text-xs"></i>
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="费用" width="80">
          <template #default="{ row }"> ¥{{ Number(row.cost).toFixed(2) }} </template>
        </el-table-column>
        <el-table-column prop="project" label="项目" width="120">
          <template #default="{ row }">
            {{ row.project?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadTasks"
          @size-change="loadTasks"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchTaskList } from '@/api/task'
  import {
    getTaskStatusTagType,
    getTaskStatusText
  } from '@/app/email-platform/constants/task-status'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'
  import { usePagination } from '@/app/email-platform/composables/use-pagination'

  defineOptions({ name: 'TaskHistory' })

  const tasks = ref<Api.Task.TaskItem[]>([])
  const loading = ref(false)
  const filters = reactive({ status: '' })
  const { pagination, setTotal } = usePagination(20)

  const getStatusType = (status: string) => getTaskStatusTagType(status)
  const getStatusText = (status: string) => getTaskStatusText(status)
  const formatTime = (value: string) => formatDateTime(value)
  const copyText = async (t: string) => {
    await navigator.clipboard.writeText(t)
    ElMessage.success('已复制')
  }

  const loadTasks = async () => {
    loading.value = true
    try {
      const res = await fetchTaskList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined
      })
      tasks.value = res.items || []
      setTotal(res.total)
    } catch (error) {
      showApiError(error, '加载任务记录失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadTasks)
</script>
