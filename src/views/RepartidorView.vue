<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'
import AppHeader from '@/components/AppHeader.vue'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const authStore = useAuthStore()

const pedidos = ref([])
const cargando = ref(true)
const error = ref('')
const actualizandoId = ref(null)

const filtroEstado = ref('Todos')
const estadosDisponibles = ['Todos', 'Asignado', 'En camino', 'Entregado', 'Cancelado']

const pedidosFiltrados = computed(() => {
  let lista = pedidos.value

  if (filtroEstado.value !== 'Todos') {
    lista = lista.filter((p) => p.estadoNombre === filtroEstado.value)
  }

  // Los que requieren acción (Asignado/En camino) van primero
  const orden = { Asignado: 0, 'En camino': 1, Entregado: 2, Cancelado: 3 }
  return [...lista].sort((a, b) => orden[a.estadoNombre] - orden[b.estadoNombre])
})

const pedidosActivos = computed(() => {
  return pedidos.value.filter(
    (pedido) =>
      pedido.estadoNombre !== 'Entregado' &&
      pedido.estadoNombre !== 'Cancelado'
  )
})

const pedidosEntregados = computed(() => {
  return pedidos.value.filter(
    (pedido) => pedido.estadoNombre === 'Entregado'
  )
})

async function cargarPedidos() {
  cargando.value = true
  error.value = ''

  try {
    const response = await fetch(
      'http://localhost:5080/api/pedidos/mis-pedidos',
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    )

    if (response.status === 401) {
      authStore.logout()
      router.push('/login')
      return
    }

    if (!response.ok) {
      throw new Error('No se pudieron cargar tus pedidos')
    }

    pedidos.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

function siguienteEstado(pedido) {
  if (pedido.estadoNombre === 'Asignado') {
    return 'En camino'
  }

  if (pedido.estadoNombre === 'En camino') {
    return 'Entregado'
  }

  return null
}

function textoBotonEstado(pedido) {
  if (pedido.estadoNombre === 'Asignado') {
    return 'Comenzar envío'
  }

  if (pedido.estadoNombre === 'En camino') {
    return 'Marcar como entregado'
  }

  return ''
}

async function actualizarEstado(pedido) {
  const nuevoEstado = siguienteEstado(pedido)

  if (!nuevoEstado) return

  actualizandoId.value = pedido.id

  try {
    const response = await fetch(
      `http://localhost:5080/api/pedidos/${pedido.id}/estado`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          nombreEstado: nuevoEstado,
        }),
      }
    )

    if (response.status === 401) {
      authStore.logout()
      router.push('/login')
      return
    }

    if (!response.ok) {
      const mensaje = await response.text()
      throw new Error(mensaje || 'No se pudo actualizar el estado')
    }

    const pedidoActualizado = await response.json()

    const indice = pedidos.value.findIndex(
      (item) => item.id === pedido.id
    )

    if (indice !== -1) {
      pedidos.value[indice] = pedidoActualizado
    }
  } catch (err) {
    error.value = err.message
  } finally {
    actualizandoId.value = null
  }
}

