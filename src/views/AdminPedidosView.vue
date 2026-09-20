<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'
import AppHeader from '@/components/AppHeader.vue'
import NavBar from '@/components/NavBar.vue'
import ModalNuevoPedido from '@/components/ModalNuevoPedido.vue'
import ModalDetallePedido from '@/components/ModalDetallePedido.vue'

const router = useRouter()
const authStore = useAuthStore()

const pedidos = ref([])
const filtroEstado = ref('Todos')
const cargando = ref(true)
const error = ref('')
const cancelandoId = ref(null)
const mostrandoModal = ref(false)
const pedidoSeleccionado = ref(null)

const estadosDisponibles = ['Todos', 'Pendiente', 'Asignado', 'En camino', 'Entregado', 'Cancelado']

const pedidosFiltrados = computed(() => {
  if (filtroEstado.value === 'Todos') return pedidos.value
  return pedidos.value.filter((p) => p.estadoNombre === filtroEstado.value)
})

async function cargarPedidos() {
  cargando.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:5080/api/pedidos', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (response.status === 401) {
      authStore.logout()
      router.push('/login')
      return
    }
    if (!response.ok) throw new Error('No se pudieron cargar los pedidos')
    pedidos.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

async function pedidoCreado() {
  await cargarPedidos()
}

async function cancelarPedido(id) {
  cancelandoId.value = id
  try {
    const response = await fetch(`http://localhost:5080/api/pedidos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!response.ok) throw new Error('No se pudo cancelar el pedido')
    await cargarPedidos()
  } catch (err) {
    error.value = err.message
  } finally {
    cancelandoId.value = null
  }
}

onMounted(() => {
  if (!authStore.estaLogueado() || !authStore.esAdmin()) {
    router.push('/login')
    return
  }
  cargarPedidos()
})
</script>

<template>
  <div class="pagina">
    <AppHeader />

    <main class="contenido">
      <div class="encabezado">
        <div>
          <h1 class="titulo">Pedidos</h1>
          <p class="subtitulo">Historial completo y su estado actual</p>
        </div>
        <button class="btn-nuevo" @click="mostrandoModal = true">
          + Nuevo pedido
        </button>
      </div>

      <div class="filtros">
        <button
          v-for="estado in estadosDisponibles"
          :key="estado"
          class="filtro-chip"
          :class="{ activo: filtroEstado === estado }"
          @click="filtroEstado = estado"
        >
          {{ estado }}
        </button>
      </div>

      <p v-if="cargando" class="estado-msg">Cargando pedidos...</p>
      <p v-else-if="error" class="estado-msg error">{{ error }}</p>
      <p v-else-if="pedidosFiltrados.length === 0" class="estado-msg">
        No hay pedidos con ese filtro.
      </p>

      <div v-else class="lista-pedidos">
        <div v-for="pedido in pedidosFiltrados" :key="pedido.id" class="pedido-card">
          <div class="pedido-datos">
            <div class="pedido-encabezado-fila">
              <strong>#{{ pedido.id }} — {{ pedido.clienteNombre }}</strong>
              <span
                class="badge-estado"
                :style="{
                  background: obtenerEstiloEstado(pedido.estadoNombre).color + '1A',
                  color: obtenerEstiloEstado(pedido.estadoNombre).color
                }"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <path
                    :d="obtenerEstiloEstado(pedido.estadoNombre).icono"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                {{ pedido.estadoNombre }}
              </span>
            </div>
            <span class="pedido-direccion">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path
                  d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              {{ pedido.direccion }}
            </span>
            <span class="pedido-costo">Costo de envío: ${{ pedido.costoEnvio.toFixed(2) }}</span>
          </div>

          <div class="pedido-acciones">
            <button
              class="btn-detalle"
              @click="pedidoSeleccionado = pedido"
            >
              Ver detalle
            </button>

            <button
              v-if="pedido.estadoNombre !== 'Cancelado' && pedido.estadoNombre !== 'Entregado'"
              class="btn-cancelar"
              :disabled="cancelandoId === pedido.id"
              @click="cancelarPedido(pedido.id)"
            >
              {{ cancelandoId === pedido.id ? 'Cancelando...' : 'Cancelar' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <NavBar />
    <ModalNuevoPedido
      v-if="mostrandoModal"
      @cerrar="mostrandoModal = false"
      @creado="pedidoCreado"
    />
    <ModalDetallePedido
      v-if="pedidoSeleccionado"
      :pedido="pedidoSeleccionado"
      @cerrar="pedidoSeleccionado = null"
      @actualizado="cargarPedidos"
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
}

.btn-nuevo:hover {
  background: #14431a;
}

.filtros {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.filtro-chip {
  background: white;
  border: 1px solid #e0e0e0;
  color: #666;
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.filtro-chip:hover {
  border-color: #a5d6a7;
}

.filtro-chip.activo {
  background: #1b5e20;
  border-color: #1b5e20;
  color: white;
}

.estado-msg {
  color: #8a978b;
  padding: 1rem 0;
}

.estado-msg.error {
  color: #c62828;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.pedido-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 14px;
  padding: 1.1rem 1.4rem;
}

.pedido-datos {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pedido-encabezado-fila {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.pedido-encabezado-fila strong {
  color: #263228;
  font-size: 0.98rem;
}

.badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
}

.pedido-direccion {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.pedido-direccion svg {
  flex-shrink: 0;
  color: #8a978b;
}
.btn-cancelar {
  background: transparent;
  border: 1.5px solid #c62828;
  color: #c62828;
  padding: 0.5rem 1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-cancelar:hover {
  background: #c62828;
  color: white;
}

.btn-cancelar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pedido-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-detalle {
  background: transparent;
  border: 1.5px solid #1b5e20;
  color: #1b5e20;
  padding: 0.5rem 1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-detalle:hover {
  background: #1b5e20;
  color: white;
}
</style>