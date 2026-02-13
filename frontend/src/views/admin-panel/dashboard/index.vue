<template>
  <div class="p-5">
    <el-row :gutter="20" class="mb-5">
      <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon" :class="stat.bgClass">
              <i :class="stat.icon" class="text-xl"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">{{ stat.label }}</p>
              <p class="text-xl font-bold">{{ stat.prefix || '' }}{{ stat.value }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="16" class="mb-5">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">任务趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadTrend">
                <el-radio-button :value="7">7天</el-radio-button>
                <el-radio-button :value="14">14天</el-radio-button>
                <el-radio-button :value="30">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8" class="mb-5">
        <el-card shadow="hover" style="height: 100%">
          <template #header>
            <span class="font-bold">上游源状态</span>
          </template>
          <div
            v-for="item in upstreamHealth"
            :key="item.id"
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <span>{{ item.name }}</span>
            <el-tag :type="item.healthy ? 'success' : 'danger'" size="small">
              {{ item.healthy ? '正常' : '异常' }}
            </el-tag>
          </div>
          <el-empty v-if="upstreamHealth.length === 0" description="暂无上游源" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import * as echarts from 'echarts'
  import { fetchUpstreamHealth } from '@/api/admin'
  import { fetchAdminDashboard, fetchTaskTrend } from '@/api/dashboard'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'AdminDashboard' })

  interface StatCard {
    label: string
    value: number | string
    icon: string
    bgClass: string
    prefix?: string
  }

  const stats = ref<Partial<Api.Dashboard.AdminDashboard>>({})
  const trendDays = ref(7)
  const trendData = ref<Api.Dashboard.TrendItem[]>([])
  const upstreamHealth = ref<Api.Admin.UpstreamHealthItem[]>([])

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null

  const statCards = computed<StatCard[]>(() => [
    {
      label: '用户总数',
      value: stats.value.totalUsers || 0,
      icon: 'ri-team-line',
      bgClass: 'bg-blue-50 text-blue-500'
    },
    {
      label: '今日任务',
      value: stats.value.todayTasks || 0,
      icon: 'ri-mail-check-line',
      bgClass: 'bg-green-50 text-green-500'
    },
    {
      label: '总充值',
      value: (stats.value.totalRecharge || 0).toFixed(2),
      icon: 'ri-money-cny-circle-line',
      bgClass: 'bg-orange-50 text-orange-500',
      prefix: '¥'
    },
    {
      label: '总消费',
      value: (stats.value.totalConsume || 0).toFixed(2),
      icon: 'ri-shopping-cart-line',
      bgClass: 'bg-purple-50 text-purple-500',
      prefix: '¥'
    }
  ])

  const renderChart = () => {
    if (!chartRef.value) return

    if (!chart) {
      chart = echarts.init(chartRef.value)
    }

    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['总数', '完成', '失败'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: trendData.value.map((item) => item.date) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '总数',
          type: 'line',
          smooth: true,
          data: trendData.value.map((item) => item.total),
          areaStyle: { opacity: 0.1 }
        },
        {
          name: '完成',
          type: 'line',
          smooth: true,
          data: trendData.value.map((item) => item.completed)
        },
        {
          name: '失败',
          type: 'line',
          smooth: true,
          data: trendData.value.map((item) => item.failed)
        }
      ]
    })
  }

  const loadTrend = async () => {
    try {
      trendData.value = await fetchTaskTrend(trendDays.value)
      renderChart()
    } catch (error) {
      showApiError(error, '加载趋势数据失败')
    }
  }

  const handleResize = () => {
    chart?.resize()
  }

  const loadDashboard = async () => {
    try {
      const [dashboardData, healthData] = await Promise.all([
        fetchAdminDashboard(),
        fetchUpstreamHealth()
      ])

      stats.value = dashboardData
      upstreamHealth.value = healthData || []
      await loadTrend()
    } catch (error) {
      showApiError(error, '加载管理概览失败')
    }
  }

  onMounted(async () => {
    window.addEventListener('resize', handleResize)
    await loadDashboard()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chart?.dispose()
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
