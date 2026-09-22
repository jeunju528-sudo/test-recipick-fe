<template>
  <RouterLink :to="`/recipes/${recipe.rcp_seq}`" class="recipe-card-link">
    <article class="card card--hoverable recipe-card">
      <div class="recipe-card__image-wrap">
        <img
          class="recipe-card__image"
          :src="getImageUrl(recipe.att_file_no_main)"
          :alt="`${recipe.rcp_nm} 대표 이미지`"
          loading="lazy"
        />
        <!-- 좋아요: 클릭 불가, 표시만 (button → span으로 변경, 이벤트 제거) -->
        <span class="recipe-card__like">
          {{ recipe.like_count > 0 ? '❤️' : '🤍' }} {{ recipe.like_count ?? 0 }}
        </span>
      </div>
      <div class="card__body">
        <span class="chip chip--accent recipe-card__category">{{ recipe.rcp_pat2 }}</span>
        <h3 class="recipe-card__title">{{ recipe.rcp_nm }}</h3>

        <!-- 조회수/칼로리 + 수정·삭제 아이콘을 한 줄 양끝에 배치 -->
        <div class="recipe-card__meta-row">
          <p class="recipe-card__meta text-secondary">
            {{ recipe.nickname }} · 조회 {{ recipe.hit }} · {{ recipe.info_eng }}kcal
          </p>
          <div class="recipe-card__actions">
            <button
              type="button"
              class="recipe-card__action-btn"
              aria-label="레시피 수정"
              @click.stop.prevent="goEdit"
            >
              ✏️
            </button>
            <button
              type="button"
              class="recipe-card__action-btn"
              aria-label="레시피 삭제"
              @click.stop.prevent="handleDelete"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="recipe-card__tags">
          <button
            v-for="tag in hashTags"
            :key="tag"
            type="button"
            class="chip recipe-card__tag"
            @click.stop.prevent="$emit('tag-click', tag)"
          >
            #{{ tag }}
          </button>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { getImageUrl } from '@/utils/image'

const props = defineProps({
  recipe: { type: Object, required: true },
  // { rcp_seq, rcp_nm, rcp_pat2, info_eng, user_id, att_file_no_main, hit, hash_tag, nickname, like_count }
})

const emit = defineEmits(['tag-click', 'deleted'])

const router = useRouter()

// hash_tag는 콤마 구분 문자열 → 배열로 split, 빈 문자열/공백 제거
const hashTags = computed(() => {
  if (!props.recipe.hash_tag) return []
  return props.recipe.hash_tag
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
})

// 레시피 수정 화면으로 이동 (이름 기반 라우팅 - 경로 오타 방지)
function goEdit() {
  router.push({ name: 'recipe-edit', params: { id: props.recipe.rcp_seq } })
}

// 레시피 삭제 처리 
async function handleDelete() {
  const ok = window.confirm('정말 이 레시피를 삭제하시겠습니까?')
  if (!ok) return

  try {
    const res = await axios.post('/api/recipe/delete', null, {
      params: { rcp_seq: props.recipe.rcp_seq }
    })

    if (res.data.result > 0) {
      emit('deleted', props.recipe.rcp_seq)
    } else {
      alert('이미 삭제되었거나 존재하지 않는 레시피입니다.')
    }
  } catch (err) {
    console.error('레시피 삭제 실패:', err)
    alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }
}
</script>

<style scoped>
.recipe-card-link {
  display: block;
  color: inherit;
  height: 100%;
}

.recipe-card.card--hoverable:hover {
  box-shadow: none;
  transform: none;
  border-color: var(--border-strong);
}
.recipe-card.card--hoverable {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recipe-card__image-wrap {
  position: relative;
}

.recipe-card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--surface-sunken);
  transition: transform 0.4s var(--ease);
}
.recipe-card:hover .recipe-card__image {
  transform: scale(1.06);
}

/* 좋아요 뱃지: 클릭 불가, 표시만 */
.recipe-card__like {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: 2px 8px;
  font-size: var(--text-sm);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full, 999px);
  line-height: 1.4;
}

.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.recipe-card__category {
  display: inline-block;
  margin-bottom: var(--space-2);
}

.recipe-card__title {
  margin-bottom: var(--space-1);
  transition: color var(--dur-base) var(--ease);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: calc(1.4em * 2);
}
.recipe-card:hover .recipe-card__title {
  color: var(--accent);
}

/* 조회수/칼로리 줄 + 수정·삭제 아이콘 양끝 배치 */
.recipe-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  margin-bottom: var(--space-3);
}
.recipe-card__meta {
  font-size: var(--text-sm);
  margin-bottom: 0;
}
.recipe-card__actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}
.recipe-card__action-btn {
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  font-size: var(--text-sm);
  background: var(--surface-sunken);
  border-radius: var(--radius-full, 999px);
  line-height: 1.4;
}
.recipe-card__action-btn:hover {
  background: var(--border);
}

.recipe-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.recipe-card__tag {
  border: none;
  cursor: pointer;
  font: inherit;
  padding: 2px 10px;
  border-radius: var(--radius-full, 999px);
  background: var(--accent-subtle, #fdece3);
  color: var(--accent-text, #c2531f);
  font-size: var(--text-sm);
  transition: background var(--dur-fast) var(--ease);
}
.recipe-card__tag:hover {
  background: var(--accent, #e5601f);
  color: #fff;
}
</style>