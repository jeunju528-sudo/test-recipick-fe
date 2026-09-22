<template>
  <AdminPanel>
    <!-- 제목 + 액션 -->
    <p v-if="loading" class="text-muted">불러오는 중입니다…</p>
    <template v-else>
      <div class="cdetail__head">
        <div>
          <h1 class="cdetail__title">{{ curation.title }}</h1>
          <p class="cdetail__meta text-secondary">
            {{ curation.targetday }} · 등록일 {{ curation.created_at }}
          </p>
        </div>
        <div class="cdetail__actions">
          <RouterLink :to="`/admin/curations/${curation.id}/edit`" class="btn btn--outline">
            수정
          </RouterLink>
          <button class="btn btn--outline" @click="handleDelete(curation.id)">삭제</button>
        </div>
      </div>

      <!-- 재료 칩 -->
      <div class="cdetail__chips">
        <span v-for="ing in curation.group" :key="ing.ingredient_id" class="chip chip--accent">
          {{ ing.ingredient_name }}
        </span>
      </div>

      <!-- 재료별 그룹 -->
      <div class="cdetail__groups">
        <CurationGroup
          v-for="ing in curation.group"
          :key="ing.ingredient_id"
          :ingredient="ing.ingredient_name"
          :recipes="ing.recipes"
        />
      </div>
    </template>
  </AdminPanel>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios';
import AdminPanel from '@/components/admin/AdminPanel.vue'
import CurationGroup from '@/components/common/CurationGroup.vue'

const route = useRoute()   // 현재 URL 정보 읽을 때 사용
const router = useRouter() // 화면 이동시킬 때 사용

const curation = ref({
  title: '',
  targetday: '',
  created_at: '',
  id: 0,
  group: [],        // v-for 도는 배열은 빈 배열로 초기화
})

const loading = ref(true)   // 추가: 초기값 true

async function loadDetailCuration(id){
  // url에 값을 그냥 붙여서 보낼 때는 백틱(`) 을 붙여야하고 "" 로 감싸면 그냥 문자열이라 안된다
  try {
    const res = await axios.get(`/api/admin/curation/${id}`)
    curation.value = res.data
  } catch (error) {
    console.error('상세보기 조회 실패',error)
  } finally {
    loading.value = false
  }
  
}

onMounted(()=>{
  const id = route.params.id // url에서 id 꺼낼 때 사용
  loadDetailCuration(id)
})

// await는 async 안에서만 쓸 수 있기 때문에 async 선언해줘야함
async function handleDelete(id) {

  if (!confirm('정말 삭제하시겠습니까?')) {
    return 
  }
  // axios는 결과가 즉시 오지 않는 비동기 작업이라, await 없이는 데이터가 도착하기 전에 다음 줄이 실행되어버림!
  try {
    await axios.delete(`/api/admin/curation/${id}`)
    router.push(`/admin/curations`)
  } catch (error) {
    console.error('삭제 처리 실패', error)
  } 
}

</script>

<style scoped>
.cdetail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.cdetail__title {
  font-size: var(--text-lg);
  margin-bottom: var(--space-1);
}
.cdetail__meta {
  font-size: var(--text-sm);
}
.cdetail__actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.cdetail__chips {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.cdetail__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
</style>