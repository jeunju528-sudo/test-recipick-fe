<template>

  <div class="new-recipe-view">
    <h2 class="page-title">{{ isEdit ? '레시피 수정' : '레시피 등록' }}</h2>

    <!--@keydown.enter => 상위 폼태그에 엔터 키 눌렀을 시 등록되는 상황 한번에 방지 기능 추가 -->
    <form class="recipe-form" @submit.prevent="handleSubmit" @keydown.enter="blockEnter">
      <!-- 레시피 제목 -->
      <div class="form-row">
        <label for="rcp_nm">레시피 제목</label>
        <input id="rcp_nm" v-model="form.rcp_nm" type="text" required/>
      </div>

      <!-- 조리방법 -->
      <div class="form-row">
        <label for="rcp_way2">조리방법</label>
        <select id="rcp_way2" v-model="form.rcp_way2" required>
          <option value="" disabled>선택하세요</option>
          <option v-for="way in wayOptions" :key="way" :value="way">{{ way }}</option>
        </select>
      </div>

      <!-- 요리종류 -->
      <div class="form-row">
        <label for="rcp_pat2">요리종류</label>
        <select id="rcp_pat2" v-model="form.rcp_pat2" required>
          <option value="" disabled>선택하세요</option>
          <option v-for="pat in patOptions" :key="pat" :value="pat">{{ pat }}</option>
        </select>
      </div>

      <!-- 기준 인원 -->
      <div class="form-row">
        <label for="info_wgt">기준 인원 / 중량</label>
        <input id="info_wgt" v-model="form.info_wgt" type="text" placeholder="예: 2인분 또는 250g" required />
      </div>

      <!-- 영양정보 (선택사항) -->
      <div class="form-row">
        <label>영양정보 (선택, 1인분 기준)</label>
        <div class="nutrition-inputs">
          <div class="nutrition-item">
            <span>칼로리(kcal)</span>
            <input v-model="form.info_eng" type="number" step="0.1" placeholder="0" />
          </div>
          <div class="nutrition-item">
            <span>탄수화물(g)</span>
            <input v-model="form.info_car" type="number" step="0.1" placeholder="0" />
          </div>
          <div class="nutrition-item">
            <span>단백질(g)</span>
            <input v-model="form.info_pro" type="number" step="0.1" placeholder="0" />
          </div>
          <div class="nutrition-item">
            <span>지방(g)</span>
            <input v-model="form.info_fat" type="number" step="0.1" placeholder="0" />
          </div>
          <div class="nutrition-item">
            <span>나트륨(mg)</span>
            <input v-model="form.info_na" type="number" step="0.1" placeholder="0" />
          </div>
        </div>
      </div>

      <!-- 해시태그 (최대 5개) -->
      <div class="form-row">
        <label>해시태그 (최대 5개)</label>
        <div class="tag-inputs">
          <div v-for="(tag, idx) in hashTagInputs"
            :key="idx" class="tag-input-row">
          <input
            v-model="hashTagInputs[idx]"
            type="text"
            placeholder="#태그"
            class="tag-input"
          />
           <button type="button" class="btn-small btn-danger" @click="removeHashTagInput(idx)">
            🗑️
           </button>
         </div>
       </div>  
        <button
          type="button"
          class="btn-small"
          @click="addHashTagInput"
          :disabled="hashTagInputs.length >= 5"
        >
          + 태그 추가
        </button>
      </div>

      <!-- 대표 이미지: 실제 파일 선택 -->
      <div class="form-row">
        <label for="att_file_no_main">대표 이미지</label>
        <input
          id="att_file_no_main"
          type="file"
          accept="image/*"
          @change="onMainImageChange"
        />
        <img v-if="mainImagePreview" :src="mainImagePreview" class="preview-img" />
      </div>

      <!-- 재료 -->
      <div class="form-row">
        <label>재료</label>
        <div v-for="(ing, idx) in ingredientInputs" :key="idx" class="ingredient-inputs">
           <!--  ing => v-for="(ing, idx) in ingredientInputs" -->        
          <input v-model="ing.name" type="text" placeholder="예: 김치 또는 양파"  class="ingredient-input"/>
          <input v-model="ing.amount" type="text" placeholder="예: 200 또는 1"  class="ingredient-input"/>
          <input v-model="ing.unit" type="text" placeholder="예: g 또는 개" class="ingredient-input"/>  
          <button type="button" class="btn-small btn-danger" @click="removeIngredientlStep(idx)">
           🗑️
          </button>
        </div>
        <button type="button" class="btn-small" @click="addIngredientInput">
          + 재료 추가
        </button>
      </div>

      <!-- 나트륨 저감 TIP (선택) -->
      <div class="form-row">
        <label for="rcp_na_tip">저감 조리법 TIP (선택)</label>
        <textarea id="rcp_na_tip" v-model="form.rcp_na_tip" rows="2"></textarea>
      </div>

      <!-- 조리순서: 설명 + 이미지 파일 -->
      <div class="form-row">
        <label>조리순서</label>
        <div v-for="(step, idx) in manualList" :key="idx" class="manual-step">
          <span class="step-no">{{ idx + 1 }}단계</span>
          <textarea
            v-model="step.desc"
            rows="2"
            placeholder="조리순서 설명"
          ></textarea>
          <!-- 수정 모드에서 기존 이미지가 있으면 미리보기로 표시 -->
          <img v-if="step.existingImg && !step.imageFile" :src="step.existingImg" class="preview-img" />
          <input
            type="file"
            accept="image/*"
            @change="(e) => onManualImageChange(e, idx)"
          />
          <button type="button" class="btn-small btn-danger" @click="removeManualStep(idx)">
            삭제
          </button>
        </div>
        <button type="button" class="btn-small" @click="addManualStep">
          + 순서 추가
        </button>
      </div>

      <button type="submit" class="btn-submit" :disabled="submitting">
        {{ submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '레시피 수정' : '레시피 등록') }}
      </button>
    </form>
  </div>
