import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        rol: string;
        idPeluqueria: number | null;
      };
    }
  }
}