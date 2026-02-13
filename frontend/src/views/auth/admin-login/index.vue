<!-- 管理员登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">管理后台</h3>
          <p class="sub-title">管理员登录</p>
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
                placeholder="管理员用户名"
                v-model.trim="formData.username"
                prefix-icon="User"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="管理员密码"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
                prefix-icon="Lock"
              />
            </ElFormItem>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                管理员登录
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <RouterLink class="text-theme" :to="{ name: 'Login' }">返回用户登录</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { HttpError } from '@/utils/http/error'
  import { fetchAdminLogin } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'AdminLogin' })

  const userStore = useUserStore()
  const router = useRouter()

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const formData = reactive({
    username: '',
    password: ''
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: '请输入管理员用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }))

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      const result = await fetchAdminLogin({
        username: formData.username,
        password: formData.password
      })

      if (!result.token) {
        throw new Error('登录失败 - 未收到 token')
      }

      // 根据实际角色映射前端角色标识
      const roleMapping: Record<string, string> = {
        SUPER_ADMIN: 'R_SUPER',
        ADMIN: 'R_ADMIN'
      }
      const frontendRole = roleMapping[result.admin.role] || 'R_ADMIN'

      // 设置管理员用户信息
      userStore.setAdminSession(result.token, {
        userId: result.admin.id,
        userName: result.admin.username,
        username: result.admin.username,
        email: '',
        id: result.admin.id,
        status: 'ACTIVE',
        balance: 0,
        createdAt: '',
        roles: [frontendRole],
        buttons: []
      })

      ElNotification({
        title: '登录成功',
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `欢迎回来，${result.admin.username}！`
      })

      router.push('/admin-panel/dashboard')
    } catch (error) {
      if (error instanceof HttpError) {
        // 错误已由 HTTP 层处理
      } else {
        console.error('[AdminLogin] Unexpected error:', error)
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  @import '../login/style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
</style>
