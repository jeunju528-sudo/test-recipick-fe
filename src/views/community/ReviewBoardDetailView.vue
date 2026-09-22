<template>
  <div class="container community-page">

    <!-- 참고한 레시피 -->
    <div
      v-if="board.rcp_seq"
      class="referenced-recipe card"
    >
      <div class="referenced-recipe__info">
        <img
          :src="board.att_file_no_main"
          :alt="board.rcp_nm"
          class="referenced-recipe__thumb"
        />

        <div>
          <span class="text-secondary">
            참고한 레시피
          </span>

          <h3>
            {{ board.rcp_nm }}
          </h3>

          <p class="text-secondary">
            {{ board.chef_nickname }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="btn btn--outline"
        @click="goToRecipeDetail(board.rcp_seq)"
      >
        레시피 보러가기 >
      </button>
    </div>

    <!-- 후기 정보 -->
    <section class="review-detail__header">
      <h2>
        {{ board.subject }}
      </h2>

      <div class="review-detail__writer">
        <div class="review-detail__icon">
          <img
            v-if="board.writer_profile_image"
            :src="board.writer_profile_image"
            :alt="board.writer_nickname"
          />

          <span v-else>
            {{ board.writer_nickname?.charAt(0) }}
          </span>
        </div>

        <div class="review-detail__writer-info">
          <span>
            {{ board.writer_nickname }}
          </span>

          <span class="text-secondary">
            {{ formatDate(board.created_at) }}
          </span>
        </div>

        <span class="review-detail__hit text-secondary">
          조회 {{ board.hit }}
        </span>
      </div>
    </section>

    <!-- 후기 이미지 -->
    <div
      v-if="board.image_url"
      class="review-detail__image"
    >
      <img
        :src="board.image_url"
        :alt="board.subject"
      />
    </div>

    <!-- 후기 본문 -->
    <section class="review-detail__content">
      <h3>후기</h3>

      <p>
        {{ board.content }}
      </p>

      <div
        v-if="isOwner"
        class="review-detail__actions"
      >
        <button
          type="button"
          class="btn btn--outline"
          @click="goToEdit"
        >
          수정
        </button>

        <button
          type="button"
          class="btn btn--outline"
          @click="handleDelete"
        >
          삭제
        </button>
      </div>
    </section>

    <!-- 작성자의 다른 후기 -->
    <section
      v-if="writerReviews.length > 0"
      class="review-detail__other-section"
    >
      <h3>작성자의 다른 후기</h3>

      <div class="review-detail__card-grid">
        <OtherReviewCard
          v-for="item in writerReviews"
          :key="item.id"
          :review="item"
          @click="goToOtherDetail(item.id)"
        />
      </div>
    </section>

    <!-- 다른 사람의 해당 레시피 후기 -->
    <section
      v-if="recipeReviews.length > 0"
      class="review-detail__other-section"
    >
      <h3>이 레시피의 다른 후기</h3>

      <div class="review-detail__card-grid">
        <OtherReviewCard
          v-for="item in recipeReviews"
          :key="item.id"
          :review="item"
          @click="goToOtherDetail(item.id)"
        />
      </div>
    </section>

    <!-- 댓글 -->
    <section class="review-detail__reply-section">
      <h3>
        댓글 ({{ replyList.length }})
      </h3>

      <!-- 댓글 입력 -->
      <div
        v-if="auth.isLoggedIn"
        class="reply-form"
      >
        <div class="reply-form__icon">
          <img
            v-if="auth.user?.profileImageUrl"
            :src="auth.user.profileImageUrl"
            alt="내 프로필"
          />

          <span v-else>
            {{ auth.user?.nickname?.charAt(0) }}
          </span>
        </div>

        <div class="reply-form__input-box">
          <textarea
            v-model="newReplyContent"
            class="input reply-form__textarea"
            placeholder="댓글을 작성해 주세요."
            rows="3"
          ></textarea>

          <div class="reply-form__actions">
            <button
              type="button"
              class="btn btn--primary"
              @click="submitReply"
            >
              등록
            </button>
          </div>
        </div>
      </div>

      <p
        v-else
        class="text-secondary"
      >
        댓글을 작성하려면 로그인이 필요합니다.
      </p>

      <!-- 댓글 목록 -->
      <div class="reply-list">
        <div
          v-for="reply in replyList"
          :key="reply.id"
          class="reply-item"
        >
          <div class="reply-item__icon">
            <img
              v-if="reply.writer_profile_image"
              :src="reply.writer_profile_image"
              :alt="reply.writer_nickname"
            />

            <span v-else>
              {{ reply.writer_nickname?.charAt(0) }}
            </span>
          </div>

          <div class="reply-item__body">
            <div class="reply-item__header">
              <span>
                {{ reply.writer_nickname }}
              </span>

              <span class="text-secondary">
                {{ formatDate(reply.created_at) }}
              </span>

              <button
                v-if="isReplyOwner(reply.users_id)"
                type="button"
                class="btn btn--ghost"
                @click="deleteReply(reply.id)"
              >
                삭제
              </button>
            </div>

            <p>
              {{ reply.content }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 하단 버튼 -->
    <div class="review-detail__bottom-actions">
      <button
        type="button"
        class="btn btn--outline"
        @click="router.back()"
      >
        뒤로 가기
      </button>

      <button
        type="button"
        class="btn btn--outline"
        @click="router.push('/community/reviews')"
      >
        목록
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import OtherReviewCard from '@/components/review/OtherReviewCard.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 상태
const reviewId = computed(() => route.params.id)

const board = ref({})
const replyList = ref([])
const writerReviews = ref([])
const recipeReviews = ref([])
const newReplyContent = ref('')

// 게시글 작성자 본인 여부
const isOwner = computed(() => {
  return (
    auth.isLoggedIn &&
    auth.user?.userId === board.value.writer_id
  )
})

// 상세 조회
const fetchDetail = async (targetId = route.params.id) => {
  try {
    const res = await axios.get(
      '/api/review/detail',
      {
        params: {
          id: targetId
        }
      }
    )

    board.value = res.data.board
    replyList.value = res.data.replyList
    writerReviews.value = res.data.writerReviews
    recipeReviews.value = res.data.recipeReviews
  } catch (err) {
    console.error('상세 조회 에러:', err)
  }
}

// 같은 상세 컴포넌트에서 URL의 id가 변경되면 다시 조회
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchDetail(newId)
    }
  }
)

