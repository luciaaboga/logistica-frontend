<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  error.value = ''
  cargando.value = true

  try {
    const response = await fetch('http://localhost:5080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    if (!response.ok) {
      throw new Error('Credenciales inválidas')
    }

    const data = await response.json()
    authStore.setToken(data.token)

    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleLogin">
      <h1>Iniciar sesión</h1>

      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required />

      <label for="password">Contraseña</label>
      <input id="password" v-model="password" type="password" required />

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-form {
  display: flex;
  flex-direction: column;
  width: 300px;
  gap: 0.5rem;
}

.login-form label {
  margin-top: 0.5rem;
  font-weight: bold;
}

.login-form input {
  padding: 0.5rem;
  font-size: 1rem;
}

.login-form button {
  margin-top: 1rem;
  padding: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
}

.error {
  color: red;
  font-size: 0.9rem;
}
</style>