</template>

<script setup>
// 다른 파일에 있는 것을 가져올 때 
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { recipeDetailStore } from '@/stores/recipeDetailStore'
import { storeToRefs } from 'pinia'
import { getImageUrl } from '@/utils/image'


const router = useRouter()
const route = useRoute()



// route에 :id가 있으면 수정 모드, 없으면 등록 모드
const isEdit = computed(() => !!route.params.id)
const rcpSeq = computed(() => route.params.id)

// 상세조회 스토어 (수정 모드일 때 기존 데이터 불러오는 용도로 재사용)
const detailStore = recipeDetailStore()
const { recipeData, manualList: detailManualList } = storeToRefs(detailStore)

const wayOptions = ['끓이기', '찜', '볶기', '굽기', '무침', '찌기', '튀기기', '기타']
const patOptions = ['국&찌개', '반찬', '후식', '일품', '밥', '기타']

// form : 텍스트 + 영양정보 필드들 모아둔 그릇
// 영양정보는 선택사항이라 빈 문자열로 시작 (입력 안 하면 서버에서 0으로 처리됨)
const form = reactive({
  rcp_nm: '',
  rcp_way2: '',
  rcp_pat2: '',
  info_wgt: '',
  rcp_na_tip: '',
  info_eng: '',
  info_car: '',
  info_pro: '',
  info_fat: '',
  info_na: ''
})

const hashTagInputs = ref([''])
function removeHashTagInput(idx) {
  hashTagInputs.value.splice(idx,1)
}
function addHashTagInput() {
  if (hashTagInputs.value.length < 5) hashTagInputs.value.push('')
}
// 재료 리스트 
const ingredientInputs = ref([{name:'', amount:'',unit:''}])
function addIngredientInput() {
  ingredientInputs.value.push({name:'', amount:'',unit:''})
}

const mainImageFile = ref(null)
const mainImagePreview = ref('')

function onMainImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  mainImageFile.value = file
  mainImagePreview.value = URL.createObjectURL(file)
}

// manualList 각 항목: desc(설명), imageFile(새로 고른 파일), existingImg(기존 이미지 경로, 수정모드용)
const manualList = ref([{ desc: '', imageFile: null, existingImg: '' }])

function addManualStep() {
  manualList.value.push({ desc: '', imageFile: null, existingImg: '' })
}
// 조리단계 삭제
function removeManualStep(idx) {
  manualList.value.splice(idx, 1)
}

