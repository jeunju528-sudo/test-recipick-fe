<template>
  <div class="container community-page">
    <h2>후기 작성</h2>

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

          <div>
            <h4>{{ selectedRecipe.rcp_nm }}</h4>
          </div>
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
          <img :src="imagePreview" alt="업로드 이미지 미리보기" />

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
      <div class="label-group">
        <label for="subject" class="form-label">제목</label>
      </div>

      <input
        id="subject"
        v-model="subject"
        type="text"
        class="input"
        placeholder="후기 제목을 입력해주세요."
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
        placeholder="레시피를 만들어본 후기를 작성해주세요."
      ></textarea>
    </section>

    <div class="write-section">
      <button
        type="button"
        class="btn btn--primary btn--block"
        :disabled="isSubmitting"
        @click="submitReview"
      >
        {{ isSubmitting ? '등록 중...' : '후기 등록' }}
      </button>
    </div>

    <ReviewRecipeSelect
      v-if="showRecipeModal"
      @select="selectRecipe"
      @close="closeRecipeModal"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import axios from 'axios'
import ReviewRecipeSelect from '@/components/review/ReviewRecipeSelect.vue'

const router = useRouter()
const route = useRoute()
//레시피 상세보기에서 넘어올 시
const rcp_seq = route.query.rcp_seq

const loadRecipe = async () => {
  if(!rcp_seq)
  {
    return
  } 
  const res = await axios.get(
    '/api/recipe/detail',
    {
      params: {
        rcp_seq: rcp_seq
      }
    }
  )
  selectRecipe(res.data.recipeData)
} 
onMounted(() => {
  loadRecipe()
})
const showRecipeModal = ref(false)
const selectedRecipe = ref(null)

const subject = ref('')
const content = ref('')

const imageFile = ref(null)
const imagePreview = ref(null)
const isSubmitting = ref(false)

const MAX_IMAGE_SIZE = 8 * 1024 * 1024

const openRecipeModal = () => {
  showRecipeModal.value = true
}

const closeRecipeModal = () => {
  showRecipeModal.value = false
}

const selectRecipe = (recipe) => {
  selectedRecipe.value = recipe
  closeRecipeModal()
}

const handleImageChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.')
    event.target.value = ''
    return
  }

  if (file.size > MAX_IMAGE_SIZE) {
    alert('이미지는 8MB 이하만 업로드할 수 있습니다.')
    event.target.value = ''
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

const submitReview = async () => {
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

    await axios.post(
      '/api/review/insert',
      formData
    )

    alert('후기가 등록되었습니다.')
    router.push('/community/reviews')
  } catch (error) {
    console.error(error)
    alert('후기 등록에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  if (imagePreview.value) {
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

.label-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
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