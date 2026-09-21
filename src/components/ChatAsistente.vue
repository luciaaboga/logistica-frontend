<script setup>
import { ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'

const API_URL = 'http://localhost:5080/api/pedidos/asistente-ia'

const authStore = useAuthStore()

const abierto = ref(false)
const pregunta = ref('')
const cargando = ref(false)
const listaMensajes = ref(null)
const inputRef = ref(null)

const mensajes = ref([
  {
    rol: 'asistente',
    texto: 'Hola, puedo responder consultas sobre tus pedidos y repartidores.',
  },
])

const sugerencias = [
  '¿Cuántos pedidos hay por estado?',
  '¿Cuál es el costo promedio de envío?',
  '¿Qué repartidor tiene más pedidos?',
]

async function scrollAlFinal() {
  await nextTick()
  if (listaMensajes.value) {
    listaMensajes.value.scrollTop = listaMensajes.value.scrollHeight
  }
}

async function alternarPanel() {
  abierto.value = !abierto.value
  if (abierto.value) {
    await nextTick()
    inputRef.value?.focus()
    scrollAlFinal()
  }
}

async function enviar(texto) {
  const contenido = (texto ?? pregunta.value).trim()
  if (!contenido || cargando.value) return

  mensajes.value.push({ rol: 'usuario', texto: contenido })
  pregunta.value = ''
  cargando.value = true
  scrollAlFinal()

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ pregunta: contenido }),
    })

    if (response.status === 401 || response.status === 403) {
      throw new Error('Tu sesión expiró o no tenés permisos. Volvé a iniciar sesión.')
    }
    if (!response.ok) {
      throw new Error('El asistente no pudo responder. Intentá de nuevo en unos segundos.')
    }

    const data = await response.json()
    mensajes.value.push({ rol: 'asistente', texto: data.respuesta })
  } catch (err) {
    const sinConexion = err instanceof TypeError
    mensajes.value.push({
      rol: 'asistente',
      error: true,
      texto: sinConexion
        ? 'No se pudo conectar con el servidor. Revisá que el backend esté corriendo.'
        : err.message,
    })
  } finally {
    cargando.value = false
    scrollAlFinal()
    await nextTick()
    inputRef.value?.focus()
  }
}

function limpiarChat() {
  mensajes.value = mensajes.value.slice(0, 1)
}
</script>

<template>
  <div class="chat-raiz">
    <transition name="panel">
      <section v-if="abierto" class="chat-panel" role="dialog" aria-label="Asistente de pedidos">
        <header class="chat-header">
          <div>
            <h2>Asistente</h2>
            <p>Consultas sobre tus pedidos</p>
          </div>
          <div class="chat-header-acciones">
            <button
              class="icono-btn"
              type="button"
              title="Limpiar conversación"
              aria-label="Limpiar conversación"
              @click="limpiarChat"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M4 7H20M10 11V17M14 11V17M6 7L7 19A1 1 0 0 0 8 20H16A1 1 0 0 0 17 19L18 7M9 7V4H15V7"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button
              class="icono-btn"
              type="button"
              title="Cerrar"
              aria-label="Cerrar asistente"
              @click="alternarPanel"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div ref="listaMensajes" class="chat-mensajes" aria-live="polite">
          <div
            v-for="(m, i) in mensajes"
            :key="i"
            class="burbuja"
            :class="[m.rol, { error: m.error }]"
          >
            {{ m.texto }}
          </div>

          <div v-if="cargando" class="burbuja asistente escribiendo" aria-label="El asistente está respondiendo">
            <span></span><span></span><span></span>
          </div>

          <div v-if="mensajes.length === 1 && !cargando" class="sugerencias">
            <button
              v-for="s in sugerencias"
              :key="s"
              type="button"
              class="sugerencia"
              @click="enviar(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <form class="chat-form" @submit.prevent="enviar()">
          <input
            ref="inputRef"
            v-model="pregunta"
            type="text"
            placeholder="Escribí tu pregunta"
            maxlength="500"
            :disabled="cargando"
            autocomplete="off"
          />
          <button type="submit" class="enviar" :disabled="cargando || !pregunta.trim()" aria-label="Enviar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M4 12L20 4L13 20L11 13L4 12Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </form>
      </section>
    </transition>

    <button
      class="chat-fab"
      :class="{ activo: abierto }"
      type="button"
      title="Asistente"
      aria-label="Abrir asistente"
      :aria-expanded="abierto"
      @click="alternarPanel"
    >
      <svg v-if="!abierto" viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path
          d="M5 5H19A1 1 0 0 1 20 6V15A1 1 0 0 1 19 16H10L6 20V16H5A1 1 0 0 1 4 15V6A1 1 0 0 1 5 5Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Queda por encima de la NavBar (que mide ~70px y tiene z-index 1000) */
