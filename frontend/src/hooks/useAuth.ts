import type{ Usuario } from "../types/usuarioType";

// Obtiene el token JWT guardado en sessionStorage
// Devuelve null si el usuario no esta logueado
export const getToken = (): string | null => {
  return sessionStorage.getItem('token');
};

// Obtiene los datos del usuario logueado guardados en sessionStorage
// Devuelve null si no hay sesion activa
export const getUsuario = (): Usuario | null => {
  const raw = sessionStorage.getItem('usuario');
  return raw ? JSON.parse(raw) : null;
};

// Cierra la sesion del usuario borrando el token y sus datos de sessionStorage
// Despues de llamar a esto hay que redirigir al usuario a '/' con navigate
export const logout = (): void => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
};

// Funcion para hacer peticiones HTTP al backend con el token incluido automaticamente
// Usar esta funcion en lugar de fetch normal para rutas protegidas
// Ejemplo: const res = await fetchAuth('http://localhost:3000/api/productos')
export const fetchAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Si hay token, lo añadimos en la cabecera Authorization con formato Bearer
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Permitimos sobreescribir cabeceras si se pasan opciones adicionales
      ...options.headers,
    },
  });
};

// Comprueba si el usuario logueado tiene alguno de los roles indicados
// Util para mostrar u ocultar elementos de la UI segun el rol
// Ejemplo: if (tieneRol('DUEÑO', 'ADMIN')) { mostrar boton de editar }
export const tieneRol = (...roles: string[]): boolean => {
  const usuario = getUsuario();
  return usuario ? roles.includes(usuario.rol) : false;
};