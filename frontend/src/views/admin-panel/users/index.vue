<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">用户管理</span>
          <div class="flex gap-2">
            <el-input
              v-model="keyword"
              placeholder="搜索用户名/邮箱"
              clearable
              style="width: 200px"
              @keyup.enter="loadUsers"
            />
            <el-select
              v-model="statusFilter"
              placeholder="状态"
              clearable
              style="width: 120px"
              @change="loadUsers"
            >
              <el-option label="正常" value="ACTIVE" />
              <el-option label="禁用" value="DISABLED" />
            </el-select>
            <el-button @click="loadUsers">
              <i class="ri-search-line"></i>
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="余额" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.wallet?.balance || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="任务数" width="90">
          <template #default="{ row }">{{ row._count?.emailTasks || 0 }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="showRechargeDialog(row)">
              充值
            </el-button>
            <el-button
              text
              :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
              size="small"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
            </el-button>
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
          @current-change="loadUsers"
          @size-change="loadUsers"
        />
      </div>
    </el-card>

    <el-dialog v-model="rechargeDialogVisible" title="用户充值" width="400px">
      <p class="mb-4"
        >为用户 <b>{{ rechargeTarget?.username }}</b> 充值</p
      >
      <el-form label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number
            v-model="rechargeAmount"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeDesc" placeholder="管理员充值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge" :loading="recharging">
          确定充值
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchAdminUsers, fetchRechargeUser, fetchUpdateUserStatus } from '@/api/admin'
  import { usePagination } from '@/app/email-platform/composables/use-pagination'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminUsers' })

  const users = ref<Api.Admin.UserItem[]>([])
  const loading = ref(false)
  const keyword = ref('')
  const statusFilter = ref<Api.Admin.UserStatus | ''>('')

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

  const rechargeDialogVisible = ref(false)
  const rechargeTarget = ref<Api.Admin.UserItem | null>(null)
  const rechargeAmount = ref(10)
  const rechargeDesc = ref('管理员充值')
  const recharging = ref(false)

  const formatTime = (value: string) => formatDateTime(value)

  const loadUsers = async () => {
    loading.value = true
    try {
      const res = await fetchAdminUsers({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
        status: statusFilter.value || undefined
      })
      users.value = res.items || []
      setTotal(res.total || 0)
    } catch (error) {
      showApiError(error, '加载用户列表失败')
    } finally {
      loading.value = false
    }
  }

  const toggleUserStatus = async (user: Api.Admin.UserItem) => {
    const newStatus: Api.Admin.UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const action = newStatus === 'DISABLED' ? '禁用' : '启用'

    try {
      await ElMessageBox.confirm(`确定${action}用户 ${user.username}？`, '确认', {
        type: 'warning'
      })
      await fetchUpdateUserStatus(user.id, newStatus)
      ElMessage.success(`已${action}`)
      await loadUsers()
    } catch (error) {
      if (!isActionCancelled(error)) {
        showApiError(error, `${action}失败`)
      }
    }
  }

  const showRechargeDialog = (user: Api.Admin.UserItem) => {
    rechargeTarget.value = user
    rechargeAmount.value = 10
    rechargeDesc.value = '管理员充值'
    rechargeDialogVisible.value = true
  }

  const handleRecharge = async () => {
    if (!rechargeTarget.value) return

    recharging.value = true
    try {
      await fetchRechargeUser(rechargeTarget.value.id, {
        amount: rechargeAmount.value,
        description: rechargeDesc.value
      })
      ElMessage.success('充值成功')
      rechargeDialogVisible.value = false
      await loadUsers()
    } catch (error) {
      showApiError(error, '充值失败')
    } finally {
      recharging.value = false
    }
  }

  onMounted(loadUsers)
</script>
