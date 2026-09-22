<template>
  <aside class="mypage-sidebar">

    <!-- 회원 정보 -->
    <div class="mypage-sidebar__profile">
      <div class="mypage-sidebar__profile-top">

        <!-- 프로필 이미지 -->
        <div class="mypage-sidebar__profile-image">
          <img
            v-if="profileImage"
            :src="profileImage"
            alt="프로필 이미지"
          />

          <span v-else>
            {{ profileNickname?.charAt(0) }}
          </span>
        </div>

        <!-- 닉네임 -->
        <p class="mypage-sidebar__name">
          {{ profileNickname }}
        </p>

      </div>

      <RouterLink
        to="/mypage/accountsetting"
        class="btn btn--primary btn--block"
      >
        회원정보 관리
      </RouterLink>
    </div>

    <br>

    <!-- 새 레시피 작성 -->
    <RouterLink
      to="/mypage/newrecipe"
      class="btn btn--primary btn--block"
    >
      새 레시피 작성
    </RouterLink>

    <!-- 마이페이지 메뉴 -->
    <nav
      class="mypage-sidebar__nav"
      aria-label="마이페이지 메뉴"
    >

      <!-- 전체 보기 -->
      <RouterLink
        to="/mypage/main"
        class="mypage-sidebar__link mypage-sidebar__link--main"
      >
        전체 보기
      </RouterLink>

      <!-- 레시피 -->
      <div class="mypage-sidebar__section">
        <p class="mypage-sidebar__section-title">
          레시피
        </p>

        <RouterLink
          to="/mypage/myrecipe"
          class="mypage-sidebar__link"
        >
          <span>나의 레시피</span>

          <span class="mypage-sidebar__count">
            {{ recipeCount }}
          </span>
        </RouterLink>

        <RouterLink
          to="/mypage/likerecipe"
          class="mypage-sidebar__link"
        >
          <span>좋아요 레시피</span>

          <span class="mypage-sidebar__count">
            {{ likedRecipeCount }}
          </span>
        </RouterLink>

        <RouterLink
          to="/mypage/saverecipe"
          class="mypage-sidebar__link"
        >
          <span>찜한 레시피</span>

          <span class="mypage-sidebar__count">
            {{ savedRecipeCount }}
          </span>
        </RouterLink>
      </div>

      <!-- 활동 -->
      <div class="mypage-sidebar__section">
        <p class="mypage-sidebar__section-title">
          활동
        </p>

        <RouterLink
          to="/mypage/myreview"
          class="mypage-sidebar__link"
        >
          <span>내 후기 관리</span>

          <span class="mypage-sidebar__count">
            {{ reviewCount }}
          </span>
        </RouterLink>

        <RouterLink
          to="/mypage/myreply"
          class="mypage-sidebar__link"
        >
          <span>내 댓글 관리</span>

          <span class="mypage-sidebar__count">
            {{ replyCount }}
          </span>
        </RouterLink>
      </div>

    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

/*
 * 회원 정보
 */
const profileNickname = ref('')
const profileImage = ref('')

/*
 * 마이페이지 카운트
 */
const recipeCount = ref(0)
const savedRecipeCount = ref(0)
const likedRecipeCount = ref(0)
const reviewCount = ref(0)
const replyCount = ref(0)

/*
 * 프로필 조회
 * 로그인 사용자 정보는 JWT로 백엔드에서 확인
 */
const loadProfile = async () => {
  try {
    const res = await axios.get(
      '/api/mypage/profile'
    )

    profileNickname.value = res.data.nickname || ''
    profileImage.value = res.data.profile_image_url || ''

  } catch (error) {
    console.error('프로필 조회 실패:', error)
  }
}

/*
 * 마이페이지 카운트 조회
 * 로그인 사용자 정보는 JWT로 백엔드에서 확인
 */
const loadCounts = async () => {
  try {
    const res = await axios.get(
      '/api/mypage/main_count'
    )

    console.log('마이페이지 카운트:', res.data)

    recipeCount.value =
      res.data.MY_RECIPE_CNT ?? 0

    savedRecipeCount.value =
      res.data.MARK_RECIPE_CNT ?? 0

    likedRecipeCount.value =
      res.data.LIKE_RECIPE_CNT ?? 0

    reviewCount.value =
      res.data.MY_REVIEW_CNT ?? 0

    replyCount.value =
      res.data.MY_REPLY_CNT ?? 0

  } catch (error) {
    console.error('마이페이지 카운트 조회 실패:', error)
  }
}

/*
 * 페이지 진입 시
 */
onMounted(() => {
  loadProfile()
  loadCounts()
})
</script>

<style scoped>
.mypage-sidebar {
  width: 240px;
}

/* 회원 정보 */
.mypage-sidebar__profile {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

.mypage-sidebar__profile-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

/* 프로필 이미지 */
.mypage-sidebar__profile-image {
  width: 64px;
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 50%;
  overflow: hidden;

  background: var(--accent-subtle);
}

/* 실제 프로필 이미지 */
.mypage-sidebar__profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 이미지가 없을 때 닉네임 첫 글자 */
.mypage-sidebar__profile-image span {
  color: var(--accent);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
}

/* 닉네임 */
.mypage-sidebar__name {
  margin: 0;
  font-weight: var(--weight-bold);
}

/* 메뉴 */
.mypage-sidebar__nav {
  margin-top: var(--space-5);
}

.mypage-sidebar__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  padding: var(--space-3) var(--space-2);

  color: var(--text-primary);
  text-decoration: none;

  border-radius: var(--radius-sm);
}

.mypage-sidebar__link:hover {
  background: var(--surface-muted);
}

.mypage-sidebar__link.router-link-active {
  color: var(--accent);
  font-weight: var(--weight-bold);
}

.mypage-sidebar__link--main {
  margin-bottom: var(--space-4);
  font-weight: var(--weight-bold);
}

/* 메뉴 섹션 */
.mypage-sidebar__section {
  margin-bottom: var(--space-5);
}

.mypage-sidebar__section-title {
  margin: 0 0 var(--space-2);
  padding: 0 var(--space-2);

  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

/* 카운트 */
.mypage-sidebar__count {
  min-width: 24px;
  text-align: center;

  color: var(--accent);
  font-size: var(--text-sm);
}
</style>