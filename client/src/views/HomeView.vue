<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const studios = ref([])
const router = useRouter()

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/studios')
    studios.value = await res.json()
  } catch (e) {
    console.error(e)
  }
})

function join(id) {
  router.push(`/studio/${id}`)
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>Join a Studio</h1>
      <p class="subtitle">Collaborate with others in real-time on a shared pixel canvas.</p>
    </div>
    
    <div class="grid-container">
      <div 
        v-for="s in studios" 
        :key="s" 
        class="studio-card" 
        @click="join(s)"
      >
        <div class="card-icon">🎨</div>
        <div class="card-content">
          <h3>Studio {{ s }}</h3>
          <p>Click to join this canvas</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  width: 100%;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.studio-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.studio-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.studio-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.studio-card:hover::before {
  opacity: 1;
}

.card-icon {
  font-size: 2rem;
  background: rgba(99, 102, 241, 0.1);
  padding: 1rem;
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.studio-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.card-content h3 {
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.card-content p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.card-arrow {
  margin-left: auto;
  font-size: 1.5rem;
  color: var(--color-primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.studio-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 640px) {
  h1 {
    font-size: 2.5rem;
  }
}
</style>
