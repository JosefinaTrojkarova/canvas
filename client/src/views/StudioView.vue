<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

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

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
]

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
    <div class="studio-header">
      <div class="controls-card">
        <div class="color-picker-section">
          <label>Color</label>
          <div class="color-presets">
             <button 
               v-for="c in PRESET_COLORS" 
               :key="c"
               class="color-btn"
               :class="{ active: selectedColor === c }"
               :style="{ backgroundColor: c }"
               @click="selectedColor = c"
             ></button>
          </div>
          <input type="color" v-model="selectedColor" class="native-picker" />
        </div>
        
        <div class="divider"></div>
        
        <div class="status-section">
           <div v-if="!canDraw" class="timer-display">
             <span class="timer-icon">⏳</span>
             <span>Wait {{ TimeRemaining }}</span>
           </div>
           <div v-else class="ready-display">
             <span class="ready-icon">✨</span>
             <span>Ready to draw!</span>
           </div>
        </div>
      </div>
    </div>

    <div class="canvas-wrapper">
      <div class="canvas-container" :class="{ disabled: !canDraw }">
        <canvas 
          ref="canvasRef" 
          width="1000" 
          height="400"
          @click="onCanvasClick"
        ></canvas>
        <div v-if="!canDraw" class="cooldown-overlay">
          <span>Cooldown Active</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 2rem;
  gap: 2rem;
}

.studio-header {
  width: 100%;
  max-width: 1000px;
}

.controls-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.color-picker-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-picker-section label {
  font-weight: 500;
  color: var(--color-text-muted);
}

.color-presets {
  display: flex;
  gap: 0.5rem;
}

.color-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #fff;
  transform: scale(1.1);
  box-shadow: 0 0 0 2px var(--color-primary);
}

.native-picker {
  -webkit-appearance: none;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}
.native-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.native-picker::-webkit-color-swatch {
  border: 2px solid var(--color-border);
  border-radius: 8px;
}

.divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

.status-section {
  min-width: 150px;
  display: flex;
  justify-content: flex-end;
}

.timer-display, .ready-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.timer-display {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ready-display {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.canvas-wrapper {
  padding: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  border: 1px solid var(--color-border);
}

.canvas-container {
  position: relative;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s;
  width: 1000px;
  height: 400px;
}

.canvas-container.disabled {
  cursor: not-allowed;
}

canvas {
  image-rendering: pixelated;
  cursor: crosshair;
  width: 1000px;
  height: 400px;
  display: block;
}

.canvas-container.disabled canvas {
  cursor: not-allowed;
}

.cooldown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.canvas-container:hover .cooldown-overlay {
  opacity: 1;
}

.cooldown-overlay span {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
