// composables/useRecipeSearch.js
import { ref } from "vue";
import axios from "axios";
const API_BASE = "/api";

export function useRecipeSearch(userId) { // 어디서든 임포트 가능하게 설정
  const keyword = ref("");  // 검색창에 입력 텍스트
  const results = ref([]);  // 검색창 결과 배열
  const loading = ref(false); // 로딩상태
  const errorMsg = ref(""); // 에러메세지

  // 검색 버튼 클릭시 사용 함수
  async function search() {
    loading.value = true; // 바로 로딩
    errorMsg.value = ""; // 에러 초기화
    try {
        // 서버요청 (Authorization 헤더는 axios 인터셉터가 자동 첨부)
        const res = await axios.get(`${API_BASE}/recipe/search`, {
            params: { keyword: keyword.value }, // 검색창 입력 텍스트
        });

        results.value = res.data; // json 값으로 변환해서 저장
    }catch(e){
        errorMsg.value = `검색 실패: ${e.response?.status ?? e.message}`;
        results.value = [];
    }finally{
        loading.value = false;
    }
}

  return { keyword, results, loading, errorMsg, search };
}