<template>
  <div class="landing">
    <HeroSearch v-model="heroKeyword" :top-recipe="popularRecipes[0]" />

    <div class="container landing__sections">
      <!-- 오늘의 인기 레시피 -->
      <section class="landing__block">
        <div class="section-head">
          <h2 class="section-title">지금 가장 많이 만드는 레시피</h2>
          <RouterLink to="/recipes" class="section-link">
            전체보기 <IconArrowRight :size="16" />
          </RouterLink>
        </div>
        <div class="landing__grid">
          <div v-for="(recipe, i) in popularRecipes" :key="recipe.rcp_seq" class="landing__rank-card">
            <span class="landing__rank" :class="{ 'landing__rank--top': i === 0 }">{{ i + 1 }}위</span>
            <RecipeCard :recipe="recipe" @tag-click="fillHeroKeyword" />
          </div>
        </div>
      </section>

      <!-- 내 냉장고 속 맞춤 레시피 -->
      <section class="landing__block">
        <FridgeMatch :ingredients="fridgeIngredients" :matches="fridgeMatches" />
      </section>

      <!-- 이번 주 식단표 -->
      <section class="landing__block">
        <WeeklyDietPreview :days="weeklyDiet" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { RouterLink, useRouter } from 'vue-router'
import { IconArrowRight, IconBowlChopsticks} from '@tabler/icons-vue'
import { useAuthStore } from '@/stores/auth'


import HeroSearch from '@/components/home/HeroSearch.vue'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import FridgeMatch from '@/components/home/FridgeMatch.vue'
import WeeklyDietPreview from '@/components/home/WeeklyDietPreview.vue'


// 오늘의 인기 레시피 (조회수 상위 4개, 실 API)
const popularRecipes = ref([])

// 히어로 검색창의 검색어 상태 (HeroSearch와 v-model로 연결)
const heroKeyword = ref('')


const router = useRouter()
// 인기 레시피 카드의 해시태그 클릭 시: 검색실행
function fillHeroKeyword(tag) {
 router.push({path:'/recipes',query:{keyword: tag}})
}

// 내 냉장고 속 맞춤 레시피 (mock)
const fridgeIngredients =ref([])

const authStore = useAuthStore()
const fridgeMatches = ref([])

onMounted(async () => {
  if (!authStore.user) {
    return   // 로그인 안 했으면 그냥 빈 상태로 둠
  }

  await loadWeeklyDiet()

  // 1. 내 냉장고 재료 조회
  const fridgeRes = await axios.get('/api/refrige/fridgedata', {
    params: { user_id: authStore.user.userId },
  })

  fridgeIngredients.value = [...new Set(
  fridgeRes.data
    .filter((r) => r.ingredient)
    .map((r) => r.ingredient.ingredient_name)
  )]
  if (fridgeIngredients.value.length === 0) {
    return   // 냉장고가 비어있으면 매칭 조회 안 함
  }


  // 2. 그 재료로 레시피 매칭 조회
  const matchRes = await axios.post('/api/refrige/recommand', {
    ingredients: fridgeIngredients.value,
    sort: 'match',
  })

  if (matchRes.data.success) {
    fridgeMatches.value = matchRes.data.recipes.slice(0, 3).map((r) => ({
      id: r.recipe_id,
      title: r.recipeName,
      icon: IconBowlChopsticks,
      matchLabel: `재료 ${r.haveIngredients.length}/${r.haveIngredients.length + r.missingIngredients.length} 보유`,
    }))
  }
})

// 이번 주 식단표 (달력 연동)
const weeklyDiet = ref([])
const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

async function loadWeeklyDiet() {
  const today = new Date()
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay() // 이번 주 월요일까지 거리
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  // 이번 주가 걸친 년/월 조합만 모아서 조회 (월 경계를 넘는 주 대비)
  const monthKeys = [...new Set(weekDays.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}`))]
  const itemsByDate = {}

  for (const key of monthKeys) {
    const [year, month] = key.split('-')
    const res = await axios.get('/api/calendar/list', {
      params: { year, month: String(month).padStart(2, '0') },
    })
    for (const it of res.data) {
      const dateOnly = String(it.meal_date).slice(0, 10)
      itemsByDate[`${dateOnly}_${it.meal_type}`] = it.rcp_nm
    }
  }

  weeklyDiet.value = weekDays.map((d) => {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      label: dayLabels[d.getDay()],
      breakfast: itemsByDate[`${dateStr}_아침`] || '',
      lunch: itemsByDate[`${dateStr}_점심`] || '',
      dinner: itemsByDate[`${dateStr}_저녁`] || '',
    }
  })
}

onMounted(async () => {
  // 조회수(hit) 기준 정렬된 레시피 목록에서 상위 4개만 노출
  const res = await axios.get('/api/recipe/list', {
    params: {
      page: 1,
      sort: 'hit',
    },
  })
  popularRecipes.value = res.data.list.slice(0, 4)
})
</script>

<style scoped>
.landing__sections { padding-block: var(--space-6); }

.landing__block { margin-bottom: var(--space-8); }
.landing__block:last-child { margin-bottom: 0; }

.landing__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
@media (max-width: 992px) { .landing__grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .landing__grid { grid-template-columns: repeat(2, 1fr); } }

.landing__rank-card { position: relative; height: 100%; }
.landing__rank {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 26px;
  padding-inline: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface-inverse);
  color: var(--text-on-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
.landing__rank--top { background: var(--accent); }
</style>