// 페이지 최초 진입
onMounted(fetchDetail)

// 참고한 레시피 상세 페이지
const goToRecipeDetail = (rcpSeq) => {
  if (rcpSeq) {
    router.push(`/recipes/${rcpSeq}`)
  }
}

// 수정 페이지
const goToEdit = () => {
  router.push(`/community/reviews/${reviewId.value}/edit/`)
}

// 다른 후기 상세
const goToOtherDetail = (id) => {
  router.push(`/community/reviews/${id}`)
}

// 게시글 삭제
const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    await axios.delete(
      '/api/review/delete',
      {
        params: {
          id: reviewId.value
        }
      }
    )

    alert('삭제되었습니다.')
    router.push('/community/reviews')
  } catch (err) {
    console.error('삭제 에러:', err)

    if (err.response?.status === 401) {
      alert('로그인이 필요합니다.')
    } else if (err.response?.status === 403) {
      alert('삭제할 권한이 없습니다.')
    } else {
      alert(err.response?.data || '삭제에 실패했습니다.')
    }
  }
}

// 댓글 작성자 본인 여부
const isReplyOwner = (userId) => {
  return (
    auth.isLoggedIn &&
    (
      auth.user?.userId === userId ||
      auth.user?.role === 'ADMIN'
    )
  )
}

// 댓글 작성
const submitReply = async () => {
  if (!newReplyContent.value.trim()) {
    alert('댓글 내용을 입력해 주세요.')
    return
  }

  try {
    await axios.post(
      '/api/review/reply/insert',
      {
        review_board_id: reviewId.value,
        content: newReplyContent.value
      }
    )

    newReplyContent.value = ''
    await fetchDetail()
  } catch (err) {
    console.error('댓글 작성 에러:', err)
  }
}

// 댓글 삭제
const deleteReply = async (replyId) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) {
    return
  }

  try {
    await axios.delete(
      '/api/review/reply/delete',
      {
        params: {
          id: replyId
        }
      }
    )

    await fetchDetail()

  } catch (err) {
    console.error('댓글 삭제 에러:', err)

    if (err.response?.status === 403) {
      alert('댓글을 삭제할 권한이 없습니다.')
    } else if (err.response?.status === 401) {
      alert('로그인이 필요합니다.')
    } else {
      alert(err.response?.data || '댓글 삭제에 실패했습니다.')
    }
  }
}

// 날짜
const formatDate = (date) => {
  if (!date) {
    return ''
  }

  return new Date(date).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
</script>

<style scoped>
.community-page {
  padding-block: var(--space-6);
}

.referenced-recipe {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
}

.referenced-recipe__info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.referenced-recipe__thumb {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.review-detail__header {
  margin-bottom: var(--space-5);
}

.review-detail__writer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  margin-top: var(--space-3);
}

.review-detail__hit {
  margin-left: auto;
}

.review-detail__icon,
.reply-form__icon,
.reply-item__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--accent-subtle);
}

.review-detail__icon,
.reply-form__icon {
  width: 40px;
  height: 40px;
}

.reply-item__icon {
  width: 36px;
  height: 36px;
}

.review-detail__icon img,
.reply-form__icon img,
.reply-item__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-detail__icon span,
.reply-form__icon span,
.reply-item__icon span {
  color: var(--accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.review-detail__writer-info {
  display: flex;
  flex-direction: column;
}

.review-detail__image {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.review-detail__image img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 800px;
}

.review-detail__content {
  padding-block: var(--space-4);
  margin-bottom: var(--space-6);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.review-detail__content p {
  margin: var(--space-4) 0;
  line-height: 1.6;
  white-space: pre-line;
}

.review-detail__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.review-detail__other-section {
  margin-bottom: var(--space-6);
}

.review-detail__card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.review-detail__reply-section {
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

.reply-form {
  display: flex;
  gap: var(--space-3);
  margin-block: var(--space-4) var(--space-6);
}

.reply-form__input-box {
  flex: 1;
}

.reply-form__textarea {
  height: auto;
  min-height: 100px;
  padding-block: var(--space-3);
  resize: none;
}

.reply-form__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.reply-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
}

.reply-item__body {
  flex: 1;
  min-width: 0;
}

.reply-item__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.reply-item__header .btn {
  margin-left: auto;
  padding: var(--space-1) var(--space-2);
}

.reply-item__body > p {
  line-height: 1.5;
  white-space: pre-line;
}

.review-detail__bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

@media (max-width: 1024px) {
  .review-detail__card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .referenced-recipe {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-detail__card-grid {
    grid-template-columns: 1fr;
  }
}
</style>