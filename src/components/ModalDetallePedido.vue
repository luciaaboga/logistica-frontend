<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'

const props = defineProps({
  pedido: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar', 'actualizado'])

const authStore = useAuthStore()

const repartidores = ref([])
const repartidorSeleccionado = ref('')
const cargandoRepartidores = ref(true)
const guardando = ref(false)
const error = ref('')

async function cargarRepartidores() {
  cargandoRepartidores.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:5080/api/auth/repartidores', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (!response.ok) {
      throw new Error('No se pudieron cargar los repartidores')
    }

    repartidores.value = await response.json()

    if (props.pedido.repartidorId !== null && props.pedido.repartidorId !== undefined) {
      repartidorSeleccionado.value = String(props.pedido.repartidorId)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    cargandoRepartidores.value = false
  }
}

function obtenerNombreRepartidor() {
  if (!props.pedido.repartidorId) {
    return 'Sin asignar'
  }

  const repartidor = repartidores.value.find(
    (r) => r.id === props.pedido.repartidorId
  )

  return repartidor ? repartidor.email : `ID #${props.pedido.repartidorId}`
}

async function guardarAsignacion() {
  if (!repartidorSeleccionado.value) {
    error.value = 'Seleccioná un repartidor'
    return
  }

  guardando.value = true
  error.value = ''

  try {
    const response = await fetch(
      `http://localhost:5080/api/pedidos/${props.pedido.id}/asignar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          repartidorId: Number(repartidorSeleccionado.value),
        }),
      }
    )

    if (!response.ok) {
      throw new Error('No se pudo asignar el repartidor')
    }

    emit('actualizado')
    emit('cerrar')
  } catch (err) {
    error.value = err.message
  } finally {
    guardando.value = false
  }
}

onMounted(cargarRepartidores)
</script>

<template>
  <div class="modal-fondo" @click.self="emit('cerrar')">
    <div class="modal-caja">
      <div class="modal-encabezado">
        <div>
          <h2>Detalle del pedido #{{ pedido.id }}</h2>
          <p class="modal-subtitulo">
            Información completa del pedido
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

      <div class="detalle">
        <div class="detalle-seccion">
          <h3>Estado</h3>

          <span
            class="badge-estado"
            :style="{
              background: obtenerEstiloEstado(pedido.estadoNombre).color + '1A',
              color: obtenerEstiloEstado(pedido.estadoNombre).color
            }"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
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

        <div class="detalle-seccion">
          <h3>Cliente</h3>

          <div class="dato">
            <span>Nombre</span>
            <strong>{{ pedido.clienteNombre }}</strong>
          </div>

          <div class="dato">
            <span>Teléfono</span>
            <strong>{{ pedido.clienteTelefono }}</strong>
          </div>
        </div>

        <div class="detalle-seccion">
          <h3>Dirección de destino</h3>

          <p class="direccion">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            {{ pedido.direccion }}
          </p>
        </div>

        <div class="detalle-seccion">
          <h3>Repartidor</h3>

          <p class="repartidor-actual">
            Actualmente:
            <strong>{{ obtenerNombreRepartidor() }}</strong>
          </p>

          <label for="repartidor">Cambiar repartidor</label>

          <select
            id="repartidor"
            v-model="repartidorSeleccionado"
            :disabled="cargandoRepartidores || guardando"
          >
            <option value="" disabled>
              Seleccioná un repartidor
            </option>

            <option
              v-for="repartidor in repartidores"
              :key="repartidor.id"
              :value="String(repartidor.id)"
            >
              {{ repartidor.email }}
            </option>
          </select>
        </div>

        <div class="detalle-seccion costo-seccion">
          <div class="dato">
            <span>Costo de envío</span>
            <strong>${{ pedido.costoEnvio.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <p v-if="error" class="modal-error">
        {{ error }}
      </p>

      <div class="modal-acciones">
        <button
          type="button"
          class="btn-cancelar"
          @click="emit('cerrar')"
        >
          Cerrar
        </button>

        <button
          type="button"
          class="btn-guardar"
          :disabled="guardando || cargandoRepartidores"
          @click="guardarAsignacion"
        >
          {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
        </button>
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
  max-width: 520px;
  max-height: 90vh;
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
}

.modal-subtitulo {
  color: #8a978b;
  font-size: 0.85rem;
  margin-top: 0.2rem;
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

.detalle {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.detalle-seccion {
  border-bottom: 1px solid #eef1ee;
  padding-bottom: 1rem;
}

.detalle-seccion:last-child {
  border-bottom: none;
}

.detalle-seccion h3 {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8a978b;
  margin-bottom: 0.55rem;
}

.badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
}

.dato {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
}

.dato span {
  color: #8a978b;
  font-size: 0.85rem;
}

.dato strong {
  color: #263228;
  font-size: 0.9rem;
  text-align: right;
}

.direccion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.direccion svg {
  flex-shrink: 0;
  color: #8a978b;
}

.repartidor-actual {
  color: #8a978b;
  font-size: 0.85rem;
  margin-bottom: 0.7rem;
}

.repartidor-actual strong {
  color: #263228;
}

.detalle-seccion label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 0.4rem;
}

.detalle-seccion select {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 9px;
  font-size: 0.9rem;
  background: white;
  color: #333;
}

.detalle-seccion select:focus {
  outline: none;
  border-color: #43a047;
  box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.12);
}

.costo-seccion {
  padding-top: 0.2rem;
}

.costo-seccion .dato strong {
  color: #1b5e20;
  font-size: 1rem;
}

.modal-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-top: 0.8rem;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1.5rem;
}

.btn-cancelar {
  background: transparent;
  border: 1px solid #ddd;
  color: #555;
  padding: 0.6rem 1.2rem;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.6rem 1.3rem;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar:hover {
  background: #14431a;
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>