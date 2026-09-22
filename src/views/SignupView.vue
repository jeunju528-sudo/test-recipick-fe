<template>
  <div class="auth container">
    <div class="auth__card">
      <h1 class="auth__title">회원가입</h1>
      <hr class="auth__divider" />

      <form class="auth__form" novalidate @submit.prevent="handleSubmit">
        <!-- 이메일 -->
        <div class="field">
          <label class="field__label" for="email">이메일</label>
          <input
            id="email"
            v-model.trim="form.email"
            class="input"
            type="email"
            placeholder="이메일을 입력해 주세요. (0~00자)"
            autocomplete="email"
            :aria-invalid="['duplicate', 'social_only', 'invalid', 'error'].includes(emailCheck.status)"
            @input="onEmailChange"
          />
          <p
            v-if="emailCheck.message"
            class="field__msg"
            :class="{
              'field__msg--error': ['duplicate', 'social_only', 'invalid', 'error'].includes(emailCheck.status),
              'field__msg--success': emailCheck.status === 'available',
            }"
          >
            {{ emailCheck.message }}
          </p>
        </div>

        <!-- 비밀번호 -->
        <div class="field">
          <label class="field__label" for="password">비밀번호</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            placeholder="비밀번호 입력란"
            autocomplete="new-password"
            :aria-invalid="!!errors.password"
            @input="validatePassword"
          />
          <input
            id="passwordConfirm"
            v-model="form.passwordConfirm"
            class="input field__spacer"
            type="password"
            placeholder="비밀번호 확인 입력란"
            autocomplete="new-password"
            :aria-invalid="!!errors.passwordConfirm"
            @input="validatePassword"
          />
          <p v-if="errors.password" class="field__msg field__msg--error">
            {{ errors.password }}
          </p>
          <p v-else-if="errors.passwordConfirm" class="field__msg field__msg--error">
            비밀번호가 일치하지 않습니다.
          </p>
        </div>

        <!-- 닉네임 -->
        <div class="field">
          <label class="field__label" for="nickname">닉네임</label>
          <input
            id="nickname"
            v-model.trim="form.nickname"
            class="input"
            type="text"
            placeholder="중복되지 않는 닉네임을 입력해 주세요. (00자)"
            :aria-invalid="!!errors.nickname"
            @input="onNicknameChange"
          />
          <p v-if="errors.nickname" class="field__msg field__msg--error">
            {{ errors.nickname }}
          </p>
          <p
            v-else-if="nicknameCheck.message"
            class="field__msg"
            :class="{
              'field__msg--error': ['duplicate', 'invalid', 'error'].includes(nicknameCheck.status),
              'field__msg--success': nicknameCheck.status === 'available',
            }"
          >
            {{ nicknameCheck.message }}
          </p>
        </div>

        <!-- 제출 -->
        <button
          type="submit"
          class="btn btn--inverse btn--block auth__submit"
          :disabled="!canSubmit || submitting"
        >
          회원가입
        </button>
      </form>

      <p class="auth__foot">
        이미 회원이신가요?
        <RouterLink to="/login" class="auth__foot-link">로그인</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
})

const errors = reactive({
  password: '',
  passwordConfirm: '',
  nickname: '',
})

const submitting = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nicknamePattern = /^[가-힣a-zA-Z0-9]{2,10}$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/

// --- 이메일 중복확인 ---
const emailCheck = reactive({
  status: 'idle', // idle | checking | available | duplicate | social_only | invalid | error
  message: '',
})
let emailCheckTimer = null
let emailCheckSeq = 0

async function checkEmailDuplicate() {
  if (!emailPattern.test(form.email)) {
    emailCheck.status = 'invalid'
    emailCheck.message = '올바른 이메일 형식을 입력해주세요.'
    return
  }

  const seq = ++emailCheckSeq
  emailCheck.status = 'checking'
  emailCheck.message = ''

  try {
    const res = await axios.get('/api/auth/email/check', {
      params: { email: form.email },
      withCredentials: true,
    })
    if (seq !== emailCheckSeq) return

    const { available, reason } = res.data
    if (available) {
      emailCheck.status = 'available'
      emailCheck.message = '사용 가능한 이메일입니다.'
    } else if (reason === 'SOCIAL_ONLY') {
      emailCheck.status = 'social_only'
      emailCheck.message = '구글 로그인을 이용해주세요.'
    } else {
      emailCheck.status = 'duplicate'
      emailCheck.message = '이미 사용중인 이메일입니다.'
    }
  } catch (err) {
    if (seq !== emailCheckSeq) return

    if (err.response?.status === 400) {
      emailCheck.status = 'invalid'
      emailCheck.message = err.response.data?.message || '올바른 이메일 형식을 입력해주세요.'
    } else {
      emailCheck.status = 'error'
      emailCheck.message = '이메일 확인 중 오류가 발생했습니다.'
    }
  }
}

function onEmailChange() {
  emailCheck.status = 'idle'
  emailCheck.message = ''

  if (emailCheckTimer) clearTimeout(emailCheckTimer)
  if (!form.email) return

  emailCheckTimer = setTimeout(() => {
    checkEmailDuplicate()
  }, 1000)
}

