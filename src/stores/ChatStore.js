import { defineStore } from 'pinia'
import axios from 'axios'

export const chatStore = defineStore('chat', {
  state: () => ({
    room_id: 0,
    roomList: [],
    messageList: []
  }),
  actions: {
    async chatRoomCrerate(id, no) {
      const res = await axios.get('/api/chat/create', {
        params: {
          user_id2: id,
          recipe_id: no,
        },
        withCredentials: true,
      })
      this.room_id = res.data.vo.room_id
    },

    async chatRoomList() {
      const res = await axios.get('/api/chat/room_list', {
        params: {},
        withCredentials: true,
      })
      this.roomList = res.data.roomList
    },

    async chatMessageList(no) {
      const res = await axios.get('/api/chat/message_list', {
        params: {
          room_id: no,
        },
        withCredentials: true,
      })
      this.messageList = res.data.messageList
    },
  },
})
