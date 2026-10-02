import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware'; 
import { getUserJById, syncServiciosService } from "../services/userJService";
import * as userJService from '../services/userJService';

export const getUserJ = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.usuario?.id;
        if (!id) {
            return res.status(401).json({ ok: false, message: "No autorizado" });
        }
        const userJ = await getUserJById(id);
        if (!userJ) {
            return res.status(404).json({ ok: false, message: "Perfil no encontrado" });
        }
        res.json({ ok: true, data: userJ });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener perfil' });
    }
};

export const hireEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // IMPORTANTE: Usamos idPeluqueria (con P mayúscula) como en tus productos
        const idPeluqueria = req.usuario?.idPeluqueria;
        const employeeData = req.body;

        if (!idPeluqueria) {
            res.status(401).json({ message: 'No autorizado: Falta ID de Peluquería' });
            return;
        }

        // Inyectamos el ID de la peluquería del jefe en los datos del empleado
        const dataFinal = {
            ...employeeData,
            id_peluqueria: idPeluqueria 
        };

        await userJService.hireEmployee(dataFinal);

        res.status(201).json({
            message: 'Empleado registrado con éxito.'
        });

    } catch (error: any) {
        console.error("❌ Error en el controlador de contratación:", error);
        if (error.code === 'DUPLICATE_DNI') {
            res.status(409).json({ message: 'El DNI/NIE ya está registrado en la base de datos.' });
            return;
        }
        if (error.code === 'DUPLICATE_NSS') {
            res.status(409).json({ message: 'El NSS ya está registrado en la base de datos.' });
            return;
        }
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'El email ya está registrado.' });
            return;
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getStaff = async (req: Request, res: Response) => {
    try {
        const { idPeluqueria } = req.params;
        
        if (!idPeluqueria) {
            return res.status(400).json({ message: "ID de peluquería requerido" });
        }

        // Aquí es donde el Controlador "maniobra" el Service
        const staff = await userJService.getStaff(Number(idPeluqueria));
        
        res.status(200).json(staff);
    } catch (error) {
        console.error("Error en getStaff:", error);
        res.status(500).json({ message: "Error al obtener la lista de empleados" });
    }
};


export const despedirEmpleado = async (req: Request, res: Response) => {
    try {
        const { idUsuario } = req.params; // Lo recibiremos por la URL: /api/usuarios/despedir/15

        if (!idUsuario) {
            return res.status(400).json({ ok: false, message: "ID de usuario no proporcionado" });
        }

        // Llamamos al servicio que creamos antes
        await userJService.fireEmployee(Number(idUsuario));

        res.status(200).json({ 
            ok: true, 
            message: "Empleado dado de baja correctamente" 
        });
    } catch (error: any) {
        console.error("Error en controlador despedirEmpleado:", error);
        res.status(500).json({ 
            ok: false, 
            message: error.message || "Error al procesar la baja" 
        });
    }
};

export const getAgenda = async (req: AuthRequest, res: Response) => {
    try {
        // Extraemos todo lo necesario del token
        const idUsuario = req.usuario?.id;
        const rol = req.usuario?.rol;
        const idPeluqueria = req.usuario?.idPeluqueria; 
        const { fecha } = req.query;

        if (!idPeluqueria || !idUsuario || !rol) {
            return res.status(400).json({ ok: false, message: 'Información de usuario incompleta en el token' });
        }

        if (!fecha) {
            return res.status(400).json({ ok: false, message: 'La fecha es obligatoria' });
        }

        // PASAMOS idUsuario y ROL al servicio además del idPeluqueria
        const agenda = await userJService.getAgendaService(
            Number(idUsuario), 
            rol, 
            Number(idPeluqueria), 
            fecha as string
        );

        if (!agenda) {
            return res.status(404).json({ ok: false, message: 'No se pudo cargar la agenda' });
        }

        return res.json({ ok: true, ...agenda });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const cancelarReserva = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; 
        const idPeluqueria = req.usuario?.idPeluqueria;

        // LOGS DE CONTROL
        console.log("--- INTENTO DE CANCELACIÓN ---");
        console.log("ID Reserva recibido de la URL:", id);
        console.log("ID Peluquería del Token:", idPeluqueria);

        if (!idPeluqueria) {
            return res.status(400).json({ ok: false, message: 'No tienes una peluquería asignada' });
        }

        const success = await userJService.cancelarReservaService(Number(id), Number(idPeluqueria));
        
        console.log("¿Tuvo éxito el Service?:", success);

        if (success) {
            return res.json({ ok: true, message: 'Reserva cancelada correctamente' });
        } else {
            return res.status(404).json({ ok: false, message: 'Reserva no encontrada o no pertenece a tu peluquería' });
        }
    } catch (error) {
        console.error("ERROR EN CONTROLLER:", error);
        return res.status(500).json({ ok: false, message: 'Error al cancelar la reserva' });
    }
};


