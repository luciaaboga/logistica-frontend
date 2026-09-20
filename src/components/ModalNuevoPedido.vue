<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['cerrar', 'creado'])
const authStore = useAuthStore()

const clienteNombre = ref('')
const clienteTelefono = ref('')
const direccionOrigen = ref('')
const direccionDestino = ref('')

const error = ref('')
const cargando = ref(false)

async function crearPedido() {
  error.value = ''
  cargando.value = true

  try {
    const response = await fetch('http://localhost:5080/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        direccionOrigen: direccionOrigen.value,
        direccionDestino: direccionDestino.value,
        clienteNombre: clienteNombre.value,
        clienteTelefono: clienteTelefono.value,
      }),
    })

    if (response.status === 401) {
      authStore.logout()
      return
    }

    if (!response.ok) {
      const mensaje = await response.text()
      throw new Error(mensaje || 'No se pudo crear el pedido')
    }

    const pedido = await response.json()

    emit('creado', pedido)
    emit('cerrar')
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="modal-fondo" @click.self="emit('cerrar')">
    <div class="modal-caja">
      <div class="modal-encabezado">
        <h2>Nuevo pedido</h2>

        <button
          type="button"
          class="modal-cerrar"
          @click="emit('cerrar')"
        >
          ✕
        </button>
      </div>

      <form class="modal-form" @submit.prevent="crearPedido">
        <label for="clienteNombre">Nombre del cliente</label>
        <input
          id="clienteNombre"
          v-model="clienteNombre"
          type="text"
          required
          placeholder="Nombre y apellido"
        />

        <label for="clienteTelefono">Teléfono del cliente</label>
        <input
          id="clienteTelefono"
          v-model="clienteTelefono"
          type="tel"
          required
          placeholder="11 1234-5678"
        />

        <label for="direccionOrigen">Dirección de origen</label>
        <input
          id="direccionOrigen"
          v-model="direccionOrigen"
          type="text"
          required
          placeholder="Ej. Av. Rivadavia 1000, Buenos Aires"
        />

        <label for="direccionDestino">Dirección de destino</label>
        <input
          id="direccionDestino"
          v-model="direccionDestino"
          type="text"
          required
          placeholder="Ej. Av. Corrientes 1500, Buenos Aires"
        />

        <p v-if="error" class="modal-error">
          {{ error }}
        </p>

        <div class="modal-acciones">
          <button
            type="button"
            class="btn-cancelar"
            @click="emit('cerrar')"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn-crear"
            :disabled="cargando"
          >
            {{ cargando ? 'Creando...' : 'Crear pedido' }}
          </button>
        </div>
      </form>
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
  max-width: 500px;
  padding: 1.8rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.3rem;
}

.modal-encabezado h2 {
  color: #1b5e20;
  font-size: 1.25rem;
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
}

.modal-cerrar:hover {
  background: #f2f2f2;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.modal-form label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
  margin-top: 0.6rem;
}

.modal-form input {
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 9px;
  font-size: 0.95rem;
}

.modal-form input:focus {
  outline: none;
  border-color: #43a047;
  box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.12);
}

.modal-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-top: 0.5rem;
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

.btn-crear {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.6rem 1.3rem;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.btn-crear:hover {
  background: #14431a;
}

.btn-crear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>