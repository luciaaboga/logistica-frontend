import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)

  function setToken(nuevoToken) {
    token.value = nuevoToken
    localStorage.setItem('token', nuevoToken)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
  }

  function estaLogueado() {
    return token.value !== null
  }

  return { token, setToken, logout, estaLogueado }
})
