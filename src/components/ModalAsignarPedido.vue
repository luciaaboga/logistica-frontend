<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  repartidor: { type: Object, required: true },
})

const emit = defineEmits(['cerrar', 'asignado'])
const authStore = useAuthStore()

const pedidosPendientes = ref([])
const cargando = ref(true)
const asignando = ref(false)
const error = ref('')

async function cargarPedidosPendientes() {
  cargando.value = true
  try {
    const response = await fetch('http://localhost:5080/api/pedidos', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!response.ok) throw new Error('No se pudieron cargar los pedidos')

    const todos = await response.json()
    pedidosPendientes.value = todos.filter((p) => p.estadoNombre === 'Pendiente')
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

async function asignar(pedidoId) {
  asignando.value = true
  error.value = ''

  try {
    const response = await fetch(`http://localhost:5080/api/pedidos/${pedidoId}/asignar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ repartidorId: props.repartidor.id }),
    })

    if (!response.ok) throw new Error('No se pudo asignar el pedido')

    emit('asignado')
    emit('cerrar')
  } catch (err) {
    error.value = err.message
  } finally {
    asignando.value = false
  }
}

onMounted(cargarPedidosPendientes)
</script>

<template>
  <div class="modal-fondo" @click.self="emit('cerrar')">
    <div class="modal-caja">
      <div class="modal-encabezado">
        <div>
          <h2>Asignar pedido</h2>
          <p class="modal-subtitulo">Repartidor: {{ repartidor.email }}</p>
        </div>
        <button class="modal-cerrar" @click="emit('cerrar')">✕</button>
      </div>

      <p v-if="cargando" class="modal-estado">Cargando pedidos pendientes...</p>
      <p v-else-if="error" class="modal-error">{{ error }}</p>
      <p v-else-if="pedidosPendientes.length === 0" class="modal-estado">
        No hay pedidos pendientes para asignar.
      </p>

      <div v-else class="lista-pedidos">
        <div v-for="pedido in pedidosPendientes" :key="pedido.id" class="pedido-item">
          <div class="pedido-info">
            <strong>#{{ pedido.id }} — {{ pedido.clienteNombre }}</strong>
            <span>{{ pedido.direccion }}</span>
          </div>
          <button
            class="btn-elegir"
            :disabled="asignando"
            @click="asignar(pedido.id)"
          >
            Asignar
          </button>
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
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.8rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.3rem;
}

.modal-encabezado h2 {
  color: #1b5e20;
  font-size: 1.2rem;
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

.modal-estado {
  color: #8a978b;
  text-align: center;
  padding: 1.5rem 0;
}

.modal-error {
  color: #c62828;
  text-align: center;
  padding: 1rem 0;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pedido-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 0.8rem 1rem;
}

.pedido-info {
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;
}

.pedido-info strong {
  color: #333;
}

.pedido-info span {
  color: #999;
  font-size: 0.8rem;
}

.btn-elegir {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-elegir:hover {
  background: #14431a;
}

.btn-elegir:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>