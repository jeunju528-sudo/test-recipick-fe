<template>
  <div class="detail container">
    <div class="detail__layout">
      <!-- ===== 좌: 본문 ===== -->
      <div class="detail__main">
        <!-- 대표 이미지 -->
        <img
          class="detail__hero"
          :src="getImageUrl(recipeData?.att_file_no_main)"
          :alt="`${recipe.title} 완성 대표 이미지`"
        />

        <!-- 음식명 + 작성자 -->
        <div class="detail__head">
          <h1 class="detail__title">{{recipe.title}}</h1>
          <div class="detail__author">
            <span class="chip chip--accent">{{ recipe.badge }}</span>
            <span class="detail__chef">{{ recipe.chef }}</span>
            <button class="btn btn--outline detail__follow" @click="connectWebSocket">
              레시피 재료 문의하기
            </button>
          </div>
          <div class="detail__tags">
            <span v-for="tag in recipe.tags" :key="tag" class="chip"># {{ tag }}</span>
          </div>
        </div>

        <!-- 앵커 탭 (③번 결정: 같은 페이지 스크롤) -->
        <nav class="detail__tabs" aria-label="상세 항목 이동">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="detail__tab"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="scrollTo(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- 만드는 법 -->
        <section :id="tabs[0].id" ref="stepsSection" class="detail__section">
          <h2 class="detail__section-title">만드는 법</h2>
          <ol class="steps">
            <li v-for="(step, i) in recipe.steps" :key="i" class="steps__item">
              <img
                v-if="step.manual_img"
                class="steps__image"
                :src="getImageUrl(step.manual_img)"
                :alt="`순서 ${i + 1} 이미지`"
                loading="lazy"
              />
              <div v-else class="steps__image steps__image--empty" aria-hidden="true">
                순서 이미지
              </div>
              <p class="steps__text">
                <!--<span class="steps__num">{{ i + 1 }}.</span>-->
                {{ step.manual_desc }}
              </p>
            </li>
          </ol>
        </section>

        <!-- 연관 레시피 (②번 결정: 가로 스크롤 캐러셀) -->
        <section :id="tabs[1].id" ref="relatedSection" class="detail__section">
          <h2 class="detail__section-title">연관 레시피</h2>
          <div class="related">
            <RecipeCard
              v-for="r in relationRecipes"
              :key="r.id"
              :recipe="r"
              class="related__item"
            />
          </div>
        </section>

        <!-- 후기 -->
        <section :id="tabs[2].id" ref="reviewsSection" class="detail__section">
          <div class="reviewInsertBox">
            <h2 class="detail__section-title">후기 ({{ reviewList.length }})</h2>
            <button class="review-write-btn"  @click="goToWrite">
              ✏️ 리뷰쓰기
            </button>
          </div>
          <div class="reviews">
            <RecipeReviewCard
              v-for="review in reviews"
              :key="review.id"
              :review="review"
            />
          </div>
          <div class="reviewBox">
            <button 
              v-if ="reviewList.length > reviewPage"
              class="more-btn" 
              @click="reviewMore()">
              더보기
            </button>
            <button 
              v-if ="reviewList.length > 4 && reviewList.length <= reviewPage"
              class="more-btn" 
              @click="reviewDis()">
              접기
            </button>
          </div>
        </section>
      </div>
      <!-- ===== 우: sticky 사이드바 (①번 결정) ===== -->
      <aside class="detail__aside">
        <IngredientPanel
          :ingredients="recipe.ingredients"
          :cooking="recipe.cooking"
          :nutrition="recipe.nutrition"
          :recipeNo="id"
          :base-servings="1"
          :likeExist="likeExist"
          :markExist="markExist"
        />
      </aside>
    </div>
    <div class="cookieBox">
        <h2 class="detail__cookie_title">방문 레시피</h2>
        <div class="related">
          <RecipeCookie
            v-for="r in cookieRecipes"
            :key="r.id"
            :recipe="r"
            class="cookie__item"
          />
        </div>
    </div>
    <transition name="chat-slide">
    <ChatPanel
      v-if="isChatOpen"
      @close="isChatOpen = false"
      :client="client"
      :room_id="room_id"
    />
  </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import IngredientPanel from '@/components/recipe/IngredientPanel.vue'
import RecipeReviewCard from '@/components/recipe/RecipeReviewCard.vue'
import { storeToRefs } from 'pinia'
import { recipeDetailStore } from '@/stores/recipeDetailStore'
import { useRoute, useRouter } from 'vue-router'
import RecipeCookie from '@/components/recipe/RecipeCookie.vue'

