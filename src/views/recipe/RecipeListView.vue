<template>
  <div class="home container">
    <!-- 히어로 -->
    <section class="home__hero">
      <p class="home__hero-text">
        오늘 뭐 해먹지?<br>
        <span class="home__count">{{ heroText }}</span>개의 맛있는 레시피가 준비되어 있어요.
      </p>
    </section>

    <!-- 검색 -->
    <section class="home__search">
      <div class="search-box">
        <input
          v-model="keyword"
          class="search-box__input"
          type="search"
          placeholder="레시피 검색 입력란"
          @keyup.enter="loadRecipes"
        />
        <button class="search-box__btn" aria-label="검색" @click="loadRecipes">
          <IconSearch :size="20" />
        </button>
      </div>
    </section>

    <!-- 카테고리 -->
    <section class="home__categories">
      <CategoryCarousel
        v-model="activeCategory"
        :categories="categories"
        @update:model-value="loadRecipes"
      />
    </section>

    <!-- 목록 헤더: 총 개수 + 정렬 -->
    <div class="home__list-head">
      <span class="text-secondary">총 {{ totalCount.toLocaleString() }}개</span>
      <SortSelect v-model="sort" @update:model-value="loadRecipes" />
    </div>

 <!-- 검색/필터 결과가 없을 때 안내 메시지 -->
    <p v-if="recipes.length === 0" class="home__empty text-secondary">
      검색 결과가 없어요. 다른 키워드나 카테고리로 시도해보세요.
    </p>

    <!-- 그리드 -->
     <!-- :key="recipe.rcp_seq => 각 카드가 서로 다른 레시피로 제대로 구분-->
  <!-- RecipeCard를 직접 렌더링 -->
     <section class="home__grid">
      <RecipeCard
        v-for="recipe in recipes"
        :key="recipe.rcp_seq" 
        :recipe="recipe"
        @tag-click="searchByTag"
      />
    </section>

    <!-- 페이지네이션 -->
    <Pagination
      class="list__pagination"
      :curpage="page.curpage"
      :startpage="page.startpage"
      :endpage="page.endpage"
      :totalpage="page.totalpage"
      @change="loadRecipes"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute} from 'vue-router'
import { useCountUp } from '@/composables/useCountUp'
import axios from 'axios'
import {
  IconSearch, IconCategory, IconBowl, IconSoup, IconCake,
  IconBowlChopsticks, IconMeat, IconSalad,
} from '@tabler/icons-vue'

import CategoryCarousel from '@/components/recipe/CategoryCarousel.vue'
import SortSelect from '@/components/recipe/SortSelect.vue'
import Pagination from '@/components/common/Pagination.vue'
import RecipeCard from '@/components/recipe/RecipeCard.vue'

// --- 히어로 카운트업 (와이어프레임 "애니메이션 추가") ---
const totalCount = ref(1200)
const { display: countDisplay } = useCountUp(totalCount, 1200)

// --- 카테고리 ---
const categories = [
  { key: 'all', label: '전체', value: null, icon: IconCategory },
  { key: 'banchan', label: '반찬', value: '반찬', icon: IconBowl },
  { key: 'soup', label: '국·찌개', value: '국&찌개', icon: IconSoup },
  { key: 'dessert', label: '후식', value: '후식', icon: IconCake },
  { key: 'rice', label: '밥', value: '밥', icon: IconBowlChopsticks },
  { key: 'ilpum', label: '일품', value: '일품', icon: IconMeat },
  { key: 'etc', label: '기타', value: '기타', icon: IconSalad },
]
const activeCategory = ref('all')

// 현재 URL 정보를 읽기 위한 route 객체 (예: /recipes?keyword=저탄수화물)
const route = useRoute()

// --- 검색 · 정렬 · 페이지 ---
const keyword = ref(route.query.keyword || '')
const sort = ref('latest')
const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

const recipes = ref([])

const heroText = computed(() => `${countDisplay.value.toLocaleString()}`)


// 해시태그 배지 클릭 시: 검색창에 태그 채우고 해당 해시태그 자돟 목록조회
function searchByTag(tag) {
  keyword.value = tag
 loadRecipes(1) // 새로운 검색/필터가 실행되면 처음페이지부터 조회
}

