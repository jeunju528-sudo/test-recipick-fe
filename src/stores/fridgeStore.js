import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useFridgeStore = defineStore('fridge', () => {
  // ── state ──
  const ingredients = ref([])
  const myFridgeIds = ref([])
  const myFridgeData = ref([])
  const recipes = ref([])
  const totalCount = ref(0)
  const loading = ref(false)
  const recipeDetail = ref([])
  const extraIngredients = ref([])
  

  // ── getters ──
  const myIngredients = computed(() => myFridgeData.value)
  const myIngredientNames = computed(() =>
    myIngredients.value.map((r) => r.ingredient?.ingredient_name).filter(Boolean)
  )

  // ── actions ──

  async function searchIngredients(keyword) {
    const res = await axios.get('/api/ingredients/list', {
      params: { keyword }
    })
    ingredients.value = res.data
  }

  function clearMatches() {
  recipes.value = []
  totalCount.value = 0
}

  // 추가 재료 검색 (새 action, 별도 state에 저장)
  async function searchExtraIngredients(keyword) {
    const res = await axios.get('/api/ingredients/list', {
      params: { keyword }
    })
    extraIngredients.value = res.data
  }

  async function loadMyFridge(user_id) {
    const res = await axios.get('/api/refrige/fridgedata', {
      params: { user_id }
    })
    myFridgeData.value = res.data
    myFridgeIds.value = res.data.map((r) => r.ingredient_id)
  }

  async function saveFridge(volist) {
    await axios.post('/api/refrige/register', volist)
  }

  async function loadMatches(ingredientNames, sort = 'match') {
    loading.value = true
    try {
      const response = await axios.post('/api/refrige/recommand', {      
        ingredients: ingredientNames,
        sort: sort,      
      })

      if (response.data.success) {
         console.log('원본 응답 recipes[0]:', response.data.recipes[0])
        recipes.value = response.data.recipes.map((r) => {
          const haveList = r.haveIngredients || []
          const missList = r.missingIngredients || []
          const total = haveList.length + missList.length

          return {
          id: r.id,
          recipeId: r.recipe_id,
          title: r.recipeName,
          similarity: r.similarity ? Math.round(r.similarity * 100) : 0,
          tip: r.tip || '',
          chef: r.foodType || '',
          image: r.recipeImage,
          matchCount: haveList.length,
          totalCount: total,
          ingredients: [
            ...haveList.map((name) => ({ name, have: true })),
            ...missList.map((name) => ({ name, have: false }))
          ]     
          }
        })
        totalCount.value = recipes.value.length
      } else {
        recipes.value = []
        totalCount.value = 0
      }
    } catch (error) {
      console.error('레시피 매칭 실패:', error)
      recipes.value = []
      totalCount.value = 0
    } finally {
      loading.value = false
    }
  }

  async function loadRecipeDetail(rcp_seq) {
    console.log('스토어로 들어온 rcp_seq:', rcp_seq); // 값이 출력되는지 확인!
  if (!rcp_seq) return;
  const res = await axios.get(`/api/refrige/recipe/${rcp_seq}`)
  recipeDetail.value = res.data
}

  return {
    ingredients, myFridgeIds, recipes, totalCount, loading,
    myIngredients, myIngredientNames, myFridgeData,
    searchIngredients, loadMyFridge, saveFridge, loadMatches,loadRecipeDetail,recipeDetail,searchExtraIngredients,extraIngredients,clearMatches
  }
})