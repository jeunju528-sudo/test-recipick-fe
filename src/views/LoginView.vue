<template>
  <div class="auth container">
    <div class="auth__card">
      <!-- 로고 -->
      <RouterLink to="/" class="auth__logo">
        <img src="@/assets/recipick-logo.svg" alt="Recipick" class="auth__logo-img" />
      </RouterLink>

      <form class="auth__form" novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label class="sr-only" for="email">이메일</label>
          <input
            id="email"
            v-model.trim="form.email"
            class="input"
            type="email"
            placeholder="이메일 입력란"
            autocomplete="email"
            :aria-invalid="!!errorMessage"
          />
        </div>

        <div class="field">
          <label class="sr-only" for="password">비밀번호</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            placeholder="비밀번호 입력란"
            autocomplete="current-password"
            :aria-invalid="!!errorMessage"
            @keyup.enter="handleSubmit"
          />
        </div>

        <p v-if="errorMessage" class="auth__error">
          {{ errorMessage }}
        </p>

        <button type="submit" class="btn btn--inverse btn--block auth__submit" :disabled="submitting">
          로그인
        </button>
      </form>

      <!-- 보조 링크 -->
      <div class="auth__links">
        <RouterLink to="/find-password" class="auth__link">비밀번호 찾기</RouterLink>
        <span class="auth__sep" aria-hidden="true">|</span>
        <RouterLink to="/signup" class="auth__link">회원가입</RouterLink>
      </div>

      <!-- 구분선 -->
      <div class="auth__or" role="separator">
        <span>or</span>
      </div>

      <div ref="googleButtonRef" class="auth__social-container"></div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errorMessage = ref('')
const submitting = ref(false)
const recoveryToken = ref(null)

const googleButtonRef = ref(null)

async function handleSubmit() {
  errorMessage.value = ''

  if (!form.email || !form.password) {
    errorMessage.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    return
  }

  submitting.value = true
  try {
    const res = await axios.post(
      '/api/auth/login',
      { email: form.email, password: form.password },
      { withCredentials: true },
    )

    const { accountStatus, accessToken, userId, nickname, role, recoveryToken: token, message } =
      res.data

    if (accountStatus === 'ACTIVE') {
      auth.setUser({ userId, nickname, role, accessToken })
      router.push('/')
      return
    }

    // accountStatus === 'WITHDRAWN' — 토큰 미발급, 복구 절차 안내
    recoveryToken.value = token

    if (confirm(`${message}\n\n5분 이내에 복구할 수 있습니다. 지금 복구하시겠습니까?`)) {
      // TODO: 계정 복구 API 명세 확정 후 recoveryToken.value로 복구 요청 연동
    }
  } catch (err) {
    const errorCode = err.response?.data?.errorCode

    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        errorMessage.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
        break
      case 'SOCIAL_ACCOUNT_ONLY':
        errorMessage.value = '구글 로그인을 이용해주세요.'
        break
      default:
        alert('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  } finally {
    submitting.value = false
  }
}

function parseEmailFromToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload).email
  } catch (e) {
    console.error('토큰 파싱 실패:', e)
    return ''
  }
}

onMounted(() => {
  // 1. 구글 SDK 로드
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    // 2. 구글 버튼 세팅
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          // 백엔드로 토큰 전달
          const res = await axios.post(
            '/api/auth/social/google', 
            { idToken: response.credential }, 
            { withCredentials: true }
          )
          
          // 로그인 성공 -> 메인 화면 이동
          auth.setUser(res.data)
          router.push('/')
          
        } catch (err) {
          // EMAIL_ALREADY_EXISTS 예외 발생 시 연동 페이지로 이동
          if (err.response?.data?.errorCode === 'EMAIL_ALREADY_EXISTS') {
            const email = err.response.data.email || parseEmailFromToken(response.credential)

            router.push({
              name: 'SocialLink',
              state: {
                idToken: response.credential,
                email: email
              }
            })

          } else {
            alert('구글 로그인에 실패했습니다.')
          }
        }
      }
    })
    
    window.google.accounts.id.renderButton(googleButtonRef.value, { theme: 'outline', size: 'large' })
  }
})
</script>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  padding-block: var(--space-8);
}
.auth__card {
  width: 100%;
  max-width: 380px;
}

.auth__logo {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-8);
}
.auth__logo-img {
  height: 40px;
  width: auto;
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth__error {
  font-size: var(--text-sm);
  color: var(--danger);
}

.auth__submit {
  margin-top: var(--space-2);
  height: 48px;
}

/* 보조 링크 */
.auth__links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
  font-size: var(--text-sm);
}
.auth__link {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}
.auth__link:hover {
  color: var(--accent);
}
.auth__sep {
  color: var(--border-strong);
}

/* or 구분선 */
.auth__or {
  display: flex;
  align-items: center;
  margin-block: var(--space-6);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.auth__or::before,
.auth__or::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}
.auth__or span {
  padding-inline: var(--space-4);
}

.auth__social {
  height: 48px;
}
</style>
