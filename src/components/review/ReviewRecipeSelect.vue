<template>
  <Teleport to="body">
    <div
      class="modal-backdrop"
      @click.self="$emit('close')"
    >
      <div class="modal card">
        <!-- 헤더 -->
        <div class="modal__header">
          <h3>레시피 검색</h3>

          <button
            type="button"
            class="btn btn--ghost"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- 검색 -->
        <div class="search-box">
          <input
            v-model="keyword"
            type="text"
            class="input"
            placeholder="레시피명으로 검색하세요."
            @keyup.enter="onNewSearch"
          />

          <button
            type="button"
            class="btn btn--primary"
            @click="onNewSearch"
          >
            검색
          </button>
        </div>

        <!-- 목록 -->
        <div class="recipe-list">
          <div
            v-if="isLoading"
            class="state-message text-secondary"
          >
            검색 중입니다...
          </div>

          <div
            v-else-if="recipeList.length === 0 && hasSearched"
            class="state-message text-secondary"
          >
            검색 결과가 없습니다.
          </div>

          <template v-else>
            <div
              v-for="recipe in recipeList"
              :key="recipe.rcp_seq"
              class="recipe-item"
            >
              <div class="recipe-item__info">
                <img
                  :src="recipe.att_file_no_main"
                  :alt="recipe.rcp_nm"
                  class="recipe-item__thumb"
                />

                <span>
                  {{ recipe.rcp_nm }}
                </span>
              </div>

              <button
                type="button"
                class="btn btn--outline"
                @click="selectRecipe(recipe)"
              >
                선택
              </button>
            </div>
          </template>
        </div>

        <!-- 페이지네이션 -->
        <Pagination
          v-if="page.totalpage > 1"
          :curpage="page.curpage"
          :startpage="page.startpage"
          :endpage="page.endpage"
          :totalpage="page.totalpage"
          @change="fetchRecipes"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import Pagination from '@/components/common/Pagination.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const rcp_seq = route.query.rcp_seq

//레시피 상세보기에서 넘어올 시
console.log('선택된 레시피:', rcp_seq)

const emit = defineEmits(['close', 'select'])

const keyword = ref('')
const recipeList = ref([])
const isLoading = ref(false)
const hasSearched = ref(false)

const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1
})

const onNewSearch = () => {
  if (!keyword.value.trim()) {
    alert('검색어를 입력해 주세요.')
    return
  }

  fetchRecipes(1)
}

const fetchRecipes = async (pageNum = 1) => {
  isLoading.value = true
  hasSearched.value = true

  try {
    const res = await axios.get(
      '/api/review/recipe/search',
      {
        params: {
          keyword: keyword.value.trim(),
          page: pageNum
        }
      }
    )

    recipeList.value = res.data.list || []

    page.value.curpage = res.data.curpage
    page.value.startpage = res.data.startpage
    page.value.endpage = res.data.endpage
    page.value.totalpage = res.data.totalpage
  } catch (err) {
    console.error('레시피 검색 실패:', err)
    recipeList.value = []
  } finally {
    isLoading.value = false
  }
}

const selectRecipe = (recipe) => {
  emit('select', recipe)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgb(0 0 0 / 40%);
}

.modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  padding: var(--space-4);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.modal__header .btn {
  padding: var(--space-1);
}

.search-box {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.search-box .input {
  flex: 1;
}

.recipe-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 0;
  height: 480px;
  overflow-y: auto;
}

.recipe-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.recipe-item__info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.recipe-item__info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-item__thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.state-message {
  padding: var(--space-6);
  text-align: center;
}
</style>
