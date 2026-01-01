<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const studioId = route.params.id
const canvasRef = ref(null)
const ws = ref(null)
const grid = ref([])
const selectedColor = ref('#000000')
const lastDrawTime = ref(0)
const currentTime = ref(Date.now())
const COOLDOWN_MS = 5 * 60 * 1000

const canDraw = computed(() => {
  return currentTime.value - lastDrawTime.value >= COOLDOWN_MS
})

const TimeRemaining = computed(() => {
  if (canDraw.value) return '00:00'
  const diff = COOLDOWN_MS - (currentTime.value - lastDrawTime.value)
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
})

let timerInterval

function drawCanvas() {
  const ctx = canvasRef.value.getContext('2d')
  const w = 100
  const h = 40
  const cellW = canvasRef.value.width / w
  const cellH = canvasRef.value.height / h

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  
  if (!grid.value || !grid.value.length) return

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = grid.value[y][x]
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH)
    }
  }
}

function onCanvasClick(e) {
  if (!canDraw.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left) / (rect.width / 100))
  const y = Math.floor((e.clientY - rect.top) / (rect.height / 40))
  
  ws.value.send(JSON.stringify({
    type: 'DRAW',
    x,
    y,
    color: selectedColor.value
  }))
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)

  ws.value = new WebSocket('ws://localhost:3000')
  
  ws.value.onopen = () => {
    ws.value.send(JSON.stringify({
      type: 'JOIN',
      studioId,
      token
    }))
  }
  
  ws.value.onmessage = (msg) => {
    const data = JSON.parse(msg.data)
    if (data.type === 'INIT') {
      grid.value = data.canvas
      lastDrawTime.value = data.cooldown
      requestAnimationFrame(drawCanvas)
    } else if (data.type === 'UPDATE') {
      grid.value[data.y][data.x] = data.color
      requestAnimationFrame(drawCanvas)
    } else if (data.type === 'COOLDOWN_START') {
      lastDrawTime.value = data.timestamp
    } else if (data.type === 'ERROR') {
      if (data.code === 'UNAUTHORIZED') {
        router.push('/login')
      } else if (data.cooldown) {
        lastDrawTime.value = data.cooldown
      }
    }
  }
})

onUnmounted(() => {
  if (ws.value) ws.value.close()
  clearInterval(timerInterval)
})
</script>

<template>
  <div class="studio">
    <div class="controls">
      <input type="color" v-model="selectedColor" />
      <div v-if="!canDraw" class="timer">Wait: {{ TimeRemaining }}</div>
      <div v-else class="ready">Ready to draw!</div>
    </div>
    <div class="canvas-container">
      <canvas 
        ref="canvasRef" 
        width="1000" 
        height="400"
        @click="onCanvasClick"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.studio {
  display: flex;
  flex-direction: column;
  padding: 20px;
  align-items: center;
}
.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}
.canvas-container {
  border: 1px solid #666;
  background: #fff;
}
canvas {
  image-rendering: pixelated;
  cursor: crosshair;
  width: 1000px;
  height: 400px;
}
.timer {
  color: #ff6666;
  font-weight: bold;
}
.ready {
  color: #66ff66;
  font-weight: bold;
}
</style>
