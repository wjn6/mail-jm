<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">统一登录</h3>
          <p class="sub-title">用户和管理员都在这里登录</p>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                placeholder="请输入用户名"
                v-model.trim="formData.username"
                prefix-icon="User"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="请输入密码"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
                prefix-icon="Lock"
              />
            </ElFormItem>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  text="向右拖动滑块完成验证"
                  textColor="var(--art-gray-700)"
                  successText="验证通过"
                  :progressBarBg="getCssVar('--el-color-primary')"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                请先完成滑块验证
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">记住密码</ElCheckbox>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                立即登录
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>没有账号？</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">去注册</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { getCssVar } from '@/utils/ui'
  import { HttpError } from '@/utils/http/error'
  import { ApiStatus } from '@/utils/http/status'
  import { fetchLogin } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'Login' })

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  const dragVerify = ref()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const isPassing = ref(false)
  const isClickPass = ref(false)

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const formData = reactive({
    username: '',
    password: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }))

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      const { username, password } = formData
      const result = await fetchLogin({ username, password })

      if (!result.token) {
        throw new HttpError('登录失败：缺少 token', ApiStatus.error)
      }

      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
      let defaultPath = '/'
      let displayName = username
      let loginRoleLabel = '用户'

      if (result.sessionType === 'admin' || result.admin) {
        if (!result.admin) {
          throw new HttpError('登录失败：管理员信息缺失', ApiStatus.error)
        }

        const roleMapping: Record<string, string> = {
          SUPER_ADMIN: 'R_SUPER',
          ADMIN: 'R_ADMIN'
        }

        userStore.setAdminSession(result.token, {
          userId: result.admin.id,
          userName: result.admin.username,
          username: result.admin.username,
          email: '',
          id: result.admin.id,
          status: 'ACTIVE',
          balance: 0,
          createdAt: '',
          roles: [roleMapping[result.admin.role] || 'R_ADMIN'],
          buttons: []
        })

        defaultPath = '/admin-panel/dashboard'
        displayName = result.admin.username
        loginRoleLabel = '管理员'
      } else {
        if (!result.user) {
          throw new HttpError('登录失败：用户信息缺失', ApiStatus.error)
        }

        userStore.setUserSession(result.token, {
          userId: result.user.id,
          userName: result.user.username,
          username: result.user.username,
          email: result.user.email,
          id: result.user.id,
          status: 'ACTIVE',
          balance: 0,
          createdAt: '',
          roles: ['R_USER'],
          buttons: []
        })

        displayName = result.user.username
      }

      showLoginSuccessNotice(loginRoleLabel, displayName)
      router.push(redirect || defaultPath)
    } catch (error) {
      if (error instanceof HttpError) return
      console.error('[Login] Unexpected error:', error)
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  const resetDragVerify = () => {
    dragVerify.value?.reset()
  }

  const showLoginSuccessNotice = (roleLabel: string, username: string) => {
    setTimeout(() => {
      ElNotification({
        title: '登录成功',
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${roleLabel} ${username}，欢迎回来`
      })
    }, 300)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
</style>
