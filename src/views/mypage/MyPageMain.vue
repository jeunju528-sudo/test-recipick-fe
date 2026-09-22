<template>
  <div class="my-page-main">

    <!-- 내 레시피 -->
    <section class="my-page-main__section">
      <div class="my-page-main__header">
        <h2>내 레시피</h2>
        <RouterLink to="/mypage/myrecipe" class="btn btn--ghost">
          더보기 &gt;
        </RouterLink>
      </div>

      <div class="my-page-main__recipe-list">
        <MyRecipeCard
          v-for="recipe in myRecipes"
          :key="recipe.rcp_seq"
          :recipe="recipe"
        />
      </div>
    </section>

    <!-- 좋아요한 레시피 -->
    <section class="my-page-main__section">
      <div class="my-page-main__header">
        <h2>좋아요한 레시피</h2>
        <RouterLink to="/mypage/likerecipe" class="btn btn--ghost">
          더보기 &gt;
        </RouterLink>
      </div>

      <div class="my-page-main__recipe-list">
        <RecipeCard
          v-for="recipe in likedRecipes"
          :key="recipe.rcp_seq"
          :recipe="recipe"
        />
      </div>
    </section>

    <!-- 찜한 레시피 -->
    <section class="my-page-main__section">
      <div class="my-page-main__header">
        <h2>찜한 레시피</h2>
        <RouterLink to="/mypage/saverecipe" class="btn btn--ghost">
          더보기 &gt;
        </RouterLink>
      </div>

      <div class="my-page-main__recipe-list">
        <RecipeCard
          v-for="recipe in bookmarkedRecipes"
          :key="recipe.rcp_seq"
          :recipe="recipe"
        />
      </div>
    </section>

    <!-- 후기 / 댓글 -->
    <div class="my-page-main__activity">

      <!-- 내 후기 -->
      <section class="my-page-main__section">
        <div class="my-page-main__header">
          <h2>내 후기</h2>
          <RouterLink to="/mypage/myreview" class="btn btn--ghost">
            더보기 &gt;
          </RouterLink>
        </div>

        <div class="my-page-main__text-list">
          <div
            v-for="review in myReviews"
            :key="review.id"
            class="my-page-main__text-item"
          >
            <p class="my-page-main__text-title">
              {{ review.subject }}
            </p>
          </div>
        </div>
      </section>

      <!-- 내 댓글 -->
      <section class="my-page-main__section">
        <div class="my-page-main__header">
          <h2>내 댓글</h2>
          <RouterLink to="/mypage/myreply" class="btn btn--ghost">
            더보기 &gt;
          </RouterLink>
        </div>

        <div class="my-page-main__text-list">
          <div
            v-for="reply in myReplies"
            :key="reply.id"
            class="my-page-main__text-item"
          >
            <p class="my-page-main__text-content">
              {{ reply.content }}
            </p>
          </div>
        </div>
      </section>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import axios from 'axios'

import MyRecipeCard from '@/components/mypage/MyRecipeCard.vue'
import RecipeCard from '@/components/recipe/RecipeCard.vue'

const myRecipes = ref([])
const likedRecipes = ref([])
const bookmarkedRecipes = ref([])
const myReviews = ref([])
const myReplies = ref([])

const loadMyRecipes = async () => {
  try {
    const res = await axios.get('/api/recipe/mylist', {
      params: { page: 1 }
    })
    myRecipes.value = res.data.list.slice(0, 3)
  } catch (error) {
    console.error('내 레시피 조회 실패:', error)
  }
}

const loadLikedRecipes = async () => {
  try {
    const res = await axios.get('/api/recipe/my-list', {
      params: {
        page: 1,
        type: 'like'
      }
    })
    likedRecipes.value = (res.data.myLikeList || []).slice(0, 3)
  } catch (error) {
    console.error('좋아요한 레시피 조회 실패:', error)
  }
}

const loadBookmarkedRecipes = async () => {
  try {
    const res = await axios.get('/api/recipe/my-list', {
      params: {
        page: 1,
        type: 'mark'
      }
    })
    bookmarkedRecipes.value = (res.data.myMarkList || []).slice(0, 3)
  } catch (error) {
    console.error('찜한 레시피 조회 실패:', error)
  }
}

const loadMyReviews = async () => {
  try {
    const res = await axios.get('/api/mypage/reviews', {
      params: { page: 1 }
    })
    myReviews.value = res.data.list.slice(0, 5)
  } catch (error) {
    console.error('내 후기 조회 실패:', error)
  }
}

const loadMyReplies = async () => {
  try {
    const res = await axios.get('/api/mypage/replies', {
      params: { page: 1 }
    })
    myReplies.value = res.data.list.slice(0, 5)
  } catch (error) {
    console.error('내 댓글 조회 실패:', error)
  }
}

onMounted(() => {
  loadMyRecipes()
  loadLikedRecipes()
  loadBookmarkedRecipes()
  loadMyReviews()
  loadMyReplies()
})
</script>

<style scoped>
.my-page-main {
  padding: var(--space-6) 0;
}

.my-page-main__section {
  margin-bottom: var(--space-6);
}

.my-page-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.my-page-main__recipe-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.my-page-main__activity {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.my-page-main__text-list {
  display: flex;
  flex-direction: column;
}

.my-page-main__text-item {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}

.my-page-main__text-item:first-child {
  padding-top: 0;
}

.my-page-main__text-title,
.my-page-main__text-content {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-page-main__text-title {
  margin-bottom: var(--space-1);
  font-weight: var(--weight-medium);
}

.my-page-main__text-content {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}
</style>