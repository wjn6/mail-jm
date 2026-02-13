<template>
  <div class="p-5">
    <el-card shadow="hover">
      <template #header>
        <span class="text-lg font-bold">账户设置</span>
      </template>

      <el-row :gutter="40">
        <el-col :xs="24" :sm="12">
          <h4 class="mb-4 font-medium">账户信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{
              userInfo.username || userInfo.userName
            }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag type="success" size="small">正常</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :xs="24" :sm="12">
          <h4 class="mb-4 font-medium">修改密码</h4>
          <el-form :model="passwordForm" :rules="passwordRules" ref="formRef" label-width="100px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="submitting"
                >修改密码</el-button
              >
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { fetchChangePassword } from '@/api/auth'
  import { showApiError } from '@/app/email-platform/utils/message'

  defineOptions({ name: 'Profile' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.info || {})

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const passwordRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码至少8位，需包含大小写字母和数字', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (_: any, value: string, callback: any) => {
          if (value !== passwordForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  const handleChangePassword = async () => {
    if (!formRef.value) return
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true
    try {
      await fetchChangePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      ElMessage.success('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } catch (error) {
      showApiError(error, '修改失败')
    } finally {
      submitting.value = false
    }
  }
</script>
