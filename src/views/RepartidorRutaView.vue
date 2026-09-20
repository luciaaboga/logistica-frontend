<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'
import AppHeader from '@/components/AppHeader.vue'
import NavBar from '@/components/NavBar.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const authStore = useAuthStore()

const pedidosRuta = ref([])
const cargando = ref(true)
const error = ref('')
const mapaContenedor = ref(null)
const usandoUbicacionReal = ref(false)
const infoRuta = ref(null)
let mapa = null

const proximaParada = computed(() => {
  return pedidosRuta.value.find(
    (p) => p.estadoNombre === 'Asignado' || p.estadoNombre === 'En camino',
  )
})

function obtenerUbicacionActual() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({ lat: posicion.coords.latitude, lon: posicion.coords.longitude })
      },
      () => {
        resolve(null)
      },
      { timeout: 5000 },
    )
  })
}

async function cargarRuta() {
  cargando.value = true
  error.value = ''

  const coords = await obtenerUbicacionActual()
  usandoUbicacionReal.value = coords !== null

  let url = 'http://localhost:5080/api/pedidos/mis-pedidos/ruta-optima'
  if (coords) {
    url += `?latActual=${coords.lat}&lonActual=${coords.lon}`
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })

    if (response.status === 401) {
      authStore.logout()
      router.push('/login')
      return
    }

    if (!response.ok) throw new Error('No se pudo calcular la ruta')

    pedidosRuta.value = await response.json()
    cargando.value = false
    await nextTick()
    await dibujarMapa(coords)
  } catch (err) {
    error.value = err.message
    cargando.value = false
  }
}
async function obtenerRutaPorCalles(puntos) {
  // OSRM espera lon,lat (al revés que Leaflet)
  const coordenadas = puntos.map(([lat, lon]) => `${lon},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordenadas}?overview=full&geometries=geojson`

  const response = await fetch(url)
  if (!response.ok) throw new Error('No se pudo calcular la ruta por calles')

  const data = await response.json()
  if (!data.routes || data.routes.length === 0) throw new Error('OSRM no encontró un camino')

  // GeoJSON devuelve [lon, lat] — lo invertimos para Leaflet, que usa [lat, lon]
  const coordenadasCamino = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])

  return {
    camino: coordenadasCamino,
    distanciaKm: (data.routes[0].distance / 1000).toFixed(1),
    duracionMin: Math.round(data.routes[0].duration / 60),
  }
}