import { getImageUrl } from '@/utils/image'

import ChatPanel from '@/components/chat/ChatPanel.vue'
import { Client } from '@stomp/stompjs'
import { chatStore } from '@/stores/ChatStore'


const route = useRoute()
const isChatOpen = ref(false)
const client = ref(null)

const id = computed(() => route.params.id)

const store = recipeDetailStore()
const chatstore = chatStore()

const { recipeData } = storeToRefs(store) // 레시피 상세 정보
const { manualList } = storeToRefs(store) // 조리과정 리스트
const { ingredientUnitList } = storeToRefs(store) // 재료 리스트
const { likeExist } = storeToRefs(store) // 좋아요 여부
const { markExist } = storeToRefs(store) // 북마크 여부
const { cookieList } = storeToRefs(store) //방문 레시피
const { relationList } = storeToRefs(store) // 연관 레시피 리스트
const { reviewList } = storeToRefs(store) // 리뷰 리스트

const { room_id } = storeToRefs(chatstore) 


const connectWebSocket = async () => {
  await chatstore.chatRoomCrerate(recipeData.value.user_id,recipeData.value.rcp_seq)

  if (client.value?.connected) {
    isChatOpen.value = true
    return
  }

  client.value = new Client({
    
    brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/chat-ws`,
    
    reconnectDelay: 5000,

    onConnect: () => {
      isChatOpen.value = true
    },

    onStompError: (frame) => {
      console.error('STOMP ERROR', frame)
    },

    onWebSocketError: (error) => {
      console.error('WebSocket ERROR', error)
    }
  })

  client.value.activate()
}



onMounted(() => {
  store.recipeDetailData(id.value) 
  store.recipeCookie()
  store.recipeDetailSub(id.value)
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      store.recipeDetailData(newId)
    }
  }
)

// 탭 정의 (앵커 id 한 곳에서 관리)
const tabs = [
  { id: 'steps', label: '만드는 법' },
  { id: 'related', label: '연관 레시피' },
  { id: 'reviews', label: '후기' },
]

const router = useRouter()
const activeTab = ref('steps')
const stepsSection = ref(null)
const relatedSection = ref(null)
const reviewsSection = ref(null)

const reviewPage = ref(4) //후기 페이지 

// 탭 클릭 → 해당 섹션으로 부드럽게 스크롤
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 스크롤 위치에 따라 활성 탭 자동 갱신 (IntersectionObserver)
let observer = null
onMounted(() => {
  const sections = [stepsSection.value, relatedSection.value, reviewsSection.value].filter(Boolean)
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeTab.value = entry.target.id
      }
    },
    // 헤더(64px) 아래를 기준선으로
    { rootMargin: '-40% 0px -55% 0px' }
  )
  sections.forEach((el) => observer.observe(el))
})
onUnmounted(() => observer?.disconnect())

// --- 아래는 목업 데이터 (API 연동 시 교체, FR-2xx) ---
const recipe = computed(()=>({

  title: recipeData.value?.rcp_nm,
  chef: recipeData.value?.nickname ?? '알 수 없는 사용자',
  badge: '오늘의 레시피',
  image: '',
  tags: recipeData.value?.hash_tag?.split(",") ?? [],
  steps: manualList.value,
  ingredients: ingredientUnitList.value,
  cooking: { type: recipeData.value?.rcp_pat2, method: recipeData.value?.rcp_way2 },
  nutrition: [
    { value: `${recipeData.value?.info_eng ?? ''}`, label: '열량' },
    { value: `${recipeData.value?.info_car ?? ''}g`, label: '탄수화물' },
    { value: `${recipeData.value?.info_pro ?? ''}g`, label: '단백질' },
    { value: `${recipeData.value?.info_fat ?? ''}g`, label: '지방' },
    { value: `${recipeData.value?.info_na  ?? ''}mg`, label: '나트륨' },
  ],
}))

//레시피 북마크

//{ rcp_seq, rcp_nm, rcp_pat2, info_eng, user_id, att_file_no_main, hit, hash_tag, nickname, like_count }

const cookieRecipes = computed(() =>
  cookieList.value.map(item => ({
    rcp_seq: item.rcp_seq,
    rcp_nm: item.rcp_nm,
    att_file_no_main: item.att_file_no_main,
    hit: item.hit,
    rcp_pat2: item.rcp_pat2,
  }))
)

// 재료가 많이 일치하는 레시피 3개
const relationRecipes = computed(() =>
  relationList.value.map(item => ({
    nickname:item.nickname,
    like_count:item.count,
    //hash_tag:item.hash_tag,
    user_id:2,
    rcp_seq: item.rcp_seq,
    info_eng: item.info_eng,
    rcp_nm: item.rcp_nm,
    att_file_no_main: item.att_file_no_main,
    hit: item.hit,
    rcp_pat2: item.rcp_pat2,
  }))
)

// 리뷰리스트
const reviews = computed(() =>
  reviewList.value
    .map((item) => ({
      id: item.id,
      title: item.subject,
      content: item.content,
      image: item.image_url
    }))
    .slice(0, reviewPage.value)
);

const reviewMore = () =>{
  reviewPage.value = reviewPage.value +4;
}
const reviewDis = () =>{
  reviewPage.value = 4;
}

const goToWrite = () => {
   router.push({
    path: '/community/reviews/write',
    query: {
      rcp_seq: id.value
    }
  })
}
</script>

<style scoped>
.detail {
  padding-block: var(--space-6);
}

/* 2단 레이아웃 */
.detail__layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-8);
  align-items: start;
}

/* ----- 좌: 본문 ----- */
.detail__hero {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
}

.detail__head {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.detail__title { font-size: var(--text-2xl); }
.detail__author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.detail__chef { font-weight: var(--weight-medium); }
.detail__follow {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-3);
}
.detail__tags { display: flex; gap: var(--space-2); }

/* 앵커 탭 */
.detail__tabs {
  display: flex;
  gap: var(--space-6);
  margin-top: var(--space-6);
  border-bottom: 1px solid var(--border);
  /* 헤더 아래에 붙어 따라오도록 */
  position: sticky;
  top: var(--header-height);
  background: var(--surface-page);
  z-index: 10;
}
.detail__tab {
  padding: var(--space-3) 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-base);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}
.detail__tab:hover { color: var(--text-primary); }
.detail__tab.is-active {
  color: var(--text-primary);
  font-weight: var(--weight-bold);
  border-bottom-color: var(--accent);
}

/* 섹션 */
.detail__section {
  padding-top: var(--space-6);
  /* 앵커 스크롤 시 sticky 탭에 가리지 않도록 여백 확보 */
  scroll-margin-top: calc(var(--header-height) + 56px);
}
.detail__section-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  margin-bottom: var(--space-4);
}

/* 만드는 법 */
.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.steps__item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-4);
  align-items: start;
}
.steps__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}
.steps__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.steps__text {
  line-height: var(--leading-normal);
  padding-top: var(--space-2);
}
.steps__num {
  font-weight: var(--weight-bold);
  margin-right: var(--space-1);
}

/* 연관 레시피 — 가로 스크롤 */
.related {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-2);
  scrollbar-width: thin;
  scroll-snap-type: x mandatory;
}
.related__item {
  flex: 0 0 260px;
  scroll-snap-align: start;
}

/* 방문 레시피 */
.cookie__item {
  flex: 0 0 162px;
  scroll-snap-align: start;
}
.detail__cookie_title {
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
  margin-bottom: var(--space-4);
}
.cookieBox{
  margin-top: 80px;
  width: 1240px;
}

/* 후기 — 2열 리스트 */
.reviews {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.more-btn {
  width: 120px;
  height: 42px;
  border: 1px solid #ddd;
  border-radius: 21px;
  background-color: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.more-btn:hover {
  background-color: #f5f5f5;
  border-color: #bbb;
}

.more-btn:active {
  transform: scale(0.97);
}
.reviewBox
{
  display: flex; 
  justify-content: center; 
  margin-top: 40px;
}
.reviewInsertBox
{
  display: flex; 
  justify-content: space-between;
}
.review-write-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.review-write-btn {
  padding: 5px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background-color: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.review-write-btn:hover {
  background-color: #f5f5f5;
  border-color: #bbb;
}

.review-write-btn:active {
  transform: scale(0.97);
}
/* ----- 우: sticky 사이드바 ----- */
.detail__aside {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
}

/* 반응형: 1024px 이하는 1단 */
@media (max-width: 1024px) {
  .detail__layout { grid-template-columns: 1fr; }
  .detail__aside { position: static; }
}
@media (max-width: 640px) {
  .steps__item { grid-template-columns: 1fr; }
  .reviews { grid-template-columns: 1fr; }
}
</style>
