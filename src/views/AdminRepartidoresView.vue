<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import NavBar from '@/components/NavBar.vue'
import ModalNuevoRepartidor from '@/components/ModalNuevoRepartidor.vue'
import ModalAsignarPedido from '@/components/ModalAsignarPedido.vue'
import ModalPedidosRepartidor from '@/components/ModalPedidosRepartidor.vue'

const router = useRouter()
const authStore = useAuthStore()

const repartidores = ref([])
const busqueda = ref('')
const cargando = ref(true)
const error = ref('')
const mostrarModal = ref(false)
const repartidorParaAsignar = ref(null)
const repartidorParaVerPedidos = ref(null)

const repartidoresFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase()
  return repartidores.value.filter((r) => r.email.toLowerCase().includes(texto))
})

async function cargarRepartidores() {
  cargando.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:5080/api/auth/repartidores', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (response.status === 401) {
      authStore.logout()
      router.push('/login')
      return
    }
    if (!response.ok) throw new Error('No se pudo cargar la lista de repartidores')
    repartidores.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  if (!authStore.estaLogueado() || !authStore.esAdmin()) {
    router.push('/login')
    return
  }
  cargarRepartidores()
})
</script>

<template>
  <div class="pagina">
    <AppHeader />

    <main class="contenido">
      <div class="encabezado">
        <div>
          <h1 class="titulo">Repartidores</h1>
          <p class="subtitulo">Gestioná tu flota y asignales pedidos</p>
        </div>
        <button class="btn-nuevo" @click="mostrarModal = true">+ Nuevo repartidor</button>
      </div>

      <div class="stats-fila">
        <div class="stat-card">
          <span class="stat-numero">{{ repartidores.length }}</span>
          <span class="stat-label">Repartidores totales</span>
        </div>
        <div class="stat-card">
          <span class="stat-numero">{{ repartidoresFiltrados.length }}</span>
          <span class="stat-label">Resultados de búsqueda</span>
        </div>
      </div>

      <div class="buscador-wrapper">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" class="buscador-icono">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input v-model="busqueda" type="text" class="buscador" placeholder="Buscar por email..." />
      </div>

      <p v-if="cargando" class="estado-msg">Cargando repartidores...</p>
      <p v-else-if="error" class="estado-msg error">{{ error }}</p>
      <p v-else-if="repartidoresFiltrados.length === 0" class="estado-msg">No se encontraron repartidores.</p>

      <div v-else class="lista-repartidores">
        <div v-for="rep in repartidoresFiltrados" :key="rep.id" class="repartidor-card">
          <div class="repartidor-avatar">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="repartidor-info">
            <h3>{{ rep.email }}</h3>
            <span class="repartidor-id">ID #{{ rep.id }}</span>
          </div>
          <div class="repartidor-acciones">
            <button
                class="btn-ver-pedidos"
                @click="repartidorParaVerPedidos = rep"
            >
                Ver pedidos
            </button>

            <button
                class="btn-asignar"
                @click="repartidorParaAsignar = rep"
            >
                Asignar pedido
            </button>
            </div>
        </div>
      </div>
    </main>

    <NavBar />
    <ModalNuevoRepartidor
        v-if="mostrarModal"
        @cerrar="mostrarModal = false"
        @creado="cargarRepartidores"
    />
    <ModalAsignarPedido
        v-if="repartidorParaAsignar"
        :repartidor="repartidorParaAsignar"
        @cerrar="repartidorParaAsignar = null"
        @asignado="cargarRepartidores"
    />
    <ModalPedidosRepartidor
        v-if="repartidorParaVerPedidos"
        :repartidor="repartidorParaVerPedidos"
        @cerrar="repartidorParaVerPedidos = null"
    />
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  background: #f6f8f6;
}

.contenido {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 6rem;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.titulo {
  font-size: 1.6rem;
  color: #1b5e20;
  margin-bottom: 0.3rem;
  font-weight: 700;
}

.subtitulo {
  color: #6b7a6d;
}

.btn-nuevo {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.7rem 1.3rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-nuevo:hover {
  background: #14431a;
}

.stats-fila {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e7ede8;
  border-radius: 12px;
  padding: 1rem 1.4rem;
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.stat-numero {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1b5e20;
}

.stat-label {
  font-size: 0.82rem;
  color: #8a978b;
}

.buscador-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.buscador-icono {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aca1;
}

.buscador {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.7rem;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
}

.buscador:focus {
  outline: none;
  border-color: #43a047;
  box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.12);
}

.estado-msg {
  color: #8a978b;
  padding: 1rem 0;
}

.estado-msg.error {
  color: #c62828;
}

.lista-repartidores {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.repartidor-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 14px;
  padding: 1.1rem 1.4rem;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.repartidor-card:hover {
  box-shadow: 0 6px 18px rgba(27, 94, 32, 0.08);
  border-color: #c8e6c9;
}

.repartidor-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #1b5e20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.repartidor-info {
  flex: 1;
}

.repartidor-info h3 {
  font-size: 0.98rem;
  color: #263228;
  font-weight: 600;
}

.repartidor-id {
  font-size: 0.78rem;
  color: #a0aca1;
}

.btn-asignar {
  background: transparent;
  border: 1.5px solid #1b5e20;
  color: #1b5e20;
  padding: 0.55rem 1.1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.btn-asignar:hover {
  background: #1b5e20;
  color: white;
}

.repartidor-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-ver-pedidos {
  background: transparent;
  border: 1.5px solid #78909c;
  color: #546e7a;
  padding: 0.55rem 1.1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.btn-ver-pedidos:hover {
  background: #546e7a;
  color: white;
}
</style>