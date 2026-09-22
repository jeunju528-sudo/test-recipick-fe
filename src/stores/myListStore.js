import { defineStore } from 'pinia'
import axios from 'axios'

export const myListStore = defineStore('myList', {
  state: () => ({
    myLikeList: [],
    myMarkList: [],
    curpage: 1,
    totalpage: 0,
    startPage: 0,
    endPage: 0,
  }),
  actions: {
    async myListData(page, type) {
      const res = await axios.get('/api/recipe/my-list', {
        params: {
          user_id: 2,
          page: page,
          type: type, //'like' , 'mark'
        },
        withCredentials: true,
      })
      console.log(res.data)
      this.myLikeList = res.data.myLikeList
      this.myMarkList = res.data.myMarkList
      this.curpage = res.data.curpage
      this.totalpage = res.data.totalpage
      this.startPage = res.data.startPage
      this.endPage = res.data.endPage
    },
  },
})
