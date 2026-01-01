<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const user = ref(localStorage.getItem('currentUser'))

router.afterEach(() => {
  user.value = localStorage.getItem('currentUser')
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  user.value = null
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
       <div class="nav-content">
         <router-link to="/" class="brand">
           <span class="brand-text">Canvas</span>
         </router-link>
         
         <div class="auth-links">
           <span v-if="user" class="user-info">
             <span class="username">{{ user }}</span>
             <BaseButton @click="logout" variant="ghost" class="logout-btn">Logout</BaseButton>
           </span>
           <template v-else>
             <router-link to="/login">
               <BaseButton variant="ghost">Login</BaseButton>
             </router-link>
             <router-link to="/register">
               <BaseButton variant="primary">Register</BaseButton>
             </router-link>
           </template>
         </div>
       </div>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.auth-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  color: var(--color-text);
  font-weight: 500;
}

.main-content {
  margin-top: 80px; /* Navbar height compensation */
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .nav-content {
    padding: 1rem;
  }
  
  .brand-text {
    font-size: 1.25rem;
  }
}
</style>
