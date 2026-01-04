<template>
  <div class="analog-clock">
    <svg viewBox="0 0 100 100" class="clock-svg">
      <!-- 表盘外圈 -->
      <circle cx="50" cy="50" r="48" class="face" />
      
      <!-- 刻度 -->
      <line v-for="n in 12" :key="n"
        x1="50" y1="5" x2="50" y2="10"
        class="tick"
        :transform="`rotate(${n * 30} 50 50)`"
      />

      <!-- 时针 -->
      <line x1="50" y1="50" x2="50" y2="25"
        class="hand hour"
        :transform="`rotate(${hourRotation} 50 50)`"
      />

      <!-- 分针 -->
      <line x1="50" y1="50" x2="50" y2="10"
        class="hand minute"
        :transform="`rotate(${minuteRotation} 50 50)`"
      />

      <!-- 中心点 -->
      <circle cx="50" cy="50" r="2" class="center" />
    </svg>
    <div class="analog-date">{{ formattedDate }}</div>
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

const hourRotation = computed(() => {
  const h = props.time.getHours() % 12
  const m = props.time.getMinutes()
  return (h * 30) + (m * 0.5)
})

const minuteRotation = computed(() => {
  return props.time.getMinutes() * 6
})

const formattedDate = computed(() => {
  const m = props.time.getMonth() + 1
  const d = props.time.getDate()
  return `${m}月${d}日`
})
</script>

<style scoped>
.analog-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.clock-svg {
  width: 60vh;
  height: 60vh;
  max-width: 80vw;
  max-height: 80vw;
}

.face {
  fill: none;
  stroke: black;
  stroke-width: 2;
}

.tick {
  stroke: black;
  stroke-width: 2;
}

.hand {
  stroke: black;
  stroke-linecap: round;
}

.hour {
  stroke-width: 4;
}

.minute {
  stroke-width: 2.5;
}

.center {
  fill: black;
}

.analog-date {
  margin-top: 2rem;
  font-size: 2rem;
  font-weight: 500;
}
</style>
