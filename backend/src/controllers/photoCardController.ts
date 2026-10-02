import { Request, Response } from 'express';
import {
    addFavoriteStoreByUser,
    createReservationByUser,
    getEmpleadosByPeluqueria,
    getFavoriteStoreIdsByUser,
    getFollowStatusByUser,
    getPhotoCardDetailById,
    getPhotoCards,
    getHorarioByPeluqueria,
    getPublicacionesByPeluqueria,
    getFavoritePhotosByUser,
    addFavoritePhotoByUser,
    removeFavoritePhotoByUser,
    getNotificationsByUser,
    getReservedHoursByDate,
    getServiciosByPeluqueria,
    userAlreadyReservedInStoreByDate,
    removeFavoriteStoreByUser,
    deleteNotificationByIdForUser,
    followStoreByUser,
    unfollowStoreByUser,
    getRandomPublicaciones,
    createReviewByUser
} from '../services/photoCardService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getPhotoCardsController = async (req: Request, res: Response) => {
    try {
        const photoCards = await getPhotoCards();
        res.json(photoCards);
    } catch (error) {
        console.error('❌ Error al obtener las PhotoCard:', error);
        res.status(500).json({ msg: 'Error al obtener las PhotoCard' });
    }
};

export const getPhotoCardDetailController = async (req: Request, res: Response) => {
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const detail = await getPhotoCardDetailById(idPeluqueria);

        if (!detail) {
            return res.status(404).json({ ok: false, message: 'Peluquería no encontrada' });
        }

        return res.json({ ok: true, peluqueria: detail });
    } catch (error) {
        console.error('❌ Error al obtener detalle de peluquería:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener detalle de peluquería' });
    }
};

export const addFavoriteStoreController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        await addFavoriteStoreByUser(idUsuario, idPeluqueria);
        return res.status(201).json({ ok: true, message: 'Favorito guardado correctamente' });
    } catch (error) {
        console.error('❌ Error al guardar favorito:', error);
        return res.status(500).json({ ok: false, message: 'Error al guardar favorito' });
    }
};

export const getFavoriteStoresController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    try {
        const favoritos = await getFavoriteStoreIdsByUser(idUsuario);
        return res.json({ ok: true, favoritos });
    } catch (error) {
        console.error('❌ Error al obtener favoritos:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener favoritos' });
    }
};

export const removeFavoriteStoreController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        await removeFavoriteStoreByUser(idUsuario, idPeluqueria);
        return res.json({ ok: true, message: 'Favorito eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar favorito:', error);
        return res.status(500).json({ ok: false, message: 'Error al eliminar favorito' });
    }
};

export const getReservedHoursController = async (req: Request, res: Response) => {
    const idPeluqueria = Number(req.params.idPeluqueria);
    const fecha = String(req.query.fecha ?? '');

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ ok: false, message: 'La fecha debe tener formato YYYY-MM-DD' });
    }

    try {
        const reservas = await getReservedHoursByDate(idPeluqueria, fecha);
        const hasEmployeeAssignment = reservas.some((reserva) => reserva.idPersonal > 0);
        const horasReservadas = hasEmployeeAssignment ? [] : reservas.map((reserva) => reserva.hora);
        return res.json({ ok: true, reservas, horasReservadas });
    } catch (error) {
        console.error('❌ Error al obtener reservas del día:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener reservas del día' });
    }
};

export const getReservationOptionsController = async (req: Request, res: Response) => {
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const [servicios, empleados, horario] = await Promise.all([
            getServiciosByPeluqueria(idPeluqueria),
            getEmpleadosByPeluqueria(idPeluqueria),
            getHorarioByPeluqueria(idPeluqueria)
        ]);

        return res.json({ ok: true, servicios, empleados, horario });
    } catch (error) {
        console.error('❌ Error al obtener opciones de reserva:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener opciones de reserva' });
    }
};

