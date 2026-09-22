<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <!-- 로고 -->
      <RouterLink to="/" class="app-header__logo">
        <img src="@/assets/recipick-logo.svg" alt="Recipick" class="app-header__logo-img" />
      </RouterLink>

      <!-- 주 메뉴 (데스크톱) -->
      <nav class="app-header__nav" aria-label="주 메뉴">
        <template v-for="item in navItems" :key="item.to">
          <!-- 하위메뉴 있는 항목: 드롭다운 -->
          <div v-if="item.children" class="dropdown">
            <RouterLink :to="item.to" class="app-header__link dropdown__trigger">
              {{ item.label }}
              <IconChevronDown :size="14" />
            </RouterLink>
            <ul class="dropdown__menu">
              <li v-for="child in item.children" :key="child.to">
                <RouterLink :to="child.to" class="dropdown__item">
                  {{ child.label }}
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- 일반 항목 -->
          <RouterLink v-else :to="item.to" class="app-header__link">
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <!-- 우측 액션 -->
      <div class="app-header__actions">
        <!-- 비로그인 -->
        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login" class="btn btn--ghost">로그인</RouterLink>
          <RouterLink to="/signup" class="btn btn--primary">회원가입</RouterLink>
        </template>

        <!-- 로그인 -->
        <div v-else class="profile">
          <button
            class="profile__trigger"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="menuOpen = !menuOpen"
          >
            <span class="profile__avatar" aria-hidden="true">
              <img v-if="auth.user.profileImage" :src="auth.user.profileImage" alt="" />
              <template v-else>{{ auth.initial }}</template>
            </span>
            <span class="profile__name">{{ auth.user.nickname }}</span>
            <IconChevronDown :size="16" class="profile__caret" />
          </button>

          <!-- 드롭다운 -->
          <ul v-if="menuOpen" class="profile__menu" role="menu" @click="menuOpen = false">
            <li role="none">
              <RouterLink to="/mypage" class="profile__item" role="menuitem">
                <IconUser :size="18" /> 마이페이지
              </RouterLink>
            </li>
            <li role="none" v-if="auth.isAdmin">
              <RouterLink to="/admin" class="profile__item" role="menuitem">
                <IconSettings :size="18" /> 관리자페이지
              </RouterLink>
            </li>
            <li role="none">
              <button class="profile__item" role="menuitem" @click="handleLogout">
                <IconLogout :size="18" /> 로그아웃
              </button>
            </li>
          </ul>
        </div>

        <!-- 모바일 햄버거 -->
        <button
          class="app-header__burger"
          aria-label="메뉴 열기"
          @click="mobileOpen = !mobileOpen"
        >
          <IconMenu2 :size="24" />
        </button>
      </div>
    </div>

    <!-- 모바일 메뉴 패널 -->
    <nav v-if="mobileOpen" class="app-header__mobile" aria-label="모바일 메뉴">
      <template v-for="item in navItems" :key="item.to">
        <RouterLink
          :to="item.to"
          class="app-header__mobile-link"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </RouterLink>
        <!-- 하위메뉴는 들여써서 나열 -->
        <RouterLink
          v-for="child in item.children"
          :key="child.to"
          :to="child.to"
          class="app-header__mobile-link app-header__mobile-link--sub"
          @click="mobileOpen = false"
        >
          {{ child.label }}
        </RouterLink>
      </template>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  IconChevronDown,
  IconUser,
  IconSettings,
  IconLogout,
  IconMenu2,
} from '@tabler/icons-vue'

const auth = useAuthStore()
const router = useRouter()

// 주 메뉴 (한 곳에서 관리 → 마크업 중복 없음)
const navItems = [
  { label: '레시피', to: '/recipes' },
  { label: '냉장고 파먹기', to: '/fridge' },
  { label: '식단관리', to: '/meal-plan' },
  {
    label: '커뮤니티',
    to: '/community',
    children: [
      { label: '후기게시판', to: '/community/reviews' },
      { label: '큐레이션', to: '/community/curations' },
    ],
  },
]

const menuOpen = ref(false)   // 프로필 드롭다운
const mobileOpen = ref(false) // 모바일 메뉴

async function handleLogout() {
  await auth.logout()
  menuOpen.value = false
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--surface-card);
  border-bottom: 1px solid var(--border);
}
.app-header__inner {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: var(--space-6);
}
.app-header__logo {
  display: flex;
  align-items: center;
}
.app-header__logo-img {
  height: 32px;
  width: auto;
}
@media (max-width: 768px) {
  .app-header__logo-img { height: 28px; }
}

/* 주 메뉴 */
.app-header__nav { display: flex; gap: var(--space-1); }
.app-header__link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.app-header__link:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}
/* 현재 활성 라우트는 vue-router가 자동으로 붙이는 클래스 사용 */
.app-header__link.router-link-active {
  background: var(--surface-inverse);
  color: var(--text-on-inverse);
}

/* 드롭다운 (하위메뉴) */
.dropdown { position: relative; }
.dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.dropdown__menu {
  position: absolute;
  left: 0;
  top: calc(100% + var(--space-1));
  min-width: 160px;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  /* 평소 숨김: hover/focus 시에만 노출 */
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--dur-fast) var(--ease);
}
.dropdown:hover .dropdown__menu,
.dropdown:focus-within .dropdown__menu {
  opacity: 1;
  visibility: visible;
}
.dropdown__item {
  display: block;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.dropdown__item:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}
.dropdown__item.router-link-active {
  color: var(--accent-text);
}

/* 우측 액션 */
.app-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 프로필 */
.profile { position: relative; }
.profile__trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  transition: background var(--dur-fast) var(--ease);
}
.profile__trigger:hover { background: var(--surface-sunken); }
.profile__avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent-subtle);
  color: var(--accent-text);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  overflow: hidden;
}
.profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile__name { font-size: var(--text-sm); color: var(--text-primary); }
.profile__caret { color: var(--text-muted); }

.profile__menu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-2));
  min-width: 180px;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
}
.profile__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
  transition: background var(--dur-fast) var(--ease);
}
.profile__item:hover { background: var(--surface-sunken); color: var(--text-primary); }
.profile__item svg { color: var(--text-muted); }

/* 모바일 */
.app-header__burger { display: none; background: transparent; border: none; color: var(--text-primary); }
.app-header__mobile { display: none; }

@media (max-width: 768px) {
  .app-header__nav { display: none; }
  .app-header__burger { display: flex; }
  .app-header__mobile {
    display: flex;
    flex-direction: column;
    padding: var(--space-2) var(--space-4) var(--space-4);
    border-top: 1px solid var(--border);
  }
  .app-header__mobile-link {
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--text-base);
  }
  .app-header__mobile-link.router-link-active { color: var(--accent); }
  .app-header__mobile-link--sub {
    padding-left: var(--space-6);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
}
</style>