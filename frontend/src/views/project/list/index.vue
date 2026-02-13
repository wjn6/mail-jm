<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">项目列表</span>
          <el-button type="primary" @click="showCreateDialog">
            <i class="ri-add-line mr-1"></i>
            新建项目
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col
          v-for="project in projects"
          :key="project.id"
          :xs="24"
          :sm="12"
          :md="8"
          class="mb-4"
        >
          <el-card
            shadow="hover"
            class="project-card cursor-pointer"
            @click="$router.push(`/project/${project.id}/keys`)"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-3"
                >
                  <i class="ri-folder-line text-xl text-blue-500"></i>
                </div>
                <div>
                  <p class="font-bold">{{ project.name }}</p>
                  <p class="text-xs text-gray-400"
                    >创建于 {{ formatProjectDate(project.createdAt) }}</p
                  >
                </div>
              </div>
              <el-dropdown @click.stop trigger="click">
                <el-button text circle>
                  <i class="ri-more-2-fill"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click.stop="editProject(project)">
                      <i class="ri-edit-line mr-1"></i>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item divided @click.stop="deleteProject(project.id)">
                      <span class="text-red-500">
                        <i class="ri-delete-bin-line mr-1"></i>
                        删除
                      </span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="flex gap-4 text-sm text-gray-500">
              <span
                ><i class="ri-key-2-line mr-1"></i>{{ project._count?.apiKeys || 0 }} 个 Key</span
              >
              <span
                ><i class="ri-mail-line mr-1"></i>{{ project._count?.emailTasks || 0 }} 个任务</span
              >
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="projects.length === 0" description="暂无项目，点击上方按钮创建" />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingProject ? '编辑项目' : '新建项目'"
      width="400px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
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
    fetchCreateProject,
    fetchDeleteProject,
    fetchProjects,
    fetchUpdateProject
  } from '@/api/project'
  import { formatDate } from '@/app/email-platform/utils/format'
  import { isActionCancelled, showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'ProjectList' })

  const projects = ref<Api.Project.ProjectItem[]>([])
  const dialogVisible = ref(false)
  const editingProject = ref<Api.Project.ProjectItem | null>(null)
  const formData = reactive({ name: '' })
  const submitting = ref(false)

  const formatProjectDate = (value: string) => formatDate(value)

  const loadProjects = async () => {
    try {
      projects.value = await fetchProjects()
    } catch (error) {
      showApiError(error, '加载项目列表失败')
    }
  }

  const showCreateDialog = () => {
    editingProject.value = null
    formData.name = ''
    dialogVisible.value = true
  }

  const editProject = (project: Api.Project.ProjectItem) => {
    editingProject.value = project
    formData.name = project.name
    dialogVisible.value = true
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      ElMessage.warning('请输入项目名称')
      return
    }

    submitting.value = true
    try {
      if (editingProject.value) {
        await fetchUpdateProject(editingProject.value.id, { name: formData.name })
        ElMessage.success('项目已更新')
      } else {
        await fetchCreateProject(formData.name)
        ElMessage.success('项目已创建')
      }

      dialogVisible.value = false
      await loadProjects()
    } catch (error) {
      showApiError(error, '操作失败')
    } finally {
      submitting.value = false
    }
  }

  const deleteProject = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除该项目？关联的 API Key 也会一并删除', '确认', {
        type: 'warning'
      })
      await fetchDeleteProject(id)
      ElMessage.success('项目已删除')
      await loadProjects()
    } catch (error) {
      if (!isActionCancelled(error)) {
        showApiError(error, '删除项目失败')
      }
    }
  }

  onMounted(loadProjects)
</script>

<style scoped>
  .project-card {
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .project-card:hover {
    transform: translateY(-2px);
  }
</style>
