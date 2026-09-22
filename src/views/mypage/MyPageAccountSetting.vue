<template>
  <div class="container account-setting">
    <header class="account-setting__head">
      <h1>회원정보 관리</h1>
    </header>

    <section class="card account-setting__section">
      <div class="card__body">
        <div class="section-head">
          <h2 class="section-title">프로필</h2>

          <button
            type="button"
            class="btn btn--primary"
            @click="saveProfile"
          >
            저장
          </button>
        </div>

        <div class="profile-image-area">
          <div class="profile-image">
            <img
              v-if="profileImagePreview"
              :src="profileImagePreview"
              alt="프로필 이미지"
            />
            <span v-else>현재 프로필 이미지</span>
          </div>

          <div class="profile-image__control">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png"
              class="sr-only"
              @change="handleFileChange"
            />

            <button
              type="button"
              class="btn btn--outline"
              @click="openFileInput"
            >
              이미지 업로드
            </button>

            <p class="text-muted">
              JPG·PNG / 5MB 이하 / 정사각형 권장.<br />
              선택한 파일은 저장 버튼을 눌러야 반영됩니다.
            </p>
          </div>
        </div>

        <div class="account-form">
          <div class="account-form__row">
            <label for="nickname">닉네임</label>

            <p class="text-muted">
              현재 닉네임: {{ currentNickname }}
            </p>

            <div class="account-form__input">
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                class="input"
              />

              <button
                type="button"
                class="btn btn--outline"
                @click="checkNickname"
              >
                중복체크
              </button>
            </div>

            <p
              v-if="nicknameMessage"
              class="account-form__message"
              :class="{ 'is-error': nicknameError }"
            >
              {{ nicknameMessage }}
            </p>
          </div>

          <div class="account-form__row">
            <label for="email">이메일</label>

            <input
              id="email"
              v-model="email"
              type="email"
              class="input"
              disabled
            />
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="hasLocalAccount"
      class="card account-setting__section account-setting__password"
    >
      <div class="card__body">
        <div class="section-head">
          <h2 class="section-title">비밀번호</h2>

          <button
            type="button"
            class="btn btn--primary"
            @click="savePassword"
          >
            저장
          </button>
        </div>

        <div class="account-form">
          <div class="account-form__row">
            <label for="currentPassword">현재 비밀번호</label>

            <input
              id="currentPassword"
              v-model="currentPassword"
              type="password"
              class="input"
            />
          </div>

          <div class="account-form__row">
            <label for="newPassword">새 비밀번호</label>

            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              class="input"
            />

            <p class="text-muted">
              8자 이상, 영문·숫자 조합 (폼 유효성검사 기준 입력)
            </p>
          </div>

          <div class="account-form__row">
            <label for="newPasswordConfirm">새 비밀번호 확인</label>

            <input
              id="newPasswordConfirm"
              v-model="newPasswordConfirm"
              type="password"
              class="input"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="card account-setting__withdraw">
      <div class="card__body">
        <div class="account-setting__withdraw-content">
          <h2 class="section-title">회원탈퇴</h2>

          <p class="text-secondary">
            저장된 데이터가 모두 삭제되며, 되돌릴 수 없습니다.
          </p>
        </div>

        <button
          type="button"
          class="btn btn--outline"
          @click="handleWithdraw"
        >
          탈퇴하기
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const fileInput = ref(null)

const currentNickname = ref('')
const nickname = ref('')
const email = ref('')

const profileImagePreview = ref('')
const selectedFile = ref(null)

const nicknameMessage = ref('')
const nicknameError = ref(false)
const nicknameChecked = ref(false)

const hasLocalAccount = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')

const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,20}$/

const loadProfile = async () => {
  try {
    const res = await axios.get(
      '/api/mypage/profile',
      { withCredentials: true }
    )

    currentNickname.value = res.data.nickname || ''
    email.value = res.data.email || ''

    if (res.data.profile_image_url) {
      profileImagePreview.value = res.data.profile_image_url
    } else {
      profileImagePreview.value = ''
    }
  } catch (error) {
    console.error('프로필 조회 실패:', error)
  }
}

const openFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('프로필 이미지는 5MB 이하만 가능합니다.')
    event.target.value = ''
    return
  }

  if (
    file.type !== 'image/jpeg' &&
    file.type !== 'image/png'
  ) {
    alert('JPG 또는 PNG 이미지만 업로드할 수 있습니다.')
    event.target.value = ''
    return
  }

  selectedFile.value = file
  profileImagePreview.value = URL.createObjectURL(file)
}

watch(nickname, () => {
  nicknameChecked.value = false
  nicknameMessage.value = ''
  nicknameError.value = false
})

