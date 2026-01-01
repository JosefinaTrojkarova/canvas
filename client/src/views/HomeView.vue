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
    <h1>Select a Studio</h1>
    <div class="list">
      <div v-for="s in studios" :key="s" class="item" @click="join(s)">
        {{ s }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px;
}
.list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.item {
  background: #444;
  padding: 20px 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.item:hover {
  background: #555;
}
</style>
