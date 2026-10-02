export type RegistroEmpleadoDTO = {
  nombre: string;
  apellido_1: string;
  apellido_2?: string | null;
  email: string;
  password: string;
  ubicacion?: string | null;
  // Estos los sacaremos del token del Jefe, no los rellena el Jefe a mano
  id_peluqueria: number; 
  dni_nie: string;
  nss: string;
}