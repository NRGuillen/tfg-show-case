import React, { createContext, useState, useEffect, type ReactNode } from 'react';
// 1. Definimos la forma de los datos
interface AuthContextType {
 usuario: any;
    token: string | null; 
    login: (userData: any, token: string) => void;
    logout: () => void;
    loading: boolean;
}

// 2. Creamos el contexto con un valor inicial indefinido
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. El Proveedor
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('usuario');
    const savedToken = sessionStorage.getItem('token');
   if (savedUser && savedToken) {
            try {
                setUsuario(JSON.parse(savedUser));
                setToken(savedToken); // <-- Lo guardamos en el estado
            } catch (e) {
                console.error("Error parseando usuario", e);
            }
        }
        setLoading(false);
    }, []);

  const login = (userData: any, token: string) => {
    sessionStorage.setItem('usuario', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
    setUsuario(userData); 
    setToken(token);
  };

  const logout = () => {
    sessionStorage.clear();
    setUsuario(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};