onUnmounted(() => {
  if (emailCheckTimer) clearTimeout(emailCheckTimer)
  if (nicknameCheckTimer) clearTimeout(nicknameCheckTimer)
})

// --- 비밀번호 검증 ---
function validatePassword() {
  errors.password = passwordPattern.test(form.password)
    ? ''
    : '비밀번호는 문자, 숫자, 특수기호를 모두 포함해 8~20자로 입력해주세요.'
  errors.passwordConfirm =
    form.passwordConfirm && form.password !== form.passwordConfirm ? '불일치' : ''
}

// --- 닉네임 중복확인 ---
const nicknameCheck = reactive({
  status: 'idle', // idle | checking | available | duplicate | invalid | error
  message: '',
})
let nicknameCheckTimer = null
let nicknameCheckSeq = 0

async function checkNicknameDuplicate(nickname) {
  if (!nicknamePattern.test(nickname)) {
    nicknameCheck.status = 'invalid'
    nicknameCheck.message = '닉네임은 2~10자의 한글, 영문, 숫자만 사용 가능합니다.'
    return
  }

  const seq = ++nicknameCheckSeq
  nicknameCheck.status = 'checking'
  nicknameCheck.message = ''

  try {
    const res = await axios.get('/api/auth/nickname/check', {
      params: { nickname },
      withCredentials: true,
    })
    if (seq !== nicknameCheckSeq) return

    if (res.data.available) {
      nicknameCheck.status = 'available'
      nicknameCheck.message = '사용 가능한 닉네임입니다.'
    } else {
      nicknameCheck.status = 'duplicate'
      nicknameCheck.message = '이미 사용중인 닉네임입니다.'
    }
  } catch (err) {
    if (seq !== nicknameCheckSeq) return

    if (err.response?.status === 400) {
      nicknameCheck.status = 'invalid'
      nicknameCheck.message =
        err.response.data?.message || '닉네임은 2~10자의 한글, 영문, 숫자만 사용 가능합니다.'
    } else {
      nicknameCheck.status = 'error'
      nicknameCheck.message = '닉네임 확인 중 오류가 발생했습니다.'
    }
  }
}

function onNicknameChange(e) {
  errors.nickname = ''

  nicknameCheck.status = 'idle'
  nicknameCheck.message = ''

  if (nicknameCheckTimer) clearTimeout(nicknameCheckTimer)

  const value = e.target.value.trim()
  if (!value) return

  nicknameCheckTimer = setTimeout(() => {
    checkNicknameDuplicate(value)
  }, 1000)
}

// --- 제출 ---
const canSubmit = computed(
  () =>
    emailCheck.status === 'available' &&
    nicknameCheck.status === 'available' &&
    passwordPattern.test(form.password) &&
    form.password === form.passwordConfirm &&
    form.password.length > 0,
)

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    await axios.post(
      '/api/auth/signup',
      {
        email: form.email,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        nickname: form.nickname,
      },
      { withCredentials: true },
    )

    alert('회원가입이 완료되었습니다.')
    router.push('/login')
  } catch (err) {
    const errorCode = err.response?.data?.errorCode
    const message = err.response?.data?.message

    switch (errorCode) {
      case 'EMAIL_DUPLICATE':
        emailCheck.status = 'duplicate'
        emailCheck.message = message || '이미 사용중인 이메일입니다.'
        break
      case 'NICKNAME_DUPLICATE':
        nicknameCheck.status = 'duplicate'
        nicknameCheck.message = message || '이미 사용중인 닉네임입니다.'
        break
      case 'INVALID_EMAIL_FORMAT':
        emailCheck.status = 'invalid'
        emailCheck.message = message || '올바른 이메일 형식을 입력해주세요.'
        break
      case 'INVALID_NICKNAME_FORMAT':
        nicknameCheck.status = 'invalid'
        nicknameCheck.message =
          message || '닉네임은 2~10자의 한글, 영문, 숫자만 사용 가능합니다.'
        break
      case 'PASSWORD_MISMATCH':
        errors.passwordConfirm = message || '비밀번호가 일치하지 않습니다.'
        break
      case 'INVALID_PASSWORD_FORMAT':
        errors.password =
          message || '비밀번호는 문자, 숫자, 특수기호를 모두 포함해 8~20자로 입력해주세요.'
        break
      default:
        alert('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  padding-block: var(--space-8);
}
.auth__card {
  width: 100%;
  max-width: 420px;
}
.auth__title {
  text-align: center;
  letter-spacing: 0.2em;
}
.auth__divider {
  margin-block: var(--space-4) var(--space-6);
  border: none;
  border-top: 1px solid var(--border-strong);
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* 필드 */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.field__label {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}
/* 인풋 두 개 세로 배치 시 간격 */
.field__spacer {
  margin-top: var(--space-2);
}

/* 안내 메시지 */
.field__msg {
  font-size: var(--text-sm);
}
.field__msg--error {
  color: var(--danger);
}
.field__msg--success {
  color: var(--success);
}

.auth__submit {
  margin-top: var(--space-2);
  height: 48px;
}

.auth__foot {
  margin-top: var(--space-5);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.auth__foot-link {
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}
.auth__foot-link:hover {
  color: var(--accent);
}
</style>
