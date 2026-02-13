<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">上游管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <i class="ri-add-line mr-1"></i>
            添加上游源
          </el-button>
        </div>
      </template>

      <el-table :data="upstreams" stripe>
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="baseUrl" label="地址" min-width="250" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editUpstream(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteUpstream(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑上游源' : '添加上游源'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="GongXi" value="gongxi" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="API地址" required>
          <el-input v-model="form.baseUrl" placeholder="http://host:3000" />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input v-model="form.apiKey" :placeholder="editing ? '留空表示不修改' : 'sk_xxx'" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchCreateUpstream,
    fetchDeleteUpstream,
    fetchUpdateUpstream,
    fetchUpstreams
  } from '@/api/admin'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminUpstream' })

  interface UpstreamForm {
    name: string
    type: Api.Admin.UpstreamType
    baseUrl: string
    apiKey: string
    priority: number
  }

  const upstreams = ref<Api.Admin.UpstreamItem[]>([])
  const dialogVisible = ref(false)
  const editing = ref<Api.Admin.UpstreamItem | null>(null)
  const submitting = ref(false)

  const form = reactive<UpstreamForm>({
    name: '',
    type: 'gongxi',
    baseUrl: '',
    apiKey: '',
    priority: 0
  })

  const resetForm = () => {
    form.name = ''
    form.type = 'gongxi'
    form.baseUrl = ''
    form.apiKey = ''
    form.priority = 0
  }

  const loadData = async () => {
    try {
      upstreams.value = await fetchUpstreams()
    } catch (error) {
      showApiError(error, '加载上游列表失败')
    }
  }

  const showCreateDialog = () => {
    editing.value = null
    resetForm()
    dialogVisible.value = true
  }

  const editUpstream = (row: Api.Admin.UpstreamItem) => {
    editing.value = row
    form.name = row.name
    form.type = row.type
    form.baseUrl = row.baseUrl
    form.apiKey = ''
    form.priority = row.priority || 0
    dialogVisible.value = true
  }

  const handleSubmit = async () => {
    submitting.value = true
    try {
      if (editing.value) {
        const updateData: Api.Admin.UpdateUpstreamParams = {
          name: form.name,
          type: form.type,
          baseUrl: form.baseUrl,
          priority: form.priority
        }

        if (form.apiKey) {
          updateData.apiKey = form.apiKey
        }

        await fetchUpdateUpstream(editing.value.id, updateData)
        ElMessage.success('已更新')
      } else {
        await fetchCreateUpstream(form)
        ElMessage.success('已添加')
      }

      dialogVisible.value = false
      await loadData()
    } catch (error) {
      showApiError(error, '操作失败')
    } finally {
      submitting.value = false
    }
  }

  const deleteUpstream = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
      await fetchDeleteUpstream(id)
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
