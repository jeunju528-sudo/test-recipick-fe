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
        <!-- span → button으로 변경, @click.stop으로 RouterLink 이동 막음 -->
        <button
          type="button"
          class="recipe-card__like"
          :class="{ 'recipe-card__like--active': liked }"
          @click.stop.prevent="toggleLike"
        >
          {{ liked ? '❤️' : '🤍' }} {{ likeCount }}
        </button>
      </div>
      <div class="card__body">
        <span class="chip chip--accent recipe-card__category">{{ recipe.rcp_pat2 }}</span>
        <h3 class="recipe-card__title">{{ recipe.rcp_nm }}</h3>
        <p class="recipe-card__meta text-secondary">
          {{ recipe.nickname }} · 조회 {{ recipe.hit }} · {{ recipe.info_eng }}kcal
        </p>
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
import { ref, computed } from 'vue'
import axios from 'axios'
import { getImageUrl } from '@/utils/image'

const props = defineProps({
  recipe: { type: Object, required: true },
  // { rcp_seq, rcp_nm, rcp_pat2, info_eng, user_id, att_file_no_main, hit, hash_tag, nickname, like_count }
})
// 해시태그 클릭 시 부모(RecipeListView)로 클릭된 태그 텍스트를 전달
defineEmits(['tag-click'])

// hash_tag는 콤마 구분 문자열 → 배열로 split, 빈 문자열/공백 제거
const hashTags = computed(() => {
  if (!props.recipe.hash_tag) return []
  return props.recipe.hash_tag
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
})

// --- 좋아요 상태 ---
// liked: 지금 이 카드에서 하트가 눌린 상태인지 여부 (초기값은 서버에서 안 내려주면 false로 시작)
const liked = ref(false)

// likeCount: 화면에 보여줄 좋아요 개수. recipe.like_count로 초기화 후, 클릭할 때마다 +1/-1로 즉시 반영
const likeCount = ref(props.recipe.like_count ?? 0)

const TEMP_USER_ID = 1

async function toggleLike() {
  const res = await axios.post('/api/recipe/like', null, {
    params: {
      user_id: TEMP_USER_ID,
      recipe_id: props.recipe.rcp_seq,
    },
  })

  // 서버 응답의 liked 값으로 하트 아이콘 상태 갱신
  liked.value = res.data.liked

  // liked가 true면 좋아요 등록된 것 → 개수 +1, false면 취소된 것 → 개수 -1
  likeCount.value += liked.value ? 1 : -1
}
</script>

<style scoped>
.recipe-card-link {
  display: block;
  color: inherit;
  height: 100%;   /* 추가: 그리드가 늘려준 높이를 그대로 받음 */
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

/* 좋아요 뱃지: 이미지 우상단 오버레이. button 기본 스타일 제거 후 기존 뱃지 모양 유지 */
.recipe-card__like {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: 2px 8px;
  font-size: var(--text-sm);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full, 999px);

  /* button 기본 스타일 초기화 */
  border: none;
  cursor: pointer;
  line-height: 1.4;
}
.recipe-card__like:hover {
  background: rgba(255, 255, 255, 1);
}
.recipe-card__like--active {
  color: var(--accent, #e5484d);
}

.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 키테고리 배지는 길이 늘어나지 않게 방지 */
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
.recipe-card__meta {
  font-size: var(--text-sm);
  margin-bottom: var(--space-3);
}
.recipe-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.recipe-card__tag {
  /* button 기본 스타일 초기화 */
  border: none;
  cursor: pointer;
  font: inherit;

  /* 카테고리 배지(chip--accent)와 톤을 맞춘 은은한 버전 */
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