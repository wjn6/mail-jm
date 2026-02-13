<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i class="ri-mail-send-line text-xl mr-2 text-blue-500"></i>
            <span class="text-lg font-bold">获取邮箱</span>
          </div>
          <el-select
            v-model="selectedProjectId"
            placeholder="选择项目"
            style="width: 200px"
            size="default"
          >
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </div>
      </template>

      <!-- 步骤1: 获取邮箱 -->
      <div v-if="!currentTask" class="text-center py-10">
        <div class="mb-6">
          <i class="ri-mail-add-line text-6xl text-gray-300"></i>
        </div>
        <p class="text-gray-500 mb-6">点击下方按钮获取一个临时邮箱用于接收验证码</p>
        <el-button
          type="primary"
          size="large"
          @click="handleGetEmail"
          :loading="loading"
          :disabled="!selectedProjectId"
        >
          <i class="ri-mail-add-line mr-1"></i> 获取邮箱
        </el-button>
      </div>

      <!-- 步骤2: 邮箱已获取，等待验证码 -->
      <div v-else class="py-4">
        <!-- 邮箱地址 + 倒计时 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">已获取邮箱</p>
              <p class="text-2xl font-mono font-bold text-blue-600">{{ currentTask.email }}</p>
            </div>
            <div class="flex gap-2">
              <el-button type="primary" @click="copyToClipboard(currentTask.email)" circle>
                <i class="ri-file-copy-line"></i>
              </el-button>
            </div>
          </div>
          <div class="flex items-center mt-3 text-sm text-gray-500">
            <i class="ri-time-line mr-1"></i>
            <span v-if="isExpired" class="text-red-500 font-bold">已过期</span>
            <span v-else>
              剩余时间:
              <span
                class="font-mono font-bold"
                :class="remainingSeconds < 120 ? 'text-red-500' : 'text-blue-600'"
              >
                {{ formatCountdown(remainingSeconds) }}
              </span>
            </span>
            <span class="mx-3">|</span>
            <span>费用: ¥{{ currentTask.cost }}</span>
            <span v-if="isPolling" class="ml-3">
              <i class="ri-loader-4-line animate-spin mr-1"></i> 自动轮询中...
            </span>
          </div>
        </div>

        <!-- 验证码区域 -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 mb-6" v-if="verifyCode">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">验证码</p>
              <p class="text-4xl font-mono font-bold text-green-600 tracking-wider">{{
                verifyCode
              }}</p>
            </div>
            <el-button type="success" @click="copyToClipboard(verifyCode)" circle size="large">
              <i class="ri-file-copy-line text-lg"></i>
            </el-button>
          </div>
        </div>

        <!-- 等待验证码提示 -->
        <div
          v-if="!verifyCode && !isExpired"
          class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 mb-6 text-center"
        >
          <i class="ri-hourglass-line text-3xl text-yellow-500 mb-2"></i>
          <p class="text-sm text-gray-600">正在等待验证码... 获取到后将自动显示</p>
          <div class="flex items-center justify-center gap-2 mt-3">
            <el-switch
              v-model="autoPolling"
              active-text="自动轮询"
              inactive-text="手动"
              @change="togglePolling"
            />
            <span class="text-xs text-gray-400">(每{{ pollingInterval / 1000 }}秒自动检查)</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3 mb-6">
          <el-button
            type="primary"
            @click="handleGetCode"
            :loading="codeLoading"
            size="large"
            :disabled="isExpired"
          >
            <i class="ri-refresh-line mr-1"></i> {{ verifyCode ? '刷新验证码' : '获取验证码' }}
          </el-button>
          <el-button
            @click="handleCheckMail"
            :loading="mailLoading"
            size="large"
            :disabled="isExpired"
          >
            <i class="ri-mail-open-line mr-1"></i> 查看邮件
          </el-button>
          <el-button type="warning" @click="handleRelease" size="large">
            <i class="ri-logout-box-line mr-1"></i> 释放邮箱
          </el-button>
          <el-button type="primary" plain @click="handleGetEmail" :loading="loading" size="large">
            <i class="ri-add-line mr-1"></i> 新取一个
          </el-button>
        </div>

        <!-- 正则匹配配置 -->
        <el-collapse class="mb-4">
          <el-collapse-item title="高级设置" name="advanced">
            <el-form inline>
              <el-form-item label="匹配正则">
                <el-input v-model="matchPattern" placeholder="\d{6}" style="width: 200px" />
              </el-form-item>
              <el-form-item label="轮询间隔(秒)">
                <el-input-number
                  v-model="pollingIntervalSec"
                  :min="2"
                  :max="30"
                  :step="1"
                  style="width: 120px"
                  @change="updatePollingInterval"
                />
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>

        <!-- 邮件内容 -->
        <el-card v-if="mailMessages.length > 0" shadow="never" class="border">
          <template #header>
            <span class="font-bold">邮件列表 ({{ mailMessages.length }})</span>
          </template>
          <div v-for="(mail, idx) in mailMessages" :key="idx" class="border-b last:border-0 py-3">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">{{ mail.subject || '(无主题)' }}</span>
              <span class="text-xs text-gray-400">{{ formatTime(mail.date) }}</span>
            </div>
            <p class="text-sm text-gray-500">From: {{ mail.from }}</p>
            <div class="mt-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded" v-if="mail.text">
              {{ mail.text }}
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchGetEmail, fetchGetCode, fetchCheckMail, fetchReleaseEmail } from '@/api/task'
  import { fetchProjects } from '@/api/project'
  import { formatDateTime } from '@/app/email-platform/utils/format'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'GetEmail' })

  const projects = ref<Api.Project.ProjectItem[]>([])
  const selectedProjectId = ref<number | undefined>()
  const currentTask = ref<Api.Task.GetEmailResult | null>(null)
  const verifyCode = ref('')
  const matchPattern = ref('\\d{6}')
  const mailMessages = ref<Api.Task.MailMessage[]>([])

  const loading = ref(false)
  const codeLoading = ref(false)
  const mailLoading = ref(false)

  // 轮询相关
  const autoPolling = ref(true)
  const isPolling = ref(false)
  const pollingIntervalSec = ref(5)
  const pollingInterval = computed(() => pollingIntervalSec.value * 1000)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  // 倒计时相关
  const remainingSeconds = ref(0)
  const isExpired = computed(() => remainingSeconds.value <= 0 && currentTask.value !== null)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const formatTime = (dateStr: string) => formatDateTime(dateStr)

  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  // 启动倒计时
  const startCountdown = () => {
    stopCountdown()
    if (!currentTask.value?.expireAt) return

    const updateRemaining = () => {
      const expireAt = new Date(currentTask.value!.expireAt).getTime()
      const now = Date.now()
      remainingSeconds.value = Math.max(0, Math.floor((expireAt - now) / 1000))

      if (remainingSeconds.value <= 0) {
        stopCountdown()
        stopPolling()
        ElMessage.warning('邮箱已过期')
      }
    }

    updateRemaining()
    countdownTimer = setInterval(updateRemaining, 1000)
  }

  const stopCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  // 自动轮询验证码
  const startPolling = () => {
    stopPolling()
    if (!autoPolling.value || !currentTask.value || verifyCode.value || isExpired.value) return

    isPolling.value = true
    pollingTimer = setInterval(async () => {
      if (!currentTask.value || verifyCode.value || isExpired.value) {
        stopPolling()
        return
      }

      try {
        const result = await fetchGetCode({
          email: currentTask.value.email,
          match: matchPattern.value
        })
        if (result.code) {
          verifyCode.value = result.code
          ElMessage.success(`验证码已获取: ${result.code}`)
          stopPolling()
        }
      } catch {
        // 轮询失败静默处理
      }
    }, pollingInterval.value)
  }

  const stopPolling = () => {
    isPolling.value = false
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  const togglePolling = (val: string | number | boolean) => {
    const enabled = typeof val === 'boolean' ? val : Boolean(val)

    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }
  }

  const updatePollingInterval = () => {
    if (isPolling.value) {
      startPolling() // 重启轮询以应用新间隔
    }
  }

  const handleGetEmail = async () => {
    if (!selectedProjectId.value) {
      ElMessage.warning('请先选择项目')
      return
    }
    loading.value = true
    try {
      // 如果已有任务，先释放
      if (currentTask.value) {
        try {
          await fetchReleaseEmail({ email: currentTask.value.email })
        } catch {
          // 释放失败不阻塞新获取
        }
      }

      stopPolling()
      stopCountdown()

      const result = await fetchGetEmail({ projectId: selectedProjectId.value })
      currentTask.value = result
      verifyCode.value = ''
      mailMessages.value = []
      ElMessage.success(`已获取邮箱: ${result.email}`)

      startCountdown()
      if (autoPolling.value) {
        // 延迟几秒后开始轮询（刚获取邮箱还没有验证码）
        setTimeout(() => startPolling(), 3000)
      }
    } catch (error) {
      showApiError(error, '获取邮箱失败')
    } finally {
      loading.value = false
    }
  }

  const handleGetCode = async () => {
    if (!currentTask.value) return
    codeLoading.value = true
    try {
      const result = await fetchGetCode({
        email: currentTask.value.email,
        match: matchPattern.value
      })
      if (result.code) {
        verifyCode.value = result.code
        ElMessage.success(`验证码: ${result.code}`)
        stopPolling()
      } else {
        ElMessage.info(result.message || '暂未收到验证码，请稍后重试')
      }
    } catch (error) {
      showApiError(error, '获取验证码失败')
    } finally {
      codeLoading.value = false
    }
  }

  const handleCheckMail = async () => {
    if (!currentTask.value) return
    mailLoading.value = true
    try {
      const result = await fetchCheckMail({ email: currentTask.value.email })
      mailMessages.value = result.messages || []
      if (mailMessages.value.length === 0) {
        ElMessage.info('暂无新邮件')
      }
    } catch (error) {
      showApiError(error, '查看邮件失败')
    } finally {
      mailLoading.value = false
    }
  }

  const handleRelease = async () => {
    if (!currentTask.value) return
    try {
      await fetchReleaseEmail({ email: currentTask.value.email })
      ElMessage.success('邮箱已释放')
      stopPolling()
      stopCountdown()
      currentTask.value = null
      verifyCode.value = ''
      mailMessages.value = []
    } catch (error) {
      showApiError(error, '释放失败')
    }
  }

  onMounted(async () => {
    try {
      projects.value = await fetchProjects()
      if (projects.value.length > 0) {
        selectedProjectId.value = projects.value[0].id
      }
    } catch (error) {
      showApiError(error, '加载项目列表失败')
    }
  })

  onUnmounted(() => {
    stopPolling()
    stopCountdown()
  })
</script>