async function dibujarMapa(coordsRepartidor) {
  if (pedidosRuta.value.length === 0) return

  if (mapa) {
    mapa.remove()
  }

  mapa = L.map(mapaContenedor.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(mapa)

  const puntos = []

  if (coordsRepartidor) {
    const puntoInicial = [coordsRepartidor.lat, coordsRepartidor.lon]
    puntos.push(puntoInicial)

    const iconoRepartidor = L.divIcon({
      className: 'marcador-repartidor',
      html: `
        <div class="pin-repartidor">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6" cy="18" r="2.5" stroke="white" stroke-width="1.8"/>
            <circle cx="17" cy="18" r="2.5" stroke="white" stroke-width="1.8"/>
            <path d="M4 18H3V14L5 9H12L15 14H19M15 14H8M15 14V9M19 14V18H17.5M8 14V11" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    L.marker(puntoInicial, { icon: iconoRepartidor })
      .addTo(mapa)
      .bindPopup('<strong>Tu ubicación actual</strong>')
  }

  pedidosRuta.value.forEach((pedido, indice) => {
    const punto = [pedido.latitud, pedido.longitud]
    puntos.push(punto)

    const numeroIcono = L.divIcon({
      className: 'marcador-orden',
      html: `<div class="pin-orden">${indice + 1}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    L.marker(punto, { icon: numeroIcono })
      .addTo(mapa)
      .bindPopup(`
        <strong>Parada ${indice + 1}: Pedido #${pedido.id}</strong><br/>
        ${pedido.clienteNombre}<br/>
        ${pedido.direccion}
      `)
  })

  // Intentamos trazar el camino real por calles; si OSRM falla, usamos la línea recta como respaldo
  try {
    const resultado = await obtenerRutaPorCalles(puntos)
    L.polyline(resultado.camino, { color: '#1b5e20', weight: 4 }).addTo(mapa)
    infoRuta.value = { distanciaKm: resultado.distanciaKm, duracionMin: resultado.duracionMin }
  } catch (err) {
    console.error('Fallo el routing por calles, usando línea recta:', err)
    L.polyline(puntos, { color: '#1b5e20', weight: 3, dashArray: '6 8' }).addTo(mapa)
    infoRuta.value = null
  }

  mapa.fitBounds(puntos, { padding: [40, 40] })

  setTimeout(() => mapa.invalidateSize(), 200)
}

function siguienteEstado(pedido) {
  if (pedido.estadoNombre === 'Asignado') return 'En camino'
  if (pedido.estadoNombre === 'En camino') return 'Entregado'
  return null
}

function textoBotonEstado(pedido) {
  if (pedido.estadoNombre === 'Asignado') return 'Comenzar envío'
  if (pedido.estadoNombre === 'En camino') return 'Marcar como entregado'
  return ''
}

const actualizandoId = ref(null)

async function actualizarEstado(pedido) {
  const nuevoEstado = siguienteEstado(pedido)
  if (!nuevoEstado) return

  actualizandoId.value = pedido.id

  try {
    const response = await fetch(`http://localhost:5080/api/pedidos/${pedido.id}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ nombreEstado: nuevoEstado }),
    })

    if (!response.ok) throw new Error('No se pudo actualizar el estado')

    // Recalculamos toda la ruta: el backend va a excluir automáticamente
    // los pedidos ya entregados, y reordenar los que quedan.
    await cargarRuta()
  } catch (err) {
    error.value = err.message
  } finally {
    actualizandoId.value = null
  }
}

onMounted(() => {
  if (!authStore.estaLogueado() || authStore.esAdmin()) {
    router.push('/login')
    return
  }
  cargarRuta()
})
</script>

<template>
  <div class="pagina">
    <AppHeader />

    <main class="contenido">
      <h1 class="titulo">Mi ruta de hoy</h1>
      <p class="subtitulo">
        {{ usandoUbicacionReal ? 'Pedidos ordenados desde tu ubicación actual' : 'Pedidos ordenados por cercanía' }}
      </p>

      <p v-if="cargando" class="estado-msg">Calculando la mejor ruta...</p>
      <p v-else-if="error" class="estado-msg error">{{ error }}</p>

      <template v-else-if="pedidosRuta.length === 0">
        <p class="estado-msg">No tenés pedidos activos para hacer una ruta.</p>
      </template>

      <template v-else>
        <div v-if="!usandoUbicacionReal" class="aviso-ubicacion">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          No se pudo acceder a tu ubicación — la ruta arranca desde el primer pedido.
        </div>

        <div class="layout-ruta">
          <aside class="columna-lista">
            <div v-if="proximaParada" class="proxima-parada">
              <span class="proxima-etiqueta">Próxima parada</span>
              <strong>#{{ proximaParada.id }} — {{ proximaParada.clienteNombre }}</strong>
              <span class="proxima-direccion">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path
                    d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ proximaParada.direccion }}
              </span>
            </div>

            <div v-if="infoRuta" class="resumen-ruta">
                <span><strong>{{ infoRuta.distanciaKm }} km</strong> en total</span>
                <span><strong>{{ infoRuta.duracionMin }} min</strong> estimados</span>
            </div>

            <div class="lista-paradas">
              <div
                v-for="(pedido, indice) in pedidosRuta"
                :key="pedido.id"
                class="parada-item"
                :class="{ actual: proximaParada && proximaParada.id === pedido.id }"
              >
                <div class="parada-numero">{{ indice + 1 }}</div>
                <div class="parada-info">
                    <strong>#{{ pedido.id }} — {{ pedido.clienteNombre }}</strong>
                    <span>{{ pedido.direccion }}</span>
                </div>

                <button
                    v-if="siguienteEstado(pedido)"
                    type="button"
                    class="btn-avanzar"
                    :disabled="actualizandoId === pedido.id"
                    @click="actualizarEstado(pedido)"
                >
                {{ actualizandoId === pedido.id ? '...' : textoBotonEstado(pedido) }}
                </button>

                <span
                    v-else
                    class="badge-estado"
                    :style="{
                        background: obtenerEstiloEstado(pedido.estadoNombre).color + '1A',
                        color: obtenerEstiloEstado(pedido.estadoNombre).color,
                    }"
                >
                {{ pedido.estadoNombre }}
                </span>
              </div>
            </div>
          </aside>

          <div ref="mapaContenedor" class="columna-mapa"></div>
        </div>
      </template>
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
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 2rem 6rem;
}

.titulo {
  font-size: 1.6rem;
  color: #1b5e20;
  margin-bottom: 0.3rem;
  font-weight: 700;
}

.subtitulo {
  color: #6b7a6d;
  margin-bottom: 1.5rem;
}

.estado-msg {
  color: #8a978b;
  padding: 2rem 0;
  text-align: center;
}

.estado-msg.error {
  color: #c62828;
}

.aviso-ubicacion {
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #8d6e00;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

/* Layout de dos columnas */

.layout-ruta {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.columna-lista {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.columna-mapa {
  width: 100%;
  height: 620px;
  border-radius: 16px;
  overflow: hidden;
  background: #eef2ef;
  position: relative;
  z-index: 1;
  position: sticky;
  top: 1.5rem;
}

.proxima-parada {
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 14px;
  padding: 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.proxima-etiqueta {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #2e7d32;
  letter-spacing: 0.04em;
}

.proxima-parada strong {
  color: #1b5e20;
  font-size: 1.1rem;
}

.proxima-direccion {
  color: #4c6b4e;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.proxima-direccion svg {
  flex-shrink: 0;
}

.columna-mapa :deep(.pin-repartidor) {
  width: 36px;
  height: 36px;
  background: #1565c0;
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.lista-paradas {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.parada-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 0.9rem 1.1rem;
}

.parada-item.actual {
  border-color: #1b5e20;
  box-shadow: 0 0 0 2px rgba(27, 94, 32, 0.12);
}

.parada-numero {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1b5e20;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.parada-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.parada-info strong {
  color: #263228;
  font-size: 0.9rem;
}

.parada-info span {
  color: #8a978b;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-estado {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.resumen-ruta {
  display: flex;
  justify-content: space-between;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 0.8rem 1.1rem;
  font-size: 0.85rem;
  color: #6b7a6d;
}

.resumen-ruta strong {
  color: #1b5e20;
}

.btn-avanzar {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s, opacity 0.15s;
}

.btn-avanzar:hover:not(:disabled) {
  background: #14431a;
}

.btn-avanzar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .layout-ruta {
    grid-template-columns: 1fr;
  }

  .columna-mapa {
    height: 380px;
    position: static;
  }
}
</style>