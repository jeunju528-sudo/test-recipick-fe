<template>

  <div class="my-recipe-list">
    <h1>나의 레시피 <span class="my-recipe-list__count">({{ totalCount }})</span></h1>

    <div v-if="loading" class="my-recipe-list__state">
      불러오는 중...
    </div>

    <div v-else-if="recipeList.length === 0" class="my-recipe-list__state">
      등록한 레시피가 없습니다.
    </div>

    <template v-else>
      <div class="my-recipe-list__grid">
        <MyRecipeCard
          v-for="recipe in recipeList"
          :key="recipe.rcp_seq"
          :recipe="recipe"
          @deleted="handleDeleted"
        />
      </div>

      <Pagination
        class="my-recipe-list__pagination"
        :curpage="page.curpage"
        :startpage="page.startpage"
        :endpage="page.endpage"
        :totalpage="page.totalpage"
        @change="loadMyRecipeList"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import MyRecipeCard from '@/components/mypage/MyRecipeCard.vue'
import Pagination from '@/components/common/Pagination.vue'

// 로그인 완성되면 수정할 부분
// import {  } from '@/stores/auth'

// const  = useAuthStore()

// TODO: 로그인 기능 완성되면 아래 한 줄로 교체
// const userId = .user.id
const TEMP_USER_ID = 3 // 로그인 구현 전까지 임시 고정

const recipeList = ref([])
const totalCount = ref(0)
const loading = ref(true)
const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

async function loadMyRecipeList(targetPage = 1) {
  loading.value = true
  try {
    const res = await axios.get('/api/recipe/mylist', {
      params: {
        user_id: TEMP_USER_ID,
        page: targetPage,
      },
    })
    recipeList.value = res.data.list
    totalCount.value = res.data.totalCount

    page.value = {
      curpage: res.data.pages[0],
      totalpage: res.data.pages[1],
      startpage: res.data.pages[2],
      endpage: res.data.pages[3],
    }
  } catch (err) {
    console.error('나의 레시피 목록 조회 실패:', err)
  } finally {
    loading.value = false
  }
}

// MyRecipeCard에서 삭제 완료 시(@deleted) 목록에서 해당 카드 제거
function handleDeleted(rcp_seq) {
  recipeList.value = recipeList.value.filter(r => r.rcp_seq !== rcp_seq)
  totalCount.value -= 1
}

onMounted(() => {
  loadMyRecipeList(1)
})
</script>

<style scoped>
.my-recipe-list {
  padding-block: var(--space-6);
  width: 100%;
}

.my-recipe-list__count {
  color: var(--accent);
  font-weight: var(--weight-bold);
}

.my-recipe-list__state {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  padding: var(--space-4) 0;
}

.my-recipe-list__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-4);
  width: 100%;
}

.my-recipe-list__pagination {
  margin-top: var(--space-6);
}

@media (max-width: 992px) { .my-recipe-list__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .my-recipe-list__grid { grid-template-columns: 1fr; } }
</style>

