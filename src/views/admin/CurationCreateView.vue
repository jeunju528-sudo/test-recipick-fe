<template>
  <AdminPanel>
    <div class="step">
      <div class="step__label"><span class="step__num">1</span> 년 / 월 선택 후 재료 추천</div>
      <div class="step__row">
        <select v-model="form.year" class="input step__select">
          <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
        </select>
        <select v-model="form.month" class="input step__select">
          <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
        </select>
        <button class="btn btn--outline step__ai" :disabled="generating" @click="handleGenerate">
          {{ generating ? '추천 중…' : (suggested.length ? '다시 추천받기' : 'AI로 제철 재료 받기') }}
        </button>
      </div>
    </div>

    <!-- 2. 추천 재료 중 3개 선택 -->
    <div v-if="suggested.length" class="step">
      <div class="step__label"><span class="step__num">2</span> 추천 재료 중 3개 선택</div>
      <div class="chip-select">
        <button
          v-for="ing in suggested"
          :key="ing.id"
          class="chip-select__item"
          :class="{ 'is-selected': selected.includes(ing.id) }"
          :disabled="!selected.includes(ing.id) && selected.length >= 3"
          @click="toggle(ing.id)"
        >
          {{ ing.ingredient_name }}
          <IconX v-if="selected.includes(ing.id)" :size="14" />
        </button>
      </div>
      <p class="step__count text-muted">
        {{ selected.length }} / 3 선택됨
      </p>
    </div>

    <!-- 3. 재료별 조회수 상위 3개 자동 조회 (미리보기) -->
    <div v-if="preview.length" class="step">
      <div class="step__label">
        <span class="step__num">3</span> 재료별 조회수 상위 3개 조회
      </div>

      <div class="step__groups">
        <CurationGroup
          v-for="group in preview"
          :key="group.ingredient_id"
          :ingredient="group.ingredient_name"
          :recipes="group.recipes"
        />
      </div>
    </div>

    <!-- 4. 제목 입력 + 저장 -->
    <div v-if="preview.length" class="step">
      <div class="step__label"><span class="step__num">4</span> 제목</div>
      <input
        v-model.trim="form.title"
        class="input input--white"
        type="text"
        :placeholder="loading ? '제목 추천 중…' : '큐레이션 제목을 입력하세요'"
        :disabled="loading"
      />
      <p v-if="titleError" class="text-muted">
        AI 제목 추천에 실패했습니다. 제목을 직접 입력해주세요.
      </p>
    </div>

    <!-- 하단 버튼 -->
    <div class="ccreate__foot">
      <RouterLink to="/admin/curations" class="btn btn--outline">취소</RouterLink>
      <button class="btn btn--primary" :disabled="!canSave || saving" @click="handleSave">
        {{isEdit ? '수정' : '저장'}}
      </button>
    </div>
  </AdminPanel>
</template>

<script setup>
// toRaw 반응형 프록시 객체를 자바스크립트 배열로 변환할 때 사용 하는 것
// nextTick :: 
import { reactive, ref, computed, watch, toRaw, onMounted, nextTick } from 'vue'
// 화면을 이동할 때 쓰는 것
import { useRouter, useRoute } from 'vue-router'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import CurationGroup from '@/components/common/CurationGroup.vue'
import { IconX } from '@tabler/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const now = new Date()
const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

const form = reactive({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  title: '',
})

const curationId = route.params.id // id가 있으면 수정모드 /curation/4/edit
const isEdit = computed(()=>!!curationId) // 생성/수정 모드, isEdit : true (수정) false(생성)
const isInitializing = ref(false) // 수정 모드에서 recipeTop3/title 추천 API를 또 호출하는 것을 막기위해 사용, 수정모드일 때 true
const titleError = ref(false)   // 제목 추천 실패 여부

const generating = ref(false) // AI 에서 재료 데이터 가져올 때 대기중임을 표시하는 것
const saving = ref(false) // 저장 중인지 확인해주기 위해
const suggested = ref([]) // AI 재료 추천 목록
const selected = ref([])  // 재료 선택 목록
const preview = ref([])   // 재료랑 레시피 미리 보여주기 위한 배열
const loading = ref(false) // 제목 추천 중임을 표시해주기 위해 

const canSave = computed(() => selected.value.length === 3 && form.title && preview.value.length)

onMounted(async () => {
    if(!isEdit.value) return // 생성모드면 아무것도 안함
    isInitializing.value = true
    try {
      const response = await axios.get(`/api/admin/curation/${curationId}`) // 수정할 데이터 가지고 오기
      const data = response.data
      form.title = data.title
      form.year = data.year
      form.month = data.month
      // preview.value = response.data.group
      // forEach : 반환값 없음, 배열을 단순 순회하며 원본 배열에 작업을 하거나 조건을 체크하여 이벤트 발생시킬 때
      // map : 새로운 배열 반환값을 줌
      // (val) => {} : 함수의 코드 블럭 여러줄 실행함, 명시적 반환을 해야함 return 작성, 조건문 변수 선언등 내부 로직 처리가 필요할 때
      // (val) => ({}) :  객체 리터럴 생성, 암묵적 반환 return 안써도 됨, 단순 객체를 반환할 떄
      preview.value = data.group.map((g) => ({
        ingredient_id: g.ingredient_id,
        ingredient_name: g.ingredient_name,
        recipes: g.recipes,
      }))

      // 제안된 재료 목록
      suggested.value = data.group.map((g)=>({
        id: g.ingredient_id,
        ingredient_name: g.ingredient_name
      }))

      // 선택된 재료 목록
      selected.value = data.group.map((g)=> g.ingredient_id)

      await nextTick() // selected 변경으로 예약된 watch가 처리될 때까지 대기

    } catch (error) {
      console.error('조회 실패', error)
    } finally {
      isInitializing.value = false
    }
})


