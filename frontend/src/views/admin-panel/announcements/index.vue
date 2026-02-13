<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">公告管理</span>
          <el-button type="primary" @click="showCreate">
            <i class="ri-add-line mr-1"></i>
            发布公告
          </el-button>
        </div>
      </template>

      <el-table :data="announcements" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag
              :type="
                row.type === 'IMPORTANT' ? 'danger' : row.type === 'WARNING' ? 'warning' : 'info'
              "
              size="small"
            >
              {{ getAnnouncementTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pinned" label="置顶" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.pinned" type="success" size="small">置顶</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ row.status === 'ACTIVE' ? '发布' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editItem(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteItem(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="20"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="通知" value="INFO" />
            <el-option label="警告" value="WARNING" />
            <el-option label="重要" value="IMPORTANT" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.pinned" />
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
    fetchAdminAnnouncements,
    fetchCreateAnnouncement,
    fetchDeleteAnnouncement,
    fetchUpdateAnnouncement
  } from '@/api/admin'
  import { usePagination } from '@/app/email-platform/composables/use-pagination'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminAnnouncements' })

  interface AnnouncementForm {
    title: string
    content: string
    type: Api.Admin.AnnouncementType
    pinned: boolean
  }

  const announcementTypeText: Record<Api.Admin.AnnouncementType, string> = {
    INFO: '通知',
    WARNING: '警告',
    IMPORTANT: '重要'
  }

  const getAnnouncementTypeLabel = (type: string) => {
    return announcementTypeText[type as Api.Admin.AnnouncementType] || type
  }

  const announcements = ref<Api.Admin.AnnouncementItem[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const editing = ref<Api.Admin.AnnouncementItem | null>(null)
  const submitting = ref(false)

  const form = reactive<AnnouncementForm>({
    title: '',
    content: '',
    type: 'INFO',
    pinned: false
  })

  const { pagination, setTotal } = usePagination(20)
  const page = computed({
    get: () => pagination.page,
    set: (value: number) => {
      pagination.page = value
    }
  })
  const total = computed(() => pagination.total)

  const formatTime = (value: string) => formatDateTime(value)

  const resetForm = () => {
    form.title = ''
    form.content = ''
    form.type = 'INFO'
    form.pinned = false
  }

  const loadData = async () => {
    loading.value = true
    try {
      const res = await fetchAdminAnnouncements({ page: page.value, pageSize: 20 })
      announcements.value = res.items || []
      setTotal(res.total || 0)
    } catch (error) {
      showApiError(error, '加载公告列表失败')
    } finally {
      loading.value = false
    }
  }

  const showCreate = () => {
    editing.value = null
    resetForm()
    dialogVisible.value = true
  }

  const editItem = (row: Api.Admin.AnnouncementItem) => {
    editing.value = row
    form.title = row.title
    form.content = row.content
    form.type = row.type
    form.pinned = row.pinned
    dialogVisible.value = true
  }

  const handleSubmit = async () => {
    submitting.value = true
    try {
      if (editing.value) {
        await fetchUpdateAnnouncement(editing.value.id, form)
      } else {
        await fetchCreateAnnouncement(form)
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

  const deleteItem = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
      await fetchDeleteAnnouncement(id)
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