// 재료정보 삭제
function removeIngredientlStep(idx) {
  ingredientInputs.value.splice(idx,1) // idx번째 위치에서, 딱 1개만 잘라내
}
function onManualImageChange(e, idx) {
  const file = e.target.files[0]
  if (!file) return
  manualList.value[idx].imageFile = file
}

// 레시피 등록 시 입력칸 엔터로 전송되는 상황 방지
function blockEnter(event){
  if (event.target.tagName ==='INPUT') { // textarea일 땐 막아야 조리순서 적을 때 줄바꿈이 가능해 그래서 INPUT일 때만 적용되게끔 조건을 줌
        event.preventDefault()
  }
}
// 수정 모드일 때, 상세조회 API로 기존 데이터를 불러와서 폼에 채워 넣음
onMounted(async () => {
  if (isEdit.value) {
    await detailStore.recipeDetailData(rcpSeq.value)

    // 1. 텍스트 필드 채우기
    form.rcp_nm = recipeData.value.rcp_nm
    form.rcp_way2 = recipeData.value.rcp_way2
    form.rcp_pat2 = recipeData.value.rcp_pat2
    form.info_wgt = recipeData.value.info_wgt
    form.rcp_na_tip = recipeData.value.rcp_na_tip
    form.info_eng = recipeData.value.info_eng
    form.info_car = recipeData.value.info_car
    form.info_pro = recipeData.value.info_pro
    form.info_fat = recipeData.value.info_fat
    form.info_na = recipeData.value.info_na

    // 2. 해시태그: 콤마 문자열 -> 배열로 쪼개기
    hashTagInputs.value = recipeData.value.hash_tag
      ? recipeData.value.hash_tag.split(',').map(t => t.trim())
      : ['']

    // 3. 재료: 콤마 문자열 -> {name, amount, unit} 객체 배열로 쪼개기
ingredientInputs.value = recipeData.value.rcp_parts_dtls // 재료 입력칸에 디비에서 가져온 재료 텍스트 넣을 준비 
  ? recipeData.value.rcp_parts_dtls.split(',').map(ingredientText => { // ? : 삼항연산자 재료텍스트에 값이 있으면 ,로 나눠서 배열로 만들기, 각 항목 꺼내서  담는 작업 반복
      const cleanText = ingredientText.trim() // 앞뒤 공백제거
      const parsed = cleanText.match(/^(\D+)\s*(\d+\.?\d*)\s*(\S*)$/) // 정규식 => 이름 / 수량 / 단위로 쪼개서 parsed에 담음 패턴 안 맞으면 null
      // parsed[1]=이름, parsed[2]=수량, parsed[3]=단위

      if (parsed) {
        return { name: parsed[1].trim(), amount: parsed[2], unit: parsed[3] }
      }
      // 패턴이 안 맞는 예외적인 경우, 이름 칸에만 원본 텍스트를 넣어둠
      return { name: cleanText, amount: '', unit: '' }
    })
  : [{ name: '', amount: '', unit: '' }]

    // 4. 대표 이미지 미리보기 (파일명을 완전한 URL로 변환해서 표시)
    mainImagePreview.value =  getImageUrl(recipeData.value.att_file_no_main)
    // 5. 조리순서: 스토어의 manualList를 폼에서 쓰는 형태로 변환
    manualList.value = detailManualList.value.map(m => ({
      desc: m.manual_desc,
      imageFile: null,
      existingImg: getImageUrl(m.manual_img)
    }))
  }
})

const submitting = ref(false)

