export const estilosPorEstado = {
  Pendiente: {
    icono: 'M4 7L12 3L20 7M4 7L12 11M4 7V17L12 21M20 7L12 11M20 7V17L12 21M12 11V21',
    color: '#F9A825',
  },

  Asignado: {
    icono: 'M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z M12 12C13.7 12 15 10.7 15 9C15 7.3 13.7 6 12 6C10.3 6 9 7.3 9 9C9 10.7 10.3 12 12 12Z',
    color: '#1565C0',
  },

  'En camino': {
    icono: 'M3 17H5M5 17A2 2 0 1 0 9 17M5 17A2 2 0 1 1 9 17M9 17H15M15 17A2 2 0 1 0 19 17M15 17A2 2 0 1 1 19 17M19 17H21V13L18 9H14V17M14 9V13H3V6A1 1 0 0 1 4 5H13A1 1 0 0 1 14 6V9Z',
    color: '#EF6C00',
  },

  Entregado: {
    icono: 'M5 12L10 17L19 7',
    color: '#2E7D32',
  },

  Cancelado: {
    icono: 'M6 6L18 18M18 6L6 18',
    color: '#C62828',
  },
}

export function obtenerEstiloEstado(estado) {
  return estilosPorEstado[estado] || {
    icono: 'M12 8V12M12 16H12.01M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21Z',
    color: '#616161',
  }
}