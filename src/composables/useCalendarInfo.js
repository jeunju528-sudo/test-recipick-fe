import {ref} from "vue";
import axios from "axios";

const API_BASE = "/api";

export function useCalendarInfo(userId,year,month){
    const info = ref(null);
    // calendar/info 담는 자리
    const loading = ref(false);

    const errorMsg = ref("");

    async function loadSummary() {
    loading.value = true; // 로딩 시작
    errorMsg.value = ""; //에러 초기화
    try {
      // Authorization 헤더는 axios 인터셉터가 자동 첨부
      const res = await axios.get(`${API_BASE}/calendar/info`, {
        params: {
          year: year.value, // 백앤드에서 YYYY로 비교하니까 그대로
          month: String(month.value).padStart(2, "0"),
          // 백엔드가 MM 2자리로 비교하니까 9월이면 09로 맞춰줘야 함
        },
      });

      info.value = res.data;// 서버가 보내준 정보를 info에 저장
    } catch (e) {
      errorMsg.value = "요약 정보를 불러오지 못했습니다.";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
    return {info,loading,errorMsg , loadSummary}
}