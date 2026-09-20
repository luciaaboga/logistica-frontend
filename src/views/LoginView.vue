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

    if (authStore.esAdmin()) {
      router.push('/admin')
    } else {
      router.push('/repartidor')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="decoracion decoracion-1"></div>
    <div class="decoracion decoracion-2"></div>

    <form class="login-card" @submit.prevent="handleLogin">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
            <path
              d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M4 7.5L12 12L20 7.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M12 12V21"
              stroke="currentColor"
              stroke-width="1.8"
            />
          </svg>
        </div>
      </div>

      <div class="encabezado">
        <h1>Bienvenido</h1>
        <p>Ingresá a tu cuenta para continuar</p>
      </div>

      <div class="campo">
        <label for="email">Email</label>

        <div class="input-wrapper">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            class="input-icon"
          >
            <path
              d="M4 6H20V18H4V6Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M4 7L12 13L20 7"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>

          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="campo">
        <label for="password">Contraseña</label>

        <div class="input-wrapper">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            class="input-icon"
          >
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="2"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>

          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Tu contraseña"
            autocomplete="current-password"
            required
          />
        </div>
      </div>

      <p v-if="error" class="error">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M12 8V13"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>

        {{ error }}
      </p>

      <button type="submit" :disabled="cargando">
        <span v-if="cargando" class="spinner"></span>

        <span>
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </span>

        <svg
          v-if="!cargando"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
        >
          <path
            d="M5 12H19"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M13 6L19 12L13 18"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="pie">
        <span>Sistema de gestión logística</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f6f8f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Decoraciones del fondo */

.decoracion {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.decoracion-1 {
  width: 420px;
  height: 420px;
  background: #e8f5e9;
  top: -180px;
  right: -130px;
}

.decoracion-2 {
  width: 300px;
  height: 300px;
  background: #edf7ee;
  bottom: -140px;
  left: -120px;
}

/* Tarjeta */

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border: 1px solid #e5ebe6;
  border-radius: 20px;
  padding: 2.5rem 2.4rem 1.8rem;
  box-shadow: 0 15px 45px rgba(27, 94, 32, 0.08);
  position: relative;
  z-index: 1;
}

/* Logo */

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.2rem;
}

.logo-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #e8f5e9;
  color: #1b5e20;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Encabezado */

.encabezado {
  text-align: center;
  margin-bottom: 2rem;
}

.encabezado h1 {
  margin: 0;
  color: #1b5e20;
  font-size: 1.65rem;
  font-weight: 700;
}

.encabezado p {
  margin: 0.45rem 0 0;
  color: #8a978b;
  font-size: 0.9rem;
}

/* Campos */

.campo {
  margin-bottom: 1.1rem;
}

.campo label {
  display: block;
  color: #39443c;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.45rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9aaa9c;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.78rem 0.9rem 0.78rem 2.65rem;
  border: 1px solid #dfe5e0;
  border-radius: 10px;
  background: #fafcfb;
  color: #263228;
  font-size: 0.9rem;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.input-wrapper input::placeholder {
  color: #adb6af;
}

.input-wrapper input:hover {
  border-color: #c8d5ca;
}

.input-wrapper input:focus {
  outline: none;
  background: white;
  border-color: #43a047;
  box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.12);
}

/* Error */

.error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 0.7rem 0.8rem;
  border-radius: 9px;
  font-size: 0.82rem;
  margin: 0.2rem 0 1rem;
}

/* Botón */

.login-card button[type='submit'] {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.82rem 1rem;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.1s;
  margin-top: 0.4rem;
}

.login-card button[type='submit']:hover:not(:disabled) {
  background: #14431a;
}

.login-card button[type='submit']:active:not(:disabled) {
  transform: translateY(1px);
}

.login-card button[type='submit']:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Spinner */

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

/* Pie */

.pie {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.2rem;
  border-top: 1px solid #eef1ee;
}

.pie span {
  color: #a0aaa2;
  font-size: 0.75rem;
}

/* Responsive */

@media (max-width: 500px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.4rem 1.5rem;
    border-radius: 16px;
  }
}
</style>