async function loadRecipes(pageinfo = 1) {
  // pageinfo가 숫자가 아니면(카테고리/정렬 변경 등에서 잘못 넘어온 값이면) 1페이지로 처리
  const targetPage = typeof pageinfo === 'number' ? pageinfo : 1

  // 현재 선택된 카테고리 정보 찾기 (value가 null이면 '전체' 카테고리)
  const selected = categories.find(cat => cat.key === activeCategory.value)

      let res

  if (keyword.value.trim() !== '' && selected.value !== null) {
    // 검색어 + 카테고리 둘 다 있으면 통합 필터 API 호출
    res = await axios.get('/api/recipe/filter', {
      params: {
        main_category: selected.value, // 선택된 카테고리 값
        keyword: keyword.value,        // 검색창에 입력한 검색어
        page: targetPage,
        sort: sort.value
      }
    })
  } else if (keyword.value.trim() !== '') {
    // 검색어만 있으면 키워드 검색
    res = await axios.get('/api/recipe/keyword', {
      params: {
        keyword: keyword.value,   // 검색창에 입력한 검색어
        page: targetPage,         // 몇 페이지를 조회할지
        sort: sort.value          // 정렬 기준 (최신순 / 인기순)
      }
    })
  } else if (selected.value === null) {    // '전체' 카테고리 선택 시: /recipe/list 로 요청
    // sort.value에는 SortSelect에서 고른 'latest' 또는 'hit'이 들어있음
    res = await axios.get('/api/recipe/list', {
      params: {
        page: targetPage,   // 몇 페이지를 조회할지
        sort: sort.value    // 정렬 기준 (최신순 / 인기순)
      }
    })
  } else {
    // 특정 카테고리 선택 시: /recipe/category 로 요청
    res = await axios.get('/api/recipe/category', {
      params: {
        main_category: selected.value, // 선택된 카테고리 값 (예: '반찬')
        page: targetPage,              // 몇 페이지를 조회할지
        sort: sort.value               // 정렬 기준 (최신순 / 인기순)
      }
    })
  }
  // 응답으로 받은 레시피 목록을 화면에 뿌릴 배열에 저장
    recipes.value = res.data.list
  // 검색(keyword) API 응답에는 totalCount가 없으므로, 없을 때는 값 갱신하지 않고 이전 값 유지
  if (res.data.totalCount !== undefined) {
    // 레시피 총 개수
    totalCount.value = res.data.totalCount 
  }


  // 페이지네이션 정보 저장 (백엔드가 배열 형태로 [현재페이지, 전체페이지, 시작페이지, 끝페이지] 순으로 줌)
  page.value = {
    curpage: res.data.pages[0],
    totalpage: res.data.pages[1],
    startpage: res.data.pages[2],
    endpage: res.data.pages[3],
  }
}

// 화면 처음 뜰 때 1페이지 조회
onMounted(() => {
  loadRecipes(1)
})

</script>


<style scoped>
.home { padding-block: var(--space-6); }

.home__hero { text-align: center; margin-bottom: var(--space-5); }
.home__hero-text {
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}
.home__count { color: var(--accent); font-weight: var(--weight-bold); }

.home__search { margin-bottom: var(--space-5); }
.search-box {
  display: flex;
  align-items: center;
  max-width: 560px;
  margin-inline: auto;
  background: var(--surface-sunken);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding-right: var(--space-2);
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.search-box:focus-within {
  background: var(--surface-card);
  border-color: var(--accent);
}
.search-box__input {
  flex: 1;
  height: 52px;
  padding: 0 var(--space-4);
  background: transparent;
  border: none;
  color: var(--text-primary);
}
.search-box__input:focus { outline: none; }
.search-box__input::placeholder { color: var(--text-muted); }
.search-box__btn {
  display: flex;
  padding: var(--space-2);
  background: transparent;
  border: none;
  color: var(--text-muted);
}
.search-box__btn:hover { color: var(--accent); }

.home__categories { margin-bottom: var(--space-6); }

.home__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.home__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

/* 페이지네이션 여백 */
.list__pagination { margin-top: var(--space-6); }

@media (max-width: 992px) { .home__grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .home__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .home__grid { grid-template-columns: 1fr; } }
</style>