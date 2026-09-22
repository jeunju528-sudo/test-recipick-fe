<template>
  <AdminPanel>
    <p class="mlist__caption">회원관리</p>

    <table class="mlist__table">
      <thead>
        <tr>
          <th style="width: 15%;">회원아이디</th>
          <th style="width: 20%;">회원닉네임</th>
          <th style="width: 35%;" class="mlist__col-date">가입일</th>
          <th style="width: 15%" class="mlist__col-select">회원상태</th>
          <th style="width: 15%;" class="mlist__col-select">권한</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in members" :key="member.id">
          <td style="width: 15%;" class="mlist__name">{{ member.id }}</td>
          <td style="width: 20%;" class="text-secondary">{{ member.nickname }}</td>
          <td style="width: 35%;" class="text-secondary">{{ member.created_at }}</td>

          <td style="width: 15%;">
            <select
              v-model="member.status"
              class="cell-select"
              :class="statusClass(member.status)"
              :disabled="member.saving || member.status === 'DELETE'"
              @change="updateStatus(member)"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </td>

          <!-- :disabled : member.saving 값이 true일때 selectbox dropdown을 잠굼 -->
          <td style="width: 15%;">
            <select
              v-model="member.role"
              class="cell-select"
              :class="{ 'cell-select--accent': member.role === 'ADMIN' }"
              :disabled="member.saving || member.status === 'DELETE' || member.status == 'WITHDRAWN'"
              @change="updateRole(member)"
            >
              <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </td>
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
      @change="loadMembers"
    />
  </AdminPanel>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import Pagination from '@/components/common/Pagination.vue'
import axios from 'axios'

// ref 로 감싸기 때문에 값이 변하는 것을 캐치할 수 있는 것
const members = ref([]) 

const page = ref({
  curpage: 1,
  startpage: 1,
  endpage: 1,
  totalpage: 1,
})

async function loadMembers(pageInfo) {
  const res = await axios.get('/api/admin/user',{
    params:{
      page:pageInfo
    }
  })

  members.value = res.data.list
  page.value = {
     curpage: res.data.curpage,
     startpage: res.data.startpage,
     endpage: res.data.endpage,
     totalpage: res.data.totalpage,
  }
}

// 화면 처음 뜰 때 1페이지 조회
onMounted(() => {
  loadMembers(1)
})
/* 
  • ACTIVE: 활동중 (정상)
  • WITHDRAWN: 탈퇴처리중 (소프트 탈퇴)
  • DELETE: 탈퇴완료 (하드 탈퇴)
*/
const statusOptions = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'WITHDRAWN', label: '정지' },
  { value: 'DELETE', label: '탈퇴' },
]
const roleOptions = [
  { value: 'USER', label: '일반' },
  { value: 'ADMIN', label: '관리자' },
]

function statusClass(status) {
  return {
    'cell-select--danger': status === 'SUSPENDED',
    'cell-select--muted': status === 'WITHDRAWN' || status === 'DELETE',
  }
}

async function updateStatus(member) {
  /* updateStatus 함수가 불리기 전 member.saving은 undefined으로 나와서 처음엔 false 값이 됨 */
  member.saving = true
  try {
    await axios.put('/api/admin/user/status',
      {
        id:member.id,
        status:member.status
      }
    )
    const label = statusOptions.find(opt => opt.value === member.status)?.label
    alert(label+" 처리 되었습니다.")
  } finally {
    member.saving = false
  }
}

async function updateRole(member) {
  const prevRole = member.role
  member.saving = true
  try {
    await axios.put('/api/admin/user/role', {
      id: member.id,
      role: member.role,
    })
    alert("권한 변경되었습니다.")
  } catch (e) {
    alert('권한 변경에 실패했습니다. 다시 시도해 주세요.')
    member.role = prevRole
    console.error(e)
  } finally {
    member.saving = false
  }
}

</script>

<style scoped>
.mlist__caption {
  font-weight: var(--weight-medium);
  margin-bottom: var(--space-4);
}

.mlist__table {
  width: 100%;
  border-collapse: collapse;
  border-top: 1px solid var(--border-strong);
  text-align: center;
}
.mlist__table th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border);
}
.mlist__table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.mlist__name { font-weight: var(--weight-medium);}
.mlist__col-date { width: 130px; }
.mlist__col-select { width: 120px; }

.cell-select {
  width: 100%;
  height: 34px;
  padding: 0 var(--space-2);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease);
}
.cell-select:hover { border-color: var(--border-strong); }
.cell-select:focus {
  outline: none;
  border-color: var(--accent);
}
.cell-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cell-select--accent { color: var(--accent-text); font-weight: var(--weight-medium); }
.cell-select--danger { color: var(--danger); }
.cell-select--muted { color: var(--text-muted); }

/* 페이지네이션 여백 */
.list__pagination { margin-top: var(--space-6); }

@media (max-width: 768px) {
  .mlist__table { display: block; overflow-x: auto; white-space: nowrap; }
}
</style>