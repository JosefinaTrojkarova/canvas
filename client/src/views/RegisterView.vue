<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')

async function register() {
  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    localStorage.setItem('token', data.token)
    localStorage.setItem('currentUser', data.username)
    
    router.push('/')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="auth-container">
    <h2>Register</h2>
    <form @submit.prevent="register" class="auth-form">
      <div class="form-group">
        <label>Username</label>
        <input v-model="username" type="text" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit">Register</button>
      <p>
        Already have an account? <router-link to="/login">Login</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  max-width: 400px;
  margin: 0 auto;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
input {
  padding: 8px;
  font-size: 16px;
}
button {
  padding: 10px;
  background: #2196F3;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
button:hover {
  background: #0b7dda;
}
.error {
  color: red;
}
</style>