async function handleSubmit() {
  if (!mainImageFile.value && !mainImagePreview.value) {
    alert('대표 이미지를 꼭 등록해주세요.')
    return
  }

   if (manualList.value.length === 0) {
    alert('조리순서를 최소 1단계 이상 추가해주세요.')
    return
  }
  
  const hasEmptyStepImage = manualList.value.some(step => !step.imageFile && !step.existingImg)
  if (hasEmptyStepImage) {
    alert('모든 조리순서 단계에 이미지를 등록해주세요.')
    return
  }

  const hasEmptyStepDesc = manualList.value.some(step => step.desc.trim() === '')
if (hasEmptyStepDesc) {
  alert('모든 조리순서 단계에 설명을 입력해주세요.')
  return
}

  const hashTag = hashTagInputs.value.filter(t => t.trim() !== '').join(',')
  const rcpPartsDtls = ingredientInputs.value.filter(ing => ing.name.trim() !== '').map(ing  => `${ing.name} ${ing.amount}${ing.unit}`).join(',')
  // filter로 걸러낸 결과를 담는 변수 => 이름이 채워진 재료만 담김
 const validIngredients = ingredientInputs.value.filter(ing => ing.name.trim() !== '')

if (validIngredients.length === 0) {
  alert('재료를 최소 1개 이상 입력해주세요.')
  return
}

  const formData = new FormData()
  formData.append('rcp_nm', form.rcp_nm)
  formData.append('rcp_way2', form.rcp_way2)
  formData.append('rcp_pat2', form.rcp_pat2)
  formData.append('info_wgt', form.info_wgt)
  formData.append('hash_tag', hashTag)
  formData.append('rcp_parts_dtls', rcpPartsDtls)
  formData.append('rcp_na_tip', form.rcp_na_tip)

  formData.append('info_eng', form.info_eng)
  formData.append('info_car', form.info_car)
  formData.append('info_pro', form.info_pro)
  formData.append('info_fat', form.info_fat)
  formData.append('info_na', form.info_na)


  if (mainImageFile.value) {
    formData.append('att_file_no_main', mainImageFile.value)
  }

  formData.append('stepCount', manualList.value.length)
  manualList.value.forEach((step, idx) => {
    formData.append(`manual_desc_${idx + 1}`, step.desc)
    if (step.imageFile) {
      formData.append(`manual_img_${idx + 1}`, step.imageFile)
    }
  })

  // 진짜 재료 개수
  formData.append('ingredientCount', validIngredients.length)
  // 각 재료 번호 붙여서 보내기 => 몇변째 재료 정보인지 구분하기 위해 idx
  validIngredients.forEach((ing,idx)=>{

    // 재료 세분화 데이터
    formData.append(`ingredient_name_${idx + 1}`, ing.name)
    formData.append(`ingredient_amount_${idx + 1}`, ing.amount)
    formData.append(`ingredient_unit_${idx + 1}`, ing.unit)
  })

  submitting.value = true
  try {
    if (isEdit.value) {
      // 수정 모드
      formData.append('rcp_seq', rcpSeq.value)
      await axios.post('/api/recipe/update', formData, {
        params: { rcp_seq: rcpSeq.value }
      })
      router.push(`/recipes/${rcpSeq.value}`)
    } else {
      // 등록 모드
      const res = await axios.post('/api/recipe/insert', formData)
      const newRcpSeq = res.data.rcp_seq
      router.push(`/recipes/${newRcpSeq}`)
    }
  } catch (err) {
    console.error(isEdit.value ? '레시피 수정 실패:' : '레시피 등록 실패:', err)
    alert(isEdit.value ? '수정에 실패했습니다. 잠시 후 다시 시도해주세요.' : '등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.new-recipe-view {
  padding: var(--space-6) var(--space-4);
  max-width: 720px;
}
.page-title {
  margin-bottom: var(--space-5);
}
.recipe-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.form-row label {
  font-weight: 600;
}
.form-row input,
.form-row select,
.form-row textarea {
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 6px);
  font: inherit;
}
.nutrition-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-2);
}
.nutrition-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nutrition-item span {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.preview-img {
  margin-top: var(--space-2);
  max-width: 200px;
  border-radius: var(--radius-md, 6px);
}
.tag-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.tag-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.ingredient-inputs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.ingredient-inputs .ingredient-input:first-child {
  flex: 2;
}
.ingredient-inputs .ingredient-input {
  flex: 1;
}
.tag-input {
  width: 120px;
}
.manual-step {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 6px);
  margin-bottom: var(--space-2);
}
.step-no {
  font-weight: 600;
  color: var(--accent);
}
.btn-small {
  align-self: flex-start;
  padding: 4px 10px;
  border: 1px solid var(--border);
  background: var(--surface-sunken);
  border-radius: var(--radius-full, 999px);
  cursor: pointer;
  font-size: var(--text-sm);
}
.btn-danger {
  color: var(--danger, #d9534f);
}
.btn-submit {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--accent, #e5601f);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  cursor: pointer;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