function formatoFecha(fecha) {
  if (!fecha) return '-'

  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatoCosto(costo) {
  return Number(costo).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

onMounted(() => {
  if (!authStore.estaLogueado()) {
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
          <h1 class="titulo">Mis pedidos</h1>
          <p class="subtitulo">
            Gestioná los pedidos que tenés asignados
          </p>
        </div>

        <div class="acciones-encabezado">
          <button type="button" class="btn-ruta" @click="router.push('/repartidor/ruta')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Ver mi ruta
          </button>

          <button type="button" class="btn-actualizar" @click="cargarPedidos" :disabled="cargando">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M20 11A8.1 8.1 0 0 0 5.3 6.3L3 8.5M3 4V8.5H7.5M4 13A8.1 8.1 0 0 0 18.7 17.7L21 15.5M21 20V15.5H16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      <div class="stats-fila">
        <div class="stat-card">
          <div class="stat-icono activo">
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
            >
              <path
                d="M4 7L12 3L20 7M4 7L12 11M4 7V17L12 21M20 7L12 11M20 7V17L12 21M12 11V21"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div>
            <span class="stat-numero">{{ pedidosActivos.length }}</span>
            <span class="stat-label">Pedidos activos</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icono entregado">
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
            >
              <path
                d="M5 12L10 17L19 7"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div>
            <span class="stat-numero">
              {{ pedidosEntregados.length }}
            </span>
            <span class="stat-label">Entregados</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icono total">
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
            >
              <path
                d="M4 7L12 3L20 7M4 7L12 11M4 7V17L12 21M20 7L12 11M20 7V17L12 21M12 11V21"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div>
            <span class="stat-numero">{{ pedidos.length }}</span>
            <span class="stat-label">Pedidos totales</span>
          </div>
        </div>
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

      <div
        v-if="!cargando && !error"
        class="seccion-pedidos"
      >
        <div class="seccion-titulo">
          <h2>Pedidos asignados</h2>
          <span>{{ pedidos.length }} pedidos</span>
        </div>
      </div>

      <p v-if="cargando" class="estado-msg">
        Cargando tus pedidos...
      </p>

      <div v-else-if="error" class="mensaje-error">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
        >
          <path
            d="M12 8V12M12 16H12.01M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        {{ error }}
      </div>

      <div
        v-else-if="pedidos.length === 0"
        class="sin-pedidos"
      >
        <div class="sin-pedidos-icono">
          <svg
            viewBox="0 0 24 24"
            width="42"
            height="42"
            fill="none"
          >
            <path
              d="M4 7L12 3L20 7M4 7L12 11M4 7V17L12 21M20 7L12 11M20 7V17L12 21M12 11V21"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <strong>No tenés pedidos asignados</strong>

        <span>
          Cuando el administrador te asigne un pedido,
          aparecerá en esta sección.
        </span>
      </div>

      <div v-else class="lista-pedidos">
        <div v-for="pedido in pedidosFiltrados" :key="pedido.id" class="pedido-card">
          <div class="pedido-cabecera">
            <div class="pedido-identificacion">
              <span class="pedido-id">
                Pedido #{{ pedido.id }}
              </span>

              <span
                class="badge-estado"
                :style="{
                  background:
                    obtenerEstiloEstado(pedido.estadoNombre).color + '1A',
                  color:
                    obtenerEstiloEstado(pedido.estadoNombre).color
                }"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                >
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
          </div>

          <div class="pedido-contenido">
            <div class="pedido-info">
              <div class="info-item">
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
                  <path
                    d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>

                <div>
                  <span class="info-label">Cliente</span>
                  <strong>{{ pedido.clienteNombre }}</strong>
                </div>
              </div>

              <div class="info-item">
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <path
                    d="M6 4H9L11 9L8.5 10.5C9.6 12.7 11.3 14.4 13.5 15.5L15 13L20 15V18C20 19.1 19.1 20 18 20C10.3 20 4 13.7 4 6C4 4.9 4.9 4 6 4Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <div>
                  <span class="info-label">Teléfono</span>
                  <strong>{{ pedido.clienteTelefono }}</strong>
                </div>
              </div>

              <div class="info-item direccion-item">
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <path
                    d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <div>
                  <span class="info-label">Dirección de entrega</span>
                  <strong>{{ pedido.direccion }}</strong>
                </div>
              </div>

              <div class="info-item">
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <rect
                    x="4"
                    y="5"
                    width="16"
                    height="15"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
                  <path
                    d="M8 3V7M16 3V7M4 10H20"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>

                <div>
                  <span class="info-label">Fecha</span>
                  <strong>
                    {{ formatoFecha(pedido.fechaCreacion) }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="pedido-lateral">
              <div class="costo">
                <span>Costo de envío</span>
                <strong>
                  ${{ formatoCosto(pedido.costoEnvio) }}
                </strong>
              </div>

              <button
                v-if="siguienteEstado(pedido)"
                type="button"
                class="btn-estado"
                :disabled="actualizandoId === pedido.id"
                @click="actualizarEstado(pedido)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <path
                    d="M5 12H19M13 6L19 12L13 18"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <span v-if="actualizandoId === pedido.id">
                  Actualizando...
                </span>

                <span v-else>
                  {{ textoBotonEstado(pedido) }}
                </span>
              </button>

              <div
                v-else-if="pedido.estadoNombre === 'Entregado'"
                class="entregado-mensaje"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <path
                    d="M5 12L10 17L19 7"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                Pedido entregado
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <NavBar />
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
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.titulo {
  font-size: 1.6rem;
  color: #1b5e20;
  margin: 0 0 0.3rem;
  font-weight: 700;
}

.subtitulo {
  color: #6b7a6d;
  margin: 0;
}

.btn-actualizar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: white;
  border: 1px solid #dfe6e0;
  color: #1b5e20;
  padding: 0.65rem 1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.btn-actualizar:hover:not(:disabled) {
  background: #f1f8f2;
  border-color: #b9d7bc;
}

.btn-actualizar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-fila {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid #e7ede8;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.stat-icono {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icono.activo {
  background: #fff8e1;
  color: #f9a825;
}

.stat-icono.entregado {
  background: #e8f5e9;
  color: #2e7d32;
}

.stat-icono.total {
  background: #e3f2fd;
  color: #1565c0;
}

.stat-numero {
  display: block;
  font-size: 1.35rem;
  font-weight: 700;
  color: #263228;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #8a978b;
  margin-top: 0.1rem;
}

.seccion-pedidos {
  margin-bottom: 1rem;
}

.seccion-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seccion-titulo h2 {
  color: #263228;
  font-size: 1.05rem;
  margin: 0;
}

.seccion-titulo span {
  color: #8a978b;
  font-size: 0.8rem;
}

.estado-msg {
  color: #8a978b;
  text-align: center;
  padding: 3rem 0;
}

.mensaje-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #c62828;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 10px;
  padding: 0.9rem 1rem;
}

.sin-pedidos {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: white;
  border: 1px solid #e7ede8;
  border-radius: 14px;
  padding: 3.5rem 1.5rem;
}

.sin-pedidos-icono {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #1b5e20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.sin-pedidos strong {
  color: #263228;
  font-size: 1rem;
  margin-bottom: 0.35rem;
}

.sin-pedidos span {
  color: #8a978b;
  font-size: 0.85rem;
  max-width: 400px;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.pedido-card {
  background: white;
  border: 1px solid #e7ede8;
  border-radius: 14px;
  padding: 1.2rem 1.3rem;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.pedido-card:hover {
  border-color: #c8e6c9;
  box-shadow: 0 6px 18px rgba(27, 94, 32, 0.07);
}

.pedido-cabecera {
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #eef1ee;
  margin-bottom: 1rem;
}

.pedido-identificacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.pedido-id {
  color: #263228;
  font-weight: 700;
  font-size: 0.95rem;
}

.badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.pedido-contenido {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.pedido-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  color: #8a978b;
  min-width: 0;
}

.info-item > svg {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.info-item > div {
  min-width: 0;
}

.info-label {
  display: block;
  font-size: 0.7rem;
  color: #a0aca1;
  margin-bottom: 0.15rem;
}

.info-item strong {
  display: block;
  color: #3c473e;
  font-size: 0.82rem;
  font-weight: 600;
  word-break: break-word;
}

.direccion-item {
  grid-column: span 2;
}

.pedido-lateral {
  min-width: 175px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.costo {
  text-align: right;
}

.costo span {
  display: block;
  color: #8a978b;
  font-size: 0.72rem;
  margin-bottom: 0.2rem;
}

.costo strong {
  color: #1b5e20;
  font-size: 1.05rem;
}

.btn-estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.65rem 0.9rem;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.btn-estado:hover:not(:disabled) {
  background: #14431a;
}

.btn-estado:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.entregado-mensaje {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #2e7d32;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 800px) {
  .stats-fila {
    grid-template-columns: 1fr;
  }

  .pedido-contenido {
    flex-direction: column;
  }

  .pedido-lateral {
    min-width: 0;
    align-items: flex-start;
    flex-direction: row;
  }

  .costo {
    text-align: left;
  }
}

@media (max-width: 600px) {
  .contenido {
    padding: 2rem 1rem 6rem;
  }

  .encabezado {
    flex-direction: column;
  }

  .btn-actualizar {
    align-self: flex-start;
  }

  .pedido-info {
    grid-template-columns: 1fr;
  }

  .direccion-item {
    grid-column: span 1;
  }

  .pedido-identificacion {
    align-items: flex-start;
    flex-direction: column;
  }

  .pedido-lateral {
    flex-direction: column;
  }
}

.acciones-encabezado {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-ruta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-ruta:hover {
  background: #14431a;
}

.filtros {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;
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

</style>