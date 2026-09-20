<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'

const props = defineProps({
  repartidor: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar'])

const authStore = useAuthStore()

const pedidos = ref([])
const cargando = ref(true)
const error = ref('')

const pedidosActivos = computed(() => {
  return pedidos.value.filter(
    (pedido) =>
      pedido.estadoNombre !== 'Entregado' &&
      pedido.estadoNombre !== 'Cancelado'
  )
})

async function cargarPedidos() {
  cargando.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:5080/api/pedidos', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (!response.ok) {
      throw new Error('No se pudieron cargar los pedidos')
    }

    const todosLosPedidos = await response.json()

    pedidos.value = todosLosPedidos.filter(
      (pedido) => pedido.repartidorId === props.repartidor.id
    )
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
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

onMounted(cargarPedidos)
</script>

<template>
  <div class="modal-fondo" @click.self="emit('cerrar')">
    <div class="modal-caja">

      <div class="modal-encabezado">
        <div>
          <h2>Pedidos asignados</h2>
          <p class="modal-subtitulo">
            Repartidor: {{ repartidor.email }}
          </p>
        </div>

        <button
          type="button"
          class="modal-cerrar"
          @click="emit('cerrar')"
        >
          ✕
        </button>
      </div>

      <div v-if="!cargando && !error" class="resumen">
        <div class="resumen-card">
          <span class="resumen-numero">{{ pedidos.length }}</span>
          <span class="resumen-label">Pedidos totales</span>
        </div>

        <div class="resumen-card">
          <span class="resumen-numero">{{ pedidosActivos.length }}</span>
          <span class="resumen-label">Pedidos activos</span>
        </div>
      </div>

      <p v-if="cargando" class="modal-estado">
        Cargando pedidos...
      </p>

      <p v-else-if="error" class="modal-error">
        {{ error }}
      </p>

      <div v-else-if="pedidos.length === 0" class="sin-pedidos">
        <div class="sin-pedidos-icono">📦</div>
        <strong>No tiene pedidos asignados</strong>
        <span>
          Este repartidor todavía no tiene ningún pedido asignado.
        </span>
      </div>

      <div v-else class="lista-pedidos">
        <div
          v-for="pedido in pedidos"
          :key="pedido.id"
          class="pedido-item"
        >
          <div class="pedido-principal">
            <div class="pedido-titulo">
              <strong>
                #{{ pedido.id }} — {{ pedido.clienteNombre }}
              </strong>

              <span
                class="badge-estado"
                :style="{
                  background:
                    obtenerEstiloEstado(pedido.estadoNombre).color + '1A',
                  color:
                    obtenerEstiloEstado(pedido.estadoNombre).color
                }"
              >
                {{ obtenerEstiloEstado(pedido.estadoNombre).emoji }}
                {{ pedido.estadoNombre }}
              </span>
            </div>

            <div class="pedido-datos">
              <span>
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

              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path
                    d="M6 4H9L11 9L8.5 10.5C9.6 12.7 11.3 14.4 13.5 15.5L15 13L20 15V18C20 19.1 19.1 20 18 20C10.3 20 4 13.7 4 6C4 4.9 4.9 4 6 4Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                {{ pedido.clienteTelefono }}
              </span>

              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
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

                {{ formatoFecha(pedido.fechaCreacion) }}
              </span>
            </div>
          </div>

          <div class="pedido-costo">
            <span>Costo de envío</span>
            <strong>
              ${{ Number(pedido.costoEnvio).toFixed(2) }}
            </strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-fondo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-caja {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.8rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.4rem;
}

.modal-encabezado h2 {
  color: #1b5e20;
  font-size: 1.25rem;
  margin: 0;
}

.modal-subtitulo {
  color: #8a978b;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.modal-cerrar {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.modal-cerrar:hover {
  background: #f2f2f2;
}

/* Resumen */

.resumen {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.resumen-card {
  background: #f6f8f6;
  border: 1px solid #e7ede8;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  display: flex;
  flex-direction: column;
  min-width: 130px;
}

.resumen-numero {
  color: #1b5e20;
  font-size: 1.25rem;
  font-weight: 700;
}

.resumen-label {
  color: #8a978b;
  font-size: 0.78rem;
}

/* Estados */

.modal-estado {
  color: #8a978b;
  text-align: center;
  padding: 2rem 0;
}

.modal-error {
  color: #c62828;
  text-align: center;
  padding: 1rem 0;
}

/* Sin pedidos */

.sin-pedidos {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1rem;
  color: #263228;
}

.sin-pedidos-icono {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.sin-pedidos strong {
  font-size: 1rem;
  margin-bottom: 0.3rem;
}

.sin-pedidos span {
  color: #8a978b;
  font-size: 0.85rem;
}

/* Lista */

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.pedido-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e7ede8;
  border-radius: 12px;
  padding: 1rem;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.pedido-item:hover {
  border-color: #c8e6c9;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.06);
}

.pedido-principal {
  flex: 1;
  min-width: 0;
}

.pedido-titulo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.pedido-titulo strong {
  color: #263228;
  font-size: 0.9rem;
}

.badge-estado {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 20px;
}

.pedido-datos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #8a978b;
  font-size: 0.8rem;
}

.pedido-datos span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.pedido-datos svg {
  flex-shrink: 0;
  color: #8a978b;
}

.pedido-costo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.pedido-costo span {
  color: #8a978b;
  font-size: 0.72rem;
}

.pedido-costo strong {
  color: #1b5e20;
  font-size: 0.95rem;
}

/* Acciones */

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.4rem;
  padding-top: 1rem;
  border-top: 1px solid #eef1ee;
}

.btn-cerrar {
  background: transparent;
  border: 1px solid #ddd;
  color: #555;
  padding: 0.6rem 1.2rem;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cerrar:hover {
  background: #f5f5f5;
}

/* Responsive */

@media (max-width: 600px) {
  .modal-caja {
    width: calc(100% - 2rem);
    padding: 1.3rem;
  }

  .pedido-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .pedido-costo {
    align-items: flex-start;
  }

  .resumen-card {
    flex: 1;
    min-width: 0;
  }
}
</style>