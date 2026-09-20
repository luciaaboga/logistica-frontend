<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function cerrarSesion() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="marca" @click="router.push('/admin')">
      <svg viewBox="0 0 24 24" class="marca-icono" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12L10 5L14 9L21 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 2H21V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 17L21 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <path d="M3 21L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/>
      </svg>
      <span class="marca-texto">EcoTrack</span>
    </div>

    <button class="btn-salir" @click="cerrarSesion" title="Cerrar sesión">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #eaeaea;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}

.marca-icono {
  width: 26px;
  height: 26px;
  color: #1b5e20;
}

.marca-texto {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1b5e20;
  letter-spacing: -0.02em;
}

.btn-salir {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #eee;
  background: #fafafa;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-salir:hover {
  background: #ffebee;
  border-color: #ffcdd2;
  color: #c62828;
}
</style>