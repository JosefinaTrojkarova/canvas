<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch('http://localhost:3000/api/login', {
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
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Welcome Back</h2>
        <p>Login to continue creating</p>
      </div>
      
      <form @submit.prevent="login" class="auth-form">
        <BaseInput 
          id="username"
          v-model="username" 
          label="Username" 
          placeholder="Enter your username"
          required 
        />
        
        <BaseInput 
          id="password"
          v-model="password" 
          label="Password" 
          type="password" 
          placeholder="Enter your password"
          required 
        />
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <BaseButton type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </BaseButton>
        
        <div class="auth-footer">
          <p>
            Don't have an account? 
            <router-link to="/register">Register now</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.875rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: var(--color-text-muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.submit-btn {
  margin-top: 1rem;
  width: 100%;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.auth-footer a {
  font-weight: 500;
}
</style>
