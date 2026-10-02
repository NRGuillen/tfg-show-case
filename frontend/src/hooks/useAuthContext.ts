import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Asegúrate de que la ruta a tu carpeta context sea correcta

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  // Si alguien intenta usar este hook FUERA del AuthProvider, le avisamos con un error claro
  if (!context) {
    throw new Error("useAuthContext debe ser usado dentro de un AuthProvider");
  }
  
  return context;
};