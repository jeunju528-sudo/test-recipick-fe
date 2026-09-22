<template>

  <ChatButton
    v-if="!isChatOpen"
    @click="connectWebSocket"
  />

  <transition name="chat-slide">
    <ChatPanel
      v-if="isChatOpen"
      @close="isChatOpen = false"
      :client="client"
    />
  </transition>

</template>

<script setup>

import { ref } from 'vue'

import ChatButton from '@/components/chat/ChatButton.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { Client } from '@stomp/stompjs'

const isChatOpen = ref(false)
const client = ref(null)

const connectWebSocket = () => {

  // 이미 연결되어 있으면
  if (client.value?.connected) {
    isChatOpen.value = true
    return
  }

  client.value = new Client({

    brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/chat-ws`,

    reconnectDelay: 5000,

    onConnect: () => {
      console.log('연결')

      // 연결 성공한 다음 채팅창 열기
      isChatOpen.value = true
    },

    onStompError: (frame) => {
      console.error('STOMP ERROR', frame)
    },

    onWebSocketError: (error) => {
      console.error('WebSocket ERROR', error)
    }

  })

  client.value.activate()
}

</script>