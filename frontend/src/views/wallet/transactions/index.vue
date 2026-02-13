<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">消费记录</span>
          <el-select
            v-model="typeFilter"
            placeholder="全部类型"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option label="充值" value="RECHARGE" />
            <el-option label="消费" value="CONSUME" />
            <el-option label="退款" value="REFUND" />
            <el-option label="冻结" value="FREEZE" />
            <el-option label="解冻" value="UNFREEZE" />
          </el-select>
        </div>
      </template>

      <el-table :data="transactions" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110">
          <template #default="{ row }">
            <span
              :class="
                Number(row.amount) > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'
              "
            >
              {{ Number(row.amount) > 0 ? '+' : '' }}¥{{ Math.abs(Number(row.amount)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceAfter" label="余额" width="110">
          <template #default="{ row }"> ¥{{ Number(row.balanceAfter).toFixed(2) }} </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { fetchTransactions } from '@/api/wallet'
  import {
    getTransactionTypeTagType,
    getTransactionTypeText
  } from '@/app/email-platform/constants/transaction-type'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'
  import { usePagination } from '@/app/email-platform/composables/use-pagination'

  defineOptions({ name: 'Transactions' })

  const transactions = ref<Api.Wallet.TransactionItem[]>([])
  const loading = ref(false)
  const typeFilter = ref('')
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

  const getTypeColor = (type: string) => getTransactionTypeTagType(type)
  const getTypeText = (type: string) => getTransactionTypeText(type)
  const formatTime = (dateStr: string) => formatDateTime(dateStr)

  const loadData = async () => {
    loading.value = true
    try {
      const res = await fetchTransactions({
        page: page.value,
        pageSize: pageSize.value,
        type: typeFilter.value || undefined
      })
      transactions.value = res.items || []
      setTotal(res.total)
    } catch (error) {
      showApiError(error, '加载交易记录失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)
</script>
