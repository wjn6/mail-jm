<template>
  <div class="p-5">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" class="mb-5">
        <el-card shadow="hover">
          <template #header>
            <span class="text-lg font-bold">Wallet Recharge</span>
          </template>

          <div class="py-4 text-center">
            <p class="mb-2 text-sm text-gray-500">Current Balance</p>
            <p class="text-3xl font-bold text-blue-600">${{ balance.toFixed(2) }}</p>
            <p v-if="frozenBalance > 0" class="mt-1 text-xs text-gray-400">
              Frozen: ${{ frozenBalance.toFixed(2) }}
            </p>
          </div>

          <el-divider />

          <div class="mb-4">
            <p class="mb-3 font-medium">Select Amount</p>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="amount in rechargeAmounts"
                :key="amount"
                class="cursor-pointer rounded-lg border-2 p-3 text-center transition-all"
                :class="
                  selectedAmount === amount
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                "
                @click="handleAmountSelect(amount)"
              >
                <p class="text-lg font-bold">${{ amount }}</p>
              </div>
            </div>
          </div>

          <el-form-item label="Custom Amount" class="mt-4">
            <el-input-number
              v-model.number="customAmount"
              :min="1"
              :max="10000"
              :precision="2"
              style="width: 100%"
              @change="selectedAmount = 0"
              placeholder="Enter amount"
            />
          </el-form-item>

          <el-alert type="info" :closable="false" class="mt-4">
            <p>Contact admin to complete the recharge request.</p>
          </el-alert>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" class="mb-5">
        <el-card shadow="hover">
          <template #header>
            <span class="text-lg font-bold">Recent Transactions</span>
          </template>

          <el-table :data="recentTransactions" size="small" stripe>
            <el-table-column prop="type" label="Type" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeColor(row.type)" size="small">
                  {{ getTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="Amount" width="120">
              <template #default="{ row }">
                <span :class="Number(row.amount) > 0 ? 'text-green-600' : 'text-red-500'">
                  {{ Number(row.amount) > 0 ? '+' : '' }}{{ Number(row.amount).toFixed(2) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="description" label="Description" show-overflow-tooltip />

            <el-table-column prop="createdAt" label="Time" width="170">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-3 text-center">
            <el-button text type="primary" @click="$router.push('/wallet/transactions')">
              View All
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { fetchWallet, fetchTransactions } from '@/api/wallet'
  import {
    getTransactionTypeTagType,
    getTransactionTypeText
  } from '@/app/email-platform/constants/transaction-type'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'Recharge' })

  const balance = ref(0)
  const frozenBalance = ref(0)
  const selectedAmount = ref(10)
  const customAmount = ref<number | undefined>(undefined)
  const rechargeAmounts = [10, 50, 100, 200, 500, 1000]
  const recentTransactions = ref<Api.Wallet.TransactionItem[]>([])

  const handleAmountSelect = (amount: number) => {
    selectedAmount.value = amount
    customAmount.value = undefined
  }

  const getTypeColor = (type: string) => getTransactionTypeTagType(type)
  const getTypeText = (type: string) => getTransactionTypeText(type)
  const formatTime = (dateStr: string) => formatDateTime(dateStr)

  onMounted(async () => {
    try {
      const [wallet, txns] = await Promise.all([
        fetchWallet(),
        fetchTransactions({ page: 1, pageSize: 10 })
      ])

      balance.value = Number(wallet.balance) || 0
      frozenBalance.value = Number(wallet.frozenBalance) || 0
      recentTransactions.value = txns.items || []
    } catch (error) {
      showApiError(error, 'Failed to load wallet data')
    }
  })
</script>
