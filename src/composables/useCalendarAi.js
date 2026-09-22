// composables/useCalendarAi.js
import { ref } from "vue";
import axios from "axios";

const API_BASE = "/api";

export function useCalendarAi() {
  const result = ref(null);
  // AI 채우기 결과 (filledCount, filledSlots)

  const loading = ref(false);
  // 요청 진행 중 여부

  const errorMsg = ref("");
  // 에러 메시지

  async function fillEmptySlots(year, month, command) {
    loading.value = true;
    errorMsg.value = "";
    try {
      const res = await axios.post(`${API_BASE}/calendar/ai-fill`, {
        year,
        month,
        command,
      });
      result.value = res.data;
    } catch (e) {
      errorMsg.value = `AI 채우기 실패: ${e.response?.status ?? e.message}`;
    } finally {
      loading.value = false;
    }
  }

  async function rollback() {
    loading.value = true;
    errorMsg.value = "";
    try {
      await axios.post(`${API_BASE}/calendar/ai-fill/rollback`);
      result.value = null;
      // 롤백 성공하면 결과 초기화 (카드가 다시 입력창 상태로 돌아가게)
    } catch (e) {
      errorMsg.value = `롤백 실패: ${e.response?.status ?? e.message}`;
    } finally {
      loading.value = false;
    }
  }
  async function confirm() {
    loading.value = true;
    errorMsg.value="";
    try{
      await axios.post(`${API_BASE}/calendar/ai-fill/confirm`);
      result.value=null;
      // 확정 성공시 프롬프트 입력창으로 
    }catch(e){
      errorMsg.value = `확정 실패: ${e.response?.status ?? e.message}`;
    }finally{
      loading.value=false;
    }
  }
  return { result, loading, errorMsg, fillEmptySlots, rollback,confirm };
}