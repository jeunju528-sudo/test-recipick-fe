import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = '/api'

// 앱 최초 로딩 시 재발급+me 복구 플로우를 1회만 실행하기 위한 캐시.
let restorePromise = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    ready: false, // 앱 시작 시 세션 복구 시도가 끝났는지 여부
  }),
  getters: {
    isLoggedIn: (state) => !!state.accessToken && !!state.user,
    initial: (state) => state.user?.nickname?.[0] ?? '',
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    setUser({ userId, nickname, role, accessToken }) {
      this.user = { userId, nickname, role }
      this.accessToken = accessToken
    },
    setAccessToken(accessToken) {
      this.accessToken = accessToken
    },
    setUserInfo({ userId, nickname, role }) {
      this.user = { userId, nickname, role }
    },
    // 재발급 엔드포인트를 호출하는 원시 로직. 앱 최초 복구(restoreSession)와
    // axios 응답 인터셉터(401 시 재발급)가 공통으로 재사용한다.
    async reissue() {
      const res = await axios.post(`${API_BASE}/auth/reissue`, null, { withCredentials: true })
      this.setAccessToken(res.data.accessToken)
      return res.data.accessToken
    },
    async fetchMe() {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, { withCredentials: true })
        this.setUserInfo(res.data)
      } catch (err) {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          // 실제 인증 거부 → 세션 정리
          this.logout()
        }
      }
    },
    // 앱 시작 시 1회: 재발급 + me 조회로 새로고침에 날아간 인증 상태를 복구한다.
    restoreSession() {
      if (!restorePromise) {
        restorePromise = this.reissue()
          .then(() => this.fetchMe())
          .catch(() => {
            // 재발급 실패 = 비로그인 상태로 시작 (강제 이동 없이 조용히 무시)
          })
          .finally(() => {
            this.ready = true
          })
      }
      return restorePromise
    },
    async logout() {
      try {
        await axios.post(`${API_BASE}/auth/logout`, null, { withCredentials: true })
      } catch {
        // 401(이미 로그아웃된 토큰)이어도 결과적으로 로그아웃 상태이므로 별도 처리 없이 무시
      } finally {
        this.user = null
        this.accessToken = null
      }
    },
  },
})