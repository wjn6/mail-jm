<template>
  <div class="p-5">
    <el-row :gutter="20" class="mb-5">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover">
          <div class="text-center py-3">
            <p class="text-sm text-gray-500">充值总额</p>
            <p class="text-2xl font-bold text-green-600">
              ¥{{ financeStats.rechargeTotal?.toFixed(2) || '0.00' }}
            </p>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover">
          <div class="text-center py-3">
            <p class="text-sm text-gray-500">消费总额</p>
            <p class="text-2xl font-bold text-red-500">
              ¥{{ financeStats.consumeTotal?.toFixed(2) || '0.00' }}
            </p>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover">
          <div class="text-center py-3">
            <p class="text-sm text-gray-500">退款总额</p>
            <p class="text-2xl font-bold text-orange-500">
              ¥{{ financeStats.refundTotal?.toFixed(2) || '0.00' }}
            </p>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover">
          <div class="text-center py-3">
            <p class="text-sm text-gray-500">交易笔数</p>
            <p class="text-2xl font-bold">{{ financeStats.transactionCount || 0 }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover">
      <template #header>
        <span class="font-bold">充值记录</span>
      </template>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">{{ row.user?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110">
          <template #default="{ row }">
            <span class="text-green-600 font-bold"
              >+¥{{ Math.abs(Number(row.amount)).toFixed(2) }}</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="170">
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
          @current-change="loadRecords"
          @size-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { fetchFinanceStats, fetchRechargeRecords } from '@/api/admin'
  import { usePagination } from '@/app/email-platform/composables/use-pagination'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminFinance' })

  const financeStats = ref<Partial<Api.Admin.FinanceStats>>({})
  const records = ref<Api.Admin.RechargeRecordItem[]>([])
  const loading = ref(false)

  const { pagination, setTotal } = usePagination(20)
  const page = computed({
    get: () => pagination.page,
    set: (value: number) => {
      pagination.page = value
    }
  })
  const pageSize = computed({
    get: () => pagination.pageSize,
    set: (value: number) => {
      pagination.pageSize = value
    }
  })
  const total = computed(() => pagination.total)

  const formatTime = (value: string) => formatDateTime(value)

  const loadRecords = async () => {
    loading.value = true
    try {
      const res = await fetchRechargeRecords({
        page: page.value,
        pageSize: pageSize.value
      })
      records.value = res.items || []
      setTotal(res.total || 0)
    } catch (error) {
      showApiError(error, '加载充值记录失败')
    } finally {
      loading.value = false
    }
  }

  const loadStats = async () => {
    try {
      financeStats.value = await fetchFinanceStats(30)
    } catch (error) {
      showApiError(error, '加载财务统计失败')
    }
  }

  onMounted(async () => {
    await loadStats()
    await loadRecords()
  })
</script>
