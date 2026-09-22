<template>
  <div class="my-reply">
    <h1>나의 댓글</h1>

    <!-- 전체 선택 / 선택 삭제 -->
    <div class="my-reply__actions">
      <button
        class="btn btn--outline"
        @click="toggleAll"
      >
        {{ isAllSelected ? '전체 해제' : '전체 선택' }}
      </button>

      <button
        class="btn btn--primary"
        @click="deleteSelected"
      >
        선택 삭제
      </button>
    </div>

    <!-- 댓글 목록 -->
    <div class="my-reply__list">
      <MyReplyCard
        v-for="reply in replies"
        :key="reply.id"
        :reply="reply"
        :selected="selectedReplyIds.includes(reply.id)"
        @toggle="toggleReply"
      />
    </div>

    <!-- 댓글 없음 -->
    <p
      v-if="replies.length === 0"
      class="my-reply__empty text-secondary"
    >
      작성한 댓글이 없습니다.
    </p>

    <!-- 페이지네이션 -->
    <Pagination
      :curpage="page.curpage"
      :startpage="page.startpage"
      :endpage="page.endpage"
      :totalpage="page.totalpage"
      @change="loadReplies"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

import MyReplyCard from '@/components/mypage/MyReplyCard.vue'
import Pagination from '@/components/common/Pagination.vue'

// 상태 변수
const replies = ref([])
const selectedReplyIds = ref([])

const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

// 현재 페이지의 댓글이 모두 선택되었는지 확인
const isAllSelected = computed(() =>
  replies.value.length > 0 &&
  selectedReplyIds.value.length === replies.value.length
)

// 댓글 하나 선택 / 해제
const toggleReply = (replyId) => {
  if (selectedReplyIds.value.includes(replyId)) {
    selectedReplyIds.value = selectedReplyIds.value.filter(
      id => id !== replyId
    )
  } else {
    selectedReplyIds.value.push(replyId)
  }
}

// 전체 선택 / 전체 해제
const toggleAll = () => {
  if (isAllSelected.value) {
    selectedReplyIds.value = []
    return
  }

  selectedReplyIds.value = replies.value.map(
    reply => reply.id
  )
}

// 댓글 목록 조회
const loadReplies = async (pageinfo = 1) => {
  const targetPage = typeof pageinfo === 'number' ? pageinfo : 1

  try {
    const res = await axios.get(
      '/api/mypage/replies',
      {
        params: {
          page: targetPage,
        },
      }
    )

    replies.value = res.data.list

    page.value = {
      curpage: res.data.pages[0],
      totalpage: res.data.pages[1],
      startpage: res.data.pages[2],
      endpage: res.data.pages[3],
    }

    // 페이지 이동 시 기존 선택 초기화
    selectedReplyIds.value = []
  } catch (error) {
    console.error('댓글 목록 조회 실패:', error)
  }
}

// 선택한 댓글 삭제
const deleteSelected = async () => {
  if (selectedReplyIds.value.length === 0) {
    return
  }

  if (!confirm('선택한 댓글을 삭제하시겠습니까?')) {
    return
  }

  try {
    await axios.delete(
      '/api/mypage/replies',
      {
        data: selectedReplyIds.value,
      }
    )

    alert('댓글이 삭제되었습니다.')

    await loadReplies(page.value.curpage)
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
    alert('댓글 삭제에 실패했습니다.')
  }
}

onMounted(() => {
  loadReplies(1)
})
</script>

<style scoped>
.my-reply {
  padding: var(--space-6) 0;
}

.my-reply__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
  margin-bottom: var(--space-3);
}

.my-reply__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.my-reply__empty {
  margin: var(--space-6) 0;
  text-align: center;
}
</style>