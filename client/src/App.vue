<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref } from 'vue'

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
  <nav>
     <router-link to="/" class="brand">Canvas</router-link>
     <div class="auth-links">
       <span v-if="user">
         {{ user }} 
         <button @click="logout" class="logout-btn">Logout</button>
       </span>
       <template v-else>
         <router-link to="/login">Login</router-link>
         <router-link to="/register">Register</router-link>
       </template>
     </div>
  </nav>
  <RouterView />
</template>

<style>
body {
  margin: 0;
  font-family: sans-serif;
  background: #222;
  color: #fff;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.brand {
  color: #fff;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.auth-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.auth-links a {
  color: #ccc;
  text-decoration: none;
}
.auth-links a:hover {
  color: #fff;
}

.logout-btn {
  background: none;
  border: 1px solid #666;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}
.logout-btn:hover {
  background: #444;
  color: #fff;
}
</style>
