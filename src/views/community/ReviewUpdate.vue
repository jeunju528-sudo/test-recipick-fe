<template>
  <div class="container community-page">
    <h2>후기 수정</h2>

    <template v-if="board">
      <!-- 레시피 선택 -->
      <section class="write-section">
        <label class="form-label">레시피</label>

        <div
          v-if="!selectedRecipe"
          class="recipe-select"
          @click="openRecipeModal"
        >
          <span class="text-secondary">레시피를 선택해주세요.</span>
        </div>

        <div v-else class="recipe-selected card">
          <div class="recipe-selected__info">
            <img
              class="recipe-selected__thumb"
              :src="selectedRecipe.att_file_no_main"
              :alt="selectedRecipe.rcp_nm"
            />

            <h4>{{ selectedRecipe.rcp_nm }}</h4>
          </div>

          <button
            type="button"
            class="btn btn--ghost"
            @click="openRecipeModal"
          >
            변경
          </button>
        </div>
      </section>

      <!-- 이미지 -->
      <section class="write-section">
        <label class="form-label">사진</label>

        <div class="image-upload">
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="후기 이미지" />

            <button
              type="button"
              class="image-preview__remove"
              @click="removeImage"
            >
              삭제
            </button>
          </div>

          <label v-else class="image-upload__button">
            <span class="text-secondary">사진 추가</span>
            <input
              type="file"
              class="file-input-hidden"
              accept="image/*"
              @change="handleImageChange"
            />
          </label>
        </div>
      </section>

      <!-- 제목 -->
      <section class="write-section">
        <label for="subject" class="form-label">제목</label>

        <input
          id="subject"
          v-model="subject"
          type="text"
          class="input"
          maxlength="100"
        />
      </section>

      <!-- 내용 -->
      <section class="write-section">
        <label for="content" class="form-label">내용</label>

        <textarea
          id="content"
          v-model="content"
          class="input write-textarea"
        ></textarea>
      </section>

      <section class="write-section">
        <button
          type="button"
          class="btn btn--primary btn--block"
          :disabled="isSubmitting"
          @click="updateReview"
        >
          {{ isSubmitting ? '수정 중...' : '수정 완료' }}
        </button>
      </section>
    </template>

    <ReviewRecipeSelect
      v-if="showRecipeModal"
      @select="selectRecipe"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import ReviewRecipeSelect from '@/components/review/ReviewRecipeSelect.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const reviewId = Number(route.params.id)

const board = ref(null)
const selectedRecipe = ref(null)
const subject = ref('')
const content = ref('')

const showRecipeModal = ref(false)
const imageFile = ref(null)
const imagePreview = ref(null)
const isSubmitting = ref(false)

const MAX_IMAGE_SIZE = 8 * 1024 * 1024

const openRecipeModal = () => {
  showRecipeModal.value = true
}

const selectRecipe = (recipe) => {
  selectedRecipe.value = recipe
  showRecipeModal.value = false
}

const handleImageChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.')
    return
  }

  if (file.size > MAX_IMAGE_SIZE) {
    alert('이미지는 8MB 이하만 업로드할 수 있습니다.')
    return
  }

  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const removeImage = () => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }

  imageFile.value = null
  imagePreview.value = null
}

const loadReview = async () => {
  try {
    const res = await axios.get(
      '/api/review/detail',
      { params: { id: reviewId } }
    )

    const data = res.data.board

    if (
      !auth.isLoggedIn ||
      auth.user?.userId !== data.writer_id
    ) {
      alert('수정 권한이 없습니다.')
      router.replace(`/community/reviews/${reviewId}`)
      return
    }

    board.value = data
    subject.value = data.subject
    content.value = data.content

    selectedRecipe.value = {
      rcp_seq: data.rcp_seq,
      rcp_nm: data.rcp_nm,
      att_file_no_main: data.att_file_no_main
    }

    imagePreview.value = data.image_url || null
  } catch (error) {
    console.error(error)
    alert('후기 정보를 불러오지 못했습니다.')
    router.replace('/community/reviews')
  }
}

const updateReview = async () => {
  if (!selectedRecipe.value) {
    alert('레시피를 선택해주세요.')
    return
  }

  if (!subject.value.trim()) {
    alert('제목을 입력해주세요.')
    return
  }

  if (!content.value.trim()) {
    alert('내용을 입력해주세요.')
    return
  }

  if (isSubmitting.value) return

  const boardData = {
    id: reviewId,
    subject: subject.value.trim(),
    content: content.value.trim(),
    rcp_seq: selectedRecipe.value.rcp_seq
  }

  const formData = new FormData()

  formData.append(
    'board',
    new Blob([JSON.stringify(boardData)], {
      type: 'application/json'
    })
  )

  if (imageFile.value) {
    formData.append('file', imageFile.value)
  }

  try {
    isSubmitting.value = true

    await axios.put(
      '/api/review/update',
      formData
    )

    alert('후기가 수정되었습니다.')
    router.push(`/community/reviews/${reviewId}`)
  } catch (error) {
    console.error(error)
    alert('후기 수정에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadReview)

onBeforeUnmount(() => {
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
})
</script>

<style scoped>
.community-page {
  padding-block: var(--space-6);
}

.write-section {
  margin-top: var(--space-5);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--weight-medium);
}

.recipe-select {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  border: 1px dashed var(--border);
  cursor: pointer;
}

.recipe-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3);
}

.recipe-selected__info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.recipe-selected__thumb {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.image-upload {
  display: flex;
}

.image-upload__button,
.image-preview {
  width: 120px;
  height: 120px;
}

.image-upload__button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border);
  cursor: pointer;
}

.file-input-hidden {
  display: none;
}

.image-preview {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview__remove {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--surface-inverse);
  color: var(--text-on-inverse);
  border: 0;
  border-radius: var(--radius-pill);
}

.write-textarea {
  height: auto;
  min-height: 200px;
  padding-block: var(--space-3);
  resize: vertical;
}
</style>