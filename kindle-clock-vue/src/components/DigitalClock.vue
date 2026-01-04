<template>
  <div class="digital-clock">
    <div class="time">{{ formattedTime }}</div>
    <div class="date">{{ formattedDate }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  time: {
    type: Date,
    required: true
  }
})

const formattedTime = computed(() => {
  const hours = props.time.getHours().toString().padStart(2, '0')
  const minutes = props.time.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const formattedDate = computed(() => {
  const y = props.time.getFullYear()
  const m = props.time.getMonth() + 1
  const d = props.time.getDate()
  const day = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][props.time.getDay()]
  return `${y}年${m}月${d}日 ${day}`
})
</script>

<style scoped>
.digital-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.time {
  font-size: 10rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 2rem;
  font-feature-settings: "tnum"; /* 等宽数字 */
}

.date {
  font-size: 2.5rem;
  font-weight: 400;
}

/* 适配小屏幕 */
@media (max-width: 600px) {
  .time { font-size: 6rem; }
  .date { font-size: 1.5rem; }
}
</style>