.chat-fab {
  position: fixed;
  right: 1.5rem;
  bottom: 5.5rem;
  z-index: 1100;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: #1b5e20;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(27, 94, 32, 0.3);
  transition: background-color 0.15s, transform 0.15s;
}

.chat-fab:hover {
  background: #2e7d32;
}

.chat-fab:active {
  transform: scale(0.95);
}

.chat-fab:focus-visible,
.icono-btn:focus-visible,
.enviar:focus-visible,
.sugerencia:focus-visible {
  outline: 2px solid #43a047;
  outline-offset: 2px;
}

.chat-panel {
  position: fixed;
  right: 1.5rem;
  bottom: 9.5rem;
  z-index: 1100;
  width: 360px;
  max-width: calc(100vw - 2rem);
  height: 480px;
  max-height: calc(100vh - 12rem);
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e7ede8;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(27, 94, 32, 0.16);
  overflow: hidden;
  transform-origin: bottom right;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  background: #1b5e20;
  color: white;
}

.chat-header h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.chat-header p {
  font-size: 0.78rem;
  margin: 0.1rem 0 0;
  color: #c8e6c9;
}

.chat-header-acciones {
  display: flex;
  gap: 0.25rem;
}

.icono-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s;
}

.icono-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.chat-mensajes {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: #f6f8f6;
}

.burbuja {
  max-width: 85%;
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.burbuja.asistente {
  align-self: flex-start;
  background: white;
  color: #2b3a2d;
  border: 1px solid #e7ede8;
  border-bottom-left-radius: 4px;
}

.burbuja.usuario {
  align-self: flex-end;
  background: #1b5e20;
  color: white;
  border-bottom-right-radius: 4px;
}

.burbuja.error {
  background: #fdecea;
  border-color: #f5c6c2;
  color: #b3261e;
}

.escribiendo {
  display: flex;
  gap: 4px;
  padding: 0.75rem 0.9rem;
}

.escribiendo span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9db3a0;
  animation: latido 1s infinite ease-in-out;
}

.escribiendo span:nth-child(2) {
  animation-delay: 0.15s;
}

.escribiendo span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes latido {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.sugerencias {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.sugerencia {
  padding: 0.45rem 0.8rem;
  border: 1px solid #c8e0ca;
  border-radius: 999px;
  background: #edf7ee;
  color: #1b5e20;
  font-size: 0.82rem;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
}

.sugerencia:hover {
  background: #dcefde;
}

.chat-form {
  display: flex;
  gap: 0.5rem;
  padding: 0.7rem;
  border-top: 1px solid #e7ede8;
  background: white;
}

.chat-form input {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d6e1d8;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}

.chat-form input:focus {
  border-color: #43a047;
}

.enviar {
  width: 40px;
  border: none;
  border-radius: 10px;
  background: #1b5e20;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s;
}

.enviar:hover:not(:disabled) {
  background: #2e7d32;
}

.enviar:disabled {
  background: #b7c9ba;
  cursor: not-allowed;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active,
  .escribiendo span {
    transition: none;
    animation: none;
  }
}

@media (max-width: 480px) {
  .chat-panel {
    right: 1rem;
    bottom: 9rem;
  }
  .chat-fab {
    right: 1rem;
  }
}
</style>