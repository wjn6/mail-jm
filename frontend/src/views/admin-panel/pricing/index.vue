<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">计费设置</span>
          <el-button type="primary" @click="showCreate">
            <i class="ri-add-line mr-1"></i>
            新增规则
          </el-button>
        </div>
      </template>

      <el-table :data="rules" stripe>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type === 'PER_USE' ? '按次' : '包月' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ Number(row.price).toFixed(4) }}</template>
        </el-table-column>
        <el-table-column prop="isDefault" label="默认" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editRule(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteRule(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑规则' : '新增规则'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="按次计费" value="PER_USE" />
            <el-option label="包月" value="PACKAGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="4"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="默认">
          <el-switch v-model="form.isDefault" />
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
    fetchCreatePricing,
    fetchDeletePricing,
    fetchPricingRules,
    fetchUpdatePricing
  } from '@/api/admin'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminPricing' })

  interface PricingForm {
    name: string
    type: string
    price: number
    description: string
    isDefault: boolean
  }

  const rules = ref<Api.Admin.PricingRule[]>([])
  const dialogVisible = ref(false)
  const editing = ref<Api.Admin.PricingRule | null>(null)
  const submitting = ref(false)

  const form = reactive<PricingForm>({
    name: '',
    type: 'PER_USE',
    price: 0.1,
    description: '',
    isDefault: false
  })

  const resetForm = () => {
    form.name = ''
    form.type = 'PER_USE'
    form.price = 0.1
    form.description = ''
    form.isDefault = false
  }

  const loadData = async () => {
    try {
      rules.value = await fetchPricingRules()
    } catch (error) {
      showApiError(error, '加载计费规则失败')
    }
  }

  const showCreate = () => {
    editing.value = null
    resetForm()
    dialogVisible.value = true
  }

  const editRule = (row: Api.Admin.PricingRule) => {
    editing.value = row
    form.name = row.name
    form.type = row.type
    form.price = Number(row.price)
    form.description = row.description || ''
    form.isDefault = row.isDefault
    dialogVisible.value = true
  }

  const handleSubmit = async () => {
    submitting.value = true
    try {
      if (editing.value) {
        await fetchUpdatePricing(editing.value.id, form)
      } else {
        await fetchCreatePricing(form)
      }

      ElMessage.success('操作成功')
      dialogVisible.value = false
      await loadData()
    } catch (error) {
      showApiError(error, '操作失败')
    } finally {
      submitting.value = false
    }
  }

  const deleteRule = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
      await fetchDeletePricing(id)
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
