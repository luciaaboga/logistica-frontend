<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const itemsAdmin = [
  {
    ruta: '/admin',
    label: 'Inicio',
    icono: 'M3 11L12 3L21 11M5 10V20A1 1 0 0 0 6 21H9A1 1 0 0 0 10 20V15A1 1 0 0 1 11 14H13A1 1 0 0 1 14 15V20A1 1 0 0 0 15 21H18A1 1 0 0 0 19 20V10',
  },
  {
    ruta: '/admin/pedidos',
    label: 'Pedidos',
    icono: 'M4 7L12 3L20 7M4 7L12 11M4 7V17L12 21M20 7L12 11M20 7V17L12 21M12 11V21',
  },
  {
    ruta: '/admin/repartidores',
    label: 'Repartidores',
    icono: 'M3 17H5M5 17A2 2 0 1 0 9 17M5 17A2 2 0 1 1 9 17M9 17H15M15 17A2 2 0 1 0 19 17M15 17A2 2 0 1 1 19 17M19 17H21V13L18 9H14V17M14 9V13H3V6A1 1 0 0 1 4 5H13A1 1 0 0 1 14 6V9Z',
  },
]

const itemsRepartidor = [
  {
    ruta: '/repartidor',
    label: 'Mis pedidos',
    icono: 'M3 11L12 3L21 11M5 10V20A1 1 0 0 0 6 21H9A1 1 0 0 0 10 20V15A1 1 0 0 1 11 14H13A1 1 0 0 1 14 15V20A1 1 0 0 0 15 21H18A1 1 0 0 0 19 20V10',
  },
  {
    ruta: '/repartidor/ruta',
    label: 'Mi ruta',
    icono: 'M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4',
  },
]

const items = authStore.esAdmin() ? itemsAdmin : itemsRepartidor
</script>

<template>
  <nav class="bottom-nav">
    
    <a v-for="item in items"
      :key="item.ruta"
      class="nav-item"
      :class="{ activo: route.path === item.ruta }"
      :title="item.label"
      @click="router.push(item.ruta)">
      
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path :d="item.icono" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: white;
  border-top: 1px solid #eaeaea;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
  z-index: 1000;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  color: #9e9e9e;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #f1f8f2;
  color: #43a047;
}

.nav-item.activo {
  background: #1b5e20;
  color: white;
}
</style>