export const buscarClientePorEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.query;

        // Validamos que el email venga en la query
        if (!email) {
            return res.status(400).json({ ok: false, message: 'Email no proporcionado' });
        }

        // Llamamos al servicio
        const usuario = await userJService.buscarClientePorEmailService(email as string);

        if (usuario) {
            return res.json({ 
                ok: true, 
                usuario 
            });
        } else {
            // No es un error de servidor, simplemente no existe
            return res.status(404).json({ 
                ok: false, 
                message: 'Usuario no encontrado' 
            });
        }
    } catch (error) {
        console.error("Error en buscarClientePorEmail:", error);
        return res.status(500).json({ 
            ok: false, 
            message: 'Error interno en la búsqueda' 
        });
    }
};

export const forzarCita = async (req: AuthRequest, res: Response) => {
    try {
        const idPeluqueria = req.usuario?.idPeluqueria;
        const idUsuarioLogueado = req.usuario?.id; // ID de la tabla 'usuario'

        const { 
            id_usuario_cliente, 
            fecha, 
            hora, 
            id_servicio, 
            notas 
        } = req.body;

        if (!idPeluqueria || !idUsuarioLogueado) {
            return res.status(400).json({ ok: false, message: 'Sesión no válida' });
        }

        const idClienteFinal = id_usuario_cliente || 720001;
        const fechaReservaSQL = `${fecha} ${hora}:00`;

        const nuevaReservaId = await userJService.forzarCitaService({
            id_peluqueria: Number(idPeluqueria),
            id_usuario: idClienteFinal,
            fecha_reserva: fechaReservaSQL,
            // Pasamos el ID del usuario logueado, el SERVICE se encargará de convertirlo a ID de personal
            id_personal_asignado: Number(idUsuarioLogueado), 
            id_servicio: Number(id_servicio || 1),
            notas: notas || null
        });

        return res.status(201).json({
            ok: true,
            message: 'Cita forzada con éxito',
            id_reserva: nuevaReservaId
        });

    } catch (error) {
        console.error("Error en forzarCita Controller:", error);
        return res.status(500).json({ ok: false, message: 'Error al procesar la reserva' });
    }
};

export const getServicios = async (req: Request, res: Response) => {
    try {
        // Usamos 'usuario' que es donde están tus datos
        const userPayload = (req as any).usuario;
        
        // ¡OJO! En tu log aparece como idPeluqueria (sin guion bajo)
        const idPeluqueria = userPayload?.idPeluqueria;

        if (!idPeluqueria) {
            return res.status(400).json({ 
                ok: false, 
                msg: 'No se encontró idPeluqueria en el token.' 
            });
        }

        const servicios = await userJService.getAllServicios(idPeluqueria);
        
        return res.json({
            ok: true,
            servicios
        });

    } catch (error) {
        console.error("❌ Error en getServicios:", error);
        return res.status(500).json({ ok: false, msg: 'Error interno' });
    }
};

export const updateServiciosConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { servicios } = req.body;
        // Usa la misma propiedad que te funciona en el GET
        const idPeluqueria = req.usuario?.idPeluqueria; 

        if (!idPeluqueria) {
            return res.status(401).json({ ok: false, msg: "No se identificó la peluquería en el token." });
        }

        await syncServiciosService(Number(idPeluqueria), servicios);

        return res.json({
            ok: true,
            msg: "Servicios sincronizados correctamente."
        });
    } catch (error) {
        console.error("Error en updateServiciosConfig:", error);
        return res.status(500).json({ ok: false, msg: "Error al sincronizar." });
    }
};