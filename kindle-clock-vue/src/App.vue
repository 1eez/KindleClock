<template>
  <div class="container" :style="rotationStyle">
    <!-- 全屏刷新遮罩（防残影） -->
    <div v-if="isRefreshing" class="refresh-overlay"></div>

    <!-- 隐藏的设置入口：点击右上角 -->
    <div class="settings-trigger" @click="toggleSettings"></div>

    <main class="content">
      <DigitalClock v-if="settings.clockType === 'digital'" :time="currentTime" />
      <AnalogClock v-else :time="currentTime" />
    </main>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-overlay" @click.self="toggleSettings">
      <div class="settings-dialog">
        <h2 class="settings-title">系统设置</h2>
        
        <div class="settings-group">
          <label>时钟样式</label>
          <div class="radio-group">
            <button :class="{ active: settings.clockType === 'digital' }" @click="settings.clockType = 'digital'">数字</button>
            <button :class="{ active: settings.clockType === 'analog' }" @click="settings.clockType = 'analog'">指针</button>
          </div>
        </div>

        <div class="settings-group">
          <label>屏幕旋转</label>
          <div class="radio-group">
            <button @click="rotate(0)">0°</button>
            <button @click="rotate(90)">90°</button>
            <button @click="rotate(180)">180°</button>
            <button @click="rotate(270)">270°</button>
          </div>
        </div>

        <button class="close-btn" @click="toggleSettings">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import DigitalClock from './components/DigitalClock.vue'
import AnalogClock from './components/AnalogClock.vue'

// 状态管理
const showSettings = ref(false)
const isRefreshing = ref(false)
const currentTime = ref(new Date())

const settings = reactive({
  clockType: localStorage.getItem('clockType') || 'digital',
  rotation: parseInt(localStorage.getItem('rotation')) || 0
})

// 监听设置并持久化
watch(() => settings.clockType, (val) => localStorage.setItem('clockType', val))
watch(() => settings.rotation, (val) => localStorage.setItem('rotation', val))

// 页面旋转样式
const rotationStyle = computed(() => {
  const isLandscape = settings.rotation % 180 !== 0
  return {
    transform: `rotate(${settings.rotation}deg)`,
    width: isLandscape ? '100vh' : '100%',
    height: isLandscape ? '100vw' : '100%',
    position: 'absolute',
    top: isLandscape ? '50%' : '0',
    left: isLandscape ? '50%' : '0',
    marginTop: isLandscape ? '-50vw' : '0',
    marginLeft: isLandscape ? '-50vh' : '0',
  }
})

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const rotate = (deg) => {
  settings.rotation = deg
}

// 全屏刷新逻辑 (每小时执行一次)
const triggerFullRefresh = () => {
  isRefreshing.value = true
  // 模拟黑白闪烁
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}

// 时钟引擎：分钟级更新
let timer = null
const startClock = () => {
  currentTime.value = new Date()
  
  // 计算距离下一分钟开始的时间
  const now = new Date()
  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

  setTimeout(() => {
    currentTime.value = new Date()
    // 检查是否需要全屏刷新（整点）
    if (currentTime.value.getMinutes() === 0) {
      triggerFullRefresh()
    }
    // 开始每分钟定时器
    timer = setInterval(() => {
      currentTime.value = new Date()
      if (currentTime.value.getMinutes() === 0) {
        triggerFullRefresh()
      }
    }, 60000)
  }, delay)
}

onMounted(() => {
  startClock()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style>
/* 全局基础重置在 style.css 中，此处为业务样式 */
.container {
  overflow: hidden;
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 防残影遮罩 */
.refresh-overlay {
  position: fixed;
  inset: 0;
  background-color: black;
  z-index: 9999;
  animation: blink 1s steps(2);
}

@keyframes blink {
  0% { background: white; }
  50% { background: black; }
  100% { background: white; }
}

.settings-trigger {
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  z-index: 100;
  cursor: pointer;
}

.content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 设置面板样式 */
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.settings-dialog {
  background: white;
  padding: 3rem;
  border: 5px solid black;
  width: 85%;
  max-width: 500px;
  box-shadow: 10px 10px 0px rgba(0,0,0,0.1);
}

.settings-title {
  font-size: 2.5rem;
  margin-top: 0;
  border-bottom: 3px solid black;
  padding-bottom: 1rem;
}

.settings-group {
  margin: 2rem 0;
}

.settings-group label {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-group button {
  flex: 1;
  padding: 1rem;
  font-size: 1.2rem;
  border: 2px solid black;
  background: white;
  cursor: pointer;
}

.radio-group button.active {
  background: black;
  color: white;
}

.close-btn {
  width: 100%;
  padding: 1.5rem;
  font-size: 1.5rem;
  background: black;
  color: white;
  border: none;
  margin-top: 1rem;
  cursor: pointer;
}
</style>
