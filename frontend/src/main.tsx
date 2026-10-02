import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import './index.css'
// 1. Importamos el proveedor que creamos
import { AuthProvider } from './context/AuthContext' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Envolvemos el AppRouter con el AuthProvider */}
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>,
)