const checkNickname = async () => {
  const value = nickname.value.trim()

  if (!value) {
    nicknameMessage.value = '닉네임을 입력해주세요.'
    nicknameError.value = true
    nicknameChecked.value = false
    return
  }

  if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(value)) {
    nicknameMessage.value =
      '닉네임은 한글, 영문, 숫자를 사용하여 2~10자로 입력해주세요.'
    nicknameError.value = true
    nicknameChecked.value = false
    return
  }

  if (value === currentNickname.value) {
    nicknameMessage.value = '현재 사용 중인 닉네임입니다.'
    nicknameError.value = true
    nicknameChecked.value = false
    return
  }

  try {
    const res = await axios.get(
      '/api/auth/nickname/check',
      {
        params: { 
          nickname: value
        },
        withCredentials: true
      }
    )

    console.log('닉네임 중복체크 응답:', res.data)

    if (res.data.available === true) {
      nicknameMessage.value = '사용 가능한 닉네임입니다.'
      nicknameError.value = false
      nicknameChecked.value = true
    } else {
      nicknameMessage.value = '이미 사용 중인 닉네임입니다.'
      nicknameError.value = true
      nicknameChecked.value = false
    }
  } catch (error) {
    console.error('닉네임 중복체크 실패:', error)

    nicknameMessage.value =
      error.response?.data || '닉네임 중복체크에 실패했습니다.'
    nicknameError.value = true
    nicknameChecked.value = false
  }
}

const saveProfile = async () => {
  const value = nickname.value.trim()

  if (!value && !selectedFile.value) {
    alert('변경된 내용이 없습니다.')
    return
  }

  if (value) {
    if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(value)) {
      alert(
        '닉네임은 한글, 영문, 숫자를 사용하여 2~10자로 입력해주세요.'
      )
      return
    }

    if (!nicknameChecked.value) {
      alert('닉네임 중복체크를 진행해주세요.')
      return
    }
  }

  const formData = new FormData()

  if (value) {
    formData.append('nickname', value)
  }

  if (selectedFile.value) {
    formData.append('file', selectedFile.value)
  }

  try {
    await axios.put(
      '/api/mypage/profile',
      formData,
      { withCredentials: true }
    )

    alert('프로필 정보가 저장되었습니다.')

    nickname.value = ''
    nicknameChecked.value = false
    nicknameMessage.value = ''
    selectedFile.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    await loadProfile()
  } catch (error) {
    console.error('프로필 저장 실패:', error)

    const message =
      error.response?.data || '프로필 저장에 실패했습니다.'

    alert(message)
  }
}

const checkLocalAccount = async () => {
  try {
    const res = await axios.get('/api/mypage/has-local-account', {
      withCredentials: true
    })
    hasLocalAccount.value = res.data // 백엔드에서 true/false 반환
  } catch (error) {
    console.error('로컬 계정 여부 확인 실패:', error)
    hasLocalAccount.value = false
  }
}

const savePassword = async () => {
  if (!currentPassword.value) {
    alert('현재 비밀번호를 입력해주세요.')
    return
  }

  if (!newPassword.value) {
    alert('새 비밀번호를 입력해주세요.')
    return
  }

  if (!newPasswordConfirm.value) {
    alert('새 비밀번호 확인을 입력해주세요.')
    return
  }

  if (!PASSWORD_PATTERN.test(newPassword.value)) {
    alert(
      '비밀번호는 문자, 숫자, 특수기호를 모두 포함해 8~20자로 입력해주세요.'
    )
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    alert('새 비밀번호가 일치하지 않습니다.')
    return
  }

  try {
    await axios.put(
      '/api/mypage/password',
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        newPasswordConfirm: newPasswordConfirm.value
      },
      { withCredentials: true }
    )

    alert('비밀번호가 변경되었습니다.')

    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)

    const message =
      error.response?.data || '비밀번호 변경에 실패했습니다.'

    alert(message)
  }
}

const handleWithdraw = () => {
  alert('회원탈퇴 기능은 준비 중입니다.')
}

onMounted(() => {
  loadProfile()
  checkLocalAccount()
})
</script>

<style scoped>
.input {
  background-color: var(--border);
}

.account-setting {
  padding-block: var(--space-6);
}

.account-setting__head {
  margin-bottom: var(--space-6);
}

.account-setting__section {
  margin-bottom: var(--space-5);
  border-color: var(--accent);
}

.profile-image-area {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

.profile-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  color: var(--text-muted);
  text-align: center;
  font-size: var(--text-sm);
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-image__control {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.account-form__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.account-form__row label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.account-form__input {
  display: flex;
  gap: var(--space-2);
}

.account-form__input .input {
  flex: 1;
}

.account-form__message {
  font-size: var(--text-sm);
  color: var(--success);
}

.account-form__message.is-error {
  color: var(--danger);
}

.account-setting__password {
  border-color: var(--danger);
}

.account-setting__withdraw .card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
}

.account-setting__withdraw-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .profile-image-area,
  .account-setting__withdraw .card__body {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-form__input {
    flex-direction: column;
  }
}
</style>