export const createReservationController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);
    const { fecha, hora, idServicio, idPersonal } = req.body as {
        fecha?: string;
        hora?: string;
        idServicio?: number;
        idPersonal?: number;
    };

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ ok: false, message: 'La fecha debe tener formato YYYY-MM-DD' });
    }

     if (!hora || !/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({ ok: false, message: 'La hora debe tener formato HH:mm' });
    }

    if (!idServicio || Number.isNaN(Number(idServicio))) {
        return res.status(400).json({ ok: false, message: 'Debes seleccionar un servicio válido' });
    }

    if (idPersonal === undefined || idPersonal === null || Number.isNaN(Number(idPersonal))) {
        return res.status(400).json({ ok: false, message: 'Debes seleccionar un empleado válido' });
    }

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}`;

    if (fecha < fechaHoy) {
        return res.status(400).json({ ok: false, message: 'No se puede reservar en fechas pasadas' });
    }

    if (fecha === fechaHoy) {
        const [horaSeleccionada, minutoSeleccionado] = hora.split(':').map(Number);

        if (
            Number.isNaN(horaSeleccionada) ||
            Number.isNaN(minutoSeleccionado) ||
            horaSeleccionada < 0 ||
            horaSeleccionada > 23 ||
            minutoSeleccionado < 0 ||
            minutoSeleccionado > 59
        ) {
            return res.status(400).json({ ok: false, message: 'La hora indicada no es válida' });
        }

        const reservaSolicitada = new Date(hoy);
        reservaSolicitada.setHours(horaSeleccionada, minutoSeleccionado, 0, 0);

        if (reservaSolicitada.getTime() <= hoy.getTime()) {
            return res.status(400).json({ ok: false, message: 'No se puede reservar en una hora pasada' });
        }
    }

    try {
        const alreadyReserved = await userAlreadyReservedInStoreByDate(idPeluqueria, idUsuario, fecha);

        if (alreadyReserved) {
            return res.status(409).json({
                ok: false,
                message: 'Ya tienes una reserva en esta peluquería para ese día'
            });
        }

        const [year, month, day] = fecha.split('-');
        const detail = await getPhotoCardDetailById(idPeluqueria);
        const nombrePeluqueria = detail?.nombre_empresa ?? 'la peluquería';
        const mensajeNotificacion = `Reserva confirmada en ${nombrePeluqueria} para el ${day}/${month}/${year} a las ${hora}.`;
        const created = await createReservationByUser(
            idPeluqueria,
            idUsuario,
            fecha,
            hora,
            Number(idServicio),
            Number(idPersonal),
            mensajeNotificacion
        );

        if (!created) {
            return res.status(409).json({ ok: false, message: 'Ese empleado ya está reservado para esa fecha y hora' });
        }

        return res.status(201).json({ ok: true, message: 'Reserva creada correctamente' });
    } catch (error) {
        console.error('❌ Error al crear reserva:', error);
        return res.status(500).json({ ok: false, message: 'Error al crear la reserva' });
    }
};

export const followStoreController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const numeroSeguidores = await followStoreByUser(idUsuario, idPeluqueria);
        return res.status(201).json({ ok: true, message: 'Peluquería seguida correctamente', numeroSeguidores });
    } catch (error) {
        console.error('❌ Error al seguir peluquería:', error);
        return res.status(500).json({ ok: false, message: 'Error al seguir peluquería' });
    }
};

export const unfollowStoreController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const numeroSeguidores = await unfollowStoreByUser(idUsuario, idPeluqueria);
        return res.json({ ok: true, message: 'Has dejado de seguir la peluquería', numeroSeguidores });
    } catch (error) {
        console.error('❌ Error al dejar de seguir peluquería:', error);
        return res.status(500).json({ ok: false, message: 'Error al dejar de seguir peluquería' });
    }
};

export const getFollowStatusController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const siguiendo = await getFollowStatusByUser(idUsuario, idPeluqueria);
        return res.json({ ok: true, siguiendo });
    } catch (error) {
        console.error('❌ Error al obtener estado de seguimiento:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener estado de seguimiento' });
    }
};

export const getPublicacionesController = async (req: Request, res: Response) => {
    const idPeluqueria = Number(req.params.idPeluqueria);

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    try {
        const publicaciones = await getPublicacionesByPeluqueria(idPeluqueria);
        return res.json({ ok: true, publicaciones });
    } catch (error) {
        console.error('❌ Error al obtener publicaciones de la peluquería:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener publicaciones' });
    }
};

export const getNotificationsController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    try {
        const notificaciones = await getNotificationsByUser(idUsuario);
        return res.json({ ok: true, notificaciones });
    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener notificaciones' });
    }
};

export const deleteNotificationController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idNotificacion = Number(req.params.idNotificacion);

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idNotificacion)) {
        return res.status(400).json({ ok: false, message: 'id_notificacion inválido' });
    }

    try {
        const deleted = await deleteNotificationByIdForUser(idNotificacion, idUsuario);

        if (!deleted) {
            return res.status(404).json({ ok: false, message: 'Notificación no encontrada' });
        }

        return res.json({ ok: true, message: 'Notificación eliminada correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar notificación:', error);
        return res.status(500).json({ ok: false, message: 'Error al eliminar notificación' });
    }
};

export const addFavoritePhotoController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const { id_peluqueria, id_personal, url } = req.body as {
        id_peluqueria?: number;
        id_personal?: number;
        url?: string;
    };

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    const idPeluqueria = Number(id_peluqueria);
    const idPersonal = Number(id_personal);
    const photoUrl = String(url ?? '').trim();

    if (Number.isNaN(idPeluqueria) || Number.isNaN(idPersonal) || !photoUrl) {
        return res.status(400).json({ ok: false, message: 'Datos inválidos para guardar foto favorita' });
    }

    try {
        const created = await addFavoritePhotoByUser(idUsuario, idPeluqueria, idPersonal, photoUrl);
        if (!created) {
            return res.status(409).json({ ok: false, message: 'La foto ya está guardada en favoritos' });
        }
        return res.status(201).json({ ok: true, message: 'Foto guardada en favoritos' });
    } catch (error) {
        console.error('❌ Error al guardar foto favorita:', error);
        return res.status(500).json({ ok: false, message: 'Error al guardar foto favorita' });
    }
};

export const getFavoritePhotosController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    try {
        const fotos = await getFavoritePhotosByUser(idUsuario);
        return res.json({ ok: true, fotos });
    } catch (error) {
        console.error('❌ Error al obtener fotos favoritas:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener fotos favoritas' });
    }
};

export const removeFavoritePhotoController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const { id_peluqueria, id_personal, url } = req.body as {
        id_peluqueria?: number;
        id_personal?: number;
        url?: string;
    };

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    const idPeluqueria = Number(id_peluqueria);
    const idPersonal = Number(id_personal);
    const photoUrl = String(url ?? '').trim();

    if (Number.isNaN(idPeluqueria) || Number.isNaN(idPersonal) || !photoUrl) {
        return res.status(400).json({ ok: false, message: 'Datos inválidos para eliminar foto favorita' });
    }

    try {
        const deleted = await removeFavoritePhotoByUser(idUsuario, idPeluqueria, idPersonal, photoUrl);

        if (!deleted) {
            return res.status(404).json({ ok: false, message: 'La foto no está guardada en favoritos' });
        }

        return res.json({ ok: true, message: 'Foto eliminada de favoritos' });
    } catch (error) {
        console.error('❌ Error al eliminar foto favorita:', error);
        return res.status(500).json({ ok: false, message: 'Error al eliminar foto favorita' });
    }
};



export const createReviewController = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;
    const idPeluqueria = Number(req.params.idPeluqueria);
    const { estrellas, comentario } = req.body as { estrellas?: number; comentario?: string };

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    if (Number.isNaN(idPeluqueria)) {
        return res.status(400).json({ ok: false, message: 'id_peluqueria inválido' });
    }

    const estrellasNum = Number(estrellas);
    const comentarioFinal = String(comentario ?? '').trim();

    if (!Number.isInteger(estrellasNum) || estrellasNum < 1 || estrellasNum > 5) {
        return res.status(400).json({ ok: false, message: 'Las estrellas deben estar entre 1 y 5' });
    }

    try {
        const result = await createReviewByUser(idUsuario, idPeluqueria, estrellasNum, comentarioFinal);

        if (!result.created) {
            return res.status(409).json({ ok: false, message: 'Ya has puesto una reseña en esta peluquería' });
        }

        return res.status(201).json({
            ok: true,
            message: 'Reseña enviada correctamente',
            puntuacion: result.puntuacion,
            reviews: result.reviews
        });
    } catch (error) {
        console.error('❌ Error al crear reseña:', error);
        return res.status(500).json({ ok: false, message: 'Error al crear la reseña' });
    }
};
export const getRandomPublicacionesController = async (_req: Request, res: Response) => {
    try {
        const publicaciones = await getRandomPublicaciones();
        return res.json({ ok: true, publicaciones });
    } catch (error) {
        console.error('❌ Error al obtener publicaciones aleatorias:', error);
        return res.status(500).json({ ok: false, message: 'Error al obtener publicaciones aleatorias' });
    }
};