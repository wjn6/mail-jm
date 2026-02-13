<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">管理员管理</span>
          <el-button type="primary" @click="showCreate">
            <i class="ri-add-line mr-1"></i>
            添加管理员
          </el-button>
        </div>
      </template>

      <el-table :data="admins" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="role" label="角色" width="130">
          <template #default="{ row }">
            <el-tag :type="row.role === 'SUPER_ADMIN' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.role !== 'SUPER_ADMIN'"
              text
              type="danger"
              size="small"
              @click="deleteAdmin(row.id)"
            >
              删除
            </el-button>
            <span v-else class="text-gray-400 text-sm">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加管理员" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="超级管理员" value="SUPER_ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchAdmins, fetchCreateAdmin, fetchDeleteAdmin } from '@/api/admin'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminAdmins' })

  const admins = ref<Api.Admin.AdminItem[]>([])
  const dialogVisible = ref(false)
  const submitting = ref(false)
  const form = reactive<Api.Admin.CreateAdminParams>({
    username: '',
    password: '',
    role: 'ADMIN'
  })

  const formatTime = (value: string) => formatDateTime(value)

  const resetForm = () => {
    form.username = ''
    form.password = ''
    form.role = 'ADMIN'
  }

  const loadData = async () => {
    try {
      admins.value = await fetchAdmins()
    } catch (error) {
      showApiError(error, '加载管理员列表失败')
    }
  }

  const showCreate = () => {
    resetForm()
    dialogVisible.value = true
  }

  const handleCreate = async () => {
    submitting.value = true
    try {
      await fetchCreateAdmin(form)
      ElMessage.success('已创建')
      dialogVisible.value = false
      await loadData()
    } catch (error) {
      showApiError(error, '创建失败')
    } finally {
      submitting.value = false
    }
  }

  const deleteAdmin = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
      await fetchDeleteAdmin(id)
      ElMessage.success('已删除')
      await loadData()
    } catch (error) {
      if (!isActionCancelled(error)) {
        showApiError(error, '删除失败')
      }
    }
  }

  onMounted(loadData)
</script>