// 1. AI 재료 추천
async function handleGenerate() {

  // 한 번 추천을 받으면 refresh를 true로 
  const isRefresh = suggested.value.length > 0

  generating.value = true
  selected.value = []
  preview.value = []
  try {
    const response = await axios.get('/api/admin/curation/recommend',{
      params:{
        year:form.year,
        month:form.month,
        refresh: isRefresh
      }
    })
    suggested.value = response.data
  } catch(error) {
    const code = error.response?.data?.errorCode
    if (code === 'AI_FAILED') {
      alert('추천 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } else {
      console.error('재료 추천 실패', error)
      alert('재료 추천에 실패했습니다.')
    }
  } finally {
    generating.value = false
  }
}

// 2. 재료 3개 선택
function toggle(ing) {
  const i = selected.value.indexOf(ing)
  if (i >= 0) selected.value.splice(i, 1)
  else if (selected.value.length < 3) selected.value.push(ing)
}

// 3. 3개 선택 완료 시 자동으로 레시피 조회
watch(
  selected,
  async (val) => {

    if(isInitializing.value){ // 초기 상태일 때는 데이터 채우는 거 없이 return
      return
    }

    if (val.length !== 3) { // 재료가 선택이 다 되지 않았을 때
       preview.value = []; 
       return 
    }
      
    const names = val.map((id)=>{
      const found = suggested.value.find((ing) => ing.id === id)
      return found.ingredient_name
    })
    
    const rawArray = toRaw(val);
    
    try {
      const response = await axios.get('/api/admin/curation/recipeTop3',{
        params:{
          ids: rawArray.join(',')
        }
      })
      const data = response.data
      /* 서버에서 넘어오는 데이터 형태가 객체타입인 경우에는 Object.keys(data).map() 으로 써야함 
        Object.keys 는 객체의 키값만 가지고 오는 것임
      */
      // .map() 은 배열타입에서만 쓸 수 있음
      /*
        서버에서 내려오는 타입이 이런식으로 key-value로 써있으면 다 객체타입 {} 로 맨 처음이 감싸져잇음
        { 
          "한식" : [{id:1, title:"비빔밥"},{id:1, title:"비빔밥"}],
          "양식" : [{id:1, title:"비빔밥"}]
        }
        서버에서 내려오는 타입이 [] 이렇게 감싸져있으면 배열타입 그 안에 [{},{}] 객체가 담겼어도 배열타입이라 바로 .map() 쓸 수 있음
      */
      preview.value = Object.keys(data).map((name) => {
        const matched = suggested.value.find((ing) => ing.ingredient_name === name)
        return {
          ingredient_id: matched ? matched.id : null,
          ingredient_name: name,
          recipes: data[name],
        }
      })

      titleError.value = false
      loading.value = true
      try {
        const title = await axios.get('/api/admin/curation/title/recommend',{
          params:{
            month:form.month,
            ids: names.join(',')
          }
        })
        form.title = title.data
      } catch (error) {
        console.error('제목 조회 실패', error)
        titleError.value = true
      } finally {
        loading.value = false
      }

    } catch (error) {
      console.error('레시피 조회 실패', error)
    } 

  },
  { deep: true },
)

// 서버로 보낼 데이터 조립
function buildPayload(){
  const details = []
  let order = 1

  preview.value.forEach((group) => {
    group.recipes.forEach((r) => {
      details.push({
        ingredient_id: group.ingredient_id,
        rcp_seq: r.rcp_seq,
        sort_order: order++,
      })
    })
  })

  return {
    year:form.year,
    month:form.month,
    title:form.title,
    details
  }
}
// 4. 저장
async function handleSave() {

  saving.value = true

  try {
    const payload = buildPayload()
    if(isEdit.value) { // 수정
      await axios.put(`/api/admin/curation/${curationId}`, payload)
    }
    else {
      await axios.post('/api/admin/curation', payload)
    }
    router.push('/admin/curations')
  } catch (error) {
    console.error('저장에 실패하였습니다. 잠시 후 다시 시도해주세요', error)
  } 
  finally {
    saving.value = false
  }
  
}
</script>

<style scoped>
/* 단계 */
.step {
  margin-bottom: var(--space-6);
}
.step__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--weight-bold);
  margin-bottom: var(--space-3);
}
.step__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--text-on-accent);
  font-size: var(--text-xs);
}
.step__row {
  display: flex;
  gap: var(--space-3);
}
.step__select {
  flex: 1;
}
.step__ai {
  flex-shrink: 0;
  white-space: nowrap;
}
.step__count {
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}
.step__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 재료 선택 칩 */
.chip-select {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.chip-select__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  transition:
    border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}
.chip-select__item:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.chip-select__item.is-selected {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-subtle);
}
.chip-select__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 하단 버튼 */
.ccreate__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

.input--white {
  background: var(--surface-card);   /* 항상 흰 배경 */
  border-color: var(--border);       /* 회색 테두리로 형태 유지 */
}
</style>