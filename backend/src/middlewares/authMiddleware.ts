import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos el tipo Request de Express
export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    rol: string;
    idPeluqueria: number | null;
  };
}

export const checkAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // USAMOS LA MISMA LÓGICA QUE EN EL LOGIN: 
  // Intenta leer del .env, si no puede, usa la frase de respaldo.
  const jwtSecret = process.env.JWT_SECRET || 'tu_clave_secreta';

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificamos el token
    const decoded = jwt.verify(token, jwtSecret) as { 
      id: number; 
      rol: string; 
      idPeluqueria: number | null 
    };
    
    // Guardamos los datos del usuario en la petición para usarlo en los controladores
    req.usuario = decoded;

    next();
  } catch (error) {
    // Si llegamos aquí es que la clave no coincide o el tiempo expiró
    console.error("Error validando token:", error);
    return res.status(401).json({ ok: false, message: 'Token invalido o expirado' });
  }
};

export const checkRol = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para acceder aqui' });
    }
    next();
  };
};