<template>
  <div class="p-5">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-5">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-blue-50 text-blue-500">
              <i class="ri-wallet-3-line text-xl"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">账户余额</p>
              <p class="text-xl font-bold">¥{{ dashboardData.balance?.toFixed(2) || '0.00' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-green-50 text-green-500">
              <i class="ri-mail-check-line text-xl"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">今日任务</p>
              <p class="text-xl font-bold">{{ dashboardData.todayTasks || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-orange-50 text-orange-500">
              <i class="ri-play-circle-line text-xl"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">进行中</p>
              <p class="text-xl font-bold">{{ dashboardData.activeTasks || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-purple-50 text-purple-500">
              <i class="ri-folder-line text-xl"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">项目数</p>
              <p class="text-xl font-bold">{{ dashboardData.projectCount || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 快速操作 -->
      <el-col :xs="24" :sm="12" class="mb-5">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center">
              <i class="ri-flashlight-line mr-2"></i>
              <span class="font-bold">快速操作</span>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-4">
            <el-button
              type="primary"
              size="large"
              class="!w-full"
              @click="$router.push('/task/get-email')"
            >
              <i class="ri-mail-add-line mr-1"></i> 获取邮箱
            </el-button>
            <el-button size="large" class="!w-full" @click="$router.push('/task/history')">
              <i class="ri-history-line mr-1"></i> 任务记录
            </el-button>
            <el-button size="large" class="!w-full" @click="$router.push('/wallet/recharge')">
              <i class="ri-coin-line mr-1"></i> 充值
            </el-button>
            <el-button size="large" class="!w-full" @click="$router.push('/project/list')">
              <i class="ri-folder-open-line mr-1"></i> 项目管理
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 最近任务 -->
      <el-col :xs="24" :sm="12" class="mb-5">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="ri-time-line mr-2"></i>
                <span class="font-bold">最近任务</span>
              </div>
              <el-button text type="primary" size="small" @click="$router.push('/task/history')"
                >查看全部</el-button
              >
            </div>
          </template>
          <el-table :data="recentTasks" size="small" stripe>
            <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{
                  getStatusText(row.status)
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verifyCode" label="验证码" width="100">
              <template #default="{ row }">
                <span class="font-mono font-bold text-green-600">{{ row.verifyCode || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告 -->
    <el-card shadow="hover" v-if="announcements.length > 0">
      <template #header>
        <div class="flex items-center">
          <i class="ri-megaphone-line mr-2"></i>
          <span class="font-bold">系统公告</span>
        </div>
      </template>
      <div v-for="item in announcements" :key="item.id" class="mb-3 last:mb-0">
        <div class="flex items-start">
          <el-tag
            :type="
              item.type === 'IMPORTANT' ? 'danger' : item.type === 'WARNING' ? 'warning' : 'info'
            "
            size="small"
            class="mr-2 mt-0.5"
          >
            {{ item.type === 'IMPORTANT' ? '重要' : item.type === 'WARNING' ? '警告' : '通知' }}
          </el-tag>
          <div>
            <p class="font-medium">{{ item.title }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ item.content }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { fetchUserDashboard, fetchRecentTasks } from '@/api/dashboard'
  import { fetchPublicAnnouncements } from '@/api/admin'
  import {
    getTaskStatusTagType,
    getTaskStatusText
  } from '@/app/email-platform/constants/task-status'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'Console' })

  const dashboardData = ref<Partial<Api.Dashboard.UserDashboard>>({})
  const recentTasks = ref<Api.Task.TaskItem[]>([])
  const announcements = ref<Api.Admin.AnnouncementItem[]>([])

  const getStatusType = (status: string) => getTaskStatusTagType(status)
  const getStatusText = (status: string) => getTaskStatusText(status)
  const formatTime = (dateStr: string) => formatDateTime(dateStr)

  onMounted(async () => {
    try {
      const [dashboard, tasks, anns] = await Promise.all([
        fetchUserDashboard(),
        fetchRecentTasks(),
        fetchPublicAnnouncements()
      ])
      dashboardData.value = dashboard
      recentTasks.value = tasks || []
      announcements.value = anns || []
    } catch (error) {
      showApiError(error, '加载工作台数据失败')
    }
  })
</script>

<style scoped>
  .stat-card {
    transition: transform 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }
</style>
