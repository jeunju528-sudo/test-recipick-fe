<template>
  <div class="container curation-page">
    <!-- 헤더 -->
    <header class="curation__head">
      <h2 class="curation__title">제철 음식 큐레이션</h2>
      <p class="curation__subtitle">이달의 제철 재료로 만드는 추천 레시피</p>
    </header>

    <!-- 카드 리스트 -->
    <ul class="clist">
      <li
        v-for="item in curations"
        :key="item.id"
        class="ccard"
        @click="goDetail(item.id)"
      >
        <!-- 좌측: 제철 시기 -->
        <div class="ccard__season">
          <span class="ccard__month">{{ monthLabel(item.targetday) }}</span>
          <span class="ccard__year">{{ yearLabel(item.targetday) }}</span>
        </div>

        <!-- 중앙: 본문 -->
        <div class="ccard__main">
          <h3 class="ccard__title">{{ item.title }}</h3>
          <ul class="ing-chips">
            <li
              v-for="ing in ingredients(item.incredient_list)"
              :key="ing"
              class="ing-chip"
            >
              <component :is="ingIcon(ing)" :size="14" :stroke="1.75" />
              {{ ing }}
            </li>
            <li v-if="restCount(item.incredient_list) > 0" class="ing-chip ing-chip--more">
              +{{ restCount(item.incredient_list) }}
            </li>
          </ul>
        </div>

        <!-- 우측: 조회수 -->
        <div class="ccard__hit">
          <span class="ccard__hit-num">{{ formatHit(item.hit) }}</span>
          <span class="ccard__hit-label">조회</span>
        </div>
      </li>

      <!-- 빈 상태 -->
      <li v-if="curations.length === 0" class="clist__empty">
        등록된 큐레이션이 없습니다.
      </li>
    </ul>

    <!-- 페이지네이션 -->
    <Pagination
      class="curation__pagination"
      :curpage="page.curpage"
      :startpage="page.startpage"
      :endpage="page.endpage"
      :totalpage="page.totalpage"
      @change="loadCuration"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Pagination from '@/components/common/Pagination.vue'
import { ingIcon, parseIngredients } from '@/utils/ingredientIcon'

const router = useRouter()

const curations = ref([])
const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

const MAX_CHIPS = 4

function ingredients(str) {
  return parseIngredients(str).slice(0, MAX_CHIPS)
}

function restCount(str) {
  return Math.max(parseIngredients(str).length - MAX_CHIPS, 0)
}

function formatHit(n) {
  return typeof n === 'number' ? n.toLocaleString('ko-KR') : n
}

// "2026년 9월" 또는 "2026-09" 형태 모두 대응
function monthLabel(targetday) {
  const m = String(targetday).match(/(\d{1,2})\s*월|-(\d{1,2})/)
  const month = m ? (m[1] || m[2]) : ''
  return month ? `${Number(month)}월` : '—'
}
function yearLabel(targetday) {
  const y = String(targetday).match(/(\d{4})/)
  return y ? y[1] : ''
}

function goDetail(id) {
  router.push(`/community/curations/${id}`)
}

async function loadCuration(pageInfo) {
  try {
    const res = await axios.get('/api/community/curation', {
      params: { page: pageInfo },
    })
    curations.value = res.data.list
    page.value = {
      curpage: res.data.curpage,
      startpage: res.data.startpage,
      endpage: res.data.endpage,
      totalpage: res.data.totalpage,
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadCuration(1)
})
</script>

<style scoped>
.curation-page {
  padding-block: var(--space-6);
}

/* 헤더 */
.curation__head {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
}
.curation__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}
.curation__subtitle {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* 카드 리스트 */
.clist {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 개별 카드 */
.ccard {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease);
}
.ccard:hover {
  border-color: var(--accent);
  background: var(--surface-sunken);
}

/* 좌측: 제철 시기 */
.ccard__season {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--accent-subtle);
}
.ccard__month {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--accent-text);
  line-height: 1;
  margin-top: 10px;
}
.ccard__year {
  font-size: var(--text-xs);
  color: var(--accent-text);
  opacity: 0.75;
}

/* 중앙: 본문 */
.ccard__main {
  min-width: 0;
}
.ccard__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ccard:hover .ccard__title {
  color: var(--accent);
}

/* 재료 칩 */
.ing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.ing-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  color: var(--text-secondary);
  white-space: nowrap;
}
.ccard:hover .ing-chip {
  background: var(--surface-card);
}
.ing-chip--more {
  color: var(--text-muted);
}

/* 우측: 조회수 */
.ccard__hit {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.ccard__hit-num {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}
.ccard__hit-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* 빈 상태 */
.clist__empty {
  text-align: center;
  color: var(--text-muted);
  padding-block: var(--space-8);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

/* 페이지네이션 */
.curation__pagination {
  margin-top: var(--space-6);
}

/* 반응형 */
@media (max-width: 640px) {
  .ccard {
    grid-template-columns: 56px 1fr;
    gap: var(--space-4);
  }
  .ccard__hit {
    display: none;
  }
  .ccard__title {
    font-size: var(--text-base);
  }
}
</style>