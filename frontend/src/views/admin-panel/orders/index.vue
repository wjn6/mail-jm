<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">订单管理</span>
          <div class="flex gap-2">
            <el-input
              v-model="filters.email"
              placeholder="邮箱"
              clearable
              style="width: 180px"
              @keyup.enter="loadOrders"
            />
            <el-select
              v-model="filters.status"
              placeholder="状态"
              clearable
              style="width: 120px"
              @change="loadOrders"
            >
              <el-option label="进行中" value="ACTIVE" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已过期" value="EXPIRED" />
              <el-option label="失败" value="FAILED" />
            </el-select>
            <el-button @click="loadOrders">
              <i class="ri-search-line"></i>
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">{{ row.user?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyCode" label="验证码" width="100">
          <template #default="{ row }">
            <span class="font-mono">{{ row.verifyCode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="费用" width="80">
          <template #default="{ row }">¥{{ Number(row.cost).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadOrders"
          @size-change="loadOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { fetchAdminOrders } from '@/api/admin'
  import {
    createPaginationBindings,
    usePagination
  } from '@/app/email-platform/composables/use-pagination'
  import {
    getTaskStatusTagType,
    getTaskStatusText
  } from '@/app/email-platform/constants/task-status'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminOrders' })

  const orders = ref<Api.Admin.AdminOrderItem[]>([])
  const loading = ref(false)
  const filters = reactive({ email: '', status: '' })

  const { pagination, setTotal } = usePagination(20)
  const { page, pageSize, total } = createPaginationBindings(pagination)

  const getStatusType = (status: string) => getTaskStatusTagType(status)
  const getStatusText = (status: string) => getTaskStatusText(status)
  const formatTime = (value: string) => formatDateTime(value)

  const loadOrders = async () => {
    loading.value = true
    try {
      const res = await fetchAdminOrders({
        page: page.value,
        pageSize: pageSize.value,
        email: filters.email || undefined,
        status: filters.status || undefined
      })

      orders.value = res.items || []
      setTotal(res.total || 0)
    } catch (error) {
      showApiError(error, '加载订单列表失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadOrders)
</script>
