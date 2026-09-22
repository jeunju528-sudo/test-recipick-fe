<template>
  <AdminPanel>
    <div class="clist__head">
      <p class="clist__caption">이달의 제철 음식 큐레이션</p>
      <RouterLink to="/admin/curations/new" class="btn btn--primary"> + 등록 </RouterLink>
    </div>

    <table class="clist__table">
      <thead>
        <tr>
          <th class="clist__col-no">번호</th>
          <th class="clist__col-title">제목</th>
          <th class="clist__col-ym">재료</th>
          <th class="clist__col-date">년/월</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in curations" :key="item.id" class="clist__row" @click="goDetail(item.id)">
          <td>{{ item.rn }}</td>
          <td class="clist__title">{{ item.title }}</td>
          <td>{{ item.incredient_list }}</td>
          <td>{{ item.targetday }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <Pagination
      class="list__pagination"
      :curpage="page.curpage"
      :startpage="page.startpage"
      :endpage="page.endpage"
      :totalpage="page.totalpage"
      @change="loadCuration"
    />

  </AdminPanel>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import Pagination from '@/components/common/Pagination.vue'

const router = useRouter()

function goDetail(id) {
  // 서버에 요청을 보내는 것이 아니라 router/index.js로 가서 찾음
  // router에는 /admin/curations/:id 로 되어있음
  router.push(`/admin/curations/${id}`)
}

const curations = ref([])

const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

async function loadCuration(pageInfo) {
  try {
    const res = await axios.get('/api/admin/curation', {
      params:{
        page:pageInfo
      }
    })
    curations.value=res.data.list
    page.value={
      curpage:res.data.curpage,
      startpage:res.data.startpage,
      endpage:res.data.endpage,
      totalpage:res.data.totalpage,
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(()=>{
  loadCuration(1)
})

</script>

<style scoped>
.clist__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.clist__caption {
  font-weight: var(--weight-medium);
}

/* 테이블 */
.clist__table {
  width: 100%;
  border-collapse: collapse;
  border-top: 1px solid var(--border-strong);
}
.clist__table th {
  padding: var(--space-3) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border);
}
.clist__table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}
.clist__col-no {
  width: 50px;
}
.clist__col-title {
  width: 300px;
}
.clist__col-ym {
  width: 130px;
}
.clist__col-date {
  width: 80px;
}

.clist__row {
  cursor: pointer;
  text-align: center;
  transition: background var(--dur-fast) var(--ease);
}
.clist__row:hover {
  background: var(--surface-sunken);
}
.clist__title {
  font-weight: var(--weight-bold);
  text-align: left;
  color: var(--accent);
}

/* 페이지네이션 여백 */
.list__pagination { margin-top: var(--space-6); }

</style>