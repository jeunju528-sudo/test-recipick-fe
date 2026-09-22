<template>
  <div class="curation-page">
    <p v-if="loading" class="container text-muted">불러오는 중입니다…</p>

    <template v-else>
      <!-- 히어로: 꽉 찬 밴드 -->
      <section class="chero">
        <div class="container chero__inner">
          <div class="chero__season">
            <span class="chero__month">{{ monthLabel(curation.targetday) }}</span>
            <span class="chero__year">{{ yearLabel(curation.targetday) }}</span>
          </div>
          <div class="chero__main">
            <h1 class="chero__title">{{ curation.title }}</h1>
            <p class="chero__meta">등록일 {{ curation.created_at }}</p>
          </div>
        </div>
      </section>

      <!-- 본문: 좌측 인덱스 + 우측 그룹 (박스로 감쌈) -->
      <div class="container">
        <div class="cdetail">
          <!-- 좌측 sticky 재료 인덱스 -->
          <aside class="cindex">
            <p class="cindex__label">제철 재료</p>
            <nav class="cindex__nav">
              <button
                v-for="ing in curation.group"
                :key="ing.ingredient_id"
                class="cindex__item"
                :class="{ 'is-active': activeIng === ing.ingredient_id }"
                @click="scrollTo(ing.ingredient_id)"
              >
                <component :is="ingIcon(ing.ingredient_name)" :size="16" :stroke="1.75" />
                <span>{{ ing.ingredient_name }}</span>
                <span class="cindex__count">{{ ing.recipes.length }}</span>
              </button>
            </nav>
          </aside>

          <!-- 우측 재료별 그룹 -->
          <div class="cdetail__groups">
            <CurationGroup
              v-for="ing in curation.group"
              :key="ing.ingredient_id"
              :id="`ing-${ing.ingredient_id}`"
              :ref="el => setGroupRef(ing.ingredient_id, el)"
              :ingredient="ing.ingredient_name"
              :recipes="ing.recipes"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import CurationGroup from '@/components/common/CurationGroup.vue'
import { ingIcon } from '@/utils/ingredientIcon'

const route = useRoute()

const curation = ref({ title: '', targetday: '', created_at: '', id: 0, group: [] })
const loading = ref(true)
const activeIng = ref(null)

// 그룹 DOM 참조 수집 (scrollspy + 점프용)
const groupEls = ref({})
function setGroupRef(id, el) {
  if (el) groupEls.value[id] = el.$el ?? el
}

function monthLabel(targetday) {
  const m = String(targetday).match(/(\d{1,2})\s*월|-(\d{1,2})/)
  const month = m ? (m[1] || m[2]) : ''
  return month ? `${Number(month)}월` : '—'
}
function yearLabel(targetday) {
  const y = String(targetday).match(/(\d{4})/)
  return y ? y[1] : ''
}

// 클릭 즉시 하이라이트 + 스크롤 중 spy 잠금
let spyLocked = false
function scrollTo(id) {
  activeIng.value = id
  spyLocked = true
  const el = groupEls.value[id]
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => { spyLocked = false }, 600)
}

// scrollspy: 화면 상단에 걸린 그룹을 active로
let observer = null
function initSpy() {
  observer = new IntersectionObserver(
    (entries) => {
      if (spyLocked) return
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('ing-', '')
          activeIng.value = Number(id) || id
        }
      })
    },
    { rootMargin: '-20% 0px -70% 0px' }
  )
  Object.values(groupEls.value).forEach((el) => el && observer.observe(el))
}

async function loadDetailCuration(id) {
  try {
    const res = await axios.get(`/api/community/curation/${id}`)
    curation.value = res.data
    if (res.data.group?.length) activeIng.value = res.data.group[0].ingredient_id
  } catch (error) {
    console.error('상세보기 조회 실패', error)
  } finally {
    loading.value = false
    await nextTick()
    initSpy()
  }
}

onMounted(() => loadDetailCuration(route.params.id))
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.curation-page {
  padding-bottom: var(--space-8);
}

/* ── 히어로 ── */
.chero {
  background: var(--accent-subtle);
  border-bottom: 1px solid var(--border);
  padding-block: var(--space-6);
  margin-bottom: var(--space-6);
}
.chero__inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}
.chero__season {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  background: var(--surface-card);
}
.chero__month {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--accent-text);
  line-height: 1;
}
.chero__year {
  font-size: var(--text-xs);
  color: var(--accent-text);
  opacity: 0.7;
}
.chero__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}
.chero__meta {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ── 본문 2단 레이아웃 (박스) ── */
.cdetail {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--space-6);
  align-items: start;
  padding: var(--space-5) var(--space-6);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

/* 좌측 sticky 인덱스 */
.cindex {
  position: sticky;
  top: var(--space-3);
}
.cindex__label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
}
.cindex__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cindex__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-align: left;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.cindex__item:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}
.cindex__item.is-active {
  background: var(--accent-subtle);
  color: var(--accent-text);
  font-weight: var(--weight-medium);
}
.cindex__count {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.cindex__item.is-active .cindex__count {
  color: var(--accent-text);
}

/* 우측 그룹 */
.cdetail__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

/* 반응형: 인덱스 숨김 */
@media (max-width: 768px) {
  .cdetail {
    grid-template-columns: 1fr;
    padding: var(--space-4);
  }
  .cindex {
    display: none;
  }
}
</style>