export type Usuario = {
    id_usuario: number;       // De tabla usuario
    nombre: string;           // De tabla usuario
    apellido_1: string;       // De tabla usuario
    apellido_2: string | null;// De tabla usuario
    email: string;            // De tabla usuario
    rol: 'ADMIN' | 'DUEÑO' | 'PERSONAL' | 'CLIENTE'; // De tabla usuario
    ubicacion: string | null; // De tabla usuario
    warnings: number;         // De tabla usuario
};

export type UpdatePerfilDTO = {
  nombre: string;
  email: string;
  telefono?: string;
  // Campos para Dueño (Tabla Peluquería)
  calle?: string;
  tipo_de_via?: string;
  codigo_postal?: string;
  horario?: string;
  nombre_empresa?: string;
  // Campo para Usuario Normal (Tabla Usuario)
  ubicacion?: string; 
}

export type PerfilResponse = {
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
  // Datos Peluquería
  calle?: string;
  tipo_de_via?: string;
  codigo_postal?: string;
  horario?: string;
  nombre_empresa?: string;
  numero_seguidores?: number;
  // Datos Usuario
  ubicacion?: string;
}