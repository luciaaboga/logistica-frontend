<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['cerrar', 'creado'])
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function crearRepartidor() {
  error.value = ''
  cargando.value = true

  try {
    const response = await fetch('http://localhost:5080/api/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        rol: 'Repartidor',
      }),
    })

    if (response.status === 409) {
      throw new Error('Ya existe un usuario con ese email')
    }

    if (!response.ok) {
      throw new Error('No se pudo crear el repartidor')
    }

    emit('creado')
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
        <h2>Nuevo repartidor</h2>
        <button class="modal-cerrar" @click="emit('cerrar')">✕</button>
      </div>

      <form class="modal-form" @submit.prevent="crearRepartidor">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required placeholder="repartidor@ejemplo.com" />

        <label for="password">Contraseña</label>
        <input id="password" v-model="password" type="password" required placeholder="Mínimo 6 caracteres" />

        <p v-if="error" class="modal-error">{{ error }}</p>

        <div class="modal-acciones">
          <button type="button" class="btn-cancelar" @click="emit('cerrar')">Cancelar</button>
          <button type="submit" class="btn-crear" :disabled="cargando">
            {{ cargando ? 'Creando...' : 'Crear repartidor' }}
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
  max-width: 420px;
  padding: 1.8rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
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