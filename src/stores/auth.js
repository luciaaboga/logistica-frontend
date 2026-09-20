import { defineStore } from 'pinia'
import { ref } from 'vue'

function decodificarToken(token) {
  const payload = token.split('.')[1]
  const decodificado = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decodificado)
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const rol = ref(localStorage.getItem('rol') || null)

  function setToken(nuevoToken) {
    token.value = nuevoToken
    localStorage.setItem('token', nuevoToken)

    const claims = decodificarToken(nuevoToken)
    const rolClaim = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    rol.value = rolClaim
    localStorage.setItem('rol', rolClaim)
  }

  function logout() {
    token.value = null
    rol.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
  }

  function estaLogueado() {
    return token.value !== null
  }

  function esAdmin() {
    return rol.value === 'Administrador'
  }

  function esRepartidor() {
    return rol.value === 'Repartidor'
  }

  return { token, rol, setToken, logout, estaLogueado, esAdmin, esRepartidor }
})