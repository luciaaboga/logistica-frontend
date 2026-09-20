import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminRepartidoresView from '../views/AdminRepartidoresView.vue'
import AdminPedidosView from '../views/AdminPedidosView.vue'
import RepartidorView from '../views/RepartidorView.vue'
import RepartidorRutaView from '../views/RepartidorRutaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/admin/pedidos',
      name: 'admin-pedidos',
      component: AdminPedidosView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
    },
    {
      path: '/admin/repartidores',
      name: 'admin-repartidores',
      component: AdminRepartidoresView,
    },
    {
      path: '/repartidor',
      name: 'repartidor',
      component: RepartidorView,
    },
    {
      path: '/repartidor/ruta',
      name: 'repartidor-ruta',
      component: RepartidorRutaView,
    },
  ],
})

export default router
