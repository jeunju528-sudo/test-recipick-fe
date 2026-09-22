// 식단 캘린더 데이터 fetch + 월 이동 + 날짜별 매핑 + 배치(upsert) 로직
import { ref, computed } from "vue";
import axios from "axios";
// ref = 값 하나 반응형
// computed = 다른 반응형 값을 가지고 계산된값 자동 생성
const API_BASE = "/api";

// 캘린더 고정값들
const MEAL_TYPES = ["아침", "점심", "저녁"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

//export 해서 다른 .vue에서 import 가능하게 해둠
export function useCalendarItems(userId) { // userId로 받는 이유 : 유저아이디를 알아야 달력을 뿌리기 때문
  // 오늘의 날짜 구하기 
  // 페이지를 열때 오늘 날짜 기준으로 달력 출력
  const today = new Date();
  const year = ref(today.getFullYear());
  const month = ref(today.getMonth() + 1);

  const items = ref([]); // 삭단 목록는 담는 배열
  const loading = ref(false); //
  const errorMsg = ref("");
  // 로딩 및 에러 값

  const itemMap = computed(() => { // item 배열 찾기 쉽게 바꿈
    const map = {};
    for (const it of items.value) {
      const dateOnly = String(it.meal_date).slice(0, 10); //"2026-01-01"로 자르기
      const key = `${dateOnly}_${it.meal_type}`; // "2026-01-01_아침" 이런식으로 키 만들기
      map[key] = it;
    }
    return map;
  });

  const calendarCells = computed(() => { // 달력 값 계산
    const firstDay = new Date(year.value, month.value - 1, 1); // 1일의 요일 구하기
    const lastDay = new Date(year.value, month.value, 0); // 다음달의 0일째를 구하면 이번달 마지막날이 나옴
    const startWeekday = firstDay.getDay(); // 1일이 무슨 요일인지 숫자로 출력(0=일~6=토)
    const totalDays = lastDay.getDate(); // 이번달의 총 일수

    // 달력 배열 채우기
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ empty: true }); // 1일 앞의 빈간 채우기

    for (let d = 1; d <= totalDays; d++) {  // 1부터 마지막날 까지 각 날짜마다 cells에 객체를 만들고 넣음
      const dateStr = `${year.value}-${String(month.value).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        empty: false,
        day: d,
        dateStr,
        meals: MEAL_TYPES.map((type) => ({
          type,
          data: itemMap.value[`${dateStr}_${type}`] || null,
        })),
      });
    }
    return cells;
  });

  // 서버에서 이번달 식단 목록 가져오기
  async function loadCalendar() {
    loading.value = true; // 시작과 동시에 로딩
    errorMsg.value = ""; // 에러메세지는 지움
    try {
      // Authorization 헤더는 axios 인터셉터가 자동 첨부
      const res = await axios.get(`${API_BASE}/calendar/list`, {
        params: {
          year: year.value,  // 년도 가져오기
          month: String(month.value).padStart(2, "0"), // 백앤드에서 월을 09 두자리기 때문에 2자리로 설정
        },
      });
      items.value = res.data; // 성공시 저장
    } catch (e) {
      errorMsg.value = "캘린더를 불러오지 못했습니다.";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  // 드래그 배치 -> 슬롯에 레시피 저장 (upsert)
  // 추가가 아니라 POST로 처리
  async function placeRecipe(dateStr, mealType, recipe) { // 드래그시 호출 함수 
    try {
      // Authorization 헤더는 axios 인터셉터가 자동 첨부
      await axios.post(`${API_BASE}/calendar/item`, {
        meal_date: dateStr,
        meal_type: mealType,
        rcp_seq: recipe.rcp_seq,
      });

      // 기존에 같은 슬롯에 있던 항목 찾기 (upsert였으니 있을 수도, 없을 수도)
      const idx = items.value.findIndex( // 같으면 첫 원소의 인덱스 값 반환
        (it) => String(it.meal_date).slice(0, 10) === dateStr // 날짜가 같은지
        && it.meal_type === mealType // 타입이 같은지
      );
      const newItem = { // 새 값을 생성
        meal_date: dateStr,
        meal_type: mealType,
        rcp_seq: recipe.rcp_seq,
        rcp_nm: recipe.rcp_nm,
        att_file_no_main: recipe.att_file_no_main,
        user_id: userId.value ?? userId,
      };

      if (idx >= 0) {
        items.value[idx] = newItem;  // 이미 있던 슬롯이면 교체
      } else {
        items.value.push(newItem);   // 없던 슬롯이면 새로 추가
      }
    } catch (e) {
      errorMsg.value = "레시피 배치에 실패했습니다.";
      console.error(e);
    }
  }
  // 슬롯의 레시피 삭제
  async function deleteItem(dateStr, mealType){
    try {
      // Authorization 헤더는 axios 인터셉터가 자동 첨부
      await axios.delete(`${API_BASE}/calendar/item`, {
        params: { // 필요한 params들
          meal_date: dateStr,
          meal_type: mealType,
        },
      });

      // 전체 재조회 대신, 로컬 배열에서 해당 슬롯만 제거
      items.value = items.value.filter( // 조건히 true인것만 모아 새 배열 생성
        (it) => !(String(it.meal_date).slice(0, 10) === dateStr // 문자열 자르고 삭제하는 날짜 dateStr과 같은지
        && it.meal_type === mealType) // 그리고 끼니도 내가 삭제하려는 타입과 같은지
      );// !로 이 반대의 것들만 그니까 지우려는 슬롯이 나닌것들만 남겨서 새 배열 생성
    }catch (e){
      errorMsg.value="레시피 삭제 실패";
      console.error(e);
    }
  }

  // 이전달 이동 로직
  function prevMonth() {
    if (month.value === 1) { month.value = 12; year.value -= 1; } // 만약 12월이면 1월로 바꾸고 년도 -1
    else month.value -= 1;
    loadCalendar();
  }
  // 다음달 이동 로직
  function nextMonth() {
    if (month.value === 12) { month.value = 1; year.value += 1; } // 이전달 이동 로직과 반대
    else month.value += 1;
    loadCalendar();
  }

  return {
    year, month, items, loading, errorMsg,
    calendarCells, loadCalendar, placeRecipe, prevMonth, nextMonth, WEEKDAYS, deleteItem
  };
}