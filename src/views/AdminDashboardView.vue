<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { obtenerEstiloEstado } from '@/utils/estados'
import AppHeader from '@/components/AppHeader.vue'
import NavBar from '@/components/NavBar.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const authStore = useAuthStore()

const accesos = [
  { titulo: 'Pedidos', descripcion: 'Ver el historial completo y su estado actual', ruta: '/admin/pedidos', color: '#e8f5e9' },
  { titulo: 'Repartidores', descripcion: 'Gestionar la flota y asignar pedidos', ruta: '/admin/repartidores', color: '#edf7ee' },
]

const mapaContenedor = ref(null)
const cargandoMapa = ref(true)

function crearIcono(estado) {
  const estilo = obtenerEstiloEstado(estado)

  return L.divIcon({
    className: 'marcador-pedido',
    html: `
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="${estilo.icono}"
          stroke="${estilo.color}"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

async function cargarPedidosEnMapa() {
  try {
    const response = await fetch('http://localhost:5080/api/pedidos', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })

    if (!response.ok) throw new Error('No se pudieron cargar los pedidos')

    const pedidos = await response.json()

    const mapa = L.map(mapaContenedor.value).setView([-34.6037, -58.3816], 11)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa)

    if (pedidos.length === 0) return

    const puntos = []
    pedidos.forEach((pedido) => {
      const punto = [pedido.latitud, pedido.longitud]
      puntos.push(punto)

      const estilo = obtenerEstiloEstado(pedido.estadoNombre)

      L.marker(punto, { icon: crearIcono(pedido.estadoNombre) })
        .addTo(mapa)
        .bindPopup(`
          <strong>Pedido #${pedido.id}</strong><br/>
          ${pedido.clienteNombre}<br/>
          ${pedido.direccion}<br/>
          <span style="color:${estilo.color}; font-weight:600">${pedido.estadoNombre}</span>
        `)
    })

    if (puntos.length > 0) {
      mapa.fitBounds(puntos, { padding: [40, 40] })
    }
  } catch (err) {
    console.error(err)
  } finally {
    cargandoMapa.value = false
  }
}

onMounted(() => {
  if (!authStore.estaLogueado() || !authStore.esAdmin()) {
    router.push('/login')
    return
  }
  cargarPedidosEnMapa()
})
</script>

<template>
  <div class="pagina">
    <AppHeader />

    <main class="contenido">
      <h1 class="titulo">Panel de administración</h1>
      <p class="subtitulo">Elegí una sección para empezar</p>

      <div class="accesos-fila">
        <div
          v-for="acceso in accesos"
          :key="acceso.ruta"
          class="acceso-card"
          :style="{ background: acceso.color }"
          @click="router.push(acceso.ruta)"
        >
          <h2>{{ acceso.titulo }}</h2>
          <p>{{ acceso.descripcion }}</p>
        </div>
      </div>

      <div class="mapa-seccion">
        <h2 class="mapa-titulo">Pedidos en el mapa</h2>

        <div class="mapa-leyenda">
          <span class="leyenda-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                :d="obtenerEstiloEstado('Pendiente').icono"
                :stroke="obtenerEstiloEstado('Pendiente').color"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Pendiente
          </span>

          <span class="leyenda-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                :d="obtenerEstiloEstado('Asignado').icono"
                :stroke="obtenerEstiloEstado('Asignado').color"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Asignado
          </span>

          <span class="leyenda-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                :d="obtenerEstiloEstado('En camino').icono"
                :stroke="obtenerEstiloEstado('En camino').color"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            En camino
          </span>

          <span class="leyenda-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                :d="obtenerEstiloEstado('Entregado').icono"
                :stroke="obtenerEstiloEstado('Entregado').color"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Entregado
          </span>

          <span class="leyenda-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                :d="obtenerEstiloEstado('Cancelado').icono"
                :stroke="obtenerEstiloEstado('Cancelado').color"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Cancelado
          </span>
        </div>

        <div ref="mapaContenedor" class="mapa-contenedor"></div>
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

.titulo {
  font-size: 1.6rem;
  color: #1b5e20;
  margin-bottom: 0.3rem;
  font-weight: 700;
}

.subtitulo {
  color: #6b7a6d;
  margin-bottom: 2rem;
}

.accesos-fila {
  display: flex;
  gap: 1.3rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.acceso-card {
  flex: 1 1 260px;
  border-radius: 16px;
  padding: 1.8rem;
  cursor: pointer;
  border: 1px solid rgba(27, 94, 32, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.acceso-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(27, 94, 32, 0.12);
}

.acceso-card h2 {
  font-size: 1.15rem;
  color: #1b5e20;
  margin-bottom: 0.4rem;
  font-weight: 700;
}

.acceso-card p {
  font-size: 0.92rem;
  color: #5c6b5e;
  line-height: 1.4;
}

.mapa-seccion {
  background: white;
  border-radius: 16px;
  border: 1px solid #e7ede8;
  padding: 1.5rem;
}

.mapa-titulo {
  font-size: 1.1rem;
  color: #1b5e20;
  margin-bottom: 0.8rem;
  font-weight: 700;
}

.mapa-leyenda {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #5c6b5e;
}

.leyenda-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mapa-contenedor {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #eef2ef;
  position: relative;
  z-index: 1;
}

.mapa-contenedor :deep(.leaflet-tile-pane) {
  filter: grayscale(85%) brightness(1.05) contrast(0.95);
}
</style>