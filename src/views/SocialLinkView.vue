<template>
  <div class="social-link-wrapper">
    <div class="card social-link-card">
      <div class="card__body">
        <h2>계정 연동 안내</h2>
        <p class="text-secondary description">
          이미 등록된 이메일 계정이 존재합니다.<br />
          기존 계정의 비밀번호를 입력하시면 구글 계정이 연동됩니다.
        </p>

        <form @submit.prevent="handleLink">
          <div class="form-group">
            <label class="form-label">연동 이메일</label>
            <input 
              type="email" 
              :value="email" 
              readonly 
              class="input readonly-input" 
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">기존 계정 비밀번호</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="input"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

          <div class="button-group">
            <button 
              type="submit" 
              :disabled="isLoading" 
              class="btn btn--primary btn--block"
            >
              {{ isLoading ? '연동 중...' : '연동 및 로그인' }}
            </button>
            <button 
              type="button" 
              @click="handleCancel" 
              class="btn btn--outline btn--block"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const idToken = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(() => {
  const state = history.state

  if (!state || !state.idToken || !state.email) {
    alert('잘못된 접근입니다. 로그인 화면으로 이동합니다.')
    router.replace('/login')
    return
  }

  idToken.value = state.idToken
  email.value = state.email
})

const handleLink = async () => {
  if (!password.value) {
    errorMessage.value = '비밀번호를 입력해주세요.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.post(
      '/api/auth/social/google/link',
      {
        idToken: idToken.value,
        password: password.value
      },
      { withCredentials: true }
    )

    auth.setUser(response.data)

    alert('계정 연동이 성공적으로 완료되었습니다.')
    router.replace('/')
    
  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '비밀번호가 일치하지 않습니다.'
    } else {
      errorMessage.value = '연동 처리 중 오류가 발생했습니다.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.replace('/login')
}
</script>

<style scoped>
/* 공용 CSS(Design Tokens / Components)를 활용하여 최적화된 최소 CSS */

.social-link-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--header-height, 64px) - 100px);
  padding: var(--space-4);
}

.social-link-card {
  width: 100%;
  max-width: 420px;
}

.description {
  margin-top: var(--space-2);
  margin-bottom: var(--space-5);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.readonly-input {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-text {
  color: var(--danger);
  font-size: var(--text-xs);
  margin-bottom: var(--space-3);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>