<template>

  <div class="my-review">

    <h1>
      나의 리뷰
    </h1>

    <!-- 리뷰 목록 -->
    <div class="my-review__list">
      <MyReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
        @delete="deleteReview"
      />
    </div>

    <!-- 리뷰가 없을 때 -->
    <p v-if="reviews.length === 0" class="my-review__empty text-secondary">
      작성한 리뷰가 없습니다.
    </p>

    <!-- 페이지네이션 -->
    <Pagination
      :curpage="page.curpage"
      :startpage="page.startpage"
      :endpage="page.endpage"
      :totalpage="page.totalpage"
      @change="loadReviews"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

import MyReviewCard from '@/components/mypage/MyReviewCard.vue'
import Pagination from '@/components/common/Pagination.vue'

const reviews = ref([])

const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

const loadReviews = async (pageinfo = 1) => {
  const targetPage = typeof pageinfo === 'number' ? pageinfo : 1

  try {
    const res = await axios.get('/api/mypage/reviews', {
      params: {
        page: targetPage,
      },
    })

    reviews.value = res.data.list

    page.value = {
      curpage: res.data.pages[0],
      totalpage: res.data.pages[1],
      startpage: res.data.pages[2],
      endpage: res.data.pages[3],
    }
  } catch (error) {
    console.error('리뷰 목록 조회 실패:', error)
  }
}

const deleteReview = async (reviewId) => {
  if (!confirm('이 리뷰를 삭제하시겠습니까?')) {
    return
  }

  try {
    await axios.delete(
      `/api/mypage/reviews/${reviewId}`
    )

    alert('리뷰가 삭제되었습니다.')
    await loadReviews(page.value.curpage)

  } catch (error) {
    console.error(error)
    alert('리뷰 삭제에 실패했습니다.')
  }
}

onMounted(() => {
  loadReviews(1)
})
</script>

<style scoped>
.my-review {
  padding: var(--space-6) 0;
}

.my-review__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.my-review__empty {
  margin-top: var(--space-5);
  text-align: center;
}
</style>
