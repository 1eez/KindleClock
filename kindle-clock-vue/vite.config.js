import { defineConfig } from 'vite'

export default defineConfig({
  // 保持默认配置即可，Vite 可以直接服务静态文件
  // build.target 默认为 modules，对于老设备可能需要调整，但因为我们手写 ES5，所以问题不大。
  // 为了保险，我们设置构建目标为 es2015 或更低（虽然手写 ES5，但 vite可能会注入 helper）
  build: {
    target: 'es2015',
    polyfillModulePreload: false
